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

    private static final BigDecimal WEEKDAY_RATE = new BigDecimal("50.00");
    private static final BigDecimal WEEKEND_RATE = new BigDecimal("60.00");
    private static final BigDecimal HOLIDAY_RATE = new BigDecimal("75.00");

    private final Set<LocalDate> holidayDates;

    public ReservationPricingService(@Value("${snowcia.pricing.holiday-dates:}") String configuredHolidayDates) {
        this.holidayDates = Arrays.stream(configuredHolidayDates.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(LocalDate::parse)
                .collect(Collectors.toUnmodifiableSet());
    }

    public ReservationPrice calculate(LocalDate checkInDate, LocalDate checkOutDate) {
        BigDecimal total = BigDecimal.ZERO;
        for (var date = checkInDate; date.isBefore(checkOutDate); date = date.plusDays(1)) {
            total = total.add(dailyRate(date));
        }
        return new ReservationPrice(total);
    }

    private BigDecimal dailyRate(LocalDate date) {
        if (holidayDates.contains(date)) {
            return HOLIDAY_RATE;
        }
        if (isHighSeason(date) || isWeekend(date)) {
            return WEEKEND_RATE;
        }
        return WEEKDAY_RATE;
    }

    private boolean isWeekend(LocalDate date) {
        return date.getDayOfWeek() == DayOfWeek.FRIDAY
                || date.getDayOfWeek() == DayOfWeek.SATURDAY
                || date.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private boolean isHighSeason(LocalDate date) {
        return date.getMonth() == Month.JANUARY || date.getMonth() == Month.JULY || date.getMonth() == Month.DECEMBER;
    }

    public record ReservationPrice(BigDecimal totalAmount) {
    }
}
