package br.com.snowcia.reservation.dto;

import java.time.LocalDate;
import java.math.BigDecimal;

import br.com.snowcia.reservation.Reservation;
import br.com.snowcia.reservation.ReservationStatus;
import br.com.snowcia.reservation.ReservationServiceType;

public record ReservationResponse(Long id, Long petId, String petName, LocalDate checkInDate,
        LocalDate checkOutDate, ReservationStatus status, ReservationServiceType serviceType, String notes,
        String declineReason, BigDecimal totalAmount, String ownerName, String ownerEmail, String ownerPhone) {

    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(reservation.getId(), reservation.getPet().getId(), reservation.getPet().getName(),
                reservation.getCheckInDate(), reservation.getCheckOutDate(), reservation.getStatus(), reservation.getServiceType(),
                reservation.getNotes(), reservation.getDeclineReason(), reservation.getTotalAmount(),
                reservation.getPet().getOwner().getName(), reservation.getPet().getOwner().getEmail(),
                reservation.getPet().getOwner().getPhone());
    }
}
