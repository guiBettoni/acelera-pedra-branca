import { useEffect, useMemo } from 'react'
import useStartups from '../hooks/useStartups'
import { RKPAL } from '../lib/utils'
import Podium from '../components/ranking/Podium'
import RankingCard from '../components/ranking/RankingCard'

export default function RankingPage({ navigate }) {
  const { startups, logs, loading, lastUpdated, refresh } = useStartups({ autoRefresh: true })

  useEffect(() => { refresh() }, [refresh])

  const catBySid = useMemo(() => {
    const map = {}
    logs.forEach(l => {
      const sid = l.sid
      const cat = l.cat || 'Manual'
      if (!map[sid]) map[sid] = {}
      map[sid][cat] = (map[sid][cat] || 0) + (l.pts || 0)
    })
    return map
  }, [logs])

  const maxPts = startups[0]?.pts || 0
  const startupsWithMax = useMemo(
    () => startups.map(s => ({ ...s, maxPts })),
    [startups, maxPts]
  )
  const top3 = startupsWithMax.slice(0, 3)

  return (
    <div id="page-ranking" className="page on" style={{ position: 'relative' }}>

<div className="rk-header">
        <div className="rk-header-top">
          <div>
            <div className="rk-eyebrow" aria-hidden="true">Acelera Pedra Branca · 5ª Edição</div>
            <h2 className="rk-title">Ranking <em>ao vivo</em></h2>
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

      {/* rk-body limita a largura máxima — max-width: 860px centrado */}
      <div className="rk-body">
        <Podium top3={top3} />

        <div
          className="race"
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
          {!loading && startupsWithMax.map((s, i) => (
            <RankingCard
              key={s.id}
              startup={s}
              index={i}
              accentColor={RKPAL[i % RKPAL.length]}
              catBySid={catBySid}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
