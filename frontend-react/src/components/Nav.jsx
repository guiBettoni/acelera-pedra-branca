import { useState, useEffect } from 'react'
import logoSrc from '/logo.png'

export default function Nav({ page, navigate }) {
  const [open, setOpen] = useState(false)
  const [activeNav, setActiveNav] = useState(page)

  useEffect(() => {
    function onScroll() {
      const nav = document.getElementById('main-nav')
      if (nav) nav.classList.toggle('nav-scrolled', window.scrollY > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function go(p, e) {
    e?.preventDefault()
    navigate(p)
    setActiveNav(p)
    setOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goSection(p, hash) {
    const needsPageChange = page !== p
    navigate(p, false)
    setActiveNav(hash)
    setOpen(false)
    setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    }, needsPageChange ? 80 : 0)
  }

  return (
    <nav id="main-nav" role="navigation" aria-label="Navegação principal">
      <button
        className="nav-logo"
        onClick={e => go('home', e)}
        aria-label="Acelera Pedra Branca — voltar ao início"
      >
        <img src={logoSrc} alt="Acelera Pedra Branca" style={{ height: 46, width: 'auto', display: 'block' }} />
      </button>

      <div
        className={`nav-center${open ? ' open' : ''}`}
        id="nav-center"
        role="menubar"
        aria-label="Menu principal"
      >
        <a className={`nav-btn${activeNav === 'home' ? ' on' : ''}`} href="#home" onClick={e => go('home', e)} aria-current={activeNav === 'home' ? 'page' : undefined} role="menuitem">
          Início
        </a>
        <a className={`nav-btn${activeNav === 'sobre' ? ' on' : ''}`} href="#sobre" onClick={e => { e.preventDefault(); goSection('home', 'sobre') }} role="menuitem">
          Programa
        </a>
        <a className={`nav-btn${activeNav === 'cronograma' ? ' on' : ''}`} href="#cronograma" onClick={e => { e.preventDefault(); goSection('home', 'cronograma') }} role="menuitem">
          Cronograma
        </a>
        <a className={`nav-btn${activeNav === 'workshops' ? ' on' : ''}`} href="#workshops" onClick={e => { e.preventDefault(); goSection('home', 'workshops') }} role="menuitem">
          Trilha
        </a>
        <a className={`nav-btn${activeNav === 'ranking' ? ' on' : ''}`} href="#ranking" onClick={e => go('ranking', e)} aria-current={activeNav === 'ranking' ? 'page' : undefined} role="menuitem">
          Ranking
        </a>
        <button className="nav-cta" onClick={() => { navigate('admin'); setActiveNav('admin'); setOpen(false) }} role="menuitem">
          Painel Admin →
        </button>
      </div>

      <button
        className={`nav-hamburger${open ? ' open' : ''}`}
        id="nav-hamburger"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        aria-expanded={open}
        aria-controls="nav-center"
      >
        <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
      </button>
    </nav>
  )
}
