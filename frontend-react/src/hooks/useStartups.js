import { useState, useEffect, useCallback } from 'react'
import { fetchStartups, fetchLogs } from '../lib/api'

function s2l(s) {
  return {
    id: s.id,
    name: s.nome,
    area: s.area,
    stage: s.estagio || 1,
    email: s.email || '',
    pts: s.pontos || 0,
    foto: s.foto_url || '',
    aulas: s.aulas || 0,
    mentorias: s.mentorias || 0,
    canvas_feito: s.canvas_feito || false,
    entrevistas: s.entrevistas || false,
    mvp_funcional: s.mvp_funcional || false,
    pessoas_testando: s.pessoas_testando || false,
    clientes_pagantes: s.clientes_pagantes || false,
  }
}

export function l2l(l) {
  return {
    id: l.id,
    sid: l.startup_id,
    sname: l.startups?.nome || '?',
    ativ: l.descricao || 'Atividade',
    cat: l.categoria || 'Manual',
    pts: l.pontos,
    obs: l.obs || '',
    by: l.lancado_por || '',
    date: (l.criado_em || '').slice(0, 10),
  }
}

export default function useStartups({ autoRefresh = false } = {}) {
  const [startups, setStartups] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const [raw, rawLogs] = await Promise.all([fetchStartups(), fetchLogs()])
      setStartups(raw.map(s2l))
      setLogs(rawLogs.map(l2l))
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    if (!autoRefresh) return
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load, autoRefresh])

  return { startups, logs, loading, error, refresh: load, lastUpdated }
}
