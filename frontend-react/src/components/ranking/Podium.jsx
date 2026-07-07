const CFG = {
  1: { personaW: 198, personaH: 316, badge: '🥇 1º Lugar' },
  2: { personaW: 200, personaH: 200, badge: '🥈 2º Lugar' },
  3: { personaW: 250, personaH: 196, badge: '🥉 3º Lugar' },
}

function Persona({ startup }) {
  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: startup.foto ? 'cover' : 'contain',
    borderRadius: startup.foto ? 28 : 0,
    filter: 'drop-shadow(0 18px 13px rgba(0,0,0,.35)) drop-shadow(0 0 14px rgba(96,196,216,.18))',
    transform: 'translateZ(0)',
    opacity: 0.98,
  }

  if (startup.persona) {
    return <img src={startup.persona} alt="" style={imgStyle} />
  }

  if (startup.foto) {
    return <img src={startup.foto} alt="" style={imgStyle} />
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,.35)',
          background:
            'radial-gradient(circle at 50% 40%, rgba(96,196,216,.18) 0%, rgba(255,255,255,.06) 35%, rgba(0,0,0,0) 72%)',
          boxShadow:
            'inset 0 0 0 1px rgba(255,255,255,.08), 0 0 26px rgba(96,196,216,.18)',
          color: '#fff',
          fontWeight: 900,
          fontSize: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {startup.name?.trim()?.slice(0, 1).toUpperCase() || 'A'}
      </div>
    </div>
  )
}

function PodCard({ startup, rank }) {
  const config = CFG[rank]
  const pts = startup.pts || 0

  // aparência por rank (teal/dark)
  const rankAccent = rank === 1 ? '#F5C842' : rank === 2 ? '#B0C8CC' : '#FA8400'
  const rankPts = rank === 1 ? '#F5C842' : rank === 2 ? '#DCE8EA' : '#FF9B26'

  return (
    <div
      className={`rk3d-pod rk3d-pod-${rank}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: 260,
        zIndex: 2,
      }}
    >
      {/* fumaça surgindo (fundo) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: rank === 1 ? 240 : 220,
          height: rank === 1 ? 360 : 320,
          borderRadius: '50%',
          background:
            `radial-gradient(55% 45% at 50% 55%, color-mix(in srgb, ${rankAccent} 22%, transparent) 0%, rgba(255,255,255,.06) 26%, transparent 60%)`,
          filter: 'blur(26px) saturate(1.1)',
          opacity: 0.95,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* copy (badge/nome/pts) */}
      <div
        className="rk3d-pod-copy"
        style={{
          position: 'relative',
          zIndex: 5,
          textAlign: 'center',
          marginBottom: 8,
          paddingTop: 6,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: rankAccent,
            fontWeight: 800,
            letterSpacing: '.06em',
            textTransform: 'uppercase',
          }}
        >
          {config.badge}
        </div>

        <div
          style={{
            fontSize: 17 + (rank === 1 ? 4 : 0),
            fontWeight: 900,
            letterSpacing: '-.01em',
            lineHeight: 1.15,
            marginTop: 2,
          }}
        >
          {startup.name}
        </div>

        <div
          style={{
            fontSize: rank === 1 ? 30 : rank === 2 ? 24 : 22,
            color: rankPts,
            fontWeight: 900,
            lineHeight: 1,
            marginTop: 3,
          }}
        >
          {pts}
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'rgba(255,255,255,.55)',
              marginLeft: 6,
            }}
          >
            pts
          </span>
        </div>
      </div>

      {/* personagem + "surgindo" + "fumacinha" embaixo */}
      <div
        className="rk3d-persona"
        style={{
          width: config.personaW,
          height: config.personaH,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* sombra / mancha (opaca) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -10,
            transform: 'translateX(-50%)',
            width: rank === 1 ? 190 : rank === 2 ? 170 : 185,
            height: rank === 1 ? 52 : 46,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,.55) 0%, rgba(0,0,0,.22) 35%, transparent 70%)',
            filter: 'blur(2px)',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        />

        {/* fumacinha de máquina de fumaça (mais "bottom" e com tom teal) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -26,
            transform: 'translateX(-50%)',
            width: rank === 1 ? 210 : 190,
            height: rank === 1 ? 86 : 76,
            borderRadius: '50%',
            background:
              `radial-gradient(ellipse at 50% 60%, rgba(96,196,216,.35) 0%, rgba(96,196,216,.14) 30%, transparent 68%),
               radial-gradient(ellipse at 50% 45%, color-mix(in srgb, ${rankAccent} 18%, transparent) 0%, transparent 55%)`,
            filter: 'blur(10px) saturate(1.25)',
            opacity: 0.95,
            pointerEvents: 'none',
          }}
        />

        {/* personagem */}
        <Persona startup={startup} />
      </div>
    </div>
  )
}

export default function Podium({ top3 }) {
  if (!top3?.length) return null

  const order = top3.length >= 3 ? [2, 1, 3] : top3.length === 2 ? [2, 1] : [1]

  return (
    <div className="rk3d-podium" id="podium-area" role="list" aria-label="Pódio - top 3 startups">
      {order.map((rank) => {
        const startup = top3[rank - 1]
        if (!startup) return null
        return (
          <div key={startup.id} role="listitem" aria-label={`${rank}º lugar: ${startup.name}, ${startup.pts || 0} pontos`}>
            <PodCard startup={startup} rank={rank} />
          </div>
        )
      })}
    </div>
  )
}
