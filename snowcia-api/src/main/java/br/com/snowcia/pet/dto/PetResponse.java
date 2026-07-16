package br.com.snowcia.pet.dto;

import java.time.LocalDate;

import br.com.snowcia.pet.Pet;
import br.com.snowcia.pet.PetSpecies;

public record PetResponse(Long id, String name, PetSpecies species, String breed, LocalDate birthDate, String gender, Boolean neutered, Boolean vaccinationsCurrent, Boolean fleaPreventionCurrent, String healthConditions, String specialCare, String allergies, String humanSocial, String petSocial, String importantHabits, String observations) {

    public static PetResponse from(Pet pet) {
        return new PetResponse(pet.getId(), pet.getName(), pet.getSpecies(), pet.getBreed(), pet.getBirthDate(), pet.getGender(), pet.getNeutered(), pet.getVaccinationsCurrent(), pet.getFleaPreventionCurrent(), pet.getHealthConditions(), pet.getSpecialCare(), pet.getAllergies(), pet.getHumanSocial(), pet.getPetSocial(), pet.getImportantHabits(), pet.getObservations());
    }
}
