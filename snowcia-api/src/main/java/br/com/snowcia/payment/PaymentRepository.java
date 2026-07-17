package br.com.snowcia.payment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByReservationPetOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Payment> findAllByOrderByCreatedAtDesc();

    List<Payment> findAllByReservationAssignedAdminIdOrderByCreatedAtDesc(Long adminId);

    Optional<Payment> findByIdAndReservationPetOwnerId(Long id, Long ownerId);

    Optional<Payment> findByIdAndReservationAssignedAdminId(Long id, Long adminId);

    Optional<Payment> findByReservationId(Long reservationId);

    boolean existsByReservationId(Long reservationId);
}
