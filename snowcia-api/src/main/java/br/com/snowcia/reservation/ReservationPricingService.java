package br.com.snowcia.reservation;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ReservationPricingService {

    private static final BigDecimal HOSTING_WEEKDAY_RATE = new BigDecimal("50.00");
    private static final BigDecimal HOSTING_WEEKEND_RATE = new BigDecimal("60.00");
    private static final BigDecimal HOLIDAY_RATE = new BigDecimal("75.00");

    private final Set<LocalDate> holidayDates;

    public ReservationPricingService(@Value("${snowcia.pricing.holiday-dates:}") String configuredHolidayDates) {
        this.holidayDates = Arrays.stream(configuredHolidayDates.split(","))
                .map(String::trim).filter(value -> !value.isEmpty()).map(LocalDate::parse)
                .collect(Collectors.toUnmodifiableSet());
    }

    public ReservationPrice calculate(ReservationServiceType serviceType, LocalDate checkInDate, LocalDate checkOutDate) {
        if (isMonthlyPlan(serviceType)) {
            return new ReservationPrice(monthlyPrice(serviceType));
        }
        BigDecimal total = BigDecimal.ZERO;
        for (var date = checkInDate; date.isBefore(checkOutDate); date = date.plusDays(1)) {
            total = total.add(dailyRate(serviceType, date));
        }
        return new ReservationPrice(total);
    }

    private BigDecimal dailyRate(ReservationServiceType serviceType, LocalDate date) {
        return switch (serviceType) {
            case HOSTING_24H -> hostingRate(date);
            case DAYCARE_HALF_DAY -> new BigDecimal("30.00");
            case DAYCARE_FULL_DAY -> isWeekend(date) || holidayDates.contains(date)
                    ? new BigDecimal("55.00") : new BigDecimal("45.00");
            case DAYCARE_EXTRA_HOUR -> new BigDecimal("5.00");
            case DAYCARE_EXTRA_WALK -> new BigDecimal("10.00");
            case WALK_20_MIN -> new BigDecimal("20.00");
            case CAT_SITTER_DAILY -> new BigDecimal("25.00");
            case CAT_SITTER_ADDITIONAL_CAT -> new BigDecimal("15.00");
            case CAT_SITTER_EXTRA_VISIT -> new BigDecimal("10.00");
            default -> throw new IllegalArgumentException("Serviço mensal deve ser calculado por pacote");
        };
    }

    private BigDecimal hostingRate(LocalDate date) {
        if (holidayDates.contains(date)) return HOLIDAY_RATE;
        return isHighSeason(date) || isWeekend(date) ? HOSTING_WEEKEND_RATE : HOSTING_WEEKDAY_RATE;
    }

    private boolean isMonthlyPlan(ReservationServiceType serviceType) {
        return serviceType.name().startsWith("MONTHLY_");
    }

    private BigDecimal monthlyPrice(ReservationServiceType serviceType) {
        return switch (serviceType) {
            case MONTHLY_DAYCARE_2X -> new BigDecimal("330.00");
            case MONTHLY_DAYCARE_3X -> new BigDecimal("480.00");
            case MONTHLY_DAYCARE_5X -> new BigDecimal("780.00");
            case MONTHLY_WALKS_2X -> new BigDecimal("150.00");
            case MONTHLY_WALKS_3X -> new BigDecimal("215.00");
            case MONTHLY_WALKS_5X -> new BigDecimal("340.00");
            default -> throw new IllegalArgumentException("Pacote mensal inválido");
        };
    }

    private boolean isWeekend(LocalDate date) {
        return date.getDayOfWeek() == DayOfWeek.FRIDAY || date.getDayOfWeek() == DayOfWeek.SATURDAY
                || date.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private boolean isHighSeason(LocalDate date) {
        return date.getMonth() == Month.JANUARY || date.getMonth() == Month.JULY || date.getMonth() == Month.DECEMBER;
    }

    public record ReservationPrice(BigDecimal totalAmount) { }
}
