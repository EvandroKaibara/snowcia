package br.com.snowcia.payment.dto;

import java.math.BigDecimal;
import java.time.Instant;

import br.com.snowcia.payment.Payment;
import br.com.snowcia.payment.PaymentMethod;
import br.com.snowcia.payment.PaymentStatus;

public record PaymentResponse(Long id, Long reservationId, Long petId, String petName, BigDecimal amount,
        PaymentMethod method, PaymentStatus status, Instant paidAt) {

    public static PaymentResponse from(Payment payment) {
        var reservation = payment.getReservation();
        var pet = reservation.getPet();
        return new PaymentResponse(payment.getId(), reservation.getId(), pet.getId(), pet.getName(), payment.getAmount(),
                payment.getMethod(), payment.getStatus(), payment.getPaidAt());
    }
}
