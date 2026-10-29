import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import { Icon, Toast } from "./components/ui.jsx";
import AuthScreen from "./screens/AuthScreen.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Pets, { AdminPets, PetEditor } from "./screens/Pets.jsx";
import Reservations, { ReservationEditor } from "./screens/Reservations.jsx";
import { buildReservationPayload } from "./lib/catalog.js";
import { Clients, Payments, ServiceEditor, Services } from "./screens/Admin.jsx";
import Profile from "./screens/Profile.jsx";
import logo from "./assets/brand/logo-wordmark.svg";

const clientNav = [["overview", "Visão geral", "home"], ["pets", "Meus pets", "paw"], ["reservations", "Reservas", "calendar"], ["profile", "Perfil", "user"]];
const adminNav = [["overview", "Visão geral", "home"], ["reservations", "Reservas", "calendar"], ["payments", "Pagamentos", "wallet"], ["services", "Serviços", "sparkle"], ["pets", "Pets", "paw"], ["clients", "Clientes", "users"], ["profile", "Perfil", "user"]];
const emptyData = { pets: [], reservations: [], payments: [], profile: null, clients: [], serviceOfferings: [], administrators: [] };

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("snowcia_token"));
  const [role, setRole] = useState(() => localStorage.getItem("snowcia_role") ?? "CLIENT");
  const [active, setActive] = useState("overview");
  const [data, setData] = useState(emptyData);
  const [editor, setEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const isAdmin = role === "ADMIN";

  const request = useCallback((path, options) => apiFetch(path, { ...options, token }), [token]);
  const notify = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const logout = useCallback(() => {
    localStorage.removeItem("snowcia_token");
    localStorage.removeItem("snowcia_role");
    setToken(null);
    setRole("CLIENT");
    setData(emptyData);
    setActive("overview");
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const [pets, reservations, payments, profile, clients, serviceOfferings, administrators] = await Promise.all([
        request("/api/pets"),
        request("/api/reservations"),
        isAdmin ? request("/api/payments") : [],
        request("/api/users/me"),
        isAdmin ? request("/api/users/clients") : [],
        request("/api/services"),
        request("/api/users/reservation-administrators"),
      ]);
      setData({ pets, reservations, payments, profile, clients, serviceOfferings, administrators });
    } catch (e) {
      // Every endpoint above is allowed for this role, so 401/403 here means the token expired.
      if ([401, 403].includes(e.status)) {
        logout();
        notify("Sua sessão expirou. Entre de novo.", "error");
      } else notify(e.message, "error");
    }
  }, [isAdmin, logout, notify, request, token]);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  async function run(action, successMessage) {
    try {
      await action();
      await refresh();
      notify(successMessage);
      return true;
    } catch (e) {
      notify(e.message, "error");
      return false;
    }
  }

  async function save(form) {
    setSaving(true);
    const { type, item } = editor;
    const path = { pet: "/api/pets", reservation: "/api/reservations", service: "/api/services" }[type];
    const done = await run(async () => {
      const body = type === "reservation" ? buildReservationPayload(form, data.pets, data.serviceOfferings) : form;
      await request(item ? `${path}/${item.id}` : path, { method: item ? "PUT" : "POST", body });
    }, "Tudo salvo.");
    setSaving(false);
    if (done) setEditor(null);
  }

  function remove(type, id) {
    const question = type === "pets" ? "Excluir este pet? Essa ação não pode ser desfeita." : "Cancelar esta solicitação?";
    if (!window.confirm(question)) return;
    run(() => request(`/api/${type}/${id}`, { method: "DELETE" }), type === "pets" ? "Pet excluído." : "Solicitação cancelada.");
  }

  function decide(id, action) {
    let body;
    if (action === "decline") {
      const reason = window.prompt("Por que a reserva foi recusada? O tutor vai receber esse motivo.");
      if (!reason?.trim()) return;
      body = { reason };
    }
    run(() => request(`/api/reservations/${id}/${action}`, { method: "PATCH", body }), action === "approve" ? "Reserva aceita e cobrança criada." : "Reserva recusada.");
  }

  function deleteService(id) {
    if (!window.confirm("Excluir este serviço do catálogo?")) return;
    if (window.prompt("Para confirmar, digite EXCLUIR.") !== "EXCLUIR") return notify("Exclusão cancelada: o texto de confirmação não confere.", "error");
    run(() => request(`/api/services/${id}`, { method: "DELETE", headers: { "X-Confirm-Service-Deletion": "EXCLUIR" } }), "Serviço excluído.");
  }

  if (!token) {
    return (
      <AuthScreen
        onAuthenticated={(nextToken, nextRole) => {
          localStorage.setItem("snowcia_token", nextToken);
          localStorage.setItem("snowcia_role", nextRole);
          setRole(nextRole);
          setToken(nextToken);
        }}
      />
    );
  }

  const nav = isAdmin ? adminNav : clientNav;
  const title = nav.find(([key]) => key === active)?.[1];
  const openEditor = (type) => (item) => setEditor({ type, item });

  return (
    <div className="shell">
      <aside className="sidebar">
        <img className="sidebar-logo" src={logo} alt="Snow & Cia" />
        <nav aria-label="Seções">
          {nav.map(([key, label, icon]) => (
            <button key={key} className="nav-item" aria-current={active === key ? "page" : undefined} onClick={() => setActive(key)}>
              <Icon name={icon} /> {label}
            </button>
          ))}
        </nav>
        <button className="nav-item nav-logout" onClick={logout}>
          <Icon name="logout" /> Sair
        </button>
      </aside>

      <main className="content">
        <header className="page-head">
          <h1>{title}</h1>
          {isAdmin && <span className="role-badge">Equipe</span>}
        </header>
        {active === "overview" && <Dashboard data={data} isAdmin={isAdmin} onRequestService={() => setEditor({ type: "reservation", item: null })} />}
        {active === "pets" && (isAdmin ? <AdminPets pets={data.pets} /> : <Pets pets={data.pets} onEdit={openEditor("pet")} onDelete={(id) => remove("pets", id)} />)}
        {active === "reservations" && (
          <Reservations reservations={data.reservations} pets={data.pets} isAdmin={isAdmin} onEdit={openEditor("reservation")} onCancel={(id) => remove("reservations", id)} onDecide={decide} />
        )}
        {active === "profile" && (
          <Profile key={JSON.stringify(data.profile)} profile={data.profile} onSave={(profile) => run(() => request("/api/users/me", { method: "PUT", body: profile }), "Dados atualizados.")} />
        )}
        {isAdmin && active === "payments" && <Payments payments={data.payments} onUpdate={(id, action) => run(() => request(`/api/payments/${id}/${action}`, { method: "PATCH" }), "Pagamento atualizado.")} />}
        {isAdmin && active === "services" && (
          <Services services={data.serviceOfferings} onEdit={openEditor("service")} onToggle={(id) => run(() => request(`/api/services/${id}/toggle`, { method: "PUT" }), "Serviço atualizado.")} onDelete={deleteService} />
        )}
        {isAdmin && active === "clients" && <Clients clients={data.clients} pets={data.pets} reservations={data.reservations} payments={data.payments} />}
      </main>

      {editor?.type === "pet" && <PetEditor item={editor.item} onClose={() => setEditor(null)} onSave={save} loading={saving} />}
      {editor?.type === "service" && <ServiceEditor item={editor.item} onClose={() => setEditor(null)} onSave={save} loading={saving} />}
      {editor?.type === "reservation" && (
        <ReservationEditor item={editor.item} pets={data.pets} serviceOfferings={data.serviceOfferings} administrators={data.administrators} onClose={() => setEditor(null)} onSave={save} loading={saving} />
      )}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
