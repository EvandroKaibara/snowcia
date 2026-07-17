package br.com.snowcia.reservation;

import java.util.List;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.text.Normalizer;

import br.com.snowcia.notification.WhatsAppNotificationService;
import br.com.snowcia.offering.ServiceOffering;
import br.com.snowcia.offering.ServiceOfferingRepository;
import br.com.snowcia.offering.ServiceTarget;
import br.com.snowcia.payment.Payment;
import br.com.snowcia.payment.PaymentMethod;
import br.com.snowcia.payment.PaymentRepository;
import br.com.snowcia.payment.PaymentStatus;
import br.com.snowcia.pet.Pet;
import br.com.snowcia.pet.PetSpecies;
import br.com.snowcia.pet.PetRepository;
import br.com.snowcia.reservation.dto.DeclineReservationRequest;
import br.com.snowcia.reservation.dto.ReservationRequest;
import br.com.snowcia.reservation.dto.ReservationResponse;
import br.com.snowcia.user.AppUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final PetRepository petRepository;
    private final PaymentRepository paymentRepository;
    private final ReservationPricingService pricingService;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final WhatsAppNotificationService whatsAppNotificationService;
    private final String paymentUrlBase;

    public ReservationService(ReservationRepository reservationRepository, PetRepository petRepository,
            PaymentRepository paymentRepository, ReservationPricingService pricingService, ServiceOfferingRepository serviceOfferingRepository,
            WhatsAppNotificationService whatsAppNotificationService,
            @Value("${snowcia.payment.public-url:http://localhost:5173/pagamento/}") String paymentUrlBase) {
        this.reservationRepository = reservationRepository;
        this.petRepository = petRepository;
        this.paymentRepository = paymentRepository;
        this.pricingService = pricingService;
        this.serviceOfferingRepository = serviceOfferingRepository;
        this.whatsAppNotificationService = whatsAppNotificationService;
        this.paymentUrlBase = paymentUrlBase;
    }

    public ReservationResponse create(AppUser owner, ReservationRequest request) {
        validateDates(request);
        var pet = findOwnedPet(owner, request.petId());
        var offering = findOffering(pet, request.serviceOfferingId());
        validateServiceForPet(pet, request.serviceType());
        ensureAvailable(pet, request, null);
        var price = offering == null ? pricingService.calculate(request.serviceType(), request.checkInDate(), request.checkOutDate()).totalAmount() : calculateOfferingPrice(offering, request.checkInDate(), request.checkOutDate());
        var reservation = reservationRepository.save(new Reservation(pet, request.serviceType(), offering, request.checkInDate(),
                request.checkOutDate(), request.checkInTime(), request.checkOutTime(), normalize(request.notes()), price));
        return ReservationResponse.from(reservation);
    }

    public List<ReservationResponse> list(AppUser user) {
        var reservations = user.isAdmin() ? reservationRepository.findAllByOrderByCheckInDateAsc()
                : reservationRepository.findAllByPetOwnerIdOrderByCheckInDateAsc(user.getId());
        return reservations.stream().map(ReservationResponse::from).toList();
    }

    public ReservationResponse get(AppUser user, Long id) {
        return ReservationResponse.from(findAccessibleReservation(user, id));
    }

    public ReservationResponse update(AppUser owner, Long id, ReservationRequest request) {
        validateDates(request);
        var reservation = findOwnedReservation(owner, id);
        var offering = findOffering(reservation.getPet(), request.serviceOfferingId());
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente reservas pendentes podem ser alteradas");
        }
        if (!reservation.getPet().getId().equals(request.petId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O pet da reserva não pode ser alterado");
        }
        ensureAvailable(reservation.getPet(), request, reservation.getId());
        validateServiceForPet(reservation.getPet(), request.serviceType());
        var price = offering == null ? pricingService.calculate(request.serviceType(), request.checkInDate(), request.checkOutDate()).totalAmount() : calculateOfferingPrice(offering, request.checkInDate(), request.checkOutDate());
        reservation.update(request.checkInDate(), request.checkOutDate(), request.checkInTime(), request.checkOutTime(), normalize(request.notes()));
        reservation.updateService(request.serviceType(), offering);
        reservation.updateTotalAmount(price);
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    public ReservationResponse approve(AppUser admin, Long id) {
        ensureAdmin(admin);
        var reservation = findReservation(id);
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Apenas reservas pendentes podem ser aprovadas");
        }
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
        ensureAdmin(admin);
        var reservation = findReservation(id);
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Apenas reservas pendentes podem ser recusadas");
        }
        reservation.decline(request.reason().trim());
        reservationRepository.save(reservation);
        var owner = reservation.getPet().getOwner();
        whatsAppNotificationService.send(owner.getPhone(), String.format(
                "Olá, %s. A reserva de %s foi recusada. Motivo: %s", owner.getName(),
                reservation.getPet().getName(), reservation.getDeclineReason()));
        return ReservationResponse.from(reservation);
    }

    public void delete(AppUser owner, Long id) {
        var reservation = findOwnedReservation(owner, id);
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente reservas pendentes podem ser canceladas");
        }
        reservationRepository.delete(reservation);
    }

    private void validateDates(ReservationRequest request) {
        if (request.checkOutDate().isBefore(request.checkInDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A saída não pode ser anterior à entrada");
        }
        if (request.checkInDate().equals(request.checkOutDate()) && !request.checkOutTime().isAfter(request.checkInTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A saída deve ser posterior à entrada");
        }
    }

    public ReservationResponse complete(AppUser admin, Long id) { ensureAdmin(admin); var reservation = findReservation(id); if (reservation.getStatus() != ReservationStatus.CONFIRMED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente reservas confirmadas podem ser finalizadas"); reservation.complete(); return ReservationResponse.from(reservationRepository.save(reservation)); }
    public ReservationResponse updateInternalNotes(AppUser admin, Long id, String notes) { ensureAdmin(admin); var reservation = findReservation(id); reservation.updateInternalNotes(normalize(notes)); return ReservationResponse.from(reservationRepository.save(reservation)); }

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
        var validTarget = offering.getTarget() == ServiceTarget.BOTH
                || (offering.getTarget() == ServiceTarget.DOG && pet.getSpecies() == PetSpecies.DOG)
                || (offering.getTarget() == ServiceTarget.CAT && pet.getSpecies() == PetSpecies.CAT);
        if (!offering.isActive() || !validTarget) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Serviço indisponível para este pet");
        }
        return offering;
    }

    private BigDecimal calculateOfferingPrice(ServiceOffering offering, LocalDate checkIn, LocalDate checkOut) {
        var total = BigDecimal.ZERO;
        var lastChargeableDay = checkOut.equals(checkIn) ? checkOut.plusDays(1) : checkOut;
        for (var day = checkIn; day.isBefore(lastChargeableDay); day = day.plusDays(1)) {
            total = total.add(priceForDate(offering, day));
        }
        return total;
    }

    private BigDecimal priceForDate(ServiceOffering offering, LocalDate date) {
        return offering.getPriceConditions().stream()
                .filter(condition -> appliesTo(condition.getName(), date))
                .findFirst()
                .orElse(offering.getPriceConditions().getFirst())
                .getPrice();
    }

    private boolean appliesTo(String conditionName, LocalDate date) {
        var day = date.getDayOfWeek();
        var condition = Normalizer.normalize(conditionName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase();
        if ((condition.contains("feriado") || condition.contains("holiday")) && isBrazilianNationalHoliday(date)) return true;
        if (condition.contains("fim de semana") || condition.contains("weekend")) {
            return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
        }
        if (condition.contains("segunda") && condition.contains("quinta")) {
            return day.getValue() >= DayOfWeek.MONDAY.getValue() && day.getValue() <= DayOfWeek.THURSDAY.getValue();
        }
        if (condition.contains("dia util") || condition.contains("weekday")) {
            return day.getValue() <= DayOfWeek.FRIDAY.getValue();
        }
        return ((condition.contains("segunda") || condition.contains("monday")) && day == DayOfWeek.MONDAY)
                || ((condition.contains("terca") || condition.contains("tuesday")) && day == DayOfWeek.TUESDAY)
                || ((condition.contains("quarta") || condition.contains("wednesday")) && day == DayOfWeek.WEDNESDAY)
                || ((condition.contains("quinta") || condition.contains("thursday")) && day == DayOfWeek.THURSDAY)
                || ((condition.contains("sexta") || condition.contains("friday")) && day == DayOfWeek.FRIDAY)
                || ((condition.contains("sabado") || condition.contains("saturday")) && day == DayOfWeek.SATURDAY)
                || ((condition.contains("domingo") || condition.contains("sunday")) && day == DayOfWeek.SUNDAY);
    }

    private boolean isBrazilianNationalHoliday(LocalDate date) {
        var fixedHoliday = switch (date.getMonthValue()) {
            case 1 -> date.getDayOfMonth() == 1;
            case 4 -> date.getDayOfMonth() == 21;
            case 5 -> date.getDayOfMonth() == 1;
            case 9 -> date.getDayOfMonth() == 7;
            case 10 -> date.getDayOfMonth() == 12;
            case 11 -> date.getDayOfMonth() == 2 || date.getDayOfMonth() == 15 || date.getDayOfMonth() == 20;
            case 12 -> date.getDayOfMonth() == 25;
            default -> false;
        };
        return fixedHoliday || date.equals(easterSunday(date.getYear()).minusDays(2));
    }

    private LocalDate easterSunday(int year) {
        int a = year % 19, b = year / 100, c = year % 100, d = b / 4, e = b % 4, f = (b + 8) / 25;
        int g = (b - f + 1) / 3, h = (19 * a + b - d - g + 15) % 30, i = c / 4, k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7, m = (a + 11 * h + 22 * l) / 451;
        int month = (h + l - 7 * m + 114) / 31, day = (h + l - 7 * m + 114) % 31 + 1;
        return LocalDate.of(year, month, day);
    }

    private void ensureAvailable(Pet pet, ReservationRequest request, Long reservationId) {
        var activeStatuses = List.of(ReservationStatus.PENDING, ReservationStatus.AWAITING_PAYMENT, ReservationStatus.CONFIRMED);
        boolean conflict = reservationId == null
                ? reservationRepository.existsByPetIdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                        pet.getId(), activeStatuses, request.checkOutDate(), request.checkInDate())
                : reservationRepository.existsByPetIdAndIdNotAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                        pet.getId(), reservationId, activeStatuses, request.checkOutDate(), request.checkInDate());
        if (conflict) throw new ResponseStatusException(HttpStatus.CONFLICT, "O pet já possui uma reserva nesse período");
    }

    private Pet findOwnedPet(AppUser owner, Long id) {
        return petRepository.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet não encontrado"));
    }

    private Reservation findOwnedReservation(AppUser owner, Long id) {
        return reservationRepository.findByIdAndPetOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva não encontrada"));
    }

    private Reservation findReservation(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva não encontrada"));
    }

    private Reservation findAccessibleReservation(AppUser user, Long id) {
        return user.isAdmin() ? findReservation(id) : findOwnedReservation(user, id);
    }

    private void ensureAdmin(AppUser user) {
        if (!user.isAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ação restrita à administração");
    }

    private String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
