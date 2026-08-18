import { useEffect } from 'react'

export default function TecnovaPage({ navigate }) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Tecnova III'
    return () => { document.title = prevTitle }
  }, [])

  return (
    <div id="page-tecnova" className="tecnova-standalone">
      <header className="tecnova-bar">
        <span className="tecnova-brand">INAITEC · Tecnova III</span>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div className="ment-hero">
          <p className="sec-tag">Tecnova III · Programa de Aceleração INAITEC</p>
          <h1 className="ment-title">
            Fortalecendo o impacto<br />
            <em>de soluções inovadoras</em>
          </h1>
          <p className="ment-sub">
            O Tecnova III é a edição atual do Programa de Aceleração INAITEC: uma trilha
            formativa de 8 workshops — sempre online, com gravação disponível — somada a
            mentorias individuais 1-to-1, construídas a partir do Plano de Desenvolvimento
            Individual de cada negócio.
          </p>
          <p className="ment-sub" style={{ marginTop: '1rem' }}>
            O objetivo das mentorias é simples: conectar cada empresa aos especialistas certos
            para as áreas que mais importam pro seu momento — do diagnóstico ao Demoday de
            encerramento.
          </p>
        </div>

        <div className="ment-section tecnova-cta-section">
          <div className="si">
            <button className="ment-btn" onClick={() => navigate('mentorias-tecnova')}>
              Ver mentores e agendar sessão →
            </button>
          </div>
        </div>
      </main>

      <footer className="tecnova-bar tecnova-bar--footer">
        <span className="tecnova-brand">Programa Tecnova III — INAITEC</span>
      </footer>
    </div>
  )
}
