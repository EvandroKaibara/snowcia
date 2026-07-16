package br.com.snowcia.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UserProfileRequest(@NotBlank @Size(max = 120) String name, @NotBlank @Size(max = 30) String phone,
        @Size(max = 300) String address) { }
