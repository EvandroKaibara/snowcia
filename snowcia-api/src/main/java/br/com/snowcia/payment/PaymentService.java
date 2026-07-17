package br.com.snowcia.payment;

import java.util.List;

import br.com.snowcia.payment.dto.PaymentResponse;
import br.com.snowcia.reservation.ReservationRepository;
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

    public List<PaymentResponse> list() {
        var payments = paymentRepository.findAllByOrderByCreatedAtDesc();
        var reservationsToCancel = payments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.CANCELLED)
                .map(Payment::getReservation)
                .filter(reservation -> reservation.getStatus() == br.com.snowcia.reservation.ReservationStatus.AWAITING_PAYMENT)
                .toList();
        reservationsToCancel.forEach(reservation -> reservation.cancel());
        if (!reservationsToCancel.isEmpty()) reservationRepository.saveAll(reservationsToCancel);
        return payments.stream().map(PaymentResponse::from).toList();
    }
    public PaymentResponse get(Long id) { return PaymentResponse.from(findPayment(id)); }

    public PaymentResponse markAsPaid(Long id) {
        var payment = findPayment(id);
        if (payment.getStatus() == PaymentStatus.CANCELLED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um pagamento cancelado não pode ser confirmado");
        payment.markAsPaid();
        payment.getReservation().confirm();
        reservationRepository.save(payment.getReservation());
        return PaymentResponse.from(paymentRepository.save(payment));
    }

    public PaymentResponse cancel(Long id) {
        var payment = findPayment(id);
        if (payment.getStatus() == PaymentStatus.PAID) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um pagamento confirmado não pode ser cancelado");
        payment.cancel();
        payment.getReservation().cancel();
        reservationRepository.save(payment.getReservation());
        return PaymentResponse.from(paymentRepository.save(payment));
    }
    public PaymentResponse markAsPending(Long id) { var payment = findPayment(id); payment.markAsPending(); return PaymentResponse.from(paymentRepository.save(payment)); }

    private Payment findPayment(Long id) { return paymentRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado")); }
}
