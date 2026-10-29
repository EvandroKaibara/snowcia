const pad = (value) => String(value).padStart(2, "0");

export const localDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
// Local date, not toISOString(): in Brazil the UTC date is already tomorrow after 21:00.
export const todayKey = () => localDateKey(new Date());
export const noon = (key) => new Date(`${key}T12:00:00`);
export const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const currencyFormat = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export const formatDate = (key) => dateFormat.format(noon(key));
export const formatTime = (time) => (time ? time.slice(0, 5) : "");
export const formatCurrency = (value) => currencyFormat.format(value ?? 0);

export function formatCep(value = "") {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function formatWhatsApp(value = "") {
  let digits = value.replace(/\D/g, "");
  if (!digits.startsWith("55")) digits = `55${digits}`;
  digits = digits.slice(0, 13);
  const area = digits.slice(2, 4);
  const number = digits.slice(4);
  if (!area) return "+55";
  if (!number) return `+55 ${area}`;
  return `+55 ${area} ${number.length > 5 ? `${number.slice(0, 5)}-${number.slice(5)}` : number}`;
}

export function calendarDays(cursor) {
  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

const labels = {
  DOG: "Cachorro",
  CAT: "Gato",
  OTHER: "Outro",
  PENDING: "Pendente",
  AWAITING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmada",
  DECLINED: "Recusada",
  CANCELLED: "Cancelada",
  COMPLETED: "Finalizada",
  PAID: "Pago",
};
export const labelOf = (value) => labels[value] ?? value;
