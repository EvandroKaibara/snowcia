package br.com.snowcia.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeclineReservationRequest(
        @NotBlank @Size(max = 500) String reason) {
}
