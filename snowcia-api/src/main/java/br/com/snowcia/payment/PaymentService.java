package br.com.snowcia.payment;

import java.util.List;

import br.com.snowcia.payment.dto.PaymentRequest;
import br.com.snowcia.payment.dto.PaymentResponse;
import br.com.snowcia.reservation.Reservation;
import br.com.snowcia.reservation.ReservationRepository;
import br.com.snowcia.user.AppUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ReservationRepository reservationRepository;

    public PaymentService(PaymentRepository paymentRepository, ReservationRepository reservationRepository) {
        this.paymentRepository = paymentRepository;
        this.reservationRepository = reservationRepository;
    }

    public PaymentResponse create(AppUser owner, PaymentRequest request) {
        var reservation = findOwnedReservation(owner, request.reservationId());
        if (paymentRepository.existsByReservationId(reservation.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta reserva já possui um pagamento");
        }
        return PaymentResponse.from(paymentRepository.save(new Payment(reservation, request.amount(), request.method())));
    }

    public List<PaymentResponse> list(AppUser owner) {
        return paymentRepository.findAllByReservationPetOwnerIdOrderByCreatedAtDesc(owner.getId()).stream()
                .map(PaymentResponse::from).toList();
    }

    public PaymentResponse get(AppUser owner, Long id) {
        return PaymentResponse.from(findOwnedPayment(owner, id));
    }

    public PaymentResponse markAsPaid(AppUser owner, Long id) {
        var payment = findOwnedPayment(owner, id);
        if (payment.getStatus() == PaymentStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um pagamento cancelado não pode ser confirmado");
        }
        payment.markAsPaid();
        return PaymentResponse.from(paymentRepository.save(payment));
    }

    public PaymentResponse cancel(AppUser owner, Long id) {
        var payment = findOwnedPayment(owner, id);
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um pagamento confirmado não pode ser cancelado");
        }
        payment.cancel();
        return PaymentResponse.from(paymentRepository.save(payment));
    }

    private Reservation findOwnedReservation(AppUser owner, Long id) {
        return reservationRepository.findByIdAndPetOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva não encontrada"));
    }

    private Payment findOwnedPayment(AppUser owner, Long id) {
        return paymentRepository.findByIdAndReservationPetOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado"));
    }
}
