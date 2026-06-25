import { useState, useEffect, useCallback } from 'react'
import { fetchMentores, apiCreateMentor, apiUpdateMentor, apiDeleteMentor } from '../lib/api'

const CACHE_KEY = 'apb_mentores'

export const STATUS_OPTIONS = [
  { value: 'aberta',   label: 'Aberta' },
  { value: 'fechada',  label: 'Fechada' },
  { value: 'em_breve', label: 'Em breve' },
]

export const DEFAULT_MENTORES = [
  { id: 'M01', nome: 'Eduardo Jacob Murakami', especialidade: 'Direito Empresarial', bio: '', calendarUrl: 'https://calendar.app.google/cSCNg8FsNE8PFe4a8', status: 'aberta' },
  { id: 'M02', nome: 'Fabiana Naya Silveira',  especialidade: 'Finanças',            bio: '', calendarUrl: 'https://calendar.app.google/dR7NYD4PsuUkLgH56', status: 'aberta' },
  { id: 'M03', nome: 'Vanessa Milis Vieira',   especialidade: 'Cultura & Liderança', bio: '', calendarUrl: 'https://calendar.app.google/KgMTRzzygEqHfcuG6', status: 'aberta' },
  { id: 'M04', nome: 'Vinícius',               especialidade: 'Engenharia de Software', bio: '13 anos de experiência em desenvolvimento web e mobile. Atua remotamente para empresas do exterior com foco em arquitetura, Node.js, Flutter e IA aplicada.', calendarUrl: 'https://calendar.app.google/8RRSeburHUVKM1ZB8', status: 'aberta' },
]

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (!parsed?.length) return DEFAULT_MENTORES
    return parsed.map(m => m.status ? m : { ...m, status: m.disponivel ? 'aberta' : 'em_breve' })
  } catch {
    return DEFAULT_MENTORES
  }
}

function writeCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch {}
}

export default function useMentores() {
  const [mentores, setMentores] = useState(readCache)

  const load = useCallback(async () => {
    try {
      const data = await fetchMentores()
      setMentores(data)
      writeCache(data)
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  async function addMentor(data) {
    await apiCreateMentor(data)
    await load()
  }

  async function updateMentor(id, data) {
    await apiUpdateMentor(id, data)
    await load()
  }

  async function deleteMentor(id) {
    await apiDeleteMentor(id)
    await load()
  }

  async function setMentorStatus(id, status) {
    const m = mentores.find(x => x.id === id)
    if (!m) return
    await apiUpdateMentor(id, { ...m, status })
    await load()
  }

  return { mentores, addMentor, updateMentor, deleteMentor, setMentorStatus }
}
