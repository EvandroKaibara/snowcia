import { useCallback, useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'
const navigation = [['Visão geral', '⌂'], ['Meus pets', '♧'], ['Reservas', '▣'], ['Pagamentos', '◈']]
const species = ['DOG', 'CAT', 'BIRD', 'OTHER']
const paymentMethods = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH']
const initialData = { pets: [], reservations: [], payments: [] }

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('snowcia_token'))
  const [isRegistering, setIsRegistering] = useState(false)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState('Visão geral')
  const [data, setData] = useState(initialData)
  const [editor, setEditor] = useState(null)

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
    })
    const payload = response.status === 204 ? null : await response.json().catch(() => ({}))
    if (!response.ok) {
      const details = payload.fieldErrors && Object.entries(payload.fieldErrors)
        .map(([field, message]) => `${field}: ${message}`).join(' · ')
      throw new Error(details ? `${payload.message}: ${details}` : payload.message ?? 'Não foi possível concluir esta ação.')
    }
    return payload
  }, [token])

  const refresh = useCallback(async () => {
    if (!token) return
    try {
      const [pets, reservations, payments] = await Promise.all([
        request('/api/pets'), request('/api/reservations'), request('/api/payments'),
      ])
      setData({ pets, reservations, payments })
    } catch (requestError) {
      if (requestError.message.includes('sessão')) logout()
      setError(requestError.message)
    }
  }, [request, token])

  useEffect(() => { refresh() }, [refresh])

  async function handleAuth(event) {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login'
      const body = isRegistering ? authForm : { email: authForm.email, password: authForm.password }
      const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível acessar sua conta.')
      localStorage.setItem('snowcia_token', payload.token); setToken(payload.token)
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  function logout() { localStorage.removeItem('snowcia_token'); setToken(null); setData(initialData); setEditor(null); setError('') }

  async function saveEditor(form) {
    setLoading(true); setError('')
    try {
      const { type, item } = editor
      if (type === 'pet') await request(item ? `/api/pets/${item.id}` : '/api/pets', { method: item ? 'PUT' : 'POST', body: JSON.stringify(form) })
      if (type === 'reservation') await request(item ? `/api/reservations/${item.id}` : '/api/reservations', { method: item ? 'PUT' : 'POST', body: JSON.stringify({ ...form, petId: Number(form.petId) }) })
      if (type === 'payment') await request('/api/payments', { method: 'POST', body: JSON.stringify({ ...form, reservationId: Number(form.reservationId), amount: Number(form.amount) }) })
      setEditor(null); await refresh()
    } catch (requestError) { setError(requestError.message) } finally { setLoading(false) }
  }

  async function deleteItem(type, id) {
    if (!window.confirm('Deseja realmente remover este item?')) return
    setError('')
    try { await request(`/api/${type}/${id}`, { method: 'DELETE' }); await refresh() } catch (requestError) { setError(requestError.message) }
  }

  async function updatePayment(id, action) {
    setError('')
    try { await request(`/api/payments/${id}/${action}`, { method: 'PATCH' }); await refresh() } catch (requestError) { setError(requestError.message) }
  }

  if (!token) return <AuthScreen isRegistering={isRegistering} setIsRegistering={setIsRegistering} form={authForm} setForm={setAuthForm} onSubmit={handleAuth} loading={loading} error={error} />

  const upcoming = data.reservations.filter((reservation) => new Date(`${reservation.checkInDate}T12:00:00`) >= new Date()).length
  const paid = data.payments.filter((payment) => payment.status === 'PAID').length
  return <main className="app-shell">
    <aside className="sidebar"><div className="brand"><span>✦</span> snowcia</div><nav>{navigation.map(([label, icon]) => <button key={label} className={active === label ? 'nav-link active' : 'nav-link'} onClick={() => setActive(label)}><span>{icon}</span>{label}</button>)}</nav><button className="logout" onClick={logout}>↪ Sair</button></aside>
    <section className="content"><header><div><p className="eyebrow">PAINEL</p><h1>{active}</h1></div><div className="avatar">🐾</div></header>{error && <p className="form-error page-error">{error}</p>}
      {active === 'Visão geral' && <Dashboard data={data} upcoming={upcoming} paid={paid} onReserve={() => setActive('Reservas')} />}
      {active === 'Meus pets' && <Pets pets={data.pets} openEditor={setEditor} onDelete={(id) => deleteItem('pets', id)} />}
      {active === 'Reservas' && <Reservations reservations={data.reservations} pets={data.pets} openEditor={setEditor} onDelete={(id) => deleteItem('reservations', id)} />}
      {active === 'Pagamentos' && <Payments payments={data.payments} reservations={data.reservations} openEditor={setEditor} updatePayment={updatePayment} />}
    </section>
    {editor && <Editor editor={editor} pets={data.pets} reservations={data.reservations} onClose={() => setEditor(null)} onSave={saveEditor} loading={loading} />}
  </main>
}

function AuthScreen({ isRegistering, setIsRegistering, form, setForm, onSubmit, loading, error }) { return <main className="auth-shell"><section className="brand-panel"><div className="brand"><span>✦</span> snowcia</div><div className="hero-copy"><p className="eyebrow">HOTEL PET, SEM COMPLICAÇÃO</p><h1>Todo o cuidado que o seu pet merece.</h1><p>Organize reservas, acompanhe pagamentos e mantenha a rotina do seu melhor amigo em um só lugar.</p></div><div className="decorative-card"><span>🐾</span><div><strong>Bem-estar em cada detalhe</strong><small>Uma experiência leve para você e seu pet.</small></div></div></section><section className="auth-panel"><form className="auth-card" onSubmit={onSubmit}><p className="eyebrow">BEM-VINDO</p><h2>{isRegistering ? 'Crie sua conta' : 'Entre na sua conta'}</h2><p className="muted">{isRegistering ? 'Comece a cuidar da rotina do seu pet.' : 'Que bom ter você de volta.'}</p>{isRegistering && <Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" /></Field>}<Field label="E-mail"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" /></Field><Field label="Senha"><input required type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></Field>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={loading}>{loading ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}</button><p className="switch-auth">{isRegistering ? 'Já possui uma conta?' : 'Ainda não tem uma conta?'} <button type="button" onClick={() => setIsRegistering(!isRegistering)}>{isRegistering ? 'Entrar' : 'Criar agora'}</button></p></form></section></main> }

function Dashboard({ data, upcoming, paid, onReserve }) { return <><div className="welcome"><div><p>Olá! Que bom te ver por aqui.</p><h2>Vamos cuidar de momentos incríveis?</h2><button className="secondary-button" onClick={onReserve}>Nova reserva <span>→</span></button></div><span className="welcome-pet">🐶</span></div><div className="stats"><Stat icon="🐾" label="Pets cadastrados" value={data.pets.length} tone="blue" /><Stat icon="▣" label="Próximas reservas" value={upcoming} tone="yellow" /><Stat icon="◈" label="Pagamentos confirmados" value={paid} tone="orange" /></div><section className="list-card"><div className="section-heading"><div><p className="eyebrow">ACOMPANHE</p><h2>Próximas reservas</h2></div></div>{data.reservations.length === 0 ? <Empty text="Ainda não há reservas. Cadastre um pet para começar." /> : data.reservations.slice(0, 4).map((reservation) => <ReservationRow reservation={reservation} key={reservation.id} />)}</section></> }
function Pets({ pets, openEditor, onDelete }) { return <section className="list-card"><SectionHeading title="Seus companheiros" action="Cadastrar pet" onAction={() => openEditor({ type: 'pet' })} />{pets.length === 0 ? <Empty text="Nenhum pet cadastrado ainda." /> : <div className="item-grid">{pets.map((pet) => <article className="pet-card" key={pet.id}><div className="pet-emoji">{pet.species === 'CAT' ? '🐱' : pet.species === 'BIRD' ? '🐦' : '🐶'}</div><h3>{pet.name}</h3><p>{labelOf(pet.species)} {pet.breed && `· ${pet.breed}`}</p><div className="card-actions"><button onClick={() => openEditor({ type: 'pet', item: pet })}>Editar</button><button className="danger" onClick={() => onDelete(pet.id)}>Excluir</button></div></article>)}</div>}</section> }
function Reservations({ reservations, pets, openEditor, onDelete }) { return <section className="list-card"><SectionHeading title="Estadias programadas" action="Nova reserva" disabled={!pets.length} onAction={() => openEditor({ type: 'reservation' })} />{!pets.length && <p className="inline-tip">Cadastre um pet antes de criar uma reserva.</p>}{reservations.length === 0 ? <Empty text="Nenhuma reserva registrada." /> : reservations.map((reservation) => <div className="reservation-row detailed" key={reservation.id}><div className="pet-dot">🐾</div><div><strong>{reservation.petName}</strong><small>{formatDate(reservation.checkInDate)} — {formatDate(reservation.checkOutDate)}</small>{reservation.notes && <small className="note">{reservation.notes}</small>}</div><span className="status">{labelOf(reservation.status)}</span><div className="row-actions"><button onClick={() => openEditor({ type: 'reservation', item: reservation })}>Editar</button><button className="danger" onClick={() => onDelete(reservation.id)}>Cancelar</button></div></div>)}</section> }
function Payments({ payments, reservations, openEditor, updatePayment }) { return <section className="list-card"><SectionHeading title="Controle financeiro" action="Registrar pagamento" disabled={!reservations.length} onAction={() => openEditor({ type: 'payment' })} />{!reservations.length && <p className="inline-tip">Crie uma reserva antes de registrar um pagamento.</p>}{payments.length === 0 ? <Empty text="Nenhum pagamento registrado." /> : payments.map((payment) => <div className="reservation-row detailed" key={payment.id}><div className="pet-dot money">◈</div><div><strong>{payment.petName}</strong><small>{labelOf(payment.method)} · {formatCurrency(payment.amount)}</small></div><span className={`status ${payment.status.toLowerCase()}`}>{labelOf(payment.status)}</span><div className="row-actions">{payment.status === 'PENDING' && <><button onClick={() => updatePayment(payment.id, 'confirm')}>Confirmar</button><button className="danger" onClick={() => updatePayment(payment.id, 'cancel')}>Cancelar</button></>}</div></div>)}</section> }

function Editor({ editor, pets, reservations, onClose, onSave, loading }) { const { type, item } = editor; const initial = item ?? (type === 'pet' ? { name: '', species: 'DOG', breed: '', birthDate: '' } : type === 'reservation' ? { petId: pets[0]?.id ?? '', checkInDate: '', checkOutDate: '', notes: '' } : { reservationId: reservations[0]?.id ?? '', amount: '', method: 'PIX' }); const [form, setForm] = useState(initial); return <div className="modal-backdrop"><form className="editor-modal" onSubmit={(e) => { e.preventDefault(); onSave(form) }}><div className="modal-heading"><div><p className="eyebrow">{item ? 'ATUALIZAR' : 'NOVO REGISTRO'}</p><h2>{type === 'pet' ? 'Pet' : type === 'reservation' ? 'Reserva' : 'Pagamento'}</h2></div><button type="button" className="icon-button" onClick={onClose}>×</button></div>{type === 'pet' && <><Field label="Nome"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field><Field label="Espécie"><select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>{species.map((value) => <option key={value} value={value}>{labelOf(value)}</option>)}</select></Field><Field label="Raça"><input value={form.breed ?? ''} onChange={(e) => setForm({ ...form, breed: e.target.value })} /></Field><Field label="Data de nascimento"><input type="date" value={form.birthDate ?? ''} onInput={(e) => setForm({ ...form, birthDate: e.target.value || null })} /></Field></>}{type === 'reservation' && <><Field label="Pet"><select value={form.petId} disabled={Boolean(item)} onChange={(e) => setForm({ ...form, petId: e.target.value })}>{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></Field><Field label="Check-in"><input required type="date" min={today()} value={form.checkInDate} onInput={(e) => setForm({ ...form, checkInDate: e.target.value })} /></Field><Field label="Check-out"><input required type="date" min={form.checkInDate || today()} value={form.checkOutDate} onInput={(e) => setForm({ ...form, checkOutDate: e.target.value })} /></Field><Field label="Observações"><textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></>}{type === 'payment' && <><Field label="Reserva"><select value={form.reservationId} onChange={(e) => setForm({ ...form, reservationId: e.target.value })}>{reservations.map((reservation) => <option key={reservation.id} value={reservation.id}>{reservation.petName} · {formatDate(reservation.checkInDate)}</option>)}</select></Field><Field label="Valor (R$)"><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field><Field label="Método"><select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>{paymentMethods.map((value) => <option key={value} value={value}>{labelOf(value)}</option>)}</select></Field></>}<button className="primary-button" disabled={loading}>{loading ? 'Salvando...' : item ? 'Salvar alterações' : 'Salvar'}</button></form></div> }

function Field({ label, children }) { return <label className="field">{label}{children}</label> }
function SectionHeading({ title, action, onAction, disabled }) { return <div className="section-heading"><div><p className="eyebrow">GERENCIE</p><h2>{title}</h2></div><button className="add-button" disabled={disabled} onClick={onAction}>+ {action}</button></div> }
function Empty({ text }) { return <div className="empty-state">{text}</div> }
function ReservationRow({ reservation }) { return <div className="reservation-row"><div className="pet-dot">🐾</div><div><strong>{reservation.petName}</strong><small>{formatDate(reservation.checkInDate)} — {formatDate(reservation.checkOutDate)}</small></div><span className="status">{labelOf(reservation.status)}</span></div> }
function Stat({ icon, label, value, tone }) { return <article className={`stat-card ${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article> }
function labelOf(value) { return ({ DOG: 'Cachorro', CAT: 'Gato', BIRD: 'Pássaro', OTHER: 'Outro', PENDING: 'Pendente', CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', PAID: 'Pago', PIX: 'PIX', CREDIT_CARD: 'Cartão de crédito', DEBIT_CARD: 'Cartão de débito', CASH: 'Dinheiro' })[value] ?? value }
function formatDate(value) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)) }
function formatCurrency(value) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) }
function today() { return new Date().toISOString().slice(0, 10) }

export default App
