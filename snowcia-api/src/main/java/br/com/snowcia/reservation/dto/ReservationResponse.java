package br.com.snowcia.reservation.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

import br.com.snowcia.reservation.Reservation;
import br.com.snowcia.reservation.ReservationStatus;
import br.com.snowcia.reservation.ReservationServiceType;

public record ReservationResponse(Long id, Long petId, String petName, LocalDate checkInDate,
        LocalDate checkOutDate, LocalTime checkInTime, LocalTime checkOutTime, ReservationStatus status, ReservationServiceType serviceType, Long serviceOfferingId, String serviceName, String notes,
        String declineReason, BigDecimal totalAmount, String ownerName, String ownerEmail, String ownerPhone, Long assignedAdminId, String assignedAdminName) {

    public static ReservationResponse from(Reservation reservation) {
        return new ReservationResponse(reservation.getId(), reservation.getPet().getId(), reservation.getPet().getName(),
                reservation.getCheckInDate(), reservation.getCheckOutDate(), reservation.getCheckInTime(), reservation.getCheckOutTime(), reservation.getStatus(), reservation.getServiceType(), reservation.getServiceOffering() == null ? null : reservation.getServiceOffering().getId(), reservation.getServiceOffering() == null ? reservation.getServiceType().name() : reservation.getServiceOffering().getName(),
                reservation.getNotes(), reservation.getDeclineReason(), reservation.getTotalAmount(),
                reservation.getPet().getOwner().getName(), reservation.getPet().getOwner().getEmail(),
                reservation.getPet().getOwner().getPhone(), reservation.getAssignedAdmin() == null ? null : reservation.getAssignedAdmin().getId(), reservation.getAssignedAdmin() == null ? null : reservation.getAssignedAdmin().getName());
    }
}
