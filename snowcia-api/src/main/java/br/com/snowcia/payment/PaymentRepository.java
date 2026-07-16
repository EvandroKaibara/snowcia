package br.com.snowcia.payment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByReservationPetOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Payment> findByIdAndReservationPetOwnerId(Long id, Long ownerId);

    boolean existsByReservationId(Long reservationId);
}
