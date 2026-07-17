package br.com.snowcia.offering;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ServiceExtra {
    @Column(name = "extra_code", nullable = false, length = 60) private String code;
    @Column(name = "extra_name", nullable = false, length = 120) private String name;
    @Column(name = "extra_price", nullable = false, precision = 10, scale = 2) private BigDecimal price;
    @Column(name = "extra_pricing", nullable = false, length = 30) private String pricing;
    protected ServiceExtra() { }
    public ServiceExtra(String code, String name, BigDecimal price, String pricing) { this.code = code; this.name = name; this.price = price; this.pricing = pricing; }
    public String getCode() { return code; } public String getName() { return name; }
    public BigDecimal getPrice() { return price; } public String getPricing() { return pricing; }
}
