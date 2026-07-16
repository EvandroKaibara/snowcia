package br.com.snowcia.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import br.com.snowcia.reservation.ReservationServiceType;

public record ReservationRequest(
        @NotNull Long petId,
        @NotNull ReservationServiceType serviceType,
        @NotNull @FutureOrPresent LocalDate checkInDate,
        @NotNull @FutureOrPresent LocalDate checkOutDate,
        @NotNull LocalTime checkInTime,
        @NotNull LocalTime checkOutTime,
        @Size(max = 500) String notes) {
}
