import useMentores from '../hooks/useMentores'
import { getInitials } from '../lib/utils'

function Initials({ nome }) {
  return <span className="mentor-ini">{getInitials(nome) || '?'}</span>
}

function MentorCard({ m, soon }) {
  return (
    <div className={`ment-card${soon ? ' ment-card--soon' : ''}`}>
      <div className="ment-card-top">
        <div className={`ment-avatar${soon ? ' ment-avatar--dim' : ''}`}>
          <Initials nome={m.nome} />
        </div>
        <div className="ment-info">
          <span className={`ment-tag${soon ? ' ment-tag--soon' : ''}`}>
            {soon ? 'Em breve' : 'Agenda aberta'}
          </span>
          <h2 className="ment-nome">{m.nome}</h2>
          {m.especialidade && <p className="ment-esp">{m.especialidade}</p>}
        </div>
      </div>

      {m.bio && <p className="ment-bio">{m.bio}</p>}

      {!soon && m.calendarUrl && (
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

export default function MentoriasPage() {
  const { mentores } = useMentores()
  const disponiveis = mentores.filter(m => m.disponivel)
  const brevemente  = mentores.filter(m => !m.disponivel)

  return (
    <div id="page-mentorias">
      <div className="ment-hero">
        <p className="sec-tag">Acelera Pedra Branca · Mentorias</p>
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
              {disponiveis.map(m => <MentorCard key={m.id} m={m} soon={false} />)}
            </div>
          )}
        </div>
      </div>

      {brevemente.length > 0 && (
        <div className="ment-section ment-section--dim">
          <div className="si">
            <p className="sec-tag" style={{ marginBottom: '1.5rem' }}>Em breve</p>
            <div className="ment-grid">
              {brevemente.map(m => <MentorCard key={m.id} m={m} soon={true} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
