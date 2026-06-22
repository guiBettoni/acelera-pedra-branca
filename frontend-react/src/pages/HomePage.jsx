import { useEffect, useRef, useMemo } from 'react'
import useStartups from '../hooks/useStartups'
import { getLevel, getInitials, RKPAL } from '../lib/utils'

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

  const totalPts = useMemo(
    () => startups.reduce((s, x) => s + (x.pts || 0), 0),
    [startups]
  )

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
      <section className="hero" id="hero" ref={heroRef}>
        <div className="parallax-bg" id="parallax-bg" />
        <div className="parallax-overlay" />
        <div className="hero-grid" id="hero-grid" />
        <div className="hero-glow">
          <div className="hero-glow-inner" ref={glowRef} id="hero-glow-inner" />
          <div className="hero-spotlight" ref={spotRef} id="hero-spotlight" />
        </div>
        <div className="hero-pill"><span className="pill-dot" />5ª Edição · 2026</div>
        <h1>Acelera<span className="hi"> Pedra Branca</span></h1>
        <p className="hero-sub">
          Acompanhe em tempo real a evolução das startups que estão transformando Pedra Branca no hub de inovação do Sul do Brasil.
        </p>
        <div className="hero-btns">
          <button className="btn-p" onClick={() => navigate('ranking')}>Ver Ranking →</button>
          <button className="btn-o" onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}>
            Sobre o programa
          </button>
        </div>
        <div className="hero-nums">
          <div>
            <div className="hnum-v">{loading ? '—' : startups.length || 15}</div>
            <div className="hnum-l">Startups</div>
          </div>
          <div>
            <div className="hnum-v">{daysUntil(DEMODAY)}</div>
            <div className="hnum-l">Dias para o Demoday</div>
          </div>
          <div>
            <div className="hnum-v">{loading ? '—' : totalPts}</div>
            <div className="hnum-l">Pontos lançados</div>
          </div>
          <div>
            <div className="hnum-v">15</div>
            <div className="hnum-l">Anos INAITEC</div>
          </div>
        </div>
      </section>

      {/* ── SOBRE ── */}
      <section className="sobre" id="sobre">
        <div className="si">
          <div className="sec-tag">Sobre a Gamificação</div>
          <h2 className="sec-h">Competição com<br /><em>propósito e método</em></h2>
          <p className="sec-sub">
            O Acelera Pedra Branca transforma a jornada de aceleração em uma <strong>corrida de pontos</strong> — cada workshop concluído, mentoria registrada e entrega realizada vale pontos que movem sua startup no ranking em tempo real. A gamificação não é um detalhe: é o motor que mantém o engajamento, premia a consistência e torna o aprendizado mais divertido.
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
      <section className="crono-sec" id="cronograma">
        <div className="si">
          <div className="sec-tag">Cronograma</div>
          <h2 className="sec-h">Etapas da <em>5ª Edição</em></h2>
          <div className="crono-h-track">
            <div className="crono-h-inner" id="cronoInner">
              {[
                { title: 'Inscrições', done: true },
                { title: 'Pré-Seleção', done: true },
                { title: 'Bootcamp', sub: 'Kickoff · City Lab', done: true },
                { title: 'Aceleração', sub: 'Trilha + Mentorias', active: true },
                { title: 'Demo Day', date: '23 · 07 · 2026', finish: true },
              ].map((step, i) => (
                <div key={i} className={`crono-h-item${step.done ? ' done' : ''}${step.active ? ' active' : ''}${step.finish ? ' finish' : ''}`}>
                  <div className="crono-h-dot" />
                  <div className="crono-h-body">
                    <div className="crono-h-title">{step.title}</div>
                    {step.sub  && <div className="crono-h-sub">{step.sub}</div>}
                    {step.date && <div className="crono-h-date">{step.date}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STARTUPS CHIPS ── */}
      <section className="startups-sec" id="startups">
        <div className="si">
          <div className="sec-tag">Startups</div>
          <h2 className="sec-h">As empresas da <em>5ª Edição</em></h2>
          <div className="startups-chips" id="startups-chips">
            {loading && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Carregando...</span>}
            {!loading && startups.map((s, i) => {
              const lv  = getLevel(s.pts || 0)
              const ini = getInitials(s.name)
              const col = RKPAL[i % RKPAL.length]
              return (
                <div key={s.id} className="sc-chip" onClick={() => navigate('ranking')}>
                  <div className="sc-av" style={{ background: col }}>
                    <div className="sc-ini">{ini}</div>
                    {s.foto && <img src={s.foto} className="sc-img" alt="" />}
                  </div>
                  <div className="sc-info">
                    <div className="sc-name">{s.name}</div>
                    <span className={`rlv ${lv.c}`}>{lv.n}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── WORKSHOPS ── */}
      <section className="workshops-sec" id="workshops">
        <div className="si">
          <div className="sec-tag">Trilha de Workshops</div>
          <h2 className="sec-h">Aprenda, construa e <em>acelere</em></h2>
          <p className="sec-sub" style={{ marginBottom: '2rem' }}>
            A trilha do Acelera Pedra Branca combina workshops práticos, mentorias especializadas e desafios de execução para levar sua startup do zero à tração.
          </p>
          <div className="workshops-cta" style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button className="btn-p" onClick={() => navigate('ranking')}>
              Ver ranking atual →
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}
