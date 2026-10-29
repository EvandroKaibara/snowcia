import { useState } from "react";
import { DateList, Field, Modal, Section, StatusPill } from "../components/ui.jsx";
import { isDayCareService, isHalfDayCareService, isHostingService, isWalkService, reservationDateLabel, serviceLabel, serviceSupportsPet } from "../lib/catalog.js";
import { formatCurrency, formatTime, todayKey } from "../lib/format.js";
import { calculateOfferingAmount } from "../lib/pricing.js";

const adminGroups = [
  ["PENDING", "Pendentes"],
  ["AWAITING_PAYMENT", "Aguardando pagamento"],
  ["CONFIRMED", "Confirmadas"],
  ["COMPLETED", "Finalizadas"],
  ["DECLINED", "Recusadas"],
  ["CANCELLED", "Canceladas"],
];

const timeRange = (r) => (r.checkInTime ? `${formatTime(r.checkInTime)} às ${formatTime(r.checkOutTime)}` : "");

export function ReservationSummary({ reservation }) {
  return (
    <li className="reservation">
      <div className="reservation-main">
        <strong>{reservation.petName}</strong>
        <span>{serviceLabel(reservation)}</span>
        <small>{reservationDateLabel(reservation)} {timeRange(reservation)}</small>
        {reservation.status === "AWAITING_PAYMENT" && <small className="note note-warn">Você vai receber o link de pagamento pelo WhatsApp.</small>}
        {reservation.declineReason && <small className="note note-danger">Motivo da recusa: {reservation.declineReason}</small>}
      </div>
      <div className="reservation-side">
        <StatusPill status={reservation.status} />
        <strong className="money">{formatCurrency(reservation.totalAmount)}</strong>
      </div>
    </li>
  );
}

function ReservationItem({ reservation: r, isAdmin, onEdit, onCancel, onApprove, onDecline }) {
  return (
    <li className="reservation">
      <div className="reservation-main">
        <strong>{r.petName} · {serviceLabel(r)}</strong>
        <small>{reservationDateLabel(r)} {timeRange(r)}</small>
        {isAdmin && <small>Tutor: {r.ownerName} · {r.ownerPhone || r.ownerEmail}</small>}
        {r.assignedAdminName && <small>Responsável: {r.assignedAdminName}</small>}
        {r.additionalServiceNames && <small>Serviços adicionais: {r.additionalServiceNames}</small>}
        {r.notes && <small className="note">{r.notes}</small>}
        {r.declineReason && <small className="note note-danger">Motivo da recusa: {r.declineReason}</small>}
      </div>
      <div className="reservation-side">
        <StatusPill status={r.status} />
        <strong className="money">{formatCurrency(r.totalAmount)}</strong>
        <div className="actions">
          {isAdmin && r.status === "PENDING" && (
            <>
              <button className="button button-primary" onClick={onApprove}>Aceitar</button>
              <button className="button button-danger" onClick={onDecline}>Recusar</button>
            </>
          )}
          {/* The API only accepts edits while the reservation is still PENDING. */}
          {!isAdmin && r.status === "PENDING" && <button className="button button-quiet" onClick={onEdit}>Editar</button>}
          {!isAdmin && ["PENDING", "AWAITING_PAYMENT"].includes(r.status) && <button className="button button-danger" onClick={onCancel}>Cancelar</button>}
        </div>
      </div>
    </li>
  );
}

export default function Reservations({ reservations, pets, isAdmin, onEdit, onCancel, onDecide }) {
  const groups = isAdmin ? adminGroups : [["ALL", "Minhas solicitações"]];
  return groups.map(([status, title]) => {
    const rows = status === "ALL" ? reservations : reservations.filter((r) => r.status === status);
    return (
      <Section
        key={status}
        title={title}
        action={isAdmin ? null : "Solicitar serviço"}
        actionDisabled={!pets.length}
        onAction={() => onEdit(null)}
      >
        {!isAdmin && !pets.length && <p className="muted">Cadastre um pet antes de solicitar um serviço.</p>}
        {rows.length ? (
          <ul className="reservation-list">
            {rows.map((r) => (
              <ReservationItem
                key={r.id}
                reservation={r}
                isAdmin={isAdmin}
                onEdit={() => onEdit(r)}
                onCancel={() => onCancel(r.id)}
                onApprove={() => onDecide(r.id, "approve")}
                onDecline={() => onDecide(r.id, "decline")}
              />
            ))}
          </ul>
        ) : (
          <p className="muted">Nenhuma reserva aqui.</p>
        )}
      </Section>
    );
  });
}

const newReservation = (pets) => ({
  petId: pets.length ? "ALL" : "",
  serviceType: "HOSTING_24H",
  serviceOfferingId: "",
  assignedAdminId: "",
  checkInDate: "",
  checkOutDate: "",
  checkInTime: "08:00",
  checkOutTime: "18:00",
  notes: "",
  extraQuantities: {},
  additionalServiceOfferingIds: [],
  additionalServiceDates: {},
  multiDates: false,
  selectedDates: [],
});

export function ReservationEditor({ item, pets, serviceOfferings, administrators, onClose, onSave, loading }) {
  const [form, setForm] = useState(() => ({
    ...newReservation(pets),
    ...item,
    extraQuantities: {},
    additionalServiceOfferingIds: [],
    additionalServiceDates: {},
    multiDates: (item?.selectedDates?.length ?? 0) > 1,
    selectedDates: item?.selectedDates ?? [],
  }));
  const update = (changes) => setForm((current) => ({ ...current, ...changes }));

  const offering = serviceOfferings.find((service) => String(service.id) === String(form.serviceOfferingId));
  const isDaycare = isDayCareService(offering) || form.serviceType.startsWith("DAYCARE");
  const allowsMultiDates = isDaycare || isWalkService(offering) || form.serviceType.startsWith("WALK");
  const showTimes = (offering?.allowCheckInOut ?? true) || isDaycare;
  const dates = allowsMultiDates && form.multiDates ? form.selectedDates : form.checkInDate ? [form.checkInDate] : [];
  const pet = pets.find((value) => String(value.id) === String(form.petId));
  const compatiblePets = form.petId === "ALL" ? pets.filter((p) => serviceSupportsPet(offering, p)) : pet ? [pet] : [];
  const available = serviceOfferings.filter((service) => service.active && (form.petId === "ALL" ? pets.some((p) => serviceSupportsPet(service, p)) : serviceSupportsPet(service, pet)));
  const additionalOptions = serviceOfferings.filter((service) => service.active && !isHostingService(service) && String(service.id) !== String(offering?.id) && compatiblePets.length > 0 && compatiblePets.every((p) => serviceSupportsPet(service, p)));
  const selectedAdditional = additionalOptions.filter((service) => form.additionalServiceOfferingIds.map(String).includes(String(service.id)));

  const primaryAmount = dates.reduce((total, date) => total + (calculateOfferingAmount(offering, date, allowsMultiDates ? date : form.checkOutDate, form.checkInTime, form.checkOutTime, form.extraQuantities) ?? 0), 0);
  const additionalAmount = selectedAdditional.reduce((total, service) => total + (form.additionalServiceDates[service.id] ?? []).reduce((sum, date) => sum + (calculateOfferingAmount(service, date, date, form.checkInTime, form.checkOutTime) ?? 0), 0), 0);
  const estimate = dates.length && compatiblePets.length ? (primaryAmount + additionalAmount) * compatiblePets.length : null;

  function toggleAdditional(service, checked) {
    const { [service.id]: _removed, ...otherDates } = form.additionalServiceDates;
    update({
      additionalServiceOfferingIds: checked ? [...form.additionalServiceOfferingIds, service.id] : form.additionalServiceOfferingIds.filter((id) => String(id) !== String(service.id)),
      additionalServiceDates: checked ? { ...otherDates, [service.id]: dates } : otherDates,
    });
  }

  return (
    <Modal title={item ? "Editar solicitação" : "Solicitar serviço"} onClose={onClose}>
      <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label="Pet">
          <select
            value={form.petId}
            disabled={Boolean(item)}
            onChange={(e) => {
              const chosen = pets.find((value) => String(value.id) === e.target.value);
              update({ petId: e.target.value, serviceOfferingId: "", serviceType: chosen?.species === "CAT" ? "CAT_SITTER_DAILY" : "HOSTING_24H" });
            }}
          >
            {!item && <option value="ALL">Todos os pets</option>}
            {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        <Field label="Serviço" hint={available.length ? undefined : "Nenhum serviço ativo atende este pet."}>
          <select required value={form.serviceOfferingId ?? ""} onChange={(e) => update({ serviceOfferingId: e.target.value, extraQuantities: {}, additionalServiceOfferingIds: [], additionalServiceDates: {} })}>
            <option value="" disabled>Escolha um serviço</option>
            {available.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
        </Field>

        <Field label="Responsável" hint={administrators.length ? undefined : "Nenhuma responsável cadastrada ainda. Tente de novo em instantes."}>
          <select required value={form.assignedAdminId ?? ""} onChange={(e) => update({ assignedAdminId: e.target.value })}>
            <option value="" disabled>Escolha quem vai cuidar</option>
            {administrators.map((admin) => <option key={admin.id} value={admin.id}>{admin.name}</option>)}
          </select>
        </Field>

        {offering?.extras?.length > 0 && (
          <fieldset className="group">
            <legend>Adicionais</legend>
            {offering.extras.map((extra) => (
              <label className="extra" key={extra.code}>
                <span>
                  {extra.name}
                  <small>+ {formatCurrency(extra.price)}{extra.pricing === "PER_DAY" ? " por dia" : ""}</small>
                  {extra.code === "additional_walk" && <small>Quantos passeios extras você quer no período.</small>}
                </span>
                <input type="number" min="0" value={form.extraQuantities[extra.code] ?? 0} onChange={(e) => update({ extraQuantities: { ...form.extraQuantities, [extra.code]: Number(e.target.value) } })} aria-label={`Quantidade de ${extra.name}`} />
              </label>
            ))}
          </fieldset>
        )}

        {allowsMultiDates && (
          <label className="toggle">
            <input type="checkbox" checked={form.multiDates} onChange={(e) => update({ multiDates: e.target.checked, selectedDates: e.target.checked ? form.selectedDates : [] })} />
            Escolher várias datas
          </label>
        )}

        {allowsMultiDates && form.multiDates ? (
          <Field label="Datas do serviço">
            <DateList dates={form.selectedDates} onChange={(selectedDates) => update({ selectedDates })} />
          </Field>
        ) : allowsMultiDates ? (
          <Field label="Data do serviço">
            <input required type="date" min={todayKey()} value={form.checkInDate} onChange={(e) => update({ checkInDate: e.target.value, checkOutDate: e.target.value })} />
          </Field>
        ) : (
          <div className="form-row">
            <Field label="Entrada">
              <input required type="date" min={todayKey()} value={form.checkInDate} onChange={(e) => update({ checkInDate: e.target.value })} />
            </Field>
            <Field label="Saída">
              <input required type="date" min={form.checkInDate || todayKey()} value={form.checkOutDate} onChange={(e) => update({ checkOutDate: e.target.value })} />
            </Field>
          </div>
        )}

        {showTimes && (
          <div className="form-row">
            <Field label="Horário de entrada">
              <input required type="time" value={form.checkInTime ?? ""} onChange={(e) => update({ checkInTime: e.target.value })} />
            </Field>
            <Field label="Horário de saída">
              <input required type="time" value={form.checkOutTime ?? ""} onChange={(e) => update({ checkOutTime: e.target.value })} />
            </Field>
          </div>
        )}

        {offering && additionalOptions.length > 0 && (
          <fieldset className="group">
            <legend>Outros serviços na mesma reserva</legend>
            {additionalOptions.map((service) => {
              const checked = selectedAdditional.includes(service);
              return (
                <div className="additional" key={service.id}>
                  <label className="toggle">
                    <input type="checkbox" checked={checked} onChange={(e) => toggleAdditional(service, e.target.checked)} />
                    {service.name}
                  </label>
                  {checked && (
                    <DateList
                      dates={form.additionalServiceDates[service.id] ?? []}
                      initialDraft={form.checkInDate}
                      onChange={(serviceDates) => update({ additionalServiceDates: { ...form.additionalServiceDates, [service.id]: serviceDates } })}
                    />
                  )}
                </div>
              );
            })}
          </fieldset>
        )}

        <Field label="Observações">
          <textarea value={form.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} placeholder="Rotina, alimentação, medicação…" />
        </Field>

        {estimate != null && (
          <div className="estimate" aria-live="polite">
            <span>Valor estimado</span>
            <strong>{formatCurrency(estimate)}</strong>
            <small>
              {isDaycare
                ? `${isHalfDayCareService(offering) ? "O DayCare meio período inclui até 6 horas" : "O DayCare inclui até 12 horas"}. Cada hora a mais, mesmo que incompleta, custa R$ 5,00.`
                : "Calculado com o preço de cada dia (dia útil, fim de semana ou feriado)."}
            </small>
          </div>
        )}

        <button className="button button-primary button-block" disabled={loading}>
          {loading ? "Enviando…" : item ? "Salvar alterações" : "Enviar solicitação"}
        </button>
      </form>
    </Modal>
  );
}
