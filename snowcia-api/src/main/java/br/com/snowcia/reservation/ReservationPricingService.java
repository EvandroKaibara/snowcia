package br.com.snowcia.reservation;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import br.com.snowcia.offering.BillingType;
import br.com.snowcia.offering.ServiceCategory;
import br.com.snowcia.offering.ServiceOffering;
import br.com.snowcia.reservation.dto.ReservationRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReservationPricingService {

    private static final BigDecimal HOSTING_WEEKDAY_RATE = new BigDecimal("50.00");
    private static final BigDecimal HOSTING_WEEKEND_RATE = new BigDecimal("60.00");
    private static final BigDecimal HOLIDAY_RATE = new BigDecimal("75.00");
    private static final BigDecimal DAYCARE_EXTRA_HOUR = BigDecimal.valueOf(5);

    private final Set<LocalDate> holidayDates;

    public ReservationPricingService(@Value("${snowcia.pricing.holiday-dates:}") String configuredHolidayDates) {
        this.holidayDates = Arrays.stream(configuredHolidayDates.split(","))
                .map(String::trim).filter(value -> !value.isEmpty()).map(LocalDate::parse)
                .collect(Collectors.toUnmodifiableSet());
    }

    /** Legacy price table for reservations made without a catalog service. */
    public BigDecimal calculate(ReservationServiceType serviceType, LocalDate checkInDate, LocalDate checkOutDate) {
        if (serviceType.name().startsWith("MONTHLY_")) return monthlyPrice(serviceType);
        BigDecimal total = BigDecimal.ZERO;
        for (var date = checkInDate; date.isBefore(checkOutDate); date = date.plusDays(1)) {
            total = total.add(dailyRate(serviceType, date));
        }
        return total;
    }

    /** Price of one pet for a catalog service, extras included. */
    public BigDecimal offeringPrice(ServiceOffering offering, ReservationRequest request) {
        BigDecimal base;
        if (isSingleDay(offering) && hasSelectedDates(request)) {
            base = offeringPriceForDates(offering, request, reservationDates(request));
        } else {
            base = offeringPrice(offering, request.checkInDate(), request.checkOutDate(), request.checkInTime(), request.checkOutTime());
        }
        return base.add(extrasPrice(offering, request));
    }

    public BigDecimal offeringPriceForDates(ServiceOffering offering, ReservationRequest request, List<LocalDate> dates) {
        return dates.stream()
                .map(date -> offeringPrice(offering, date, date, request.checkInTime(), request.checkOutTime()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal offeringPrice(ServiceOffering offering, LocalDate checkIn, LocalDate checkOut, LocalTime checkInTime, LocalTime checkOutTime) {
        if (isDaycare(offering)) {
            var minutes = minutesBetween(checkIn, checkInTime, checkOut, checkOutTime);
            var overtimeHours = Math.max(0, (minutes - includedDaycareMinutes(offering) + 59) / 60);
            return priceForDate(offering, checkIn).add(DAYCARE_EXTRA_HOUR.multiply(BigDecimal.valueOf(overtimeHours)));
        }
        var total = BigDecimal.ZERO;
        if (offering.getBillingType() == BillingType.DAILY) {
            var days = dailyCount(checkIn, checkInTime, checkOut, checkOutTime);
            for (int index = 0; index < days; index++) total = total.add(priceForDate(offering, checkIn.plusDays(index)));
            return total;
        }
        var lastChargeableDay = checkOut.equals(checkIn) || isCatSitter(offering) ? checkOut.plusDays(1) : checkOut;
        for (var day = checkIn; day.isBefore(lastChargeableDay); day = day.plusDays(1)) total = total.add(priceForDate(offering, day));
        return total;
    }

    private BigDecimal extrasPrice(ServiceOffering offering, ReservationRequest request) {
        Map<String, Integer> quantities = request.extraQuantities() == null ? Map.of() : request.extraQuantities();
        var total = BigDecimal.ZERO;
        for (var extra : offering.getExtras()) {
            int quantity = quantities.getOrDefault(extra.getCode(), 0);
            if (quantity < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantidade de adicional inválida");
            if (quantity == 0) continue;
            long multiplier = "weekend_holiday".equals(extra.getCode()) ? weekendOrHolidayDays(request)
                    : "PER_DAY".equals(extra.getPricing()) ? chargeableDays(offering, request) : 1;
            total = total.add(extra.getPrice().multiply(BigDecimal.valueOf((long) quantity * multiplier)));
        }
        return total;
    }

    private long chargeableDays(ServiceOffering offering, ReservationRequest request) {
        if (isSingleDay(offering) && hasSelectedDates(request)) return reservationDates(request).size();
        if (offering.getBillingType() == BillingType.DAILY) {
            return dailyCount(request.checkInDate(), request.checkInTime(), request.checkOutDate(), request.checkOutTime());
        }
        var days = ChronoUnit.DAYS.between(request.checkInDate(), request.checkOutDate());
        return request.checkOutDate().equals(request.checkInDate()) || isCatSitter(offering) ? days + 1 : Math.max(1, days);
    }

    private long weekendOrHolidayDays(ReservationRequest request) {
        return datesBetween(request.checkInDate(), request.checkOutDate()).stream()
                .filter(date -> date.getDayOfWeek() == DayOfWeek.SATURDAY || date.getDayOfWeek() == DayOfWeek.SUNDAY || isBrazilianNationalHoliday(date))
                .count();
    }

    private BigDecimal priceForDate(ServiceOffering offering, LocalDate date) {
        var conditions = offering.getPriceConditions();
        return conditions.stream()
                .filter(condition -> isHolidayCondition(condition.getName()) && isBrazilianNationalHoliday(date))
                .findFirst()
                .or(() -> conditions.stream().filter(condition -> appliesTo(condition.getName(), date)).findFirst())
                .orElse(conditions.getFirst())
                .getPrice();
    }

    private static boolean isHolidayCondition(String conditionName) {
        var condition = plain(conditionName);
        return condition.contains("feriado") || condition.contains("holiday");
    }

    /** Matches the condition names admins type, such as "Segunda a quinta", "Fim de semana" or "Feriado". */
    private boolean appliesTo(String conditionName, LocalDate date) {
        var day = date.getDayOfWeek();
        var condition = plain(conditionName);
        if (isHolidayCondition(conditionName) && isBrazilianNationalHoliday(date)) return true;
        if (condition.contains("fim de semana") || condition.contains("weekend")) {
            return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY
                    || (day == DayOfWeek.FRIDAY && (condition.contains("sexta") || condition.contains("friday")));
        }
        if (condition.contains("segunda") && condition.contains("quinta")) return day.getValue() <= DayOfWeek.THURSDAY.getValue();
        if (condition.contains("dia util") || condition.contains("weekday")) return day.getValue() <= DayOfWeek.FRIDAY.getValue();
        return switch (day) {
            case MONDAY -> condition.contains("segunda") || condition.contains("monday");
            case TUESDAY -> condition.contains("terca") || condition.contains("tuesday");
            case WEDNESDAY -> condition.contains("quarta") || condition.contains("wednesday");
            case THURSDAY -> condition.contains("quinta") || condition.contains("thursday");
            case FRIDAY -> condition.contains("sexta") || condition.contains("friday");
            case SATURDAY -> condition.contains("sabado") || condition.contains("saturday");
            case SUNDAY -> condition.contains("domingo") || condition.contains("sunday");
        };
    }

    static boolean isBrazilianNationalHoliday(LocalDate date) {
        var dayOfMonth = date.getDayOfMonth();
        var fixedHoliday = switch (date.getMonthValue()) {
            case 1, 5 -> dayOfMonth == 1;
            case 4 -> dayOfMonth == 21;
            case 9 -> dayOfMonth == 7;
            case 10 -> dayOfMonth == 12;
            case 11 -> dayOfMonth == 2 || dayOfMonth == 15 || dayOfMonth == 20;
            case 12 -> dayOfMonth == 25;
            default -> false;
        };
        return fixedHoliday || date.equals(easterSunday(date.getYear()).minusDays(2));
    }

    private static LocalDate easterSunday(int year) {
        int a = year % 19, b = year / 100, c = year % 100, d = b / 4, e = b % 4, f = (b + 8) / 25;
        int g = (b - f + 1) / 3, h = (19 * a + b - d - g + 15) % 30, i = c / 4, k = c % 4;
        int l = (32 + 2 * e + 2 * i - h - k) % 7, m = (a + 11 * h + 22 * l) / 451;
        return LocalDate.of(year, (h + l - 7 * m + 114) / 31, (h + l - 7 * m + 114) % 31 + 1);
    }

    private static long minutesBetween(LocalDate fromDate, LocalTime fromTime, LocalDate toDate, LocalTime toTime) {
        return Duration.between(LocalDateTime.of(fromDate, fromTime), LocalDateTime.of(toDate, toTime)).toMinutes();
    }

    private static long dailyCount(LocalDate fromDate, LocalTime fromTime, LocalDate toDate, LocalTime toTime) {
        return Math.max(1, (minutesBetween(fromDate, fromTime, toDate, toTime) + 1439) / 1440);
    }

    private static int includedDaycareMinutes(ServiceOffering offering) {
        var name = plain(offering.getName());
        return name.contains("meio periodo") || name.contains("half day") ? 360 : 720;
    }

    private static boolean hasSelectedDates(ReservationRequest request) {
        return request.selectedDates() != null && !request.selectedDates().isEmpty();
    }

    static String plain(String text) {
        return Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase();
    }

    private static boolean matches(ServiceOffering offering, ServiceCategory category, String... words) {
        if (offering == null) return false;
        var name = plain(offering.getName());
        return offering.getCategory() == category || Arrays.stream(words).anyMatch(name::contains);
    }

    static boolean isDaycare(ServiceOffering offering) { return matches(offering, ServiceCategory.DAYCARE, "daycare", "day care"); }
    static boolean isWalk(ServiceOffering offering) { return matches(offering, ServiceCategory.WALK, "passeio", "walk"); }
    static boolean isHosting(ServiceOffering offering) { return matches(offering, ServiceCategory.HOSTING, "hospedagem", "hosting"); }
    static boolean isCatSitter(ServiceOffering offering) { return matches(offering, ServiceCategory.CAT_SITTER, "cat sitter"); }
    static boolean isSingleDay(ServiceOffering offering) { return isDaycare(offering) || isWalk(offering); }

    static List<LocalDate> reservationDates(ReservationRequest request) {
        if (hasSelectedDates(request)) return request.selectedDates().stream().distinct().sorted().toList();
        return datesBetween(request.checkInDate(), request.checkOutDate());
    }

    static List<LocalDate> datesBetween(LocalDate from, LocalDate to) {
        var dates = new ArrayList<LocalDate>();
        for (var date = from; !date.isAfter(to); date = date.plusDays(1)) dates.add(date);
        return dates;
    }

    private BigDecimal dailyRate(ReservationServiceType serviceType, LocalDate date) {
        return switch (serviceType) {
            case HOSTING_24H -> hostingRate(date);
            case DAYCARE_HALF_DAY -> new BigDecimal("30.00");
            case DAYCARE_FULL_DAY -> isLegacyWeekend(date) || holidayDates.contains(date)
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
        return isHighSeason(date) || isLegacyWeekend(date) ? HOSTING_WEEKEND_RATE : HOSTING_WEEKDAY_RATE;
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

    // The legacy table counts Friday as weekend.
    private boolean isLegacyWeekend(LocalDate date) {
        return date.getDayOfWeek() == DayOfWeek.FRIDAY || date.getDayOfWeek() == DayOfWeek.SATURDAY
                || date.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private boolean isHighSeason(LocalDate date) {
        return date.getMonth() == Month.JANUARY || date.getMonth() == Month.JULY || date.getMonth() == Month.DECEMBER;
    }
}
