import { useState } from 'react'
import { getLevel, getInitials, CAT_DEFS } from '../../lib/utils'

export default function RankingCard({ startup, index, accentColor, catBySid }) {
  const [expanded, setExpanded] = useState(false)
  const s   = startup
  const pts = s.pts || 0
  const lv  = getLevel(pts)
  const ini = getInitials(s.name)
  const bw  = s.maxPts > 0 ? Math.max(Math.round(pts / s.maxPts * 100), pts > 0 ? 2 : 0) : 0

  const rankLabel =
    index === 0 ? '🥇' :
    index === 1 ? '🥈' :
    index === 2 ? '🥉' :
    <span className="rpos-n">{index + 1}</span>

  const sCats    = catBySid?.[s.id] || {}
  const rawTotal = CAT_DEFS.reduce((sum, c) => sum + Math.max(0, sCats[c.k] || 0), 0)
  const scale    = rawTotal > pts && rawTotal > 0 ? pts / rawTotal : 1

  const badges = [
    s.canvas_feito      && <span key="c" className="rbadge">Canvas</span>,
    s.entrevistas       && <span key="e" className="rbadge">Entrevistas</span>,
    s.mvp_funcional     && <span key="m" className="rbadge accent">MVP</span>,
    s.clientes_pagantes && <span key="p" className="rbadge gold">Cliente Pagante</span>,
  ].filter(Boolean)

  const hasStats = s.aulas > 0 || s.mentorias > 0 || badges.length > 0

  return (
    <div
      className={`rrow${index === 0 ? ' rrow--first' : ''}${expanded ? ' expanded' : ''}`}
      data-sid={s.id}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="rrow-main">
        <div className="rpos">{rankLabel}</div>

        <div className="rav" style={{ flexShrink: 0 }}>
          <div className="rav-ini" style={{ background: 'rgba(255,255,255,0.10)' }}>{ini}</div>
          {s.foto && <img src={s.foto} className="rav-img" alt="" />}
        </div>

        <div className="rinfo">
          <div className="rname">{s.name}</div>
          <div className="rmeta">{s.area}</div>
          {hasStats && (
            <div className="rrow-stats">
              {s.aulas > 0 && <span className="rstat">{s.aulas} aulas</span>}
              {s.mentorias > 0 && <span className="rstat">{s.mentorias} mentorias</span>}
              {badges}
            </div>
          )}
        </div>

        <div className="rtrack">
          <div className="rbar-bg">
            <div
              className="rbar"
              style={{
                width: `${bw}%`,
                background: 'rgba(255,255,255,0.30)',
              }}
            />
          </div>
        </div>

        <div className="rright">
          <div className="rpts">{pts}</div>
          <div className={`rlv ${lv.c}`}>{lv.n}</div>
        </div>

        <div className="rrow-chev">▾</div>
      </div>

      <div className="rrow-panel">
        <div className="rrow-cats">
          {pts > 0 ? CAT_DEFS.map(c => {
            const p = Math.round(Math.max(0, sCats[c.k] || 0) * scale)
            const w = pts > 0 ? Math.min(100, Math.round(p / pts * 100)) : 0
            return (
              <div key={c.k} className="rcat-item">
                <div className="rcat-lbl">{c.k}</div>
                <div className="rcat-bar-bg">
                  <div className="rcat-bar" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.28)' }} />
                </div>
                <div className="rcat-pts">{p || '—'}</div>
              </div>
            )
          }) : (
            <div className="rcat-empty">Nenhum ponto lançado ainda.</div>
          )}
        </div>
      </div>
    </div>
  )
}
