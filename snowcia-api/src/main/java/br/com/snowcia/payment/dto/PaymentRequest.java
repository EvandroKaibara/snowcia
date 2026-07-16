package br.com.snowcia.payment.dto;

import java.math.BigDecimal;

import br.com.snowcia.payment.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

public record PaymentRequest(
        @NotNull Long reservationId,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 8, fraction = 2) BigDecimal amount,
        @NotNull PaymentMethod method) {
}
