import { getLevel, getInitials } from '../../lib/utils'

const MEDALS = [
  { m: '🥇', cls: 'p1', pos: '1º lugar' },
  { m: '🥈', cls: 'p2', pos: '2º lugar' },
  { m: '🥉', cls: 'p3', pos: '3º lugar' },
]

export default function Podium({ top3 }) {
  if (!top3.length) return null

  // visual order: 2nd, 1st, 3rd
  const vis   = top3.length >= 2 ? [top3[1], top3[0], top3[2]].filter(Boolean) : top3
  const mvis  = top3.length >= 2 ? [MEDALS[1], MEDALS[0], MEDALS[2]].filter(Boolean) : MEDALS

  return (
    <div className="podium" id="podium-area">
      {vis.map((s, i) => {
        const mi  = mvis[i]
        const lv  = getLevel(s.pts || 0)
        const ini = getInitials(s.name)
        const rn  = mi.cls === 'p1' ? '1' : mi.cls === 'p2' ? '2' : '3'

        return (
          <div key={s.id} className={`pod ${mi.cls}`}>
            <div className="pod-rank-num">{rn}</div>
            <div className="pod-shield">
              <div className="pod-ico">{mi.m}</div>
              <div className="pod-av-wrap">
                <div className="rav-ini">{ini}</div>
                {s.foto && <img src={s.foto} className="rav-img" alt="" />}
              </div>
              <div className="pod-nm">{s.name}</div>
              <div className="pod-area-s">{s.area}</div>
              <div className="pod-ptsrow">
                <span className="pod-ptsn">{s.pts || 0}</span>
                <span className="pod-ptsl">pts</span>
              </div>
              <div className={`pod-lvb`}>{lv.n}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
