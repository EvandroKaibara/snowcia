import { useState } from "react";
import { apiFetch } from "../api.js";
import { Field } from "../components/ui.jsx";
import { formatWhatsApp } from "../lib/format.js";
import logo from "../assets/brand/logo-stacked.svg";
import dogCatPlaying from "../assets/brand/dog-cat-playing.svg";

export default function AuthScreen({ onAuthenticated }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: key === "phone" ? formatWhatsApp(e.target.value) : e.target.value });

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = await apiFetch(isRegistering ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        body: isRegistering ? form : { email: form.email, password: form.password },
      });
      onAuthenticated(payload.token, payload.role ?? "CLIENT");
    } catch (e) {
      setError(!isRegistering && [401, 403].includes(e.status) ? "E-mail ou senha incorretos." : e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-brand">
        <img className="auth-logo" src={logo} alt="Snow & Cia" />
        <div className="auth-copy">
          <h1>Hospedagem, DayCare e passeios para o seu pet.</h1>
          <p>Peça o serviço por aqui e acompanhe a resposta da equipe sem precisar ligar.</p>
        </div>
        <img className="auth-illustration" src={dogCatPlaying} alt="" />
      </section>
      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2>{isRegistering ? "Criar conta" : "Entrar"}</h2>
          {isRegistering && (
            <>
              <Field label="Nome">
                <input required autoComplete="name" value={form.name} onChange={set("name")} />
              </Field>
              <Field label="WhatsApp">
                <input required type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="+55 11 99999-9999" />
              </Field>
            </>
          )}
          <Field label="E-mail">
            <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} />
          </Field>
          <Field label="Senha" hint={isRegistering ? "Pelo menos 8 caracteres." : undefined}>
            <input required type="password" minLength="8" autoComplete={isRegistering ? "new-password" : "current-password"} value={form.password} onChange={set("password")} />
          </Field>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary button-block" disabled={loading}>
            {loading ? "Aguarde…" : isRegistering ? "Criar conta" : "Entrar"}
          </button>
          <p className="auth-switch">
            {isRegistering ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(""); }}>
              {isRegistering ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
