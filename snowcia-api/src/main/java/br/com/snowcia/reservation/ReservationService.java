package br.com.snowcia.reservation;

import java.util.List;

import br.com.snowcia.notification.WhatsAppNotificationService;
import br.com.snowcia.payment.Payment;
import br.com.snowcia.payment.PaymentMethod;
import br.com.snowcia.payment.PaymentRepository;
import br.com.snowcia.payment.PaymentStatus;
import br.com.snowcia.pet.Pet;
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
    private final WhatsAppNotificationService whatsAppNotificationService;
    private final String paymentUrlBase;

    public ReservationService(ReservationRepository reservationRepository, PetRepository petRepository,
            PaymentRepository paymentRepository, ReservationPricingService pricingService,
            WhatsAppNotificationService whatsAppNotificationService,
            @Value("${snowcia.payment.public-url:http://localhost:5173/pagamento/}") String paymentUrlBase) {
        this.reservationRepository = reservationRepository;
        this.petRepository = petRepository;
        this.paymentRepository = paymentRepository;
        this.pricingService = pricingService;
        this.whatsAppNotificationService = whatsAppNotificationService;
        this.paymentUrlBase = paymentUrlBase;
    }

    public ReservationResponse create(AppUser owner, ReservationRequest request) {
        validateDates(request);
        var pet = findOwnedPet(owner, request.petId());
        ensureAvailable(pet, request, null);
        var price = pricingService.calculate(request.serviceType(), request.checkInDate(), request.checkOutDate());
        var reservation = reservationRepository.save(new Reservation(pet, request.serviceType(), request.checkInDate(),
                request.checkOutDate(), normalize(request.notes()), price.totalAmount()));
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
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Somente reservas pendentes podem ser alteradas");
        }
        if (!reservation.getPet().getId().equals(request.petId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O pet da reserva não pode ser alterado");
        }
        ensureAvailable(reservation.getPet(), request, reservation.getId());
        var price = pricingService.calculate(request.serviceType(), request.checkInDate(), request.checkOutDate());
        reservation.update(request.checkInDate(), request.checkOutDate(), normalize(request.notes()));
        reservation.updateTotalAmount(price.totalAmount());
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
        if (!request.checkOutDate().isAfter(request.checkInDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A saída deve ser posterior à entrada");
        }
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
