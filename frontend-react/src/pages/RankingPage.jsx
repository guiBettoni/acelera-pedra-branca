import { useEffect, useMemo } from 'react'
import useStartups from '../hooks/useStartups'
import { RKPAL } from '../lib/utils'
import Podium from '../components/ranking/Podium'
import RankingCard from '../components/ranking/RankingCard'

export default function RankingPage() {
  const { startups, logs, loading, lastUpdated, refresh } = useStartups({ autoRefresh: true })

  // auto refresh on mount
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

      {/* decorative clouds */}
      <div className="rk-clouds" aria-hidden="true">
        <div className="rk-cloud lg" style={{ top: '3%', left: '-2%', animation: 'cloud-drift-a 8s ease-in-out infinite' }} />
        <div className="rk-cloud" style={{ top: '6%', right: '3%', animation: 'cloud-drift-b 11s ease-in-out infinite 1.5s' }} />
        <div className="rk-cloud sm" style={{ top: '1.5%', left: '30%', animation: 'cloud-drift-c 9s ease-in-out infinite 2.5s' }} />
        <div className="rk-cloud sm" style={{ top: '11%', right: '20%', animation: 'cloud-drift-a 12s ease-in-out infinite 3.5s' }} />
        <div className="rk-cloud lg" style={{ bottom: '6%', right: '-1%', animation: 'cloud-drift-b 10s ease-in-out infinite 2s', opacity: 0.35 }} />
        <div className="rk-cloud" style={{ bottom: '16%', left: '1%', animation: 'cloud-drift-c 13s ease-in-out infinite 4s', opacity: 0.3 }} />
      </div>

      <div className="rk-header">
        <div className="rk-header-top">
          <div>
            <div className="rk-eyebrow">Acelera Pedra Branca · 5ª Edição</div>
            <h2 className="rk-title">Ranking<br /><em>ao vivo</em></h2>
          </div>
          <div className="live">
            <span className="live-d" />
            {lastUpdated ? 'Atualizado' : 'Conectando...'}
          </div>
        </div>
      </div>

      <Podium top3={top3} />

      <div id="race-area">
        {loading && (
          <div className="empty" style={{ padding: '2rem', textAlign: 'center' }}>
            Carregando ranking...
          </div>
        )}
        {!loading && startups.length === 0 && (
          <div className="empty">Nenhuma startup cadastrada ainda.</div>
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
  )
}
