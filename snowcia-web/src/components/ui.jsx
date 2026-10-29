import { useEffect, useRef, useState } from "react";
import { formatDate, labelOf, todayKey } from "../lib/format.js";
import catPeeking from "../assets/brand/cat-peeking.svg";

const iconPaths = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  paw: <><circle cx="8" cy="6.5" r="1.9" /><circle cx="16" cy="6.5" r="1.9" /><circle cx="4.6" cy="11.5" r="1.7" /><circle cx="19.4" cy="11.5" r="1.7" /><path d="M12 11.5c-3 0-6 3.6-6 6.3 0 1.6 1.3 2.3 2.8 1.9 1.2-.3 2.2-.8 3.2-.8s2 .5 3.2.8c1.5.4 2.8-.3 2.8-1.9 0-2.7-3-6.3-6-6.3z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.5.5 4 2.3 4 5.5" /></>,
  wallet: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18M16 15h2" /></>,
  sparkle: <path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7z" />,
  logout: <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.5" /></>,
};

export function Icon({ name, size = 20 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function Empty({ text, illustrated = false }) {
  return (
    <div className={illustrated ? "empty empty-illustrated" : "empty"}>
      {illustrated && <img src={catPeeking} alt="" />}
      <p>{text}</p>
    </div>
  );
}

export function Section({ title, action, onAction, actionDisabled, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {action && (
          <button className="button button-primary" disabled={actionDisabled} onClick={onAction}>
            <Icon name="plus" size={18} /> {action}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

export function Modal({ title, onClose, wide = false, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? "modal modal-wide" : "modal"}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Detail({ label, value }) {
  return (
    <div className="detail">
      <dt>{label}</dt>
      <dd>{value || "Não informado"}</dd>
    </div>
  );
}

export function StatusPill({ status }) {
  return <span className={`pill pill-${status.toLowerCase()}`}>{labelOf(status)}</span>;
}

export function Segmented({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>
          {text}
        </button>
      ))}
    </div>
  );
}

export function Toast({ message, type, onClose }) {
  return (
    <div className={`toast toast-${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon name={type === "error" ? "alert" : "check"} />
      <p>{message}</p>
      <button onClick={onClose} aria-label="Fechar aviso">
        <Icon name="close" size={18} />
      </button>
    </div>
  );
}

export function DateList({ dates, onChange, initialDraft = "" }) {
  const [draft, setDraft] = useState(initialDraft);
  return (
    <div className="date-list">
      <div className="date-list-add">
        <input type="date" min={todayKey()} value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Data" />
        <button type="button" className="button button-quiet" disabled={!draft || dates.includes(draft)} onClick={() => onChange([...dates, draft].sort())}>
          Adicionar data
        </button>
      </div>
      {dates.length > 0 && (
        <ul className="chips">
          {dates.map((date) => (
            <li key={date}>
              <button type="button" onClick={() => onChange(dates.filter((value) => value !== date))} aria-label={`Remover ${formatDate(date)}`}>
                {formatDate(date)} <Icon name="close" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
