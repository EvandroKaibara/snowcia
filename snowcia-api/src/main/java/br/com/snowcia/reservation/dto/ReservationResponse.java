package br.com.snowcia.reservation.dto;

import java.time.LocalDate;
import java.math.BigDecimal;

import br.com.snowcia.reservation.Reservation;
import br.com.snowcia.reservation.ReservationStatus;

public record ReservationResponse(Long id, Long petId, String petName, LocalDate checkInDate,
        LocalDate checkOutDate, ReservationStatus status, String notes, BigDecimal totalAmount) {

    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(reservation.getId(), reservation.getPet().getId(), reservation.getPet().getName(),
                reservation.getCheckInDate(), reservation.getCheckOutDate(), reservation.getStatus(), reservation.getNotes(),
                reservation.getTotalAmount());
    }
}
