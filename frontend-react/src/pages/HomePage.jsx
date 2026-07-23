import { useEffect, useRef, useMemo } from 'react'
import useStartups from '../hooks/useStartups'
import { getLevel, RKPAL } from '../lib/utils'
import WorkshopsSection from '../components/WorkshopsSection'

const DEMODAY = new Date('2026-07-23')

function daysUntil(date) {
  const diff = date - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}


export default function HomePage({ navigate }) {
  const heroRef = useRef(null)
  const glowRef = useRef(null)
  const spotRef = useRef(null)
  const { startups, loading } = useStartups()
  const daysLeft = daysUntil(DEMODAY)

  const totalPts = useMemo(
    () => startups.reduce((s, x) => s + (x.pts || 0), 0),
    [startups]
  )

  useEffect(() => {
    const bg = document.getElementById('parallax-bg')
    if (!bg) return
    let raf
    function onScroll() {
      if (raf) return
      raf = requestAnimationFrame(() => {
        bg.style.transform = `translateY(${window.scrollY * 0.35}px)`
        raf = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    const glow = glowRef.current
    const spot = spotRef.current
    if (!hero || !glow || !spot) return
    function onMove(e) {
      const r  = hero.getBoundingClientRect()
      const x  = e.clientX - r.left
      const y  = e.clientY - r.top
      glow.style.left    = x + 'px'
      glow.style.top     = y + 'px'
      spot.style.left    = x + 'px'
      spot.style.top     = y + 'px'
      glow.style.opacity = '1'
      spot.style.opacity = '1'
    }
    function onLeave() {
      glow.style.opacity = '0'
      spot.style.opacity = '0'
    }
    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div id="page-home" className="page on">

      {/* ── HERO ── */}
      <section className="hero" id="hero" ref={heroRef} aria-label="Apresentação do Acelera Pedra Branca">
        <div className="parallax-bg" id="parallax-bg" aria-hidden="true" />
        <div className="parallax-overlay" aria-hidden="true" />
        <div className="hero-grid" id="hero-grid" aria-hidden="true" />
        <div className="hero-glow" aria-hidden="true">
          <div className="hero-glow-inner" ref={glowRef} id="hero-glow-inner" />
          <div className="hero-spotlight" ref={spotRef} id="hero-spotlight" />
        </div>
        <div className="hero-pill" aria-hidden="true"><span className="pill-dot" />5ª Edição · 2026</div>

        <h1>Acelera<span className="hi"> Pedra Branca</span></h1>
        <p className="hero-sub">
          Acompanhe em tempo real a evolução das startups que estão transformando Pedra Branca no hub de inovação do Sul do Brasil.
        </p>
        <div className="hero-btns">
          <button className="btn-p" onClick={() => navigate('ranking')}>Ver Ranking</button>
          <button className="btn-o" onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}>
            Sobre o programa
          </button>
        </div>
        <dl className="hero-nums" aria-label="Números do programa">
          <div>
            <dt className="hnum-l">Startups</dt>
            <dd className="hnum-v">{loading ? '—' : startups.length || 15}</dd>
          </div>
          <div>
            <dt className="hnum-l">{daysLeft === 0 ? 'Demo Day' : 'Dias para o Demoday'}</dt>
            <dd className="hnum-v">{daysLeft === 0 ? 'Hoje 🎉' : daysLeft}</dd>
          </div>
          <div>
            <dt className="hnum-l">Pontos lançados</dt>
            <dd className="hnum-v">{loading ? '—' : totalPts}</dd>
          </div>
          <div>
            <dt className="hnum-l">Anos INAITEC</dt>
            <dd className="hnum-v">15</dd>
          </div>
        </dl>
      </section>

      {/* ── SOBRE ── */}
      <section className="sobre" id="sobre" aria-labelledby="sobre-heading">
        <div className="si">
          <div className="sec-tag">Sobre a Gamificação</div>
          <h2 className="sec-h" id="sobre-heading">Competição com<br /><em>propósito e método</em></h2>
          <p className="sec-sub">
            O Acelera Pedra Branca transforma a jornada de aceleração em uma <strong>corrida de pontos</strong> - cada workshop concluído, mentoria registrada e entrega realizada vale pontos que movem sua startup no ranking em tempo real. A gamificação não é um detalhe: é o motor que mantém o engajamento, premia a consistência e torna o aprendizado mais divertido.
          </p>
          <div className="pillars">
            <div className="pill-card">
              <div className="pill-ico">🏆</div>
              <div className="pill-t">Ranking em Tempo Real</div>
              <div className="pill-d">Sua startup sobe ou cai no placar a cada ação concluída. Transparência total entre os participantes durante toda a aceleração.</div>
            </div>
            <div className="pill-card">
              <div className="pill-ico">⭐</div>
              <div className="pill-t">Sistema de Pontuação</div>
              <div className="pill-d">Workshops presenciais, mentorias, entregas e participação em eventos geram pontos. Cada ação tem peso definido e publicado no edital.</div>
            </div>
            <div className="pill-card">
              <div className="pill-ico">🎖️</div>
              <div className="pill-t">Níveis e Conquistas</div>
              <div className="pill-d">Explorador → Construtor → Acelerador → Destaque → Elite. Cada nível desbloqueado traz benefícios e visibilidade no ecossistema.</div>
            </div>
            <div className="pill-card">
              <div className="pill-ico">🎯</div>
              <div className="pill-t">Demo Day · 23/07/2026</div>
              <div className="pill-d">As startups com maior pontuação ganham destaque na apresentação para investidores anjo, VCs e parceiros estratégicos.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CRONOGRAMA ── */}
      <section className="crono-sec" id="cronograma" aria-labelledby="crono-heading">
        <div className="si">
          <div className="sec-tag" aria-hidden="true">Cronograma</div>
          <h2 className="sec-h" id="crono-heading">Etapas da <em>5ª Edição</em></h2>
          <div className="crono-h-track">
            <ol className="crono-h-inner" id="cronoInner" aria-label="Etapas do programa">
              {[
                { title: 'Inscrições', done: true },
                { title: 'Pré-Seleção', done: true },
                { title: 'Bootcamp', sub: 'Kickoff · City Lab', done: true },
                { title: 'Aceleração', sub: 'Trilha + Mentorias', done: true },
                { title: 'Demo Day', date: '23 · 07 · 2026', finish: true },
              ].map((step, i) => {
                const state = step.active ? 'Em andamento' : step.done ? 'Concluído' : step.finish ? 'Evento final' : 'Pendente'
                return (
                  <li key={i} className={`crono-h-item${step.done ? ' done' : ''}${step.active ? ' active' : ''}${step.finish ? ' finish' : ''}`}
                    aria-label={`${step.title}${step.sub ? ` — ${step.sub}` : ''}${step.date ? ` — ${step.date}` : ''}: ${state}`}>
                    <div className="crono-h-dot" aria-hidden="true" />
                    <div className="crono-h-body">
                      <div className="crono-h-title">{step.title}</div>
                      {step.sub  && <div className="crono-h-sub">{step.sub}</div>}
                      {step.date && <div className="crono-h-date">{step.date}</div>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ── STARTUPS CHIPS ── */}
      <section className="startups-sec" id="startups" aria-labelledby="startups-heading">
        <div className="si">
          <div className="sec-tag" aria-hidden="true">Startups</div>
          <h2 className="sec-h" id="startups-heading">As empresas da <em>5ª Edição</em></h2>
          <div className="chips" id="startups-chips" role="list" aria-label="Startups participantes">
            {loading && <span role="status" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Carregando...</span>}
            {!loading && startups.map((s) => {
              const lv = getLevel(s.pts || 0)
              return (
                <div
                  key={s.id}
                  className="chip"
                  onClick={() => navigate('ranking')}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('ranking') } }}
                  role="listitem button"
                  tabIndex={0}
                  aria-label={`${s.name}, ${s.area}, estágio ${s.stage}, nível ${lv.n} — ver no ranking`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="chip-n">{s.name}</div>
                  <div className="chip-a">{s.area}</div>
                  <span className={`chip-s st${s.stage}`}>Est. {s.stage}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── WORKSHOPS (HTML original preservado) ── */}
      <WorkshopsSection />

      {/* ── CTA MENTORIAS ── */}
      <section className="mentoria-cta" aria-label="Agendar mentoria">
        <div className="si mentoria-cta-inner">
          <p className="sec-tag">Mentorias</p>
          <h2 className="mentoria-cta-h">
            Aprenda com quem<br /><em>já construiu</em>
          </h2>
          <p className="mentoria-cta-sub">
            Sessões one-on-one com os especialistas da trilha. Quando uma agenda abre, você escolhe e confirma.
          </p>
          <button className="btn-p mentoria-cta-btn" onClick={() => navigate('mentorias')}>
            Agendar mentoria →
          </button>
        </div>
      </section>

    </div>
  )
}
