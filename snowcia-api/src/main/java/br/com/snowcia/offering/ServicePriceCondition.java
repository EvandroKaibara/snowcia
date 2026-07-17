package br.com.snowcia.offering;

import java.math.BigDecimal;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class ServicePriceCondition {
    @Column(name = "condition_name", nullable = false, length = 80)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    protected ServicePriceCondition() { }

    public ServicePriceCondition(String name, BigDecimal price) {
        this.name = name;
        this.price = price;
    }

    public String getName() { return name; }
    public BigDecimal getPrice() { return price; }
}
