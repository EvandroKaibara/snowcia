package br.com.snowcia.reservation;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import br.com.snowcia.offering.BillingType;
import br.com.snowcia.offering.DurationUnit;
import br.com.snowcia.offering.ServiceCategory;
import br.com.snowcia.offering.ServiceExtra;
import br.com.snowcia.offering.ServiceOffering;
import br.com.snowcia.offering.ServicePriceCondition;
import br.com.snowcia.offering.ServiceTarget;
import br.com.snowcia.reservation.dto.ReservationRequest;
import org.junit.jupiter.api.Test;

// Same cases as snowcia-web/src/lib/pricing.test.js: the estimate on screen and the charged price must agree.
class ReservationPricingServiceTest {

    private final ReservationPricingService pricing = new ReservationPricingService("");

    private static ServiceOffering offering(String name, ServiceCategory category, BillingType billing, List<ServiceExtra> extras, Object... conditions) {
        var prices = new ArrayList<ServicePriceCondition>();
        for (int i = 0; i < conditions.length; i += 2) prices.add(new ServicePriceCondition((String) conditions[i], new BigDecimal(conditions[i + 1].toString())));
        return new ServiceOffering(name, null, category, ServiceTarget.BOTH, billing, null, DurationUnit.MINUTES, true, true, false, true, true, null, prices, extras);
    }

    private static ReservationRequest request(String checkIn, String checkOut, String inTime, String outTime, Map<String, Integer> extras, List<LocalDate> selectedDates) {
        return new ReservationRequest(1L, null, ReservationServiceType.HOSTING_24H, 1L, 1L, LocalDate.parse(checkIn), LocalDate.parse(checkOut),
                LocalTime.parse(inTime), LocalTime.parse(outTime), extras, null, selectedDates, null, null);
    }

    private static void assertPrice(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual), () -> "expected " + expected + " but was " + actual);
    }

    private final ServiceOffering hosting = offering("Hospedagem", ServiceCategory.HOSTING, BillingType.DAILY,
            List.of(new ServiceExtra("medication_up_to_2", "Medicamento", BigDecimal.valueOf(5), "PER_DAY")),
            "Segunda a quinta", 50, "Fim de semana", 60, "Feriado", 75);

    @Test
    void dailyBillingChargesEachBlockByItsOwnDay() {
        assertPrice("160", pricing.offeringPrice(hosting, request("2026-11-05", "2026-11-08", "08:00", "08:00", null, null)));
    }

    @Test
    void holidayConditionWinsOverWeekdayPrice() {
        assertPrice("75", pricing.offeringPrice(hosting, request("2026-11-02", "2026-11-03", "08:00", "08:00", null, null)));
    }

    @Test
    void perDayExtrasMultiplyByChargeableDays() {
        assertPrice("110", pricing.offeringPrice(hosting, request("2026-11-05", "2026-11-07", "08:00", "08:00", Map.of("medication_up_to_2", 1), null)));
    }

    @Test
    void daycareChargesEachStartedHourPastTwelve() {
        var daycare = offering("Day Care integral", ServiceCategory.DAYCARE, BillingType.FIXED, List.of(), "Dia útil", 45);
        assertPrice("45", pricing.offeringPrice(daycare, request("2026-11-10", "2026-11-10", "08:00", "20:00", null, null)));
        assertPrice("50", pricing.offeringPrice(daycare, request("2026-11-10", "2026-11-10", "08:00", "20:01", null, null)));
    }

    @Test
    void daycareWithSelectedDatesChargesEachDate() {
        var daycare = offering("Day Care integral", ServiceCategory.DAYCARE, BillingType.FIXED, List.of(), "Dia útil", 45);
        var dates = List.of(LocalDate.parse("2026-11-10"), LocalDate.parse("2026-11-12"));
        assertPrice("90", pricing.offeringPrice(daycare, request("2026-11-10", "2026-11-12", "08:00", "18:00", null, dates)));
    }

    @Test
    void catSitterCountsTheCheckOutDay() {
        var catSitter = offering("Cat Sitter", ServiceCategory.CAT_SITTER, BillingType.FIXED, List.of(), "Diária", 25);
        assertPrice("75", pricing.offeringPrice(catSitter, request("2026-11-10", "2026-11-12", "08:00", "18:00", null, null)));
    }

    @Test
    void goodFridayFollowsEaster() {
        assertTrue(ReservationPricingService.isBrazilianNationalHoliday(LocalDate.parse("2026-04-03")));
        assertFalse(ReservationPricingService.isBrazilianNationalHoliday(LocalDate.parse("2026-04-02")));
    }
}
