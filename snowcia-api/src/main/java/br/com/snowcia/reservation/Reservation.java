package br.com.snowcia.reservation;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import br.com.snowcia.pet.Pet;
import br.com.snowcia.offering.ServiceOffering;
import br.com.snowcia.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "reservations")
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(name = "pet_names", length = 500)
    private String petNames;

    @Column(name = "selected_dates", length = 1000)
    private String selectedDates;

    @Column(name = "additional_service_names", length = 1000)
    private String additionalServiceNames;

    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private LocalDate checkOutDate;

    @Column(name = "check_in_time")
    private LocalTime checkInTime;

    @Column(name = "check_out_time")
    private LocalTime checkOutTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ReservationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 30)
    private ReservationServiceType serviceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_offering_id")
    private ServiceOffering serviceOffering;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_admin_id")
    private AppUser assignedAdmin;

    @Column(length = 500)
    private String notes;

    @Column(name = "decline_reason", length = 500)
    private String declineReason;

    @Column(name = "internal_notes", length = 1000)
    private String internalNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    protected Reservation() {
    }

    public Reservation(Pet pet, String petNames, List<LocalDate> selectedDates, String additionalServiceNames, ReservationServiceType serviceType, ServiceOffering serviceOffering, AppUser assignedAdmin, LocalDate checkInDate, LocalDate checkOutDate,
            LocalTime checkInTime, LocalTime checkOutTime, String notes, BigDecimal totalAmount) {
        this.pet = pet;
        this.petNames = petNames;
        this.additionalServiceNames = additionalServiceNames;
        this.status = ReservationStatus.PENDING;
        this.serviceType = serviceType;
        this.serviceOffering = serviceOffering;
        this.assignedAdmin = assignedAdmin;
        this.totalAmount = totalAmount;
        update(checkInDate, checkOutDate, checkInTime, checkOutTime, notes, selectedDates);
    }

    public void update(LocalDate checkInDate, LocalDate checkOutDate, LocalTime checkInTime, LocalTime checkOutTime, String notes, List<LocalDate> selectedDates) {
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.checkInTime = checkInTime;
        this.checkOutTime = checkOutTime;
        this.notes = notes;
        this.selectedDates = selectedDates == null || selectedDates.isEmpty() ? null : selectedDates.stream().map(LocalDate::toString).collect(java.util.stream.Collectors.joining(","));
    }

    public void updateTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void approve() {
        status = ReservationStatus.AWAITING_PAYMENT;
        declineReason = null;
    }

    public void confirm() {
        status = ReservationStatus.CONFIRMED;
    }

    public void decline(String reason) {
        status = ReservationStatus.DECLINED;
        declineReason = reason;
    }

    public void updateAdditionalServiceNames(String names) { this.additionalServiceNames = names; }
    public void cancel() { status = ReservationStatus.CANCELLED; }
    public void updateService(ReservationServiceType serviceType, ServiceOffering serviceOffering) { this.serviceType = serviceType; this.serviceOffering = serviceOffering; }
    public void assignAdmin(AppUser admin) { this.assignedAdmin = admin; }

    public void complete() { status = ReservationStatus.COMPLETED; }
    public void updateInternalNotes(String notes) { internalNotes = notes; }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public Pet getPet() { return pet; }
    public String getPetNames() { return petNames; }
    public List<LocalDate> getSelectedDates() { return selectedDates == null || selectedDates.isBlank() ? List.of() : Arrays.stream(selectedDates.split(",")).map(LocalDate::parse).toList(); }
    public String getAdditionalServiceNames() { return additionalServiceNames; }
    public LocalDate getCheckInDate() { return checkInDate; }
    public LocalDate getCheckOutDate() { return checkOutDate; }
    public LocalTime getCheckInTime() { return checkInTime; }
    public LocalTime getCheckOutTime() { return checkOutTime; }
    public ReservationStatus getStatus() { return status; }
    public ReservationServiceType getServiceType() { return serviceType; }
    public ServiceOffering getServiceOffering() { return serviceOffering; }
    public AppUser getAssignedAdmin() { return assignedAdmin; }
    public String getNotes() { return notes; }
    public String getDeclineReason() { return declineReason; }
    public String getInternalNotes() { return internalNotes; }
    public BigDecimal getTotalAmount() { return totalAmount; }
}
