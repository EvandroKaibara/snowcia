// Estimate only: the API recalculates the price in ReservationService and its value is the one charged.
import { isCatSitterService, isDayCareService, isHalfDayCareService, plain } from "./catalog.js";
import { addDays, noon } from "./format.js";

export function calculateOfferingAmount(service, checkInDate, checkOutDate, checkInTime = "08:00", checkOutTime = "18:00", extraQuantities = {}) {
  if (!service || !checkInDate || !checkOutDate || checkOutDate < checkInDate) return null;
  const conditions = service.priceConditions ?? [];
  if (!conditions.length) return null;
  const priceFor = (date) => Number((
    conditions.find((condition) => isHolidayCondition(condition.name) && isBrazilianNationalHoliday(date))
    ?? conditions.find((condition) => conditionMatchesDay(condition.name, date))
    ?? conditions[0]).price);

  const firstDay = noon(checkInDate);
  const minutes = (new Date(`${checkOutDate}T${checkOutTime}:00`) - new Date(`${checkInDate}T${checkInTime}:00`)) / 60000;
  let total = 0;
  let chargeableDays = 1;
  if (isDayCareService(service)) {
    const includedMinutes = isHalfDayCareService(service) ? 360 : 720;
    total = priceFor(firstDay) + Math.max(0, Math.ceil((minutes - includedMinutes) / 60)) * 5;
  } else if (service.billingType === "DAILY") {
    chargeableDays = Math.max(1, Math.ceil(minutes / 1440));
    for (let index = 0; index < chargeableDays; index += 1) total += priceFor(addDays(firstDay, index));
  } else {
    const lastDay = checkOutDate === checkInDate || isCatSitterService(service) ? addDays(noon(checkOutDate), 1) : noon(checkOutDate);
    let days = 0;
    for (let day = firstDay; day < lastDay; day = addDays(day, 1)) {
      total += priceFor(day);
      days += 1;
    }
    chargeableDays = Math.max(1, days);
  }

  const weekendHolidayDays = countWeekendHolidayDays(checkInDate, checkOutDate);
  const extrasTotal = (service.extras ?? []).reduce((sum, extra) => {
    const quantity = Math.max(0, Number(extraQuantities?.[extra.code] ?? 0));
    if (!quantity) return sum;
    const multiplier = extra.code === "weekend_holiday" ? weekendHolidayDays : extra.pricing === "PER_DAY" ? chargeableDays : 1;
    return sum + Number(extra.price ?? 0) * quantity * multiplier;
  }, 0);
  return total + extrasTotal;
}

function countWeekendHolidayDays(checkInDate, checkOutDate) {
  let total = 0;
  for (let day = noon(checkInDate); day <= noon(checkOutDate); day = addDays(day, 1)) {
    if ([0, 6].includes(day.getDay()) || isBrazilianNationalHoliday(day)) total += 1;
  }
  return total;
}

const isHolidayCondition = (name = "") => ["feriado", "holiday"].some((word) => plain(name).includes(word));

const weekdayWords = [["domingo", "sunday"], ["segunda", "monday"], ["terca", "tuesday"], ["quarta", "wednesday"], ["quinta", "thursday"], ["sexta", "friday"], ["sabado", "saturday"]];

export function conditionMatchesDay(name = "", date) {
  const day = date.getDay();
  const condition = plain(name);
  if (isHolidayCondition(name) && isBrazilianNationalHoliday(date)) return true;
  if (condition.includes("fim de semana") || condition.includes("weekend")) return day === 0 || day === 6 || (day === 5 && (condition.includes("sexta") || condition.includes("friday")));
  if (condition.includes("segunda") && condition.includes("quinta")) return day >= 1 && day <= 4;
  if (condition.includes("dia util") || condition.includes("weekday")) return day >= 1 && day <= 5;
  return weekdayWords[day].some((word) => condition.includes(word));
}

export function isBrazilianNationalHoliday(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const fixed = { 1: [1], 4: [21], 5: [1], 9: [7], 10: [12], 11: [2, 15, 20], 12: [25] }[month]?.includes(day);
  const goodFriday = addDays(easterSunday(date.getFullYear()), -2);
  return Boolean(fixed) || date.toDateString() === goodFriday.toDateString();
}

function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(year, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1, 12);
}
