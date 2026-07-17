package br.com.snowcia.pet.dto;

import java.time.LocalDate;

import br.com.snowcia.pet.PetSpecies;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record PetRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull PetSpecies species,
        @Size(max = 100) String breed,
        @PastOrPresent LocalDate birthDate, @Size(max = 20) String gender, Boolean neutered, Boolean vaccinationsCurrent,
        Boolean fleaPreventionCurrent, @Size(max = 500) String healthConditions, @Size(max = 500) String specialCare,
        @Size(max = 500) String allergies, @Size(max = 100) String humanSocial, @Size(max = 100) String petSocial,
        @Size(max = 500) String importantHabits, @Size(max = 500) String observations) {
}
