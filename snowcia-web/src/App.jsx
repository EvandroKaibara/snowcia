import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8081";
const navigation = [
  ["Visão geral", "⌂"],
  ["Meus pets", "♧"],
  ["Reservas", "▣"],
  ["Perfil", "☺"],
  ["Pagamentos", "◈"],
];
const adminNavigation = [["Visão geral", "⌂"], ["Reservas", "▣"], ["Pagamentos", "◈"], ["Serviços", "✦"], ["Pets cadastrados", "♧"], ["Clientes", "☻"], ["Perfil", "☺"]];
const species = ["DOG", "CAT", "OTHER"];
const dogBreeds = ["SRD (Sem Raça Definida)", "Affenpinscher", "Airedale Terrier", "Akita", "American Bully", "American Staffordshire Terrier", "Basenji", "Basset Hound", "Beagle", "Bearded Collie", "Bedlington Terrier", "Bichon Frisé", "Boiadeiro Australiano", "Border Collie", "Border Terrier", "Borboleta (Papillon)", "Boston Terrier", "Boxer", "Buldogue Campeiro", "Buldogue Francês", "Buldogue Inglês", "Bull Terrier", "Cane Corso", "Cavalier King Charles Spaniel", "Chihuahua", "Chow Chow", "Cocker Spaniel Americano", "Cocker Spaniel Inglês", "Collie", "Corgi Pembroke", "Dachshund (Teckel)", "Dálmata", "Dobermann", "Dogo Argentino", "Dogue Alemão", "Dogue de Bordeaux", "Fila Brasileiro", "Fox Paulistinha", "Fox Terrier", "Golden Retriever", "Greyhound", "Husky Siberiano", "Jack Russell Terrier", "Labrador Retriever", "Lhasa Apso", "Lulu da Pomerânia", "Maltês", "Mastiff Inglês", "Mastim Napolitano", "Munchkin", "Pastor Alemão", "Pastor Australiano", "Pastor Belga", "Pastor de Shetland", "Pequinês", "Pinscher", "Pit Bull Terrier", "Pointer", "Poodle", "Pug", "Rottweiler", "Samoieda", "São Bernardo", "Schnauzer", "Setter Irlandês", "Shar Pei", "Shiba Inu", "Shih Tzu", "Spitz Alemão", "Staffordshire Bull Terrier", "Terra-nova", "Whippet", "Yorkshire Terrier"];
const catBreeds = ["SRD (Sem Raça Definida)", "Abissínio", "Angorá Turco", "American Curl", "Balinês", "Bengal", "Birmanês", "Bombaim", "British Shorthair", "Burmês", "Chartreux", "Cornish Rex", "Devon Rex", "Egípcio Mau", "Exótico", "Himalaio", "Maine Coon", "Manx", "Munchkin", "Nebelung", "Norueguês da Floresta", "Ocicat", "Oriental", "Persa", "Ragdoll", "Russian Blue", "Sagrado da Birmânia", "Scottish Fold", "Siamês", "Siberiano", "Singapura", "Somali", "Sphynx", "Tonquinês"];
const initialData = {
  pets: [],
  reservations: [],
  payments: [],
  profile: null,
  clients: [],
  serviceOfferings: [],
};
const services = [
  ["HOSTING_24H", "Hospedagem (diária 24h)", "R$ 50 - R$ 75/dia"],
  ["DAYCARE_HALF_DAY", "DayCare - meio período", "R$ 30/dia"],
  ["DAYCARE_FULL_DAY", "DayCare - período integral", "R$ 45/dia"],
  ["DAYCARE_EXTRA_HOUR", "DayCare - hora adicional", "R$ 5/dia"],
  ["DAYCARE_EXTRA_WALK", "DayCare - passeio extra", "R$ 10/dia"],
  ["WALK_20_MIN", "Passeio (20 min)", "R$ 20/dia"],
  ["CAT_SITTER_DAILY", "CatSitter - diária (2 visitas)", "R$ 25/dia"],
  ["CAT_SITTER_ADDITIONAL_CAT", "CatSitter - gato adicional", "R$ 15/dia"],
  ["CAT_SITTER_EXTRA_VISIT", "CatSitter - visita adicional", "R$ 10/dia"],
  ["MONTHLY_DAYCARE_2X", "Plano DayCare 2x/semana", "R$ 330/mês"],
  ["MONTHLY_DAYCARE_3X", "Plano DayCare 3x/semana", "R$ 480/mês"],
  ["MONTHLY_DAYCARE_5X", "Plano DayCare 5x/semana", "R$ 780/mês"],
  ["MONTHLY_WALKS_2X", "Plano Passeios 2x/semana", "R$ 150/mês"],
  ["MONTHLY_WALKS_3X", "Plano Passeios 3x/semana", "R$ 215/mês"],
  ["MONTHLY_WALKS_5X", "Plano Passeios 5x/semana", "R$ 340/mês"],
];

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("snowcia_token"),
  );
  const [role, setRole] = useState(
    () => localStorage.getItem("snowcia_role") ?? "CLIENT",
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState("Visão geral");
  const [data, setData] = useState(initialData);
  const [editor, setEditor] = useState(null);
  const isAdmin = role === "ADMIN";
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const request = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });
      const payload =
        response.status === 204
          ? null
          : await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          payload.message ?? "Não foi possível concluir esta ação.",
        );
      return payload;
    },
    [token],
  );
  const logout = useCallback(() => {
    localStorage.removeItem("snowcia_token");
    localStorage.removeItem("snowcia_role");
    setToken(null);
    setRole("CLIENT");
    setData(initialData);
    setError("");
  }, []);
  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [pets, reservations, payments, profile, clients, serviceOfferings] = await Promise.all([
        request("/api/pets"),
        request("/api/reservations"),
        isAdmin ? request("/api/payments") : Promise.resolve([]),
        request("/api/users/me"),
        isAdmin ? request("/api/users/clients") : Promise.resolve([]),
        request("/api/services"),
      ]);
      setData({ pets, reservations, payments, profile, clients, serviceOfferings });
    } catch (e) {
      setError(e.message);
    }
  }, [isAdmin, request, token]);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function handleAuth(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const body = isRegistering
        ? authForm
        : { email: authForm.email, password: authForm.password };
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.message ?? "Não foi possível acessar sua conta.",
        );
      const nextRole = payload.role ?? "CLIENT";
      localStorage.setItem("snowcia_token", payload.token);
      localStorage.setItem("snowcia_role", nextRole);
      setRole(nextRole);
      setToken(payload.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  async function saveEditor(form) {
    setLoading(true);
    setError("");
    try {
      const { type, item } = editor;
      if (type === "pet")
        await request(item ? `/api/pets/${item.id}` : "/api/pets", {
          method: item ? "PUT" : "POST",
          body: JSON.stringify(form),
        });
      if (type === "reservation")
        await request(
          item ? `/api/reservations/${item.id}` : "/api/reservations",
          {
            method: item ? "PUT" : "POST",
            body: JSON.stringify({ ...form, petId: Number(form.petId), serviceOfferingId: form.serviceOfferingId ? Number(form.serviceOfferingId) : null }),
          },
        );
      if (type === "service")
        await request(item ? `/api/services/${item.id}` : "/api/services", {
          method: item ? "PUT" : "POST",
          body: JSON.stringify(form),
        });
      setEditor(null);
      await refresh();
      showToast("Alterações salvas com sucesso.");
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }
  async function deleteItem(type, id) {
    if (!window.confirm("Deseja cancelar esta solicitação?")) return;
    try {
      await request(`/api/${type}/${id}`, { method: "DELETE" });
      refresh();
      showToast("Registro removido com sucesso.");
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  }
  async function decideReservation(id, action) {
    let body;
    if (action === "decline") {
      const reason = window.prompt("Informe o motivo da recusa:");
      if (!reason?.trim()) return;
      body = JSON.stringify({ reason });
    }
    try {
      await request(`/api/reservations/${id}/${action}`, {
        method: "PATCH",
        body,
      });
      refresh();
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  }
  async function updatePayment(id, action) {
    try {
      await request(`/api/payments/${id}/${action}`, { method: "PATCH" });
      refresh();
    } catch (e) {
      setError(e.message);
      showToast(e.message, "error");
    }
  }
  async function serviceAction(id, action) {
    try {
      if (action === "delete" && !window.confirm("Excluir este serviço?")) return;
      await request(`/api/services/${id}${action === "toggle" ? "/toggle" : ""}`, { method: action === "toggle" ? "PUT" : "DELETE" });
      refresh();
    } catch (e) { setError(e.message); }
  }
  async function updateProfile(profile) {
    try { await request("/api/users/me", { method: "PUT", body: JSON.stringify(profile) }); await refresh(); showToast("Alterações salvas com sucesso."); }
    catch (e) { setError(e.message); showToast(e.message, "error"); }
  }
  if (!token)
    return (
      <AuthScreen
        {...{
          isRegistering,
          setIsRegistering,
          form: authForm,
          setForm: setAuthForm,
          onSubmit: handleAuth,
          loading,
          error,
        }}
      />
    );
  const upcoming = data.reservations.filter(
    (r) => r.status === "CONFIRMED" && new Date(`${r.checkInDate}T12:00`) >= new Date(),
  ).length;
  const paid = data.payments.filter((p) => p.status === "PAID").length;
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>✦</span> snowcia
        </div>
        <nav>
          {(isAdmin ? adminNavigation : navigation.filter(([label]) => label !== "Pagamentos"))
            .map(([label, icon]) => (
              <button
                key={label}
                className={active === label ? "nav-link active" : "nav-link"}
                onClick={() => setActive(label)}
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
        </nav>
        <button className="logout" onClick={logout}>
          ↪ Sair
        </button>
      </aside>
      <section className="content">
        <header>
          <div>
            <p className="eyebrow">
              {isAdmin ? "PAINEL ADMINISTRATIVO" : "PAINEL DO CLIENTE"}
            </p>
            <h1>{active}</h1>
          </div>
          <div className="avatar">🐾</div>
        </header>
        {error && <p className="form-error page-error">{error}</p>}
        {active === "Visão geral" && (
          <Dashboard
            data={data}
            upcoming={upcoming}
            paid={paid}
            isAdmin={isAdmin}
            onReserve={() => setActive("Reservas")}
          />
        )}
        {active === "Meus pets" && (
          <Pets
            pets={data.pets}
            openEditor={setEditor}
            onDelete={(id) => deleteItem("pets", id)}
          />
        )}
        {active === "Reservas" && (
          <Reservations
            {...{
              reservations: data.reservations,
              pets: data.pets,
              isAdmin,
              openEditor: setEditor,
              onDelete: (id) => deleteItem("reservations", id),
              decideReservation,
            }}
          />
        )}
        {active === "Perfil" && <Profile profile={data.profile} onSave={updateProfile} />}
        {active === "Pagamentos" && isAdmin && (
          <Payments payments={data.payments} updatePayment={updatePayment} />
        )}
        {active === "Serviços" && isAdmin && <ServiceOfferings services={data.serviceOfferings} openEditor={setEditor} onAction={serviceAction} />}
        {active === "Pets cadastrados" && isAdmin && <AdminPets pets={data.pets} />}
        {active === "Clientes" && isAdmin && <Clients clients={data.clients} reservations={data.reservations} payments={data.payments} pets={data.pets} />}
      </section>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      {editor && editor.type === "service" && <ServiceEditor editor={editor} onClose={() => setEditor(null)} onSave={saveEditor} loading={loading} />}
      {editor && editor.type !== "service" && (
        <Editor
          editor={editor}
          pets={data.pets}
          serviceOfferings={data.serviceOfferings}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
          loading={loading}
        />
      )}
    </main>
  );
}

function AuthScreen({
  isRegistering,
  setIsRegistering,
  form,
  setForm,
  onSubmit,
  loading,
  error,
}) {
  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand">
          <span>✦</span> snowcia
        </div>
        <div className="hero-copy">
          <p className="eyebrow">HOTEL PET, SEM COMPLICAÇÃO</p>
          <h1>Todo o cuidado que o seu pet merece.</h1>
          <p>
            Solicite serviços, acompanhe sua reserva e receba as atualizações da
            administração.
          </p>
        </div>
      </section>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={onSubmit}>
          <p className="eyebrow">BEM-VINDO</p>
          <h2>{isRegistering ? "Crie sua conta" : "Entre na sua conta"}</h2>
          {isRegistering && (
            <>
              <Field label="Nome">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: formatWhatsApp(e.target.value) })}
                  placeholder="+55 11 99999-9999"
                />
              </Field>
            </>
          )}
          <Field label="E-mail">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Senha">
            <input
              required
              type="password"
              minLength="8"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={loading}>
            {loading ? "Aguarde..." : isRegistering ? "Criar conta" : "Entrar"}
          </button>
          <p className="switch-auth">
            {isRegistering
              ? "Já possui uma conta?"
              : "Ainda não tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Entrar" : "Criar agora"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ data, upcoming, paid, isAdmin, onReserve }) {
  return (
    <>
      <div className="welcome">
        <div>
          <p>Olá! Que bom te ver por aqui.</p>
          <h2>
            {isAdmin
              ? "Acompanhe as estadias confirmadas."
              : "Vamos cuidar de momentos incríveis?"}
          </h2>
          {!isAdmin && (
            <button className="secondary-button" onClick={onReserve}>
              Solicitar serviço <span>→</span>
            </button>
          )}
        </div>
        <span className="welcome-pet">🐶</span>
      </div>
      <div className="stats">
        <Stat
          icon="🐾"
          label="Pets cadastrados"
          value={data.pets.length}
          tone="blue"
        />
        <Stat
          icon="▣"
          label="Reservas futuras"
          value={upcoming}
          tone="yellow"
        />
        {isAdmin && (
          <Stat
            icon="◈"
            label="Pagamentos confirmados"
            value={paid}
            tone="orange"
          />
        )}
      </div>
      {isAdmin ? (
        <ReservationCalendar
          reservations={data.reservations.filter((r) => r.status === "CONFIRMED")}
        />
      ) : (
        <section className="list-card">
          <SectionTitle title="Minhas solicitações" />
          <p className="inline-tip">
            Os status são atualizados automaticamente nesta tela após a decisão
            da administração.
          </p>
          {data.reservations.length ? (
            data.reservations
              .slice(0, 4)
              .map((r) => <ReservationRow key={r.id} reservation={r} />)
          ) : (
            <Empty text="Nenhuma solicitação registrada." />
          )}
        </section>
      )}
    </>
  );
}
function ReservationCalendar({ reservations }) {
  const [cursor, setCursor] = useState(() => new Date());
  const days = useMemo(() => calendarDays(cursor), [cursor]);
  return (
    <section className="list-card calendar-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">AGENDA</p>
          <h2>
            {cursor.toLocaleDateString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </h2>
        </div>
        <div className="row-actions">
          <button
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
              )
            }
          >
            ←
          </button>
          <button
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
              )
            }
          >
            →
          </button>
        </div>
      </div>
      <div className="calendar-week">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => (
          <div
            className={`calendar-day ${day.getMonth() === cursor.getMonth() ? "" : "muted-day"}`}
            key={day.toISOString()}
          >
            <strong>{day.getDate()}</strong>
            {reservations
              .filter((r) => between(day, r.checkInDate, r.checkOutDate))
              .map((r) => (
                <small className="calendar-pet" key={r.id}>
                  🐾 {r.petName}
                </small>
              ))}
          </div>
        ))}
      </div>
      {!reservations.length && (
        <p className="inline-tip">
          As reservas aparecem aqui após a confirmação do pagamento.
        </p>
      )}
    </section>
  );
}
function Pets({ pets, openEditor, onDelete }) {
  return (
    <section className="list-card">
      <SectionHeading
        title="Seus companheiros"
        action="Cadastrar pet"
        onAction={() => openEditor({ type: "pet" })}
      />
      {pets.length === 0 ? (
        <Empty text="Nenhum pet cadastrado ainda." />
      ) : (
        <div className="item-grid">
          {pets.map((pet) => (
            <article className="pet-card" key={pet.id}>
              <div className="pet-emoji">🐾</div>
              <h3>{pet.name}</h3>
              <p>
                {labelOf(pet.species)} {pet.breed && `· ${pet.breed}`}
              </p>
              <div className="card-actions">
                <button onClick={() => openEditor({ type: "pet", item: pet })}>
                  Editar
                </button>
                <button className="danger" onClick={() => onDelete(pet.id)}>
                  Excluir
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Profile({ profile, onSave }) {
  const [form, setForm] = useState(profile ?? { name: "", phone: "", address: "" });
  const [cep, setCep] = useState("");
  const [cepError, setCepError] = useState("");
  useEffect(() => { setForm(profile ?? { name: "", phone: "", address: "" }); setCep((profile?.address ?? "").match(/CEP\s*(\d{5}-?\d{3})/i)?.[1] ?? ""); }, [profile]);
  const lookupCep = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return setCepError("Informe os 8 dígitos do CEP.");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error();
      const address = data.logradouro ?? "";
      setForm({ ...form, address }); setCep(formatCep(digits)); setCepError("");
    } catch { setCepError("CEP não encontrado. Confira e tente novamente."); }
  };
  if (!profile) return <Empty text="Carregando perfil..." />;
  return <section className="list-card"><SectionTitle title="Meus dados" /><form className="editor-modal profile-form" onSubmit={(e) => { e.preventDefault(); onSave(form); }}><Field label="Nome"><input required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="E-mail"><input disabled value={form.email ?? ""} /></Field><Field label="WhatsApp"><input required value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: formatWhatsApp(e.target.value) })} placeholder="+55 11 99999-9999" /></Field><Field label="CEP"><div className="cep-field"><input inputMode="numeric" value={cep} onChange={(e) => setCep(formatCep(e.target.value))} onBlur={lookupCep} placeholder="00000-000" /><button type="button" onClick={lookupCep}>Buscar CEP</button></div>{cepError && <small className="field-error">{cepError}</small>}</Field><Field label="Endereço"><textarea value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Preenchido automaticamente pelo CEP; complemente com número e apartamento." /></Field><button className="primary-button">Salvar alterações</button></form></section>;
}

function AdminPets({ pets }) {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const rows = filter === "ALL" ? pets : pets.filter((pet) => pet.species === filter);
  return <><section className="list-card"><SectionTitle title="Pets cadastrados" /><div className="row-actions"><button onClick={() => setFilter("ALL")}>Todos</button><button onClick={() => setFilter("DOG")}>Cachorro</button><button onClick={() => setFilter("CAT")}>Gato</button></div><div className="item-grid">{rows.map((pet) => <article className="pet-card admin-pet-card" key={pet.id}><div className="pet-emoji">🐾</div><h3>{pet.name}</h3><p>{labelOf(pet.species)} · {pet.breed || "Sem raça informada"}</p><p className="card-meta">Tutor: {pet.ownerName || "Não informado"}</p><button className="card-more" onClick={() => setSelected(pet)}>Ver mais</button></article>)}</div>{!rows.length && <Empty text="Nenhum pet encontrado." />}</section>{selected && <PetDetailsModal pet={selected} onClose={() => setSelected(null)} />}</>;
}

function Clients({ clients, pets, reservations, payments }) {
  const [selected, setSelected] = useState(null); const current = clients.find((client) => client.id === selected);
  const clientPets = current ? pets.filter((pet) => pet.ownerId === current.id) : []; const clientReservations = current ? reservations.filter((reservation) => reservation.ownerEmail === current.email) : []; const clientPayments = current ? payments.filter((payment) => clientReservations.some((reservation) => reservation.id === payment.reservationId)) : [];
  return <><section className="list-card"><SectionTitle title="Clientes" />{clients.map((client) => <div className="reservation-row detailed" key={client.id}><div><strong>{client.name}</strong><small>{client.email} · {client.phone || "Sem telefone"}</small></div><button className="card-more row-more" onClick={() => setSelected(client.id)}>Ver mais</button></div>)}{!clients.length && <Empty text="Nenhum cliente cadastrado." />}</section>{current && <ClientDetailsModal client={current} pets={clientPets} reservations={clientReservations} payments={clientPayments} onClose={() => setSelected(null)} />}</>;
}

function DetailModal({ title, onClose, children }) { return <div className="modal-backdrop"><section className="editor-modal details-modal"><div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose}>×</button></div>{children}</section></div>; }
function PetDetailsModal({ pet, onClose }) { return <DetailModal title={pet.name} onClose={onClose}><p className="detail-subtitle">{labelOf(pet.species)} · {pet.breed || "Sem raça informada"}</p><div className="detail-grid"><Detail label="Tutor" value={pet.ownerName} /><Detail label="Telefone / WhatsApp" value={pet.ownerPhone} /><Detail label="E-mail" value={pet.ownerEmail} /><Detail label="Endereço" value={pet.ownerAddress} /><Detail label="Nascimento" value={pet.birthDate ? formatDate(pet.birthDate) : "Não informado"} /><Detail label="Gênero" value={pet.gender} /><Detail label="Castrado" value={pet.neutered == null ? "Não informado" : pet.neutered ? "Sim" : "Não"} /><Detail label="Vacinação" value={pet.vaccinationsCurrent ? "Em dia" : "Não informado"} /><Detail label="Antipulgas" value={pet.fleaPreventionCurrent ? "Em dia" : "Não informado"} /><Detail label="Doenças" value={pet.healthConditions} /><Detail label="Cuidados especiais" value={pet.specialCare} /><Detail label="Alergias" value={pet.allergies} /><Detail label="Sociabilidade humana" value={pet.humanSocial} /><Detail label="Sociabilidade com pets" value={pet.petSocial} /><Detail label="Hábitos" value={pet.importantHabits} /><Detail label="Observações" value={pet.observations} /></div></DetailModal>; }
function ClientDetailsModal({ client, pets, reservations, payments, onClose }) { return <DetailModal title={client.name} onClose={onClose}><div className="detail-grid"><Detail label="E-mail" value={client.email} /><Detail label="Telefone / WhatsApp" value={client.phone} /><Detail label="Endereço" value={client.address} /><Detail label="Pets" value={pets.map((pet) => pet.name).join(", ") || "Nenhum"} /><Detail label="Histórico de reservas" value={`${reservations.length} registro(s)`} /><Detail label="Histórico de pagamentos" value={`${payments.length} registro(s)`} /></div></DetailModal>; }
function Detail({ label, value }) { return <div className="detail-item"><strong>{label}</strong><span>{value || "Não informado"}</span></div>; }
function Reservations({
  reservations,
  pets,
  isAdmin,
  openEditor,
  onDelete,
  decideReservation,
}) {
  const groups = isAdmin
    ? [
        ["PENDING", "Pendentes"],
        ["AWAITING_PAYMENT", "Aguardando pagamento"],
        ["CONFIRMED", "Confirmadas"],
        ["COMPLETED", "Finalizadas"],
        ["DECLINED", "Recusadas"],
        ["CANCELLED", "Canceladas"],
      ]
    : [["ALL", "Minhas solicitações"]];
  return (
    <>
      {groups.map(([status, title]) => {
        const rows =
          status === "ALL"
            ? reservations
            : reservations.filter((r) => r.status === status);
        return (
          <section className="list-card reservation-section" key={status}>
            <SectionHeading title={title} action={!isAdmin ? "Solicitar serviço" : null} disabled={!pets.length} onAction={() => openEditor({ type: "reservation" })} />
            {rows.length ? (
              rows.map((r) => (
                <ReservationDetail
                  key={r.id}
                  reservation={r}
                  isAdmin={isAdmin}
                  onEdit={() => openEditor({ type: "reservation", item: r })}
                  onDelete={() => onDelete(r.id)}
                  onApprove={() => decideReservation(r.id, "approve")}
                  onDecline={() => decideReservation(r.id, "decline")}
                />
              ))
            ) : (
              <Empty text={`Nenhuma reserva ${title.toLowerCase()}.`} />
            )}
          </section>
        );
      })}
    </>
  );
}
function ReservationDetail({
  reservation,
  isAdmin,
  onEdit,
  onDelete,
  onApprove,
  onDecline,
}) {
  const isDaycare = isDayCareReservation(reservation);
  return (
    <div className="reservation-row detailed">
      <div className="pet-dot">🐾</div>
      <div>
        <strong>
          {reservation.petName} · {reservation.serviceName || serviceName(reservation.serviceType)}
        </strong>
        <small>{isDaycare ? <>{formatDate(reservation.checkInDate)} · {formatTime(reservation.checkInTime)} — {formatTime(reservation.checkOutTime)}</> : <>{formatDate(reservation.checkInDate)} {formatTime(reservation.checkInTime)} — {formatDate(reservation.checkOutDate)} {formatTime(reservation.checkOutTime)}</>} · {formatCurrency(reservation.totalAmount)}</small>
        {isAdmin && (
          <small className="note">
            Cliente: {reservation.ownerName} ·{" "}
            {reservation.ownerPhone || reservation.ownerEmail}
          </small>
        )}
        {reservation.notes && (
          <small className="note">{reservation.notes}</small>
        )}
        {reservation.declineReason && (
          <small className="note decline-reason">
            Motivo da recusa: {reservation.declineReason}
          </small>
        )}
      </div>
      <span className={`status ${reservation.status.toLowerCase()}`}>
        {labelOf(reservation.status)}
      </span>
      <div className="row-actions">
        {isAdmin && reservation.status === "PENDING" && (
          <>
            <button onClick={onApprove}>Aceitar</button>
            <button className="danger" onClick={onDecline}>
              Recusar
            </button>
          </>
        )}
        {!isAdmin && ["PENDING", "AWAITING_PAYMENT"].includes(reservation.status) && (
          <>
            <button onClick={onEdit}>Editar</button>
            <button className="danger" onClick={onDelete}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
function Payments({ payments, updatePayment }) {
  const [filter, setFilter] = useState("ALL"); const rows = filter === "ALL" ? payments : payments.filter((payment) => payment.status === filter);
  return (
    <section className="list-card">
      <SectionTitle title="Controle financeiro" />
      <div className="row-actions"><button onClick={() => setFilter("ALL")}>Todos</button><button onClick={() => setFilter("PENDING")}>Pendentes</button><button onClick={() => setFilter("PAID")}>Confirmados</button><button onClick={() => setFilter("CANCELLED")}>Cancelados</button></div>
      <p className="inline-tip">
        O pagamento integral é criado somente após a reserva ser aprovada.
      </p>
      {rows.length ? (
        rows.map((p) => (
          <div className="reservation-row detailed" key={p.id}>
            <div className="pet-dot money">◈</div>
            <div>
              <strong>{p.petName}</strong>
              <small>PIX · {formatCurrency(p.amount)}</small>
            </div>
            <span className={`status ${p.status.toLowerCase()}`}>
              {labelOf(p.status)}
            </span>
            <div className="row-actions">
              {p.status === "PENDING" && (
                <>
                  <button onClick={() => updatePayment(p.id, "confirm")}>
                    Confirmar pagamento
                  </button>
                  <button
                    className="danger"
                    onClick={() => updatePayment(p.id, "cancel")}
                  >
                    Cancelar
                  </button>
                </>
              )}
              {p.status !== "PENDING" && <button onClick={() => updatePayment(p.id, "pending")}>Marcar como pendente</button>}
            </div>
          </div>
        ))
      ) : (
        <Empty text="Nenhum pagamento pendente." />
      )}
    </section>
  );
}
function ServiceOfferings({ services, openEditor, onAction }) {
  return <section className="list-card"><SectionHeading title="Serviços" onAction={() => openEditor({ type: "service" })} action="Adicionar serviço" /><div className="item-grid">{services.map((service) => <article className="pet-card admin-pet-card service-card" key={service.id}><div className="pet-emoji">✦</div><h3>{service.name}</h3><p>{service.category} · {service.target === "BOTH" ? "Cachorro e gato" : service.target === "DOG" ? "Cachorro" : "Gato"}</p><p className="card-meta">{service.priceConditions?.map((condition) => `${condition.name}: R$ ${Number(condition.price).toFixed(2)}`).join(" · ")}</p>{service.extras?.length > 0 && <div className="service-extra-list"><strong>Serviços extras</strong>{service.extras.map((extra) => <small key={extra.code}>{extra.name} (+R$ {Number(extra.price).toFixed(2)})</small>)}</div>}<div className="service-actions"><button className="card-more" onClick={() => openEditor({ type: "service", item: service })}>Editar</button><button className="small-action" onClick={() => onAction(service.id, "toggle")}>{service.active ? "Inativar" : "Ativar"}</button><button className="small-action danger" onClick={() => onAction(service.id, "delete")}>Excluir</button></div></article>)}</div>{!services.length && <Empty text="Nenhum serviço cadastrado. Use “Adicionar serviço” para criar o primeiro." />}</section>;
}

function ServiceEditor({ editor, onClose, onSave, loading }) {
  const initial = editor.item ?? { name: "", description: "", category: "OTHER", target: "DOG", billingType: "DAILY", durationMinutes: "", durationUnit: "MINUTES", active: true, allowDateSelection: true, allowTimeSelection: false, allowCustomerNotes: true, allowCheckInOut: false, maxPets: "", priceConditions: [{ name: "Segunda a quinta", price: "" }] };
  const [form, setForm] = useState(initial);
  const isDaycare = isDayCareService(form);
  const updateCondition = (index, key, value) => setForm({ ...form, priceConditions: form.priceConditions.map((condition, i) => i === index ? { ...condition, [key]: value } : condition) });
  const submit = (event) => { event.preventDefault(); onSave({ ...form, category: form.category ?? "OTHER", allowDateSelection: isDaycare ? true : form.allowDateSelection, allowCheckInOut: isDaycare ? true : form.allowCheckInOut, allowTimeSelection: false, durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null, durationUnit: form.durationUnit ?? "MINUTES", maxPets: form.maxPets ? Number(form.maxPets) : null, priceConditions: form.priceConditions.map((condition) => ({ ...condition, price: Number(condition.price) })) }); };
  return <div className="modal-backdrop"><form className="editor-modal service-editor" onSubmit={submit}><div className="modal-heading"><div><p className="eyebrow">{editor.item ? "EDITAR" : "NOVO CADASTRO"}</p><h2>Serviço</h2></div><button type="button" className="icon-button" onClick={onClose}>×</button></div><Field label="Nome do serviço"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Descrição"><textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><div className="form-columns"><Field label="Destinado a"><select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}><option value="DOG">Cachorro</option><option value="CAT">Gato</option><option value="BOTH">Ambos</option></select></Field><Field label="Tipo de cobrança"><select value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value })}><option value="DAILY">Valor por diária</option><option value="HOURLY">Valor por hora/minuto</option><option value="FIXED">Valor fixo</option><option value="PER_WALK">Valor por passeio</option></select></Field></div><Field label="Duração"><div className="form-columns"><input type="number" min="1" placeholder="Quantidade" value={form.durationMinutes ?? ""} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /><select value={form.durationUnit ?? "MINUTES"} onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}><option value="MINUTES">Minutos</option><option value="HOURS">Horas</option><option value="DAILY">Diárias</option><option value="UNITS">Idas (unidade)</option></select></div></Field><Field label="Condições de preço"><div className="price-conditions">{form.priceConditions.map((condition, index) => <div className="price-condition" key={index}><input required placeholder="Ex.: Fim de semana, sexta-feira ou feriados" value={condition.name} onChange={(e) => updateCondition(index, "name", e.target.value)} /><input required min="0" step="0.01" type="number" placeholder="R$" value={condition.price} onChange={(e) => updateCondition(index, "price", e.target.value)} />{form.priceConditions.length > 1 && <button type="button" className="remove-condition" onClick={() => setForm({ ...form, priceConditions: form.priceConditions.filter((_, i) => i !== index) })}>×</button>}</div>)}<button type="button" className="add-condition" onClick={() => setForm({ ...form, priceConditions: [...form.priceConditions, { name: "", price: "" }] })}>+ Adicionar condição</button></div></Field><Field label="Quantidade máxima de pets (opcional)"><input type="number" min="1" value={form.maxPets ?? ""} onChange={(e) => setForm({ ...form, maxPets: e.target.value })} /></Field><div className="toggle-list"><Toggle label="Serviço ativo" checked={form.active} onChange={(active) => setForm({ ...form, active })} /><Toggle label="Permitir seleção de data" checked={form.allowDateSelection} onChange={(allowDateSelection) => setForm({ ...form, allowDateSelection })} /><Toggle label="Permitir observações do cliente" checked={form.allowCustomerNotes} onChange={(allowCustomerNotes) => setForm({ ...form, allowCustomerNotes })} /><Toggle label="Permitir horário de entrada e saída" checked={form.allowCheckInOut} onChange={(allowCheckInOut) => setForm({ ...form, allowCheckInOut })} /></div><button className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Salvar serviço"}</button></form></div>;
}
function Toggle({ label, checked, onChange }) { return <label className="toggle-field"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>; }

function Editor({ editor, pets, serviceOfferings, onClose, onSave, loading }) {
  const { type, item } = editor;
  const initial =
    item ??
    (type === "pet"
      ? { name: "", species: "DOG", breed: "SRD (Sem Raça Definida)", birthDate: "" }
      : {
          petId: pets[0]?.id ?? "",
          serviceType: "HOSTING_24H",
          checkInDate: "",
          checkOutDate: "",
          checkInTime: "08:00",
          checkOutTime: "18:00",
          notes: "",
          serviceOfferingId: "",
          extraQuantities: {},
        });
  const [form, setForm] = useState(initial);
  const selectedOffering = serviceOfferings.find((service) => String(service.id) === String(form.serviceOfferingId));
  const isDaycare = isDayCareService(selectedOffering) || String(form.serviceType ?? "").startsWith("DAYCARE");
  const showCheckInOut = selectedOffering?.allowCheckInOut ?? true;
  const estimatedAmount = calculateOfferingAmount(selectedOffering, form.checkInDate, form.checkOutDate, form.checkInTime, form.checkOutTime, form.extraQuantities);
  return (
    <div className="modal-backdrop">
      <form
        className="editor-modal"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{item ? "ATUALIZAR" : "NOVA SOLICITAÇÃO"}</p>
            <h2>{type === "pet" ? "Pet" : "Serviço"}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            ×
          </button>
        </div>
        {type === "pet" ? (
          <>
            <Field label="Nome">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Espécie">
              <select
                value={form.species}
                onChange={(e) => setForm({ ...form, species: e.target.value, breed: e.target.value === "DOG" || e.target.value === "CAT" ? "SRD (Sem Raça Definida)" : "" })}
              >
                {species.map((v) => (
                  <option key={v} value={v}>
                    {labelOf(v)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Raça">{form.species === "DOG" || form.species === "CAT" ? <select value={form.breed || "SRD (Sem Raça Definida)"} onChange={(e) => setForm({ ...form, breed: e.target.value })}>{(form.species === "DOG" ? dogBreeds : catBreeds).map((breed) => <option key={breed} value={breed}>{breed}</option>)}</select> : <input value={form.breed ?? ""} onChange={(e) => setForm({ ...form, breed: e.target.value })} />}</Field>
            <Field label="Data de nascimento"><input type="date" value={form.birthDate ?? ""} onChange={(e) => setForm({ ...form, birthDate: e.target.value || null })} /></Field>
            <Field label="Gênero"><select value={form.gender ?? ""} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="">Não informado</option><option value="MACHO">Macho</option><option value="FÊMEA">Fêmea</option></select></Field>
            <Field label="Castrado?"><select value={String(form.neutered ?? "")} onChange={(e) => setForm({ ...form, neutered: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Não informado</option><option value="true">Sim</option><option value="false">Não</option></select></Field>
            <Field label="Vacinação em dia?"><select value={String(form.vaccinationsCurrent ?? "")} onChange={(e) => setForm({ ...form, vaccinationsCurrent: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Não informado</option><option value="true">Sim</option><option value="false">Não</option></select></Field>
            <Field label="Antipulgas em dia?"><select value={String(form.fleaPreventionCurrent ?? "")} onChange={(e) => setForm({ ...form, fleaPreventionCurrent: e.target.value === "" ? null : e.target.value === "true" })}><option value="">Não informado</option><option value="true">Sim</option><option value="false">Não</option></select></Field>
            <Field label="Doenças ou condições"><textarea value={form.healthConditions ?? ""} onChange={(e) => setForm({ ...form, healthConditions: e.target.value })} /></Field>
            <Field label="Cuidados especiais"><textarea value={form.specialCare ?? ""} onChange={(e) => setForm({ ...form, specialCare: e.target.value })} /></Field>
            <Field label="Alergias"><textarea value={form.allergies ?? ""} onChange={(e) => setForm({ ...form, allergies: e.target.value })} /></Field>
            <Field label="Sociável com humanos"><input value={form.humanSocial ?? ""} onChange={(e) => setForm({ ...form, humanSocial: e.target.value })} /></Field>
            <Field label="Sociável com outros pets"><input value={form.petSocial ?? ""} onChange={(e) => setForm({ ...form, petSocial: e.target.value })} /></Field>
            <Field label="Hábitos importantes"><textarea value={form.importantHabits ?? ""} onChange={(e) => setForm({ ...form, importantHabits: e.target.value })} /></Field>
            <Field label="Observações"><textarea value={form.observations ?? ""} onChange={(e) => setForm({ ...form, observations: e.target.value })} /></Field>
          </>
        ) : (
          <>
            <Field label="Pet">
              <select
                value={form.petId}
                disabled={Boolean(item)}
                onChange={(e) => {
                  const pet = pets.find((value) => String(value.id) === e.target.value);
                  setForm({ ...form, petId: e.target.value, serviceOfferingId: "", serviceType: pet?.species === "CAT" ? "CAT_SITTER_DAILY" : "HOSTING_24H" });
                }}
              >
                {pets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            {(() => {
              const pet = pets.find((value) => String(value.id) === String(form.petId));
              const available = serviceOfferings.filter((service) => service.active && (service.target === "BOTH" || (service.target === "DOG" && pet?.species === "DOG") || (service.target === "CAT" && pet?.species === "CAT")));
              return <Field label="Serviço"><select required value={form.serviceOfferingId ?? ""} onChange={(e) => setForm({ ...form, serviceOfferingId: e.target.value, extraQuantities: {} })}><option value="" disabled>Selecione um serviço</option>{available.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select>{!available.length && <small className="field-hint">Não há serviços ativos para a espécie deste pet.</small>}</Field>;
            })()}
            {selectedOffering?.extras?.length > 0 && <div className="reservation-extras"><strong>Serviços extras</strong><small>Informe a quantidade de cada adicional desejado.</small>{selectedOffering.extras.map((extra) => <label key={extra.code}><span>{extra.name} <em>+ {formatCurrency(extra.price)}{extra.pricing === "PER_DAY" ? " por dia" : ""}</em></span><input type="number" min="0" value={form.extraQuantities?.[extra.code] ?? 0} onChange={(e) => setForm({ ...form, extraQuantities: { ...(form.extraQuantities ?? {}), [extra.code]: Number(e.target.value) } })} /></label>)}</div>}
            {isDaycare ? <Field label="Data do serviço">
              <input
                required
                type="date"
                min={today()}
                value={form.checkInDate}
                onInput={(e) => setForm({ ...form, checkInDate: e.target.value, checkOutDate: e.target.value })}
              />
            </Field> : <><Field label="Data de entrada">
              <input
                required
                type="date"
                min={today()}
                value={form.checkInDate}
                onInput={(e) =>
                  setForm({ ...form, checkInDate: e.target.value })
                }
              />
            </Field>
            </>}
            {(showCheckInOut || isDaycare) && <><Field label="Horário de entrada">
              <input
                required
                type="time"
                value={form.checkInTime ?? ""}
                onChange={(e) =>
                  setForm({ ...form, checkInTime: e.target.value })
                }
              />
            </Field></>}
            {!isDaycare && <Field label="Data de saída">
              <input
                required
                type="date"
                min={form.checkInDate || today()}
                value={form.checkOutDate}
                onInput={(e) =>
                  setForm({ ...form, checkOutDate: e.target.value })
                }
              />
            </Field>
            }
            {(showCheckInOut || isDaycare) && <Field label="Horário de saída">
              <input
                required
                type="time"
                value={form.checkOutTime ?? ""}
                onChange={(e) =>
                  setForm({ ...form, checkOutTime: e.target.value })
                }
              />
            </Field>}
            <Field label="Observações">
              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            {estimatedAmount != null && <div className="price-preview"><span>Valor estimado da reserva</span><strong>{formatCurrency(estimatedAmount)}</strong><small>O valor considera as condições de preço cadastradas para cada dia.</small></div>}
          </>
        )}
        <button className="primary-button" disabled={loading}>
          {loading
            ? "Salvando..."
            : type === "pet"
              ? "Salvar pet"
              : "Enviar solicitação"}
        </button>
      </form>
    </div>
  );
}
function Toast({ message, type, onClose }) {
  return <div className={`toast ${type}`} role="status"><span>{type === "success" ? "✓" : "!"}</span><p>{message}</p><button onClick={onClose} aria-label="Fechar notificação">×</button></div>;
}
function Field({ label, children }) {
  return (
    <label className="field">
      {label}
      {children}
    </label>
  );
}
function SectionTitle({ title }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">GERENCIE</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
function SectionHeading({ title, action, onAction, disabled }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">GERENCIE</p>
        <h2>{title}</h2>
      </div>
      {action && <button className="add-button" disabled={disabled} onClick={onAction}>+ {action}</button>}
    </div>
  );
}
function Empty({ text }) {
  return <div className="empty-state">{text}</div>;
}
function ReservationRow({ reservation }) {
  return (
    <article className="reservation-card">
      <div className="reservation-head">
        <div>
          <h3>{reservation.petName}</h3>
          <p>
            {reservation.serviceName || serviceName(reservation.serviceType)} ·{" "}
            {formatCurrency(reservation.totalAmount)}
          </p>
        </div>
        <span className={`status ${reservation.status.toLowerCase()}`}>
          {labelOf(reservation.status)}
        </span>
      </div>
      <p className="reservation-dates">
        {formatDate(reservation.checkInDate)}{" "}
        {formatTime(reservation.checkInTime)} —{" "}
        {formatDate(reservation.checkOutDate)}{" "}
        {formatTime(reservation.checkOutTime)}
      </p>
      {reservation.status === "AWAITING_PAYMENT" && <p className="payment-whatsapp-tip">O pagamento será realizado pelo WhatsApp. Aguarde o envio do link.</p>}
      {reservation.notes && <p className="muted">{reservation.notes}</p>}
      {reservation.declineReason && (
        <p className="decline-reason">Motivo: {reservation.declineReason}</p>
      )}
    </article>
  );
}
function Stat({ icon, label, value, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
function labelOf(v) {
  return (
    {
      DOG: "Cachorro",
      CAT: "Gato",
      BIRD: "Pássaro",
      OTHER: "Outro",
      PENDING: "Pendente",
      AWAITING_PAYMENT: "Aguardando pagamento",
      CONFIRMED: "Confirmada",
      DECLINED: "Recusada",
      CANCELLED: "Cancelada",
      COMPLETED: "Finalizada",
      PAID: "Confirmado",
      PIX: "PIX",
    }[v] ?? v
  );
}
function serviceName(id) {
  return services.find(([key]) => key === id)?.[1] ?? id;
}
function isDayCareService(service) {
  const name = String(service?.name ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return service?.category === "DAYCARE" || name.includes("daycare") || name.includes("day care");
}
function isDayCareReservation(reservation) {
  return String(reservation?.serviceType ?? "").startsWith("DAYCARE") || isDayCareService({ name: reservation?.serviceName });
}
function calculateOfferingAmount(service, checkInDate, checkOutDate, checkInTime = "08:00", checkOutTime = "18:00", extraQuantities = {}) {
  if (!service || !checkInDate || !checkOutDate || checkOutDate < checkInDate) return null;
  const conditions = service.priceConditions ?? [];
  if (!conditions.length) return null;
  const priceFor = (date) => Number((conditions.find((condition) => isHolidayCondition(condition.name) && isBrazilianNationalHoliday(date)) ?? conditions.find((condition) => conditionMatchesDay(condition.name, date)) ?? conditions[0]).price);
  const firstDay = new Date(`${checkInDate}T12:00:00`);
  let total = 0;
  let chargeableDays = 1;
  if (service.billingType === "DAILY") {
    const start = new Date(`${checkInDate}T${checkInTime}:00`);
    const end = new Date(`${checkOutDate}T${checkOutTime}:00`);
    chargeableDays = Math.max(1, Math.ceil((end - start) / 86400000));
    total = Array.from({ length: chargeableDays }, (_, index) => priceFor(new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + index, 12))).reduce((sum, price) => sum + price, 0);
  } else {
    const isCatSitter = service.category === "CAT_SITTER" || service.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes("cat sitter");
    const lastChargeableDay = (checkOutDate === checkInDate || isCatSitter) ? new Date(new Date(`${checkOutDate}T12:00:00`).getFullYear(), new Date(`${checkOutDate}T12:00:00`).getMonth(), new Date(`${checkOutDate}T12:00:00`).getDate() + 1, 12) : new Date(`${checkOutDate}T12:00:00`);
    for (let day = firstDay; day < lastChargeableDay; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 12)) {
      total += priceFor(day);
      chargeableDays += 1;
    }
    chargeableDays = Math.max(1, chargeableDays - 1);
  }
  const weekendHolidayDays = countWeekendHolidayDays(checkInDate, checkOutDate);
  const extrasTotal = (service.extras ?? []).reduce((sum, extra) => {
    const quantity = Math.max(0, Number(extraQuantities?.[extra.code] ?? 0));
    if (!quantity) return sum;
    const multiplier = extra.code === "weekend_holiday" ? weekendHolidayDays : extra.pricing === "PER_DAY" ? chargeableDays : 1;
    return sum + Number(extra.price ?? 0) * quantity * multiplier;
  }, 0);
  return total + extrasTotal;
}
function countWeekendHolidayDays(checkInDate, checkOutDate) {
  let total = 0;
  const lastDay = new Date(`${checkOutDate}T12:00:00`);
  for (let day = new Date(`${checkInDate}T12:00:00`); day <= lastDay; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 12)) if ([0, 6].includes(day.getDay()) || isBrazilianNationalHoliday(day)) total += 1;
  return total;
}
function conditionMatchesDay(name = "", date) {
  const day = date.getDay();
  const condition = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if ((condition.includes("feriado") || condition.includes("holiday")) && isBrazilianNationalHoliday(date)) return true;
  if (condition.includes("fim de semana") || condition.includes("weekend")) return day === 0 || day === 6;
  if (condition.includes("segunda") && condition.includes("quinta")) return day >= 1 && day <= 4;
  if (condition.includes("dia util") || condition.includes("weekday")) return day >= 1 && day <= 5;
  return ((condition.includes("segunda") || condition.includes("monday")) && day === 1)
    || ((condition.includes("terca") || condition.includes("tuesday")) && day === 2)
    || ((condition.includes("quarta") || condition.includes("wednesday")) && day === 3)
    || ((condition.includes("quinta") || condition.includes("thursday")) && day === 4)
    || ((condition.includes("sexta") || condition.includes("friday")) && day === 5)
    || ((condition.includes("sabado") || condition.includes("saturday")) && day === 6)
    || ((condition.includes("domingo") || condition.includes("sunday")) && day === 0);
}
function isHolidayCondition(name = "") { const condition = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); return condition.includes("feriado") || condition.includes("holiday"); }
function isBrazilianNationalHoliday(date) {
  const month = date.getMonth() + 1, day = date.getDate();
  const fixed = (month === 1 && day === 1) || (month === 4 && day === 21) || (month === 5 && day === 1) || (month === 9 && day === 7) || (month === 10 && day === 12) || (month === 11 && [2, 15, 20].includes(day)) || (month === 12 && day === 25);
  const easter = easterSunday(date.getFullYear());
  const goodFriday = new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 2, 12);
  return fixed || date.toDateString() === goodFriday.toDateString();
}
function easterSunday(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), month = Math.floor((h + l - 7 * m + 114) / 31) - 1, day = (h + l - 7 * m + 114) % 31 + 1;
  return new Date(year, month, day, 12);
}
function formatDate(v) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${v}T12:00`));
}
function formatTime(v) {
  return v ? `às ${v.slice(0, 5)}` : "";
}
function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v ?? 0);
}
function formatCep(value = "") { const digits = value.replace(/\D/g, "").slice(0, 8); return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits; }
function formatWhatsApp(value = "") { let digits = value.replace(/\D/g, ""); if (!digits.startsWith("55")) digits = `55${digits}`; digits = digits.slice(0, 13); const country = digits.slice(0, 2), area = digits.slice(2, 4), number = digits.slice(4); if (!area) return `+${country}`; if (!number) return `+${country} ${area}`; return `+${country} ${area} ${number.length > 5 ? `${number.slice(0, 5)}-${number.slice(5)}` : number}`; }
function today() {
  return new Date().toISOString().slice(0, 10);
}
function calendarDays(c) {
  const start = new Date(c.getFullYear(), c.getMonth(), 1);
  start.setDate(start.getDate() - start.getDay());
  return Array.from(
    { length: 42 },
    (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}
function between(day, from, to) {
  const value = day.toISOString().slice(0, 10);
  return value >= from && value <= to;
}
export default App;
