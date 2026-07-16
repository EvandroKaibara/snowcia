import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'

const navigation = [
  ['Visão geral', '⌂'],
  ['Meus pets', '♧'],
  ['Reservas', '▣'],
  ['Pagamentos', '◈'],
]

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('snowcia_token'))
  const [isRegistering, setIsRegistering] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState('Visão geral')
  const [data, setData] = useState({ pets: [], reservations: [], payments: [] })

  useEffect(() => {
    if (!token) return
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${API_URL}/api/pets`, { headers }),
      fetch(`${API_URL}/api/reservations`, { headers }),
      fetch(`${API_URL}/api/payments`, { headers }),
    ])
      .then(async (responses) => {
        if (responses.some((response) => response.status === 401)) throw new Error('Sua sessão expirou. Entre novamente.')
        return Promise.all(responses.map((response) => response.ok ? response.json() : []))
      })
      .then(([pets, reservations, payments]) => setData({ pets, reservations, payments }))
      .catch((requestError) => setError(requestError.message))
  }, [token])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login'
      const body = isRegistering ? form : { email: form.email, password: form.password }
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.message ?? 'Não foi possível acessar sua conta.')
      localStorage.setItem('snowcia_token', payload.token)
      setToken(payload.token)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('snowcia_token')
    setToken(null)
    setData({ pets: [], reservations: [], payments: [] })
    setError('')
  }

  if (!token) {
    return <main className="auth-shell">
      <section className="brand-panel">
        <div className="brand"><span>✦</span> snowcia</div>
        <div className="hero-copy">
          <p className="eyebrow">HOTEL PET, SEM COMPLICAÇÃO</p>
          <h1>Todo o cuidado que o seu pet merece.</h1>
          <p>Organize reservas, acompanhe pagamentos e mantenha a rotina do seu melhor amigo em um só lugar.</p>
        </div>
        <div className="decorative-card"><span>🐾</span><div><strong>Bem-estar em cada detalhe</strong><small>Uma experiência leve para você e seu pet.</small></div></div>
      </section>
      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="eyebrow">BEM-VINDO</p>
          <h2>{isRegistering ? 'Crie sua conta' : 'Entre na sua conta'}</h2>
          <p className="muted">{isRegistering ? 'Comece a cuidar da rotina do seu pet.' : 'Que bom ter você de volta.'}</p>
          {isRegistering && <label>Nome<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" /></label>}
          <label>E-mail<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@email.com" /></label>
          <label>Senha<input required type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={loading}>{loading ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}</button>
          <p className="switch-auth">{isRegistering ? 'Já possui uma conta?' : 'Ainda não tem uma conta?'} <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError('') }}>{isRegistering ? 'Entrar' : 'Criar agora'}</button></p>
        </form>
      </section>
    </main>
  }

  const upcoming = data.reservations.filter((reservation) => new Date(reservation.checkInDate) >= new Date()).length
  const paid = data.payments.filter((payment) => payment.status === 'PAID').length
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span>✦</span> snowcia</div>
      <nav>{navigation.map(([label, icon]) => <button key={label} className={active === label ? 'nav-link active' : 'nav-link'} onClick={() => setActive(label)}><span>{icon}</span>{label}</button>)}</nav>
      <button className="logout" onClick={logout}>↪ Sair</button>
    </aside>
    <section className="content">
      <header><div><p className="eyebrow">PAINEL</p><h1>{active}</h1></div><div className="avatar">🐾</div></header>
      {error && <p className="form-error page-error">{error}</p>}
      <div className="welcome"><div><p>Olá! Que bom te ver por aqui.</p><h2>Vamos cuidar de momentos incríveis?</h2><button className="secondary-button" onClick={() => setActive('Reservas')}>Nova reserva <span>→</span></button></div><span className="welcome-pet">🐶</span></div>
      <div className="stats">
        <Stat icon="🐾" label="Pets cadastrados" value={data.pets.length} tone="blue" />
        <Stat icon="▣" label="Próximas reservas" value={upcoming} tone="yellow" />
        <Stat icon="◈" label="Pagamentos confirmados" value={paid} tone="orange" />
      </div>
      <section className="list-card"><div className="section-heading"><div><p className="eyebrow">ACOMPANHE</p><h2>Próximas reservas</h2></div><button onClick={() => setActive('Reservas')}>Ver todas</button></div>
        {data.reservations.length === 0 ? <div className="empty-state">Ainda não há reservas. Cadastre um pet para começar.</div> : data.reservations.slice(0, 4).map((reservation) => <div className="reservation-row" key={reservation.id}><div className="pet-dot">🐾</div><div><strong>{reservation.petName}</strong><small>{formatDate(reservation.checkInDate)} — {formatDate(reservation.checkOutDate)}</small></div><span className="status">{reservation.status}</span></div>)}
      </section>
    </section>
  </main>
}

function Stat({ icon, label, value, tone }) { return <article className={`stat-card ${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article> }
function formatDate(value) { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)) }

export default App
