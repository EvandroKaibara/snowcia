package br.com.snowcia.pet.dto;

import java.time.LocalDate;

import br.com.snowcia.pet.Pet;
import br.com.snowcia.pet.PetSpecies;

public record PetResponse(Long id, Long ownerId, String ownerName, String ownerEmail, String ownerPhone, String ownerAddress, String name, PetSpecies species, String breed, LocalDate birthDate, String gender, Boolean neutered, Boolean vaccinationsCurrent, Boolean fleaPreventionCurrent, String healthConditions, String specialCare, String allergies, String humanSocial, String petSocial, String importantHabits, String observations) {

    public static PetResponse from(Pet pet) {
        var owner = pet.getOwner(); return new PetResponse(pet.getId(), owner.getId(), owner.getName(), owner.getEmail(), owner.getPhone(), owner.getAddress(), pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getBirthDate(), pet.getGender(), pet.getNeutered(), pet.getVaccinationsCurrent(), pet.getFleaPreventionCurrent(), pet.getHealthConditions(), pet.getSpecialCare(), pet.getAllergies(), pet.getHumanSocial(), pet.getPetSocial(), pet.getImportantHabits(), pet.getObservations());
    }
}
