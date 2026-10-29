import { useState } from "react";
import { Detail, Empty, Field, Icon, Modal, Section, Segmented, StatusPill, Toggle } from "../components/ui.jsx";
import { isDayCareService, targetLabel } from "../lib/catalog.js";
import { formatCurrency } from "../lib/format.js";

export function Payments({ payments, onUpdate }) {
  const [filter, setFilter] = useState("ALL");
  const rows = filter === "ALL" ? payments : payments.filter((payment) => payment.status === filter);
  return (
    <Section title="Pagamentos">
      <Segmented label="Filtrar por status" value={filter} onChange={setFilter} options={[["ALL", "Todos"], ["PENDING", "Pendentes"], ["PAID", "Pagos"], ["CANCELLED", "Cancelados"]]} />
      <p className="muted">A cobrança por PIX é criada quando você aceita a reserva.</p>
      {rows.length ? (
        <ul className="reservation-list">
          {rows.map((p) => (
            <li className="reservation" key={p.id}>
              <div className="reservation-main">
                <strong>{p.petName}</strong>
                <small>PIX</small>
              </div>
              <div className="reservation-side">
                <StatusPill status={p.status} />
                <strong className="money">{formatCurrency(p.amount)}</strong>
                <div className="actions">
                  {p.status === "PENDING" ? (
                    <>
                      <button className="button button-primary" onClick={() => onUpdate(p.id, "confirm")}>Confirmar pagamento</button>
                      <button className="button button-danger" onClick={() => onUpdate(p.id, "cancel")}>Cancelar</button>
                    </>
                  ) : (
                    <button className="button button-quiet" onClick={() => onUpdate(p.id, "pending")}>Voltar para pendente</button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="Nenhum pagamento neste filtro." />
      )}
    </Section>
  );
}

export function Services({ services, onEdit, onToggle, onDelete }) {
  return (
    <Section title="Serviços" action="Novo serviço" onAction={() => onEdit(null)}>
      {services.length ? (
        <ul className="service-grid">
          {services.map((service) => (
            <li className={service.active ? "service" : "service is-inactive"} key={service.id}>
              <div className="service-head">
                <h3>{service.name}</h3>
                {!service.active && <span className="pill pill-cancelled">Inativo</span>}
              </div>
              <p className="muted">{targetLabel(service.target)}</p>
              <dl className="prices">
                {service.priceConditions?.map((condition) => (
                  <div key={`${condition.name}-${condition.price}`}>
                    <dt>{condition.name}</dt>
                    <dd>{formatCurrency(condition.price)}</dd>
                  </div>
                ))}
              </dl>
              {service.extras?.length > 0 && (
                <p className="service-extras">
                  <strong>Adicionais:</strong> {service.extras.map((extra) => `${extra.name} (+${formatCurrency(extra.price)})`).join(", ")}
                </p>
              )}
              <div className="actions">
                <button className="button button-quiet" onClick={() => onEdit(service)}>Editar</button>
                <button className="button button-quiet" onClick={() => onToggle(service.id)}>{service.active ? "Desativar" : "Ativar"}</button>
                <button className="button button-danger" onClick={() => onDelete(service.id)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="Nenhum serviço cadastrado. Use “Novo serviço” para criar o primeiro." />
      )}
    </Section>
  );
}

const newService = {
  name: "", description: "", category: "OTHER", target: "DOG", billingType: "DAILY", durationMinutes: "", durationUnit: "MINUTES",
  active: true, allowDateSelection: true, allowTimeSelection: false, allowCustomerNotes: true, allowCheckInOut: false, maxPets: "",
  priceConditions: [{ name: "Segunda a quinta", price: "" }],
};

export function ServiceEditor({ item, onClose, onSave, loading }) {
  const [form, setForm] = useState(item ?? newService);
  const set = (key, value) => setForm({ ...form, [key]: value });
  const isDaycare = isDayCareService(form);
  const setCondition = (index, key, value) => set("priceConditions", form.priceConditions.map((condition, i) => (i === index ? { ...condition, [key]: value } : condition)));

  function submit(event) {
    event.preventDefault();
    onSave({
      ...form,
      category: form.category ?? "OTHER",
      // DayCare always needs a date and a drop-off/pick-up time to price the extra hours.
      allowDateSelection: isDaycare || form.allowDateSelection,
      allowCheckInOut: isDaycare || form.allowCheckInOut,
      allowTimeSelection: false,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      durationUnit: form.durationUnit ?? "MINUTES",
      maxPets: form.maxPets ? Number(form.maxPets) : null,
      priceConditions: form.priceConditions.map((condition) => ({ ...condition, price: Number(condition.price) })),
    });
  }

  return (
    <Modal title={item ? `Editar ${item.name}` : "Novo serviço"} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        <Field label="Nome"><input required value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="Descrição"><textarea value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} /></Field>
        <div className="form-row">
          <Field label="Para">
            <select value={form.target} onChange={(e) => set("target", e.target.value)}>
              <option value="DOG">Cachorro</option>
              <option value="CAT">Gato</option>
              <option value="BOTH">Cachorro e gato</option>
            </select>
          </Field>
          <Field label="Cobrança">
            <select value={form.billingType} onChange={(e) => set("billingType", e.target.value)}>
              <option value="DAILY">Por diária</option>
              <option value="HOURLY">Por hora ou minuto</option>
              <option value="FIXED">Valor fixo</option>
              <option value="PER_WALK">Por passeio</option>
            </select>
          </Field>
        </div>
        <div className="form-row">
          <Field label="Duração"><input type="number" min="1" value={form.durationMinutes ?? ""} onChange={(e) => set("durationMinutes", e.target.value)} /></Field>
          <Field label="Unidade">
            <select value={form.durationUnit ?? "MINUTES"} onChange={(e) => set("durationUnit", e.target.value)}>
              <option value="MINUTES">Minutos</option>
              <option value="HOURS">Horas</option>
              <option value="DAILY">Diárias</option>
              <option value="UNITS">Idas</option>
            </select>
          </Field>
        </div>
        <fieldset className="group">
          <legend>Preços</legend>
          <p className="muted">O nome define quando o preço vale: “Segunda a quinta”, “Fim de semana”, “Sexta e fim de semana”, “Feriado”, “Dia útil” ou um dia da semana.</p>
          {form.priceConditions.map((condition, index) => (
            <div className="price-row" key={index}>
              <input required placeholder="Ex.: Fim de semana" value={condition.name} onChange={(e) => setCondition(index, "name", e.target.value)} aria-label="Quando vale" />
              <input required type="number" min="0" step="0.01" placeholder="R$" value={condition.price} onChange={(e) => setCondition(index, "price", e.target.value)} aria-label="Preço" />
              {form.priceConditions.length > 1 && (
                <button type="button" className="icon-button" onClick={() => set("priceConditions", form.priceConditions.filter((_, i) => i !== index))} aria-label="Remover preço">
                  <Icon name="close" />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="button button-quiet" onClick={() => set("priceConditions", [...form.priceConditions, { name: "", price: "" }])}>
            <Icon name="plus" size={18} /> Adicionar preço
          </button>
        </fieldset>
        <Field label="Máximo de pets (opcional)"><input type="number" min="1" value={form.maxPets ?? ""} onChange={(e) => set("maxPets", e.target.value)} /></Field>
        <div className="toggles">
          <Toggle label="Serviço ativo" checked={form.active} onChange={(v) => set("active", v)} />
          <Toggle label="Cliente escolhe a data" checked={form.allowDateSelection} onChange={(v) => set("allowDateSelection", v)} />
          <Toggle label="Cliente pode deixar observações" checked={form.allowCustomerNotes} onChange={(v) => set("allowCustomerNotes", v)} />
          <Toggle label="Cliente informa horário de entrada e saída" checked={form.allowCheckInOut} onChange={(v) => set("allowCheckInOut", v)} />
        </div>
        <button className="button button-primary button-block" disabled={loading}>{loading ? "Salvando…" : "Salvar serviço"}</button>
      </form>
    </Modal>
  );
}

export function Clients({ clients, pets, reservations, payments }) {
  const [selectedId, setSelectedId] = useState(null);
  const client = clients.find((c) => c.id === selectedId);
  const clientReservations = client ? reservations.filter((r) => r.ownerEmail === client.email) : [];
  const clientPayments = payments.filter((p) => clientReservations.some((r) => r.id === p.reservationId));
  const clientPets = client ? pets.filter((pet) => pet.ownerId === client.id) : [];

  return (
    <Section title="Clientes">
      {clients.length ? (
        <ul className="reservation-list">
          {clients.map((c) => (
            <li className="reservation" key={c.id}>
              <div className="reservation-main">
                <strong>{c.name}</strong>
                <small>{c.email} · {c.phone || "sem telefone"}</small>
              </div>
              <button className="button button-quiet" onClick={() => setSelectedId(c.id)}>Ver ficha</button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty text="Nenhum cliente cadastrado." />
      )}
      {client && (
        <Modal title={client.name} onClose={() => setSelectedId(null)} wide>
          <dl className="details">
            <Detail label="E-mail" value={client.email} />
            <Detail label="WhatsApp" value={client.phone} />
            <Detail label="Endereço" value={client.address} />
            <Detail label="Pets" value={clientPets.map((pet) => pet.name).join(", ") || "Nenhum"} />
            <Detail label="Reservas com você" value={String(clientReservations.length)} />
            <Detail label="Pagamentos" value={String(clientPayments.length)} />
          </dl>
        </Modal>
      )}
    </Section>
  );
}
