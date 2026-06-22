import { useState } from 'react'
import logoSrc from '/logo.png'

export default function Nav({ page, navigate }) {
  const [open, setOpen] = useState(false)

  function go(p, e) {
    e?.preventDefault()
    navigate(p)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goSection(p, hash) {
    const needsPageChange = page !== p
    navigate(p, false)
    setOpen(false)
    setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    }, needsPageChange ? 80 : 0)
  }

  return (
    <nav id="main-nav">
      <button
        className="nav-logo"
        onClick={e => go('home', e)}
        aria-label="Acelera Pedra Branca — voltar ao início"
      >
        <img src={logoSrc} alt="Acelera Pedra Branca" style={{ height: 46, width: 'auto', display: 'block' }} />
      </button>

      <div className={`nav-center${open ? ' open' : ''}`} id="nav-center">
        <a className={`nav-btn${page === 'home' ? ' on' : ''}`} href="#home" onClick={e => go('home', e)}>
          Início
        </a>
        <a className="nav-btn" href="#sobre" onClick={e => { e.preventDefault(); goSection('home', 'sobre') }}>
          Programa
        </a>
        <a className="nav-btn" href="#cronograma" onClick={e => { e.preventDefault(); goSection('home', 'cronograma') }}>
          Cronograma
        </a>
        <a className="nav-btn" href="#workshops" onClick={e => { e.preventDefault(); goSection('home', 'workshops') }}>
          Trilha
        </a>
        <a className={`nav-btn${page === 'ranking' ? ' on' : ''}`} href="#ranking" onClick={e => go('ranking', e)}>
          Ranking
        </a>
        <button className="nav-cta" onClick={() => { navigate('admin'); setOpen(false) }}>
          Painel Admin →
        </button>
      </div>

      <button
        className={`nav-hamburger${open ? ' open' : ''}`}
        id="nav-hamburger"
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir menu de navegação"
      >
        <span /><span /><span />
      </button>
    </nav>
  )
}
