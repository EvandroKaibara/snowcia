package br.com.snowcia.reservation;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

import br.com.snowcia.pet.Pet;
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

    @Column(length = 500)
    private String notes;

    @Column(name = "decline_reason", length = 500)
    private String declineReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    protected Reservation() {
    }

    public Reservation(Pet pet, ReservationServiceType serviceType, LocalDate checkInDate, LocalDate checkOutDate,
            LocalTime checkInTime, LocalTime checkOutTime, String notes, BigDecimal totalAmount) {
        this.pet = pet;
        this.status = ReservationStatus.PENDING;
        this.serviceType = serviceType;
        this.totalAmount = totalAmount;
        update(checkInDate, checkOutDate, checkInTime, checkOutTime, notes);
    }

    public void update(LocalDate checkInDate, LocalDate checkOutDate, LocalTime checkInTime, LocalTime checkOutTime, String notes) {
        this.checkInDate = checkInDate;
        this.checkOutDate = checkOutDate;
        this.checkInTime = checkInTime;
        this.checkOutTime = checkOutTime;
        this.notes = notes;
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
    public LocalDate getCheckInDate() { return checkInDate; }
    public LocalDate getCheckOutDate() { return checkOutDate; }
    public LocalTime getCheckInTime() { return checkInTime; }
    public LocalTime getCheckOutTime() { return checkOutTime; }
    public ReservationStatus getStatus() { return status; }
    public ReservationServiceType getServiceType() { return serviceType; }
    public String getNotes() { return notes; }
    public String getDeclineReason() { return declineReason; }
    public BigDecimal getTotalAmount() { return totalAmount; }
}
