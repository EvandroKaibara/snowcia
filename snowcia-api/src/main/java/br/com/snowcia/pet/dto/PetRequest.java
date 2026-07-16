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
        @PastOrPresent LocalDate birthDate) {
}
