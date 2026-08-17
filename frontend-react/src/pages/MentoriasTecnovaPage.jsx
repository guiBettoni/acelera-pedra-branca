import { useEffect } from 'react'
import useMentores from '../hooks/useMentores'
import { getInitials } from '../lib/utils'

function Initials({ nome }) {
  return <span className="mentor-ini">{getInitials(nome) || '?'}</span>
}

const TAG_LABEL = { aberta: 'Agenda aberta', fechada: 'Fechada', em_breve: 'Em breve' }

function MentorCard({ m }) {
  const inactive = m.status !== 'aberta'
  return (
    <div className={`ment-card${inactive ? ' ment-card--soon' : ''}`}>
      <div className="ment-card-top">
        <div className={`ment-avatar${inactive ? ' ment-avatar--dim' : ''}`}>
          {m.photoUrl
            ? <img src={m.photoUrl} alt={m.nome} className="ment-avatar-img" />
            : <Initials nome={m.nome} />
          }
        </div>
        <div className="ment-info">
          <span className={`ment-tag${inactive ? ' ment-tag--soon' : ''}`}>
            {TAG_LABEL[m.status] ?? 'Em breve'}
          </span>
          <h2 className="ment-nome">{m.nome}</h2>
          {m.especialidade && <p className="ment-esp">{m.especialidade}</p>}
        </div>
      </div>

      {m.bio && <p className="ment-bio">{m.bio}</p>}

      {m.status === 'aberta' && m.calendarUrl && (
        <a
          className="ment-btn"
          href={m.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Agendar mentoria com ${m.nome}`}
        >
          Agendar horário →
        </a>
      )}
    </div>
  )
}

export default function MentoriasTecnovaPage() {
  const { mentores } = useMentores('tecnova')

  useEffect(() => {
    const prevTitle = document.title
    document.title = 'Mentorias Tecnova'
    return () => { document.title = prevTitle }
  }, [])
  const disponiveis = mentores.filter(m => m.status === 'aberta')
  const emBreve     = mentores.filter(m => m.status === 'em_breve')
  const fechadas    = mentores.filter(m => m.status === 'fechada')

  return (
    <div id="page-mentorias-tecnova" className="tecnova-standalone">
      <header className="tecnova-bar">
        <span className="tecnova-brand">INAITEC · Tecnova III</span>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div className="ment-hero">
          <p className="sec-tag">Tecnova III · Mentorias</p>
          <h1 className="ment-title">
            Conecte-se com quem<br />
            <em>já percorreu esse caminho</em>
          </h1>
          <p className="ment-sub">
            Sessões individuais de 1 hora, one-on-one.
            Quando um mentor abre sua agenda, o horário aparece aqui — é só escolher e confirmar.
          </p>
        </div>

        <div className="ment-section">
          <div className="si">
            {disponiveis.length === 0 ? (
              <div className="ment-empty">
                <p>Nenhuma agenda aberta no momento. Em breve novos horários.</p>
              </div>
            ) : (
              <div className="ment-grid">
                {disponiveis.map(m => <MentorCard key={m.id} m={m} />)}
              </div>
            )}
          </div>
        </div>

        {emBreve.length > 0 && (
          <div className="ment-section ment-section--dim">
            <div className="si">
              <p className="sec-tag" style={{ marginBottom: '1.5rem' }}>Em breve</p>
              <div className="ment-grid">
                {emBreve.map(m => <MentorCard key={m.id} m={m} />)}
              </div>
            </div>
          </div>
        )}

        {fechadas.length > 0 && (
          <div className="ment-section ment-section--dim">
            <div className="si">
              <p className="sec-tag" style={{ marginBottom: '1.5rem' }}>Agenda encerrada</p>
              <div className="ment-grid">
                {fechadas.map(m => <MentorCard key={m.id} m={m} />)}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="tecnova-bar tecnova-bar--footer">
        <span className="tecnova-brand">Programa Tecnova III — INAITEC</span>
      </footer>
    </div>
  )
}
