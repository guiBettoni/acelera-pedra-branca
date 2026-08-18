import { useState, useEffect } from 'react'
import { BACKEND_URL } from './lib/utils'
import Nav from './components/Nav'
import Footer from './components/Footer'
import Toast, { useToast } from './components/Toast'
import AccessibilityPanel from './components/AccessibilityPanel'
import HomePage from './pages/HomePage'
import RankingPage from './pages/RankingPage'
import AdminPage from './pages/AdminPage'
import MentoriasPage from './pages/MentoriasPage'
import MentoriasTecnovaPage from './pages/MentoriasTecnovaPage'

const PAGES = ['home', 'ranking', 'admin', 'mentorias', 'tecnova']

function getInitialPage() {
  const h = window.location.hash.replace('#', '')
  if (PAGES.includes(h)) return h
  return 'home'
}

export default function App() {
  const [page, setPage] = useState(getInitialPage)
  const { msg, visible, showToast } = useToast()

  // Acorda o backend Render silenciosamente no carregamento
  useEffect(() => { fetch(`${BACKEND_URL}/api/ping`).catch(() => {}) }, [])

  function navigate(p, scrollTop = true) {
    setPage(p)
    window.location.hash = p
    if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' })
    // move o foco para o conteúdo principal ao navegar (leitores de tela)
    setTimeout(() => document.getElementById('main-content')?.focus(), 80)
  }

  useEffect(() => {
    function onHashChange() {
      const h = window.location.hash.replace('#', '')
      if (PAGES.includes(h)) setPage(h)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (page === 'tecnova') {
    return <MentoriasTecnovaPage />
  }

  return (
    <>
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <Nav page={page} navigate={navigate} />
      <main id="main-content" tabIndex={-1}>
        {page === 'home'      && <HomePage navigate={navigate} />}
        {page === 'ranking'   && <RankingPage />}
        {page === 'admin'     && <AdminPage showToast={showToast} />}
        {page === 'mentorias' && <MentoriasPage />}
      </main>
      <Footer navigate={navigate} />
      <AccessibilityPanel />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
