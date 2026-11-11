// Dados do site congelados em arquivos JSON (src/data/static/).
// O site não depende mais do Supabase nem do backend no Render.
// Para atualizar a partir do banco: `npm run exportar-dados` (ver scripts/exportar-dados.mjs)
// ou edite os JSON diretamente.
import startups from '../data/static/startups.json'
import mentores from '../data/static/mentores.json'
import workshops from '../data/static/workshops.json'
import meta from '../data/static/meta.json'

export const STARTUPS = [...startups].sort((a, b) => (b.pts || 0) - (a.pts || 0))

export const WORKSHOPS = [...workshops].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))

const MENTORES_POR_PROGRAMA = mentores.reduce((acc, m) => {
  const programa = m.programa || 'acelera'
  ;(acc[programa] ||= []).push(m)
  return acc
}, {})

const VAZIO = []

export function mentoresDoPrograma(programa = 'acelera') {
  return MENTORES_POR_PROGRAMA[programa] || VAZIO
}

export const ATUALIZADO_EM = meta.atualizadoEm ? new Date(meta.atualizadoEm) : null
