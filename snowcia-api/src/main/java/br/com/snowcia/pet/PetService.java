package br.com.snowcia.pet;

import java.util.List;

import br.com.snowcia.pet.dto.PetRequest;
import br.com.snowcia.pet.dto.PetResponse;
import br.com.snowcia.user.AppUser;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PetService {

    private final PetRepository petRepository;

    public PetService(PetRepository petRepository) {
        this.petRepository = petRepository;
    }

    public PetResponse create(AppUser owner, PetRequest request) {
        var pet = new Pet(owner, request.name().trim(), request.species(), normalize(request.breed()), request.birthDate(), normalize(request.gender()), request.neutered(), request.vaccinationsCurrent(), request.fleaPreventionCurrent(), normalize(request.healthConditions()), normalize(request.specialCare()), normalize(request.allergies()), normalize(request.humanSocial()), normalize(request.petSocial()), normalize(request.importantHabits()), normalize(request.observations()));
        return PetResponse.from(petRepository.save(pet));
    }

    public List<PetResponse> list(AppUser owner) {
        var pets = owner.isAdmin() ? petRepository.findAllByOrderByNameAsc() : petRepository.findAllByOwnerIdOrderByNameAsc(owner.getId());
        return pets.stream().map(PetResponse::from).toList();
    }

    public PetResponse get(AppUser owner, Long id) {
        return PetResponse.from(findOwnedPet(owner, id));
    }

    public PetResponse update(AppUser owner, Long id, PetRequest request) {
        var pet = findOwnedPet(owner, id);
        pet.update(request.name().trim(), request.species(), normalize(request.breed()), request.birthDate(), normalize(request.gender()), request.neutered(), request.vaccinationsCurrent(), request.fleaPreventionCurrent(), normalize(request.healthConditions()), normalize(request.specialCare()), normalize(request.allergies()), normalize(request.humanSocial()), normalize(request.petSocial()), normalize(request.importantHabits()), normalize(request.observations()));
        return PetResponse.from(petRepository.save(pet));
    }

    public void delete(AppUser owner, Long id) {
        petRepository.delete(findOwnedPet(owner, id));
    }

    private Pet findOwnedPet(AppUser owner, Long id) {
        return petRepository.findByIdAndOwnerId(id, owner.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pet não encontrado"));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
