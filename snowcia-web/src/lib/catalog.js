import { addDays, formatDate, localDateKey, noon } from "./format.js";

export const SRD = "SRD (Sem Raça Definida)";
export const dogBreeds = [SRD, "Affenpinscher", "Airedale Terrier", "Akita", "American Bully", "American Staffordshire Terrier", "Basenji", "Basset Hound", "Beagle", "Bearded Collie", "Bedlington Terrier", "Bichon Frisé", "Boiadeiro Australiano", "Border Collie", "Border Terrier", "Borboleta (Papillon)", "Boston Terrier", "Boxer", "Buldogue Campeiro", "Buldogue Francês", "Buldogue Inglês", "Bull Terrier", "Cane Corso", "Cavalier King Charles Spaniel", "Chihuahua", "Chow Chow", "Cocker Spaniel Americano", "Cocker Spaniel Inglês", "Collie", "Corgi Pembroke", "Dachshund (Teckel)", "Dálmata", "Dobermann", "Dogo Argentino", "Dogue Alemão", "Dogue de Bordeaux", "Fila Brasileiro", "Fox Paulistinha", "Fox Terrier", "Golden Retriever", "Greyhound", "Husky Siberiano", "Jack Russell Terrier", "Labrador Retriever", "Lhasa Apso", "Lulu da Pomerânia", "Maltês", "Mastiff Inglês", "Mastim Napolitano", "Munchkin", "Pastor Alemão", "Pastor Australiano", "Pastor Belga", "Pastor de Shetland", "Pequinês", "Pinscher", "Pit Bull Terrier", "Pointer", "Poodle", "Pug", "Rottweiler", "Samoieda", "São Bernardo", "Schnauzer", "Setter Irlandês", "Shar Pei", "Shiba Inu", "Shih Tzu", "Spitz Alemão", "Staffordshire Bull Terrier", "Terra-nova", "Whippet", "Yorkshire Terrier"];
export const catBreeds = [SRD, "Abissínio", "Angorá Turco", "American Curl", "Balinês", "Bengal", "Birmanês", "Bombaim", "British Shorthair", "Burmês", "Chartreux", "Cornish Rex", "Devon Rex", "Egípcio Mau", "Exótico", "Himalaio", "Maine Coon", "Manx", "Munchkin", "Nebelung", "Norueguês da Floresta", "Ocicat", "Oriental", "Persa", "Ragdoll", "Russian Blue", "Sagrado da Birmânia", "Scottish Fold", "Siamês", "Siberiano", "Singapura", "Somali", "Sphynx", "Tonquinês"];

// Reservations created before the service catalog only carry the old enum name.
const legacyServiceNames = {
  HOSTING_24H: "Hospedagem (diária 24h)",
  DAYCARE_HALF_DAY: "DayCare meio período",
  DAYCARE_FULL_DAY: "DayCare período integral",
  DAYCARE_EXTRA_HOUR: "DayCare hora adicional",
  DAYCARE_EXTRA_WALK: "DayCare passeio extra",
  WALK_20_MIN: "Passeio (20 min)",
  CAT_SITTER_DAILY: "CatSitter diária (2 visitas)",
  CAT_SITTER_ADDITIONAL_CAT: "CatSitter gato adicional",
  CAT_SITTER_EXTRA_VISIT: "CatSitter visita adicional",
  MONTHLY_DAYCARE_2X: "Plano DayCare 2x/semana",
  MONTHLY_DAYCARE_3X: "Plano DayCare 3x/semana",
  MONTHLY_DAYCARE_5X: "Plano DayCare 5x/semana",
  MONTHLY_WALKS_2X: "Plano Passeios 2x/semana",
  MONTHLY_WALKS_3X: "Plano Passeios 3x/semana",
  MONTHLY_WALKS_5X: "Plano Passeios 5x/semana",
};
export const serviceLabel = (reservation) => legacyServiceNames[reservation.serviceName] ?? reservation.serviceName;

export const plain = (text = "") => String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const matches = (service, category, ...words) =>
  service?.category === category || words.some((word) => plain(service?.name).includes(word));

export const isDayCareService = (service) => matches(service, "DAYCARE", "daycare", "day care");
export const isHalfDayCareService = (service) => ["meio periodo", "half day"].some((word) => plain(service?.name).includes(word));
export const isWalkService = (service) => matches(service, "WALK", "passeio", "walk");
export const isHostingService = (service) => matches(service, "HOSTING", "hospedagem", "hosting");
export const isCatSitterService = (service) => matches(service, "CAT_SITTER", "cat sitter");

export function serviceSupportsPet(service, pet) {
  if (!service || !pet) return false;
  if (isHostingService(service) && pet.species !== "DOG") return false;
  return service.target === "BOTH" || service.target === pet.species;
}

export const targetLabel = (target) => ({ BOTH: "Cachorro e gato", DOG: "Cachorro", CAT: "Gato" })[target] ?? target;

export function reservationDates(reservation) {
  if (reservation?.selectedDates?.length) return reservation.selectedDates;
  const dates = [];
  for (let day = noon(reservation.checkInDate); day <= noon(reservation.checkOutDate); day = addDays(day, 1)) dates.push(localDateKey(day));
  return dates;
}

export const reservationDateLabel = (reservation) => reservationDates(reservation).map(formatDate).join(" · ");

export function buildReservationPayload(form, pets, offerings) {
  const offering = offerings.find((service) => String(service.id) === String(form.serviceOfferingId));
  const selectedPets = form.petId === "ALL"
    ? pets.filter((pet) => serviceSupportsPet(offering, pet))
    : pets.filter((pet) => String(pet.id) === String(form.petId));
  const dates = form.multiDates ? [...new Set(form.selectedDates)].sort() : [form.checkInDate];
  if (!selectedPets.length) throw new Error("Nenhum pet é compatível com o serviço escolhido.");
  if (!dates.length || dates.some((date) => !date)) throw new Error("Escolha pelo menos uma data para o serviço.");
  if (form.additionalServiceOfferingIds.some((id) => !form.additionalServiceDates[id]?.length)) throw new Error("Escolha pelo menos uma data para cada serviço adicional.");
  return {
    petId: Number(selectedPets[0].id),
    petIds: selectedPets.map((pet) => Number(pet.id)),
    serviceType: form.serviceType,
    serviceOfferingId: form.serviceOfferingId ? Number(form.serviceOfferingId) : null,
    assignedAdminId: Number(form.assignedAdminId),
    checkInDate: form.multiDates ? dates[0] : form.checkInDate,
    checkOutDate: form.multiDates ? dates.at(-1) : form.checkOutDate,
    checkInTime: form.checkInTime,
    checkOutTime: form.checkOutTime,
    notes: form.notes,
    extraQuantities: form.extraQuantities,
    selectedDates: form.multiDates ? dates : null,
    additionalServiceOfferingIds: form.additionalServiceOfferingIds,
    additionalServiceDates: form.additionalServiceDates,
  };
}
