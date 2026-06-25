import { useState, useEffect } from 'react'
import { uid } from '../lib/utils'

const KEY = 'apb_mentores'

export const DEFAULT_MENTORES = [
  { id: 'M01', nome: 'Eduardo Jacob Murakami', especialidade: 'Direito Empresarial', bio: '', calendarUrl: 'https://calendar.app.google/cSCNg8FsNE8PFe4a8', disponivel: true },
  { id: 'M02', nome: 'Fabiana Naya Silveira',  especialidade: 'Finanças',            bio: '', calendarUrl: 'https://calendar.app.google/dR7NYD4PsuUkLgH56', disponivel: true },
  { id: 'M03', nome: 'Vanessa Milis Vieira',   especialidade: 'Cultura & Liderança', bio: '', calendarUrl: 'https://calendar.app.google/KgMTRzzygEqHfcuG6', disponivel: true },
  { id: 'M04', nome: 'Vinícius',               especialidade: 'Engenharia de Software', bio: '13 anos de experiência em desenvolvimento web e mobile. Atua remotamente para empresas do exterior com foco em arquitetura, Node.js, Flutter e IA aplicada.', calendarUrl: 'https://calendar.app.google/8RRSeburHUVKM1ZB8', disponivel: true },
]

export default function useMentores() {
  const [mentores, setMentores] = useState(() => {
    try {
      const raw = localStorage.getItem(KEY)
      const parsed = raw ? JSON.parse(raw) : null
      return parsed?.length ? parsed : DEFAULT_MENTORES
    } catch {
      return DEFAULT_MENTORES
    }
  })

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(mentores)) } catch {}
  }, [mentores])

  function addMentor(data) {
    const id = 'M' + uid().slice(-4).toUpperCase()
    setMentores(prev => [...prev, { id, ...data }])
  }

  function updateMentor(id, data) {
    setMentores(prev => prev.map(m => m.id === id ? { ...m, ...data } : m))
  }

  function deleteMentor(id) {
    setMentores(prev => prev.filter(m => m.id !== id))
  }

  function toggleDisponivel(id) {
    setMentores(prev => prev.map(m => m.id === id ? { ...m, disponivel: !m.disponivel } : m))
  }

  return { mentores, addMentor, updateMentor, deleteMentor, toggleDisponivel }
}
