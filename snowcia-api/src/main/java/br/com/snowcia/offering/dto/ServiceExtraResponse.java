package br.com.snowcia.offering.dto;
import java.math.BigDecimal;
import br.com.snowcia.offering.ServiceExtra;
public record ServiceExtraResponse(String code, String name, BigDecimal price, String pricing) { public static ServiceExtraResponse from(ServiceExtra extra) { return new ServiceExtraResponse(extra.getCode(), extra.getName(), extra.getPrice(), extra.getPricing()); } }
