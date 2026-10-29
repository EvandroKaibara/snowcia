import { useState } from "react";
import { Empty, Field, Section } from "../components/ui.jsx";
import { formatCep, formatWhatsApp } from "../lib/format.js";

export default function Profile({ profile, onSave }) {
  // App remounts this screen with a key when the profile changes, so the form starts fresh.
  const [form, setForm] = useState(profile ?? {});
  const [cep, setCep] = useState(() => profile?.address?.match(/CEP\s*(\d{5}-?\d{3})/i)?.[1] ?? "");
  const [cepError, setCepError] = useState("");

  async function lookupCep() {
    const digits = cep.replace(/\D/g, "");
    if (!digits) return;
    if (digits.length !== 8) return setCepError("O CEP tem 8 dígitos.");
    try {
      const data = await fetch(`https://viacep.com.br/ws/${digits}/json/`).then((response) => response.json());
      if (data.erro) throw new Error();
      setForm((current) => ({ ...current, address: data.logradouro ?? "" }));
      setCep(formatCep(digits));
      setCepError("");
    } catch {
      setCepError("Não achamos esse CEP. Confira os números.");
    }
  }

  if (!profile) return <Empty text="Carregando seus dados…" />;
  return (
    <Section title="Seus dados" className="panel-narrow">
      <form className="form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
        <Field label="Nome"><input required autoComplete="name" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="E-mail" hint="O e-mail não pode ser alterado."><input disabled value={form.email ?? ""} /></Field>
        <Field label="WhatsApp"><input required type="tel" autoComplete="tel" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: formatWhatsApp(e.target.value) })} placeholder="+55 11 99999-9999" /></Field>
        <Field label="CEP" error={cepError}>
          <div className="input-with-button">
            <input inputMode="numeric" autoComplete="postal-code" value={cep} onChange={(e) => setCep(formatCep(e.target.value))} onBlur={lookupCep} placeholder="00000-000" />
            <button type="button" className="button button-quiet" onClick={lookupCep}>Buscar</button>
          </div>
        </Field>
        <Field label="Endereço" hint="A rua vem do CEP. Complete com número e apartamento.">
          <textarea autoComplete="street-address" value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <button className="button button-primary">Salvar</button>
      </form>
    </Section>
  );
}
