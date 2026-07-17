package br.com.snowcia.offering.dto;
import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
public record ServiceExtraRequest(@NotBlank String code, @NotBlank String name, @NotNull @DecimalMin("0.00") BigDecimal price, @NotBlank String pricing) { }
