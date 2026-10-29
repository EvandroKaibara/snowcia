import { useMemo, useState } from "react";
import { Empty, Icon, Section } from "../components/ui.jsx";
import { reservationDates } from "../lib/catalog.js";
import { calendarDays, localDateKey, noon } from "../lib/format.js";
import { ReservationSummary } from "./Reservations.jsx";
import dogJumping from "../assets/brand/dog-jumping.svg";

const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Dashboard({ data, isAdmin, onRequestService }) {
  const firstName = data.profile?.name?.split(" ")[0];
  const confirmed = data.reservations.filter((r) => r.status === "CONFIRMED");
  const upcoming = confirmed.filter((r) => noon(r.checkInDate) >= new Date()).length;
  const pending = data.reservations.filter((r) => r.status === "PENDING").length;
  const paid = data.payments.filter((p) => p.status === "PAID").length;

  return (
    <>
      <section className="welcome">
        <div className="welcome-copy">
          <h2>{firstName ? `Oi, ${firstName}.` : "Oi."}</h2>
          <p>
            {isAdmin
              ? pending ? `${pending} ${pending === 1 ? "pedido espera" : "pedidos esperam"} a sua resposta.` : "Nenhum pedido esperando resposta."
              : "Peça hospedagem, DayCare ou passeio e acompanhe a resposta aqui."}
          </p>
          {!isAdmin && (
            <button className="button button-primary" onClick={onRequestService}>
              Solicitar serviço <Icon name="right" size={18} />
            </button>
          )}
        </div>
        <img className="welcome-dog" src={dogJumping} alt="" />
      </section>

      <dl className="figures">
        <div><dt>Pets cadastrados</dt><dd>{data.pets.length}</dd></div>
        <div><dt>Estadias confirmadas por vir</dt><dd>{upcoming}</dd></div>
        {isAdmin && <div><dt>Pagamentos recebidos</dt><dd>{paid}</dd></div>}
      </dl>

      {isAdmin ? (
        <ReservationCalendar reservations={confirmed} />
      ) : (
        <Section title="Últimas solicitações">
          <p className="muted">O status muda aqui assim que a equipe responde.</p>
          {data.reservations.length ? (
            <ul className="reservation-list">
              {data.reservations.slice(0, 4).map((r) => <ReservationSummary key={r.id} reservation={r} />)}
            </ul>
          ) : (
            <Empty illustrated text="Você ainda não fez nenhuma solicitação." />
          )}
        </Section>
      )}
    </>
  );
}

function ReservationCalendar({ reservations }) {
  const [cursor, setCursor] = useState(() => new Date());
  const days = useMemo(() => calendarDays(cursor), [cursor]);
  const today = localDateKey(new Date());
  const byDay = useMemo(() => {
    const map = {};
    for (const r of reservations) for (const day of reservationDates(r)) (map[day] ??= []).push(r);
    return map;
  }, [reservations]);
  const move = (months) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + months, 1));
  const month = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <section className="panel calendar">
      <div className="panel-head">
        <h2>{month[0].toUpperCase() + month.slice(1)}</h2>
        <div className="actions">
          <button className="icon-button" onClick={() => move(-1)} aria-label="Mês anterior"><Icon name="left" /></button>
          <button className="icon-button" onClick={() => move(1)} aria-label="Próximo mês"><Icon name="right" /></button>
        </div>
      </div>
      <div className="calendar-grid" role="grid">
        {weekDays.map((d) => <span className="calendar-weekday" key={d}>{d}</span>)}
        {days.map((day) => {
          const key = localDateKey(day);
          const outside = day.getMonth() !== cursor.getMonth();
          return (
            <div className={`calendar-day${outside ? " is-outside" : ""}${key === today ? " is-today" : ""}`} key={key}>
              <span className="calendar-date">{day.getDate()}</span>
              {byDay[key]?.map((r) => <span className="calendar-pet" key={r.id} title={r.petName}>{r.petName}</span>)}
            </div>
          );
        })}
      </div>
      {!reservations.length && <p className="muted">As estadias aparecem aqui depois que o pagamento é confirmado.</p>}
    </section>
  );
}
