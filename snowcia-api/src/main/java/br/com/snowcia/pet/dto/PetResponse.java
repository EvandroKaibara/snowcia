package br.com.snowcia.pet.dto;

import java.time.LocalDate;

import br.com.snowcia.pet.Pet;
import br.com.snowcia.pet.PetSpecies;

public record PetResponse(Long id, String name, PetSpecies species, String breed, LocalDate birthDate) {

    public static PetResponse from(Pet pet) {
        return new PetResponse(pet.getId(), pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getBirthDate());
    }
}
