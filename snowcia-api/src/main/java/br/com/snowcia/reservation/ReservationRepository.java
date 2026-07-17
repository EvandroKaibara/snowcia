package br.com.snowcia.reservation;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findAllByPetOwnerIdOrderByCheckInDateAsc(Long ownerId);

    List<Reservation> findAllByOrderByCheckInDateAsc();

    List<Reservation> findAllByAssignedAdminIdOrderByCheckInDateAsc(Long adminId);

    List<Reservation> findAllByStatusAndCheckOutDateBefore(ReservationStatus status, LocalDate date);

    Optional<Reservation> findByIdAndPetOwnerId(Long id, Long ownerId);

    Optional<Reservation> findByIdAndAssignedAdminId(Long id, Long adminId);

    boolean existsByPetIdAndIdNotAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
            Long petId, Long id, Collection<ReservationStatus> statuses, LocalDate checkOutDate, LocalDate checkInDate);

    boolean existsByPetIdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
            Long petId, Collection<ReservationStatus> statuses, LocalDate checkOutDate, LocalDate checkInDate);
}
