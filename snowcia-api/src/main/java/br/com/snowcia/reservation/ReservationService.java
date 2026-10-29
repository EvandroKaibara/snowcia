package br.com.snowcia.reservation;

import static br.com.snowcia.reservation.ReservationPricingService.datesBetween;
import static br.com.snowcia.reservation.ReservationPricingService.isHosting;
import static br.com.snowcia.reservation.ReservationPricingService.isSingleDay;
import static br.com.snowcia.reservation.ReservationPricingService.reservationDates;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

import br.com.snowcia.notification.WhatsAppNotificationService;
import br.com.snowcia.offering.ServiceOffering;
import br.com.snowcia.offering.ServiceOfferingRepository;
import br.com.snowcia.offering.ServiceTarget;
import br.com.snowcia.payment.Payment;
import br.com.snowcia.payment.PaymentMethod;
import br.com.snowcia.payment.PaymentRepository;
import br.com.snowcia.payment.PaymentStatus;
import br.com.snowcia.pet.Pet;
import br.com.snowcia.pet.PetRepository;
import br.com.snowcia.pet.PetSpecies;
import br.com.snowcia.reservation.dto.DeclineReservationRequest;
import br.com.snowcia.reservation.dto.ReservationRequest;
import br.com.snowcia.reservation.dto.ReservationResponse;
import br.com.snowcia.user.AppUser;
import br.com.snowcia.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {

    private static final List<ReservationStatus> ACTIVE_STATUSES = List.of(ReservationStatus.PENDING, ReservationStatus.AWAITING_PAYMENT, ReservationStatus.CONFIRMED);

    private final ReservationRepository reservationRepository;
    private final PetRepository petRepository;
    private final PaymentRepository paymentRepository;
    private final ReservationPricingService pricingService;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final UserRepository userRepository;
    private final WhatsAppNotificationService whatsAppNotificationService;
    private final String paymentUrlBase;

    public ReservationService(ReservationRepository reservationRepository, PetRepository petRepository,
            PaymentRepository paymentRepository, ReservationPricingService pricingService, ServiceOfferingRepository serviceOfferingRepository, UserRepository userRepository,
            WhatsAppNotificationService whatsAppNotificationService,
            @Value("${snowcia.payment.public-url:http://localhost:5173/pagamento/}") String paymentUrlBase) {
        this.reservationRepository = reservationRepository;
        this.petRepository = petRepository;
        this.paymentRepository = paymentRepository;
        this.pricingService = pricingService;
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.userRepository = userRepository;
        this.whatsAppNotificationService = whatsAppNotificationService;
        this.paymentUrlBase = paymentUrlBase;
    }

    public ReservationResponse create(AppUser owner, ReservationRequest request) {
        var pets = findOwnedPets(owner, request);
        var pet = pets.getFirst();
        var offering = findOffering(pet, request.serviceOfferingId());
        var additionalOfferings = findAdditionalOfferings(pets, offering, request.additionalServiceOfferingIds());
        var assignedAdmin = findReservationAdministrator(request.assignedAdminId());
        var normalized = normalizeSingleDayServiceDates(offering, request);
        validateDates(normalized);
        for (var selectedPet : pets) {
            if (offering == null) validateServiceForPet(selectedPet, normalized.serviceType()); else validateOfferingForPet(offering, selectedPet);
            ensureAvailable(selectedPet, normalized, null);
        }
        var price = unitPrice(offering, additionalOfferings, normalized).multiply(BigDecimal.valueOf(pets.size()));
        var reservation = reservationRepository.save(new Reservation(pet, petNames(pets), reservationDates(normalized), additionalServiceNames(additionalOfferings, normalized),
                normalized.serviceType(), offering, assignedAdmin, normalized.checkInDate(), normalized.checkOutDate(), normalized.checkInTime(), normalized.checkOutTime(),
                normalize(normalized.notes()), price));
        return ReservationResponse.from(reservation);
    }

    public List<ReservationResponse> list(AppUser user) {
        finalizePastReservations();
        var reservations = user.isAdmin() ? reservationRepository.findAllByAssignedAdminIdOrderByCheckInDateAsc(user.getId())
                : reservationRepository.findAllByPetOwnerIdOrderByCheckInDateAsc(user.getId());
        return reservations.stream().map(ReservationResponse::from).toList();
    }

    public ReservationResponse get(AppUser user, Long id) {
        return ReservationResponse.from(findAccessibleReservation(user, id));
    }

    public ReservationResponse update(AppUser owner, Long id, ReservationRequest request) {
        var reservation = findOwnedReservation(owner, id);
        var offering = findOffering(reservation.getPet(), request.serviceOfferingId());
        var additionalOfferings = findAdditionalOfferings(List.of(reservation.getPet()), offering, request.additionalServiceOfferingIds());
        var assignedAdmin = findReservationAdministrator(request.assignedAdminId());
        var normalized = normalizeSingleDayServiceDates(offering, request);
        validateDates(normalized);
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente reservas pendentes podem ser alteradas");
        }
        if (!reservation.getPet().getId().equals(normalized.petId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O pet da reserva não pode ser alterado");
        }
        ensureAvailable(reservation.getPet(), normalized, reservation.getId());
        if (offering == null) validateServiceForPet(reservation.getPet(), normalized.serviceType());
        reservation.update(normalized.checkInDate(), normalized.checkOutDate(), normalized.checkInTime(), normalized.checkOutTime(), normalize(normalized.notes()), reservationDates(normalized));
        reservation.updateService(normalized.serviceType(), offering);
        reservation.assignAdmin(assignedAdmin);
        reservation.updateAdditionalServiceNames(additionalServiceNames(additionalOfferings, normalized));
        reservation.updateTotalAmount(unitPrice(offering, additionalOfferings, normalized));
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    public ReservationResponse approve(AppUser admin, Long id) {
        var reservation = findPendingForDecision(admin, id, "aprovadas");
        reservation.approve();
        reservationRepository.save(reservation);
        var payment = paymentRepository.save(new Payment(reservation, reservation.getTotalAmount(), PaymentMethod.PIX));
        var owner = reservation.getPet().getOwner();
        whatsAppNotificationService.send(owner.getPhone(), String.format(
                "Olá, %s! A reserva de %s foi aprovada. Para confirmar sua vaga, realize o pagamento de %s: %s%s",
                owner.getName(), reservation.getPet().getName(), reservation.getTotalAmount().toPlainString(),
                paymentUrlBase, payment.getId()));
        return ReservationResponse.from(reservation);
    }

    public ReservationResponse decline(AppUser admin, Long id, DeclineReservationRequest request) {
        var reservation = findPendingForDecision(admin, id, "recusadas");
        reservation.decline(request.reason().trim());
        reservationRepository.save(reservation);
        var owner = reservation.getPet().getOwner();
        whatsAppNotificationService.send(owner.getPhone(), String.format(
                "Olá, %s. A reserva de %s foi recusada. Motivo: %s", owner.getName(),
                reservation.getPet().getName(), reservation.getDeclineReason()));
        return ReservationResponse.from(reservation);
    }

    public ReservationResponse complete(AppUser admin, Long id) {
        ensureAdmin(admin);
        var reservation = findAccessibleReservation(admin, id);
        if (reservation.getStatus() != ReservationStatus.CONFIRMED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente reservas confirmadas podem ser finalizadas");
        }
        reservation.complete();
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    public ReservationResponse updateInternalNotes(AppUser admin, Long id, String notes) {
        ensureAdmin(admin);
        var reservation = findAccessibleReservation(admin, id);
        reservation.updateInternalNotes(normalize(notes));
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    public void delete(AppUser owner, Long id) {
        var reservation = findOwnedReservation(owner, id);
        if (!ACTIVE_STATUSES.contains(reservation.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Esta reserva não pode mais ser cancelada");
        }
        reservation.cancel();
        reservationRepository.save(reservation);
        paymentRepository.findByReservationId(reservation.getId())
                .filter(payment -> payment.getStatus() != PaymentStatus.PAID)
                .ifPresent(payment -> {
                    payment.cancel();
                    paymentRepository.save(payment);
                });
    }

    private BigDecimal unitPrice(ServiceOffering offering, List<ServiceOffering> additionalOfferings, ReservationRequest request) {
        var price = offering == null
                ? pricingService.calculate(request.serviceType(), request.checkInDate(), request.checkOutDate())
                : pricingService.offeringPrice(offering, request);
        for (var additional : additionalOfferings) {
            price = price.add(pricingService.offeringPriceForDates(additional, request, additionalDatesFor(additional, request)));
        }
        return price;
    }

    private Reservation findPendingForDecision(AppUser admin, Long id, String action) {
        ensureAdmin(admin);
        var reservation = findAccessibleReservation(admin, id);
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Apenas reservas pendentes podem ser " + action);
        }
        return reservation;
    }

    private void validateDates(ReservationRequest request) {
        if (request.checkOutDate().isBefore(request.checkInDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A saída não pode ser anterior à entrada");
        }
        if (request.checkInDate().equals(request.checkOutDate()) && !request.checkOutTime().isAfter(request.checkInTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A saída deve ser posterior à entrada");
        }
    }

    private void finalizePastReservations() {
        var finished = reservationRepository.findAllByStatusAndCheckOutDateBefore(ReservationStatus.CONFIRMED, LocalDate.now());
        finished.forEach(Reservation::complete);
        if (!finished.isEmpty()) reservationRepository.saveAll(finished);
    }

    private void validateServiceForPet(Pet pet, ReservationServiceType serviceType) {
        boolean catSitter = serviceType.name().startsWith("CAT_SITTER");
        if ((pet.getSpecies() == PetSpecies.DOG && catSitter) || (pet.getSpecies() == PetSpecies.CAT && !catSitter)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O serviço selecionado não é compatível com a espécie do pet");
        }
    }

    private ServiceOffering findOffering(Pet pet, Long id) {
        if (id == null) return null;
        var offering = serviceOfferingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço não encontrado"));
        validateOfferingForPet(offering, pet);
        return offering;
    }

    private List<ServiceOffering> findAdditionalOfferings(List<Pet> pets, ServiceOffering primaryOffering, List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        var offerings = ids.stream().distinct()
                .map(id -> serviceOfferingRepository.findById(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Serviço adicional não encontrado")))
                .filter(offering -> primaryOffering == null || !offering.getId().equals(primaryOffering.getId()))
                .toList();
        for (var offering : offerings) {
            if (isHosting(offering)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hospedagem não pode ser selecionada como serviço adicional");
            pets.forEach(pet -> validateOfferingForPet(offering, pet));
        }
        return offerings;
    }

    private String additionalServiceNames(List<ServiceOffering> offerings, ReservationRequest request) {
        if (offerings.isEmpty()) return null;
        return offerings.stream()
                .map(offering -> offering.getName() + " (" + additionalDatesFor(offering, request).stream().map(LocalDate::toString).collect(Collectors.joining(", ")) + ")")
                .collect(Collectors.joining(", "));
    }

    private void validateOfferingForPet(ServiceOffering offering, Pet pet) {
        var validTarget = offering.getTarget() == ServiceTarget.BOTH
                || (offering.getTarget() == ServiceTarget.DOG && pet.getSpecies() == PetSpecies.DOG)
                || (offering.getTarget() == ServiceTarget.CAT && pet.getSpecies() == PetSpecies.CAT);
        if (!offering.isActive() || !validTarget) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço indisponível para este pet");
        }
    }

    /** DayCare and walks happen on single days: the stay range becomes the first and last chosen dates. */
    private ReservationRequest normalizeSingleDayServiceDates(ServiceOffering offering, ReservationRequest request) {
        var type = request.serviceType().name();
        if (!type.startsWith("DAYCARE") && !type.startsWith("WALK") && !isSingleDay(offering)) return request;
        var dates = reservationDates(request);
        // An inverted range yields no dates; keep check-in so validateDates still answers 400.
        var first = dates.isEmpty() ? request.checkInDate() : dates.getFirst();
        var last = dates.isEmpty() ? request.checkInDate() : dates.getLast();
        return new ReservationRequest(request.petId(), request.petIds(), request.serviceType(), request.serviceOfferingId(), request.assignedAdminId(),
                first, last, request.checkInTime(), request.checkOutTime(), request.extraQuantities(), request.notes(), dates,
                request.additionalServiceOfferingIds(), request.additionalServiceDates());
    }

    private void ensureAvailable(Pet pet, ReservationRequest request, Long reservationId) {
        var requestedDates = reservationDates(request);
        boolean conflict = reservationRepository.findAllByPetIdAndStatusIn(pet.getId(), ACTIVE_STATUSES).stream()
                .filter(reservation -> !reservation.getId().equals(reservationId))
                .anyMatch(reservation -> datesOf(reservation).stream().anyMatch(requestedDates::contains));
        if (conflict) throw new ResponseStatusException(HttpStatus.CONFLICT, "O pet já possui uma reserva nesse período");
    }

    private List<LocalDate> additionalDatesFor(ServiceOffering offering, ReservationRequest request) {
        var dates = request.additionalServiceDates() == null ? null : request.additionalServiceDates().get(offering.getId());
        if (dates == null || dates.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione ao menos uma data para o serviço adicional " + offering.getName());
        return dates.stream().distinct().sorted().toList();
    }

    private List<LocalDate> datesOf(Reservation reservation) {
        var selected = reservation.getSelectedDates();
        return selected.isEmpty() ? datesBetween(reservation.getCheckInDate(), reservation.getCheckOutDate()) : selected;
    }

    private List<Pet> findOwnedPets(AppUser owner, ReservationRequest request) {
        var ids = request.petIds() == null || request.petIds().isEmpty() ? List.of(request.petId()) : request.petIds();
        return ids.stream().distinct()
                .map(id -> petRepository.findByIdAndOwnerId(id, owner.getId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet não encontrado")))
                .toList();
    }

    private String petNames(List<Pet> pets) {
        return pets.stream().map(Pet::getName).collect(Collectors.joining(", "));
    }

    private AppUser findReservationAdministrator(Long id) {
        var admin = userRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Administradora não encontrada"));
        if (!admin.isAdmin() || !AppUser.RESERVATION_ADMIN_EMAILS.contains(admin.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selecione Jussara ou Isabella para a reserva");
        }
        return admin;
    }

    private Reservation findOwnedReservation(AppUser owner, Long id) {
        return reservationRepository.findByIdAndPetOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva não encontrada"));
    }

    private Reservation findAccessibleReservation(AppUser user, Long id) {
        if (!user.isAdmin()) return findOwnedReservation(user, id);
        return reservationRepository.findByIdAndAssignedAdminId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva não encontrada"));
    }

    private void ensureAdmin(AppUser user) {
        if (!user.isAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ação restrita à administração");
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
