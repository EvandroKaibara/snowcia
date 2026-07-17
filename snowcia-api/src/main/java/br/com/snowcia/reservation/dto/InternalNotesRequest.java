package br.com.snowcia.reservation.dto;
import jakarta.validation.constraints.Size;
public record InternalNotesRequest(@Size(max = 1000) String notes) { }
