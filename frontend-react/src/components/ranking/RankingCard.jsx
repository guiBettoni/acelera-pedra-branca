import { getLevel } from '../../lib/utils'

const LV_COLORS = {
  Elite: '#F5C842',
  Destaque: '#F5C842',
  Acelerador: '#FA8400',
  Construtor: '#00C08B',
  Explorador: '#B0C8CC',
}

export default function RankingCard({ startup, index, accentColor }) {
  const pts = startup.pts || 0
  const maxPts = startup.maxPts || 0
  const level = getLevel(pts)
  const rank = index + 1
  const barPct = maxPts > 0 ? Math.max(Math.round((pts / maxPts) * 100), pts > 0 ? 4 : 0) : 0
  const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank

  return (
    <div
      className={`rrow rk3d-row${index === 0 ? ' rrow--first' : ''}`}
      role="listitem"
      aria-label={`${rank}º lugar: ${startup.name}, ${pts} pontos, nível ${level.n}`}
    >
      <div className="rk3d-rank" style={{ color: rank <= 3 ? '#fff' : 'rgba(255,255,255,.4)' }}>
        {rankLabel}
      </div>

      <div className="rk3d-avatar" style={{ background: `linear-gradient(135deg, ${accentColor}, #FA8400)` }}>
        {startup.foto && <img src={startup.foto} alt="" />}
      </div>

      <div className="rk3d-info">
        <div className="rk3d-name">{startup.name}</div>
        <div className="rk3d-area">{startup.area}</div>
      </div>

      <div className="rk3d-track" aria-hidden="true">
        <div className="rk3d-bar" style={{ width: `${barPct}%` }} />
      </div>

      <div className="rk3d-score">
        <div className="rk3d-pts" style={{ color: rank === 1 ? '#F5C842' : '#fff' }}>
          {pts}
        </div>
        <div className="rk3d-level" style={{ color: LV_COLORS[level.n] || 'rgba(255,255,255,.5)' }}>
          {level.n}
        </div>
      </div>
    </div>
  )
}
