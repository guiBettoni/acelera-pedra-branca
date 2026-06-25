import { SUPABASE_URL, SUPABASE_ANON_KEY, BACKEND_URL } from './utils'

const sbHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
}

function authHeaders() {
  const token = sessionStorage.getItem('admin_token')
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// ── Supabase public reads ──────────────────────────────

export async function fetchStartups() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/startups?ativo=eq.true&order=pontos.desc`,
    { headers: sbHeaders }
  )
  if (!r.ok) throw new Error('Supabase fetch failed')
  return r.json()
}

export async function fetchLogs() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/pontuacoes?select=*,startups(nome)&order=criado_em.desc&limit=200`,
    { headers: sbHeaders }
  )
  if (!r.ok) throw new Error('Logs fetch failed')
  return r.json()
}

// ── Backend writes (admin) ─────────────────────────────

export async function apiLogin(email, password) {
  const r = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Login failed')
  return data
}

export async function apiCreateStartup(payload) {
  const r = await fetch(`${BACKEND_URL}/api/startups`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Create failed')
  return data
}

export async function apiUpdateStartup(id, payload) {
  const r = await fetch(`${BACKEND_URL}/api/startups/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Update failed')
  return data
}

export async function apiDeleteStartup(id) {
  const r = await fetch(`${BACKEND_URL}/api/startups/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  if (!r.ok) throw new Error('Delete failed')
}

export async function apiLancarPontos(payload) {
  const r = await fetch(`${BACKEND_URL}/api/pontuacoes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Lançamento failed')
  return data
}

export async function apiDeleteLog(id) {
  const r = await fetch(`${BACKEND_URL}/api/pontuacoes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  if (!r.ok) throw new Error('Delete log failed')
}

export async function apiFetchAtividades() {
  const r = await fetch(`${BACKEND_URL}/api/atividades`, {
    headers: authHeaders(),
  })
  if (!r.ok) throw new Error('Fetch atividades failed')
  return r.json()
}

export async function apiCreateAtividade(payload) {
  const r = await fetch(`${BACKEND_URL}/api/atividades`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Create atividade failed')
  return data
}

export async function apiUpdateAtividade(id, payload) {
  const r = await fetch(`${BACKEND_URL}/api/atividades/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Update atividade failed')
  return data
}

export async function apiDeleteAtividade(id) {
  const r = await fetch(`${BACKEND_URL}/api/atividades/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  if (!r.ok) throw new Error('Delete atividade failed')
}

// ── Mentores ──────────────────────────────────────────────────────────────────

export async function fetchMentores() {
  const r = await fetch(`${BACKEND_URL}/api/mentores`)
  if (!r.ok) throw new Error('Mentores fetch failed')
  return r.json()
}

export async function apiCreateMentor(payload) {
  const r = await fetch(`${BACKEND_URL}/api/mentores`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Create mentor failed')
  return data
}

export async function apiUpdateMentor(id, payload) {
  const r = await fetch(`${BACKEND_URL}/api/mentores/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Update mentor failed')
  return data
}

export async function apiDeleteMentor(id) {
  const r = await fetch(`${BACKEND_URL}/api/mentores/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  if (!r.ok) throw new Error('Delete mentor failed')
}
