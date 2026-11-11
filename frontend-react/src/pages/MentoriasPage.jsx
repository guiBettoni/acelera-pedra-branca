import useMentores from '../hooks/useMentores'
import { getInitials } from '../lib/utils'
import { MENTOR_PHOTOS } from '../data/mentorPhotos'

function Initials({ nome }) {
  return <span className="mentor-ini">{getInitials(nome) || '?'}</span>
}

const TAG_LABEL = { aberta: 'Agenda aberta', fechada: 'Fechada', em_breve: 'Em breve' }

function MentorCard({ m, vitrine = false }) {
  const inactive = !vitrine && m.status !== 'aberta'
  const photo = m.photoUrl || MENTOR_PHOTOS[m.id] || null
  return (
    <div className={`ment-card${inactive ? ' ment-card--soon' : ''}`}>
      <div className="ment-card-top">
        <div className={`ment-avatar${inactive ? ' ment-avatar--dim' : ''}`}>
          {photo
            ? <img src={photo} alt={m.nome} className="ment-avatar-img" />
            : <Initials nome={m.nome} />
          }
        </div>
        <div className="ment-info">
          <span className={`ment-tag${inactive ? ' ment-tag--soon' : ''}`}>
            {vitrine ? 'Mentor · 5ª Edição' : (TAG_LABEL[m.status] ?? 'Em breve')}
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

export default function MentoriasPage() {
  const { mentores } = useMentores()
  const disponiveis = mentores.filter(m => m.status === 'aberta')
  const emBreve     = mentores.filter(m => m.status === 'em_breve')
  const fechadas    = mentores.filter(m => m.status === 'fechada')

  return (
    <div id="page-mentorias">
      <div className="ment-hero">
        <p className="sec-tag">Acelera Pedra Branca · Mentores</p>
        <h1 className="ment-title">
          Conheça quem<br />
          <em>guiou a 5ª edição</em>
        </h1>
        <p className="ment-sub">
          Sessões individuais de 1 hora, one-on-one, com os especialistas
          que acompanharam as startups da 5ª edição.
        </p>
      </div>

      <div className="ment-section">
        <div className="si">
          {disponiveis.length === 0 ? (
            <div className="ment-grid">
              {mentores.map(m => <MentorCard key={m.id} m={m} vitrine />)}
            </div>
          ) : (
            <div className="ment-grid">
              {disponiveis.map(m => <MentorCard key={m.id} m={m} soon={false} />)}
            </div>
          )}
        </div>
      </div>

      {disponiveis.length > 0 && emBreve.length > 0 && (
        <div className="ment-section ment-section--dim">
          <div className="si">
            <p className="sec-tag" style={{ marginBottom: '1.5rem' }}>Em breve</p>
            <div className="ment-grid">
              {emBreve.map(m => <MentorCard key={m.id} m={m} />)}
            </div>
          </div>
        </div>
      )}

      {disponiveis.length > 0 && fechadas.length > 0 && (
        <div className="ment-section ment-section--dim">
          <div className="si">
            <p className="sec-tag" style={{ marginBottom: '1.5rem' }}>Agenda encerrada</p>
            <div className="ment-grid">
              {fechadas.map(m => <MentorCard key={m.id} m={m} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
