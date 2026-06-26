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
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/mentores?select=id,nome,especialidade,bio,calendar_url,status,photo_url&order=criado_em`,
    { headers: sbHeaders }
  )
  if (!r.ok) throw new Error('Mentores fetch failed')
  const rows = await r.json()
  return rows.map(row => ({
    id: row.id,
    nome: row.nome,
    especialidade: row.especialidade,
    bio: row.bio,
    calendarUrl: row.calendar_url,
    status: row.status,
    photoUrl: row.photo_url || '',
  }))
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

// ── Workshops ──────────────────────────────────────────────────────────────────

export async function fetchWorkshops() {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/workshops?select=id,num,data_workshop,date_display,tema,nome_mentor,role_mentor,bio_mentor,photo_url,ordem&order=ordem`,
    { headers: sbHeaders }
  )
  if (!r.ok) throw new Error('Workshops fetch failed')
  const rows = await r.json()
  return rows.map(row => ({
    id: row.id,
    num: row.num,
    dataWorkshop: row.data_workshop,
    dateDisplay: row.date_display,
    tema: row.tema,
    nomeMentor: row.nome_mentor,
    roleMentor: row.role_mentor,
    bioMentor: row.bio_mentor,
    photoUrl: row.photo_url || '',
    ordem: row.ordem,
  }))
}

export async function apiCreateWorkshop(payload) {
  const r = await fetch(`${BACKEND_URL}/api/workshops`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Create workshop failed')
  return data
}

export async function apiUpdateWorkshop(id, payload) {
  const r = await fetch(`${BACKEND_URL}/api/workshops/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'Update workshop failed')
  return data
}

export async function apiDeleteWorkshop(id) {
  const r = await fetch(`${BACKEND_URL}/api/workshops/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (r.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  if (!r.ok) throw new Error('Delete workshop failed')
}
