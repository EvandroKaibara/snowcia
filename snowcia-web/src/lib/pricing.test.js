import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateOfferingAmount, isBrazilianNationalHoliday } from "./pricing.js";
import { todayKey } from "./format.js";

const hosting = {
  name: "Hospedagem",
  category: "HOSTING",
  billingType: "DAILY",
  priceConditions: [{ name: "Segunda a quinta", price: 50 }, { name: "Fim de semana", price: 60 }, { name: "Feriado", price: 75 }],
  extras: [{ code: "medication_up_to_2", price: 5, pricing: "PER_DAY" }],
};

test("daily billing charges each 24h block by its own day", () => {
  // Thu 2026-11-05 08:00 to Sun 2026-11-08 08:00: Thu 50 + Fri 50 + Sat 60
  assert.equal(calculateOfferingAmount(hosting, "2026-11-05", "2026-11-08", "08:00", "08:00"), 160);
});

test("holiday condition wins over the weekday price", () => {
  // 2026-11-02 (Finados) is a Monday
  assert.equal(calculateOfferingAmount(hosting, "2026-11-02", "2026-11-03", "08:00", "08:00"), 75);
});

test("per-day extras multiply by chargeable days", () => {
  assert.equal(calculateOfferingAmount(hosting, "2026-11-05", "2026-11-07", "08:00", "08:00", { medication_up_to_2: 1 }), 110);
});

test("daycare charges R$ 5 per started hour past the included 12h", () => {
  const daycare = { name: "Day Care integral", category: "DAYCARE", priceConditions: [{ name: "Dia útil", price: 45 }] };
  assert.equal(calculateOfferingAmount(daycare, "2026-11-10", "2026-11-10", "08:00", "20:00"), 45);
  assert.equal(calculateOfferingAmount(daycare, "2026-11-10", "2026-11-10", "08:00", "20:01"), 50);
});

test("cat sitter counts the check-out day", () => {
  const catSitter = { name: "Cat Sitter", category: "CAT_SITTER", billingType: "FIXED", priceConditions: [{ name: "Diária", price: 25 }] };
  assert.equal(calculateOfferingAmount(catSitter, "2026-11-10", "2026-11-12"), 75);
});

test("Good Friday follows Easter", () => {
  assert.equal(isBrazilianNationalHoliday(new Date(2026, 3, 3, 12)), true);
  assert.equal(isBrazilianNationalHoliday(new Date(2026, 3, 2, 12)), false);
});

test("today uses the local calendar date", () => {
  const now = new Date();
  assert.equal(todayKey(), `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
});
