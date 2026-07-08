import { useState } from 'react'
import { getLevel, getInitials, scoreBreakdown } from '../../lib/utils'

const LV_COLORS = {
  Elite: '#F5C842',
  Destaque: '#F5C842',
  Acelerador: '#FA8400',
  Construtor: '#00C08B',
  Explorador: '#B0C8CC',
}

export default function RankingCard({ startup, index, accentColor }) {
  const [open, setOpen] = useState(false)
  const pts = startup.pts || 0
  const maxPts = startup.maxPts || 0
  const level = getLevel(pts)
  const rank = index + 1
  const barPct = maxPts > 0 ? Math.max(Math.round((pts / maxPts) * 100), pts > 0 ? 4 : 0) : 0
  const rankLabel = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank
  const groups = scoreBreakdown(startup)

  return (
    <div
      className={`rrow rk3d-row${index === 0 ? ' rrow--first' : ''}${open ? ' expanded' : ''}`}
      role="listitem"
      aria-label={`${rank}º lugar: ${startup.name}, ${pts} pontos, nível ${level.n}`}
    >
      <button
        type="button"
        className="rk3d-row-summary"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="rk3d-rank" style={{ color: rank <= 3 ? '#fff' : 'rgba(255,255,255,.4)' }}>
          {rankLabel}
        </div>

        <div className="rk3d-avatar" style={{ background: `linear-gradient(135deg, ${accentColor}, #FA8400)` }}>
          {startup.foto && <img src={startup.foto} alt="" />}
          {!startup.foto && <span>{getInitials(startup.name)}</span>}
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

        <div className="rk3d-chev" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <div className="rk3d-detail">
        <div className="rk3d-detail-inner">
          <div className="rk3d-detail-box">
            <div className="rk3d-detail-head">
              <span>Detalhamento da pontuação</span>
              <span>= {pts} pts</span>
            </div>
            {groups.map(g => (
              <div className="rk3d-cat" key={g.key}>
                <div className="rk3d-cat-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="rk3d-cat-dot" style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
                    <span className="rk3d-cat-name" style={{ color: g.color }}>{g.key}</span>
                  </div>
                  <span className="rk3d-cat-sub">{g.subtotal} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
