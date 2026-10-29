import assert from "node:assert/strict";
import { test } from "node:test";
import { buildReservationPayload } from "./catalog.js";

const pets = [{ id: 1, name: "Snow", species: "DOG" }, { id: 2, name: "Mia", species: "CAT" }];
const offerings = [{ id: 10, name: "Day Care", category: "DAYCARE", target: "DOG", active: true }];
const form = {
  petId: "ALL", serviceType: "HOSTING_24H", serviceOfferingId: "10", assignedAdminId: "7",
  checkInDate: "2026-11-10", checkOutDate: "2026-11-10", checkInTime: "08:00", checkOutTime: "18:00", notes: "",
  extraQuantities: {}, additionalServiceOfferingIds: [], additionalServiceDates: {}, multiDates: true,
  selectedDates: ["2026-11-12", "2026-11-10", "2026-11-12"],
};

test("'all pets' keeps only the pets the service accepts", () => {
  const payload = buildReservationPayload(form, pets, offerings);
  assert.deepEqual(payload.petIds, [1]);
  assert.equal(payload.assignedAdminId, 7);
});

test("multiple dates are deduplicated and define the stay range", () => {
  const payload = buildReservationPayload(form, pets, offerings);
  assert.deepEqual(payload.selectedDates, ["2026-11-10", "2026-11-12"]);
  assert.equal(payload.checkInDate, "2026-11-10");
  assert.equal(payload.checkOutDate, "2026-11-12");
});

test("rejects an additional service without dates", () => {
  assert.throws(() => buildReservationPayload({ ...form, additionalServiceOfferingIds: [11] }, pets, offerings), /serviço adicional/);
});
