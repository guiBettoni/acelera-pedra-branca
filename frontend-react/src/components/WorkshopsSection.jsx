import { useEffect, useRef } from 'react'
import useWorkshops from '../hooks/useWorkshops'

function wsStatus(dateStr, isNext) {
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr + 'T00:00:00')
  if (d < today) return { cls: 'done', badge: 'Realizado', badgeCls: 'past-badge' }
  if (d.getTime() === today.getTime()) return { cls: 'today', badge: 'Hoje', badgeCls: 'today-badge' }
  if (isNext) return { cls: 'next', badge: 'Próximo', badgeCls: 'next-badge' }
  return { cls: '', badge: 'Em breve', badgeCls: 'next-badge' }
}

export default function WorkshopsSection() {
  const ref = useRef(null)
  const { workshops, loading } = useWorkshops()

  useEffect(() => {
    window.toggleWs = function(el) {
      const isOpen = el.classList.contains('expanded')
      ref.current?.querySelectorAll('.ws-card.expanded').forEach(c => c.classList.remove('expanded'))
      if (!isOpen) el.classList.add('expanded')
    }
    return () => { delete window.toggleWs }
  }, [])

  if (loading) return null

  // Find first future/today workshop to mark as "next"
  const today = new Date(); today.setHours(0,0,0,0)
  const nextIdx = workshops.findIndex(w => new Date(w.dataWorkshop + 'T00:00:00') >= today)

  return (
    <section className="workshops-sec" id="workshops">
      <div className="si">
        <div className="sec-tag">Trilha Formativa</div>
        <h2 className="sec-h">O que você vai <em>aprender</em></h2>
        <p className="sec-sub">13 workshops de metodologia aplicada. Clique em cada workshop para ver o perfil do mentor.</p>
        <div className="ws-header-row">
          <span>#</span><span>Data</span><span>Tema</span><span>Mentor</span><span>Status</span><span></span>
        </div>
        <div className="ws-grid" ref={ref}>
          {workshops.map((w, i) => {
            const { cls, badge, badgeCls } = wsStatus(w.dataWorkshop, i === nextIdx)
            const numStr = String(w.num).padStart(2, '0')
            return (
              <div
                key={w.id}
                className={`ws-card${cls ? ' ' + cls : ''}`}
                onClick={e => window.toggleWs(e.currentTarget)}
                aria-label="Ver perfil do mentor"
                data-date={w.dataWorkshop}
              >
                <div className="ws-main">
                  <span className="ws-num">{numStr}</span>
                  <span className="ws-date-col">{w.dateDisplay}</span>
                  <span className="ws-title-col">{w.tema}</span>
                  <div className="ws-mentor-col">
                    {w.photoUrl
                      ? <img className="ws-mentor-thumb" src={w.photoUrl} alt={w.nomeMentor} />
                      : <span className="ws-mentor-thumb" style={{background:'rgba(255,255,255,.1)',borderRadius:'50%',display:'inline-block',width:32,height:32}} />
                    }
                    <span className="ws-mentor-name">{w.nomeMentor}</span>
                  </div>
                  <span className={`ws-badge ${badgeCls}`}>{badge}</span>
                  <div className="ws-expand-btn">›</div>
                </div>
                <div className="ws-bio-panel">
                  <div className="ws-bio-inner">
                    {w.photoUrl && <img className="ws-bio-photo" src={w.photoUrl} alt={w.nomeMentor} />}
                    <div className="ws-bio-content">
                      <div className="ws-bio-name">{w.nomeMentor}</div>
                      <div className="ws-bio-role">Mentor · {w.roleMentor}</div>
                      <div className="ws-bio-text">{w.bioMentor}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
