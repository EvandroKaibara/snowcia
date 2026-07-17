package br.com.snowcia.offering;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "service_offerings")
public class ServiceOffering {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 120) private String name;
    @Column(length = 1000) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private ServiceCategory category;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private ServiceTarget target;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private BillingType billingType;
    @Column(name = "duration_minutes") private Integer durationMinutes;
    @Enumerated(EnumType.STRING) @Column(name = "duration_unit", nullable = false, length = 20) private DurationUnit durationUnit = DurationUnit.MINUTES;
    @Column(nullable = false) private boolean active = true;
    @Column(name = "allow_date_selection", nullable = false) private boolean allowDateSelection = true;
    @Column(name = "allow_time_selection", nullable = false) private boolean allowTimeSelection;
    @Column(name = "allow_customer_notes", nullable = false) private boolean allowCustomerNotes = true;
    @Column(name = "allow_check_in_out", nullable = false) private boolean allowCheckInOut;
    @Column(name = "max_pets") private Integer maxPets;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "service_price_conditions", joinColumns = @JoinColumn(name = "service_id"))
    private List<ServicePriceCondition> priceConditions = new ArrayList<>();

    protected ServiceOffering() { }

    public ServiceOffering(String name, String description, ServiceCategory category, ServiceTarget target, BillingType billingType,
            Integer durationMinutes, DurationUnit durationUnit, boolean active, boolean allowDateSelection, boolean allowTimeSelection,
            boolean allowCustomerNotes, boolean allowCheckInOut, Integer maxPets, List<ServicePriceCondition> priceConditions) {
        update(name, description, category, target, billingType, durationMinutes, durationUnit, active, allowDateSelection, allowTimeSelection,
                allowCustomerNotes, allowCheckInOut, maxPets, priceConditions);
    }
    public void update(String name, String description, ServiceCategory category, ServiceTarget target, BillingType billingType,
            Integer durationMinutes, DurationUnit durationUnit, boolean active, boolean allowDateSelection, boolean allowTimeSelection,
            boolean allowCustomerNotes, boolean allowCheckInOut, Integer maxPets, List<ServicePriceCondition> priceConditions) {
        this.name = name; this.description = description; this.category = category; this.target = target; this.billingType = billingType;
        this.durationMinutes = durationMinutes; this.durationUnit = durationUnit == null ? DurationUnit.MINUTES : durationUnit; this.active = active; this.allowDateSelection = allowDateSelection;
        this.allowTimeSelection = allowTimeSelection; this.allowCustomerNotes = allowCustomerNotes; this.allowCheckInOut = allowCheckInOut;
        this.maxPets = maxPets; this.priceConditions.clear(); this.priceConditions.addAll(priceConditions);
    }
    public Long getId() { return id; } public String getName() { return name; } public String getDescription() { return description; }
    public ServiceCategory getCategory() { return category; } public ServiceTarget getTarget() { return target; }
    public BillingType getBillingType() { return billingType; } public Integer getDurationMinutes() { return durationMinutes; }
    public DurationUnit getDurationUnit() { return durationUnit; }
    public boolean isActive() { return active; } public boolean isAllowDateSelection() { return allowDateSelection; }
    public boolean isAllowTimeSelection() { return allowTimeSelection; } public boolean isAllowCustomerNotes() { return allowCustomerNotes; }
    public boolean isAllowCheckInOut() { return allowCheckInOut; } public Integer getMaxPets() { return maxPets; }
    public List<ServicePriceCondition> getPriceConditions() { return priceConditions; }
}
