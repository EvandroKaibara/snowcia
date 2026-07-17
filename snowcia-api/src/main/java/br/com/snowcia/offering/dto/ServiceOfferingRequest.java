package br.com.snowcia.offering.dto;

import java.util.List;
import br.com.snowcia.offering.BillingType;
import br.com.snowcia.offering.ServiceCategory;
import br.com.snowcia.offering.ServiceTarget;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record ServiceOfferingRequest(
        @NotBlank String name, String description, @NotNull ServiceCategory category, @NotNull ServiceTarget target,
        @NotNull BillingType billingType, @Min(1) Integer durationMinutes, boolean active,
        boolean allowDateSelection, boolean allowTimeSelection, boolean allowCustomerNotes, boolean allowCheckInOut,
        @Min(1) Integer maxPets, @NotEmpty List<@Valid PriceConditionRequest> priceConditions) { }
