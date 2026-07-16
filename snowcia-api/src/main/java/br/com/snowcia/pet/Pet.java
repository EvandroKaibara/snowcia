package br.com.snowcia.pet;

import java.time.Instant;
import java.time.LocalDate;

import br.com.snowcia.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "pets")
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private AppUser owner;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PetSpecies species;

    @Column(length = 100)
    private String breed;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(length = 20) private String gender;
    @Column(name = "neutered") private Boolean neutered;
    @Column(name = "vaccinations_current") private Boolean vaccinationsCurrent;
    @Column(name = "flea_prevention_current") private Boolean fleaPreventionCurrent;
    @Column(length = 500) private String healthConditions;
    @Column(length = 500) private String specialCare;
    @Column(length = 500) private String allergies;
    @Column(name = "human_social", length = 100) private String humanSocial;
    @Column(name = "pet_social", length = 100) private String petSocial;
    @Column(name = "important_habits", length = 500) private String importantHabits;
    @Column(length = 500) private String observations;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Pet() {
    }

    public Pet(AppUser owner, String name, PetSpecies species, String breed, LocalDate birthDate, String gender,
            Boolean neutered, Boolean vaccinationsCurrent, Boolean fleaPreventionCurrent, String healthConditions,
            String specialCare, String allergies, String humanSocial, String petSocial, String importantHabits, String observations) {
        this.owner = owner;
        update(name, species, breed, birthDate, gender, neutered, vaccinationsCurrent, fleaPreventionCurrent, healthConditions, specialCare, allergies, humanSocial, petSocial, importantHabits, observations);
    }

    public void update(String name, PetSpecies species, String breed, LocalDate birthDate, String gender, Boolean neutered, Boolean vaccinationsCurrent, Boolean fleaPreventionCurrent, String healthConditions, String specialCare, String allergies, String humanSocial, String petSocial, String importantHabits, String observations) {
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.birthDate = birthDate;
        this.gender = gender; this.neutered = neutered; this.vaccinationsCurrent = vaccinationsCurrent; this.fleaPreventionCurrent = fleaPreventionCurrent; this.healthConditions = healthConditions; this.specialCare = specialCare; this.allergies = allergies; this.humanSocial = humanSocial; this.petSocial = petSocial; this.importantHabits = importantHabits; this.observations = observations;
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public PetSpecies getSpecies() {
        return species;
    }

    public AppUser getOwner() {
        return owner;
    }

    public String getBreed() {
        return breed;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }
    public String getGender() { return gender; }
    public Boolean getNeutered() { return neutered; }
    public Boolean getVaccinationsCurrent() { return vaccinationsCurrent; }
    public Boolean getFleaPreventionCurrent() { return fleaPreventionCurrent; }
    public String getHealthConditions() { return healthConditions; }
    public String getSpecialCare() { return specialCare; }
    public String getAllergies() { return allergies; }
    public String getHumanSocial() { return humanSocial; }
    public String getPetSocial() { return petSocial; }
    public String getImportantHabits() { return importantHabits; }
    public String getObservations() { return observations; }
}
