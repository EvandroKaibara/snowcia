package br.com.snowcia.reservation;

import java.util.List;

import br.com.snowcia.pet.Pet;
import br.com.snowcia.pet.PetRepository;
import br.com.snowcia.reservation.dto.ReservationRequest;
import br.com.snowcia.reservation.dto.ReservationResponse;
import br.com.snowcia.user.AppUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final PetRepository petRepository;

    public ReservationService(ReservationRepository reservationRepository, PetRepository petRepository) {
        this.reservationRepository = reservationRepository;
        this.petRepository = petRepository;
    }

    public ReservationResponse create(AppUser owner, ReservationRequest request) {
        validateDates(request);
        var pet = findOwnedPet(owner, request.petId());
        ensureAvailable(pet, request, null);
        return ReservationResponse.from(reservationRepository.save(
                new Reservation(pet, request.checkInDate(), request.checkOutDate(), normalize(request.notes()))));
    }

    public List<ReservationResponse> list(AppUser owner) {
        return reservationRepository.findAllByPetOwnerIdOrderByCheckInDateAsc(owner.getId()).stream()
                .map(ReservationResponse::from).toList();
    }

    public ReservationResponse get(AppUser owner, Long id) {
        return ReservationResponse.from(findOwnedReservation(owner, id));
    }

    public ReservationResponse update(AppUser owner, Long id, ReservationRequest request) {
        validateDates(request);
        var reservation = findOwnedReservation(owner, id);
        if (!reservation.getPet().getId().equals(request.petId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O pet da reserva não pode ser alterado");
        }
        ensureAvailable(reservation.getPet(), request, reservation.getId());
        reservation.update(request.checkInDate(), request.checkOutDate(), normalize(request.notes()));
        return ReservationResponse.from(reservationRepository.save(reservation));
    }

    public void delete(AppUser owner, Long id) {
        reservationRepository.delete(findOwnedReservation(owner, id));
    }

    private void validateDates(ReservationRequest request) {
        if (!request.checkOutDate().isAfter(request.checkInDate())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A saída deve ser posterior à entrada");
        }
    }

    private void ensureAvailable(Pet pet, ReservationRequest request, Long reservationId) {
        var activeStatuses = List.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED);
        boolean conflict = reservationId == null
                ? reservationRepository.existsByPetIdAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                        pet.getId(), activeStatuses, request.checkOutDate(), request.checkInDate())
                : reservationRepository.existsByPetIdAndIdNotAndStatusInAndCheckInDateLessThanAndCheckOutDateGreaterThan(
                        pet.getId(), reservationId, activeStatuses, request.checkOutDate(), request.checkInDate());
        if (conflict) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "O pet já possui uma reserva nesse período");
        }
    }

    private Pet findOwnedPet(AppUser owner, Long id) {
        return petRepository.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet não encontrado"));
    }

    private Reservation findOwnedReservation(AppUser owner, Long id) {
        return reservationRepository.findByIdAndPetOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva não encontrada"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
