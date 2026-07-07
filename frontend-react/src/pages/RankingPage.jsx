import { useEffect, useMemo } from 'react'
import useStartups from '../hooks/useStartups'
import { RKPAL } from '../lib/utils'
import Podium from '../components/ranking/Podium'
import RankingCard from '../components/ranking/RankingCard'

const PERSONAS = [
  { match: 'delia', src: '/personas/delia.png' },
  { match: 'pdv fluxo', src: '/personas/janser.png' },
  { match: 'izitag', src: '/personas/izitag.png' },
]

function normalizeName(name) {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function personaFor(startup) {
  const normalized = normalizeName(startup.name)
  return PERSONAS.find((persona) => normalized.includes(persona.match))?.src
}

export default function RankingPage() {
  const { startups, loading, lastUpdated, refresh } = useStartups({ autoRefresh: true })

  useEffect(() => { refresh() }, [refresh])

  const maxPts = startups[0]?.pts || 0
  const startupsWithMax = useMemo(
    () => startups.map((startup) => ({ ...startup, maxPts, persona: personaFor(startup) })),
    [startups, maxPts]
  )
  const top3 = startupsWithMax.slice(0, 3)

  return (
    <div id="page-ranking" className="page on rk3d-page" style={{ position: 'relative' }}>
      <div className="rk-header rk3d-header">
        <div className="rk-header-top">
          <div>
            <div className="rk-eyebrow" aria-hidden="true">Acelera Pedra Branca · 5ª Edição</div>
            <h1 className="rk-title">Ranking <em>ao vivo</em></h1>
          </div>
          <div
            className="live"
            role="status"
            aria-live="polite"
            aria-label={lastUpdated ? `Ranking atualizado às ${lastUpdated.toLocaleTimeString('pt-BR')}` : 'Conectando ao ranking...'}
          >
            <span className="live-d" aria-hidden="true" />
            {lastUpdated ? 'Atualizado' : 'Conectando...'}
          </div>
        </div>
      </div>

      <div className="rk-body rk3d-body">
        <Podium top3={top3} />

        <div className="rk3d-list-head">
          <div>Classificação completa</div>
          <span>{loading ? '...' : `${startups.length} startups`}</span>
        </div>

        <div
          className="race rk3d-list"
          id="race-area"
          role="list"
          aria-label="Ranking completo de startups"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading && (
            <div className="empty" role="status" style={{ padding: '2rem', textAlign: 'center' }}>
              Carregando ranking...
            </div>
          )}
          {!loading && startups.length === 0 && (
            <div className="empty" role="status">Nenhuma startup cadastrada ainda.</div>
          )}
          {!loading && startupsWithMax.map((startup, index) => (
            <RankingCard
              key={startup.id}
              startup={startup}
              index={index}
              accentColor={RKPAL[index % RKPAL.length]}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
