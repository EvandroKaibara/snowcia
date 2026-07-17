package br.com.snowcia.offering.dto;

import java.util.List;
import br.com.snowcia.offering.BillingType;
import br.com.snowcia.offering.ServiceCategory;
import br.com.snowcia.offering.ServiceOffering;
import br.com.snowcia.offering.ServiceTarget;
import br.com.snowcia.offering.DurationUnit;

public record ServiceOfferingResponse(Long id, String name, String description, ServiceCategory category, ServiceTarget target,
        BillingType billingType, Integer durationMinutes, DurationUnit durationUnit, boolean active, boolean allowDateSelection,
        boolean allowTimeSelection, boolean allowCustomerNotes, boolean allowCheckInOut, Integer maxPets,
        List<PriceConditionResponse> priceConditions) {
    public static ServiceOfferingResponse from(ServiceOffering service) {
        return new ServiceOfferingResponse(service.getId(), service.getName(), service.getDescription(), service.getCategory(),
                service.getTarget(), service.getBillingType(), service.getDurationMinutes(), service.getDurationUnit(), service.isActive(),
                service.isAllowDateSelection(), service.isAllowTimeSelection(), service.isAllowCustomerNotes(),
                service.isAllowCheckInOut(), service.getMaxPets(), service.getPriceConditions().stream().map(PriceConditionResponse::from).toList());
    }
}
