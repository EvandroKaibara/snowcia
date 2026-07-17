package br.com.snowcia.payment;

import java.util.List;

import br.com.snowcia.payment.dto.PaymentResponse;
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

    public List<PaymentResponse> list(AppUser admin) {
        ensureAdmin(admin);
        var payments = paymentRepository.findAllByReservationAssignedAdminIdOrderByCreatedAtDesc(admin.getId());
        var reservationsToCancel = payments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.CANCELLED)
                .map(Payment::getReservation)
                .filter(reservation -> reservation.getStatus() == br.com.snowcia.reservation.ReservationStatus.AWAITING_PAYMENT)
                .toList();
        reservationsToCancel.forEach(reservation -> reservation.cancel());
        if (!reservationsToCancel.isEmpty()) reservationRepository.saveAll(reservationsToCancel);
        return payments.stream().map(PaymentResponse::from).toList();
    }
    public PaymentResponse get(AppUser admin, Long id) { return PaymentResponse.from(findPayment(admin, id)); }

    public PaymentResponse markAsPaid(AppUser admin, Long id) {
        var payment = findPayment(admin, id);
        if (payment.getStatus() == PaymentStatus.CANCELLED) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um pagamento cancelado não pode ser confirmado");
        payment.markAsPaid();
        payment.getReservation().confirm();
        reservationRepository.save(payment.getReservation());
        return PaymentResponse.from(paymentRepository.save(payment));
    }

    public PaymentResponse cancel(AppUser admin, Long id) {
        var payment = findPayment(admin, id);
        if (payment.getStatus() == PaymentStatus.PAID) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Um pagamento confirmado não pode ser cancelado");
        payment.cancel();
        payment.getReservation().cancel();
        reservationRepository.save(payment.getReservation());
        return PaymentResponse.from(paymentRepository.save(payment));
    }
    public PaymentResponse markAsPending(AppUser admin, Long id) { var payment = findPayment(admin, id); payment.markAsPending(); return PaymentResponse.from(paymentRepository.save(payment)); }

    private Payment findPayment(AppUser admin, Long id) { ensureAdmin(admin); return paymentRepository.findByIdAndReservationAssignedAdminId(id, admin.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pagamento não encontrado")); }
    private void ensureAdmin(AppUser user) { if (!user.isAdmin()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ação restrita à administração"); }
}
