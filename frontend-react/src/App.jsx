import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Toast, { useToast } from './components/Toast'
import AccessibilityPanel from './components/AccessibilityPanel'
import HomePage from './pages/HomePage'
import RankingPage from './pages/RankingPage'
import AdminPage from './pages/AdminPage'

function getInitialPage() {
  const h = window.location.hash.replace('#', '')
  if (['home', 'ranking', 'admin'].includes(h)) return h
  return 'home'
}

export default function App() {
  const [page, setPage] = useState(getInitialPage)
  const { msg, visible, showToast } = useToast()

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
      if (['home', 'ranking', 'admin'].includes(h)) setPage(h)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <>
      <a href="#main-content" className="skip-link">Ir para o conteúdo principal</a>
      <Nav page={page} navigate={navigate} />
      <main id="main-content" tabIndex={-1}>
        {page === 'home'    && <HomePage navigate={navigate} />}
        {page === 'ranking' && <RankingPage />}
        {page === 'admin'   && <AdminPage showToast={showToast} />}
      </main>
      <AccessibilityPanel />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
