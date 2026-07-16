package br.com.snowcia.reservation.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReservationRequest(
        @NotNull Long petId,
        @NotNull @FutureOrPresent LocalDate checkInDate,
        @NotNull @FutureOrPresent LocalDate checkOutDate,
        @Size(max = 500) String notes) {
}
