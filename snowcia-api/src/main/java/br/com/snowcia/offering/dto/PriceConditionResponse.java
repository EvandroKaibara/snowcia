package br.com.snowcia.offering.dto;

import java.math.BigDecimal;
import br.com.snowcia.offering.ServicePriceCondition;

public record PriceConditionResponse(String name, BigDecimal price) {
    public static PriceConditionResponse from(ServicePriceCondition condition) { return new PriceConditionResponse(condition.getName(), condition.getPrice()); }
}
