import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Toast, { useToast } from './components/Toast'
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

  function navigate(p) {
    setPage(p)
    window.location.hash = p
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <Nav page={page} navigate={navigate} />
      <main id="main-content">
        {page === 'home'    && <HomePage navigate={navigate} />}
        {page === 'ranking' && <RankingPage />}
        {page === 'admin'   && <AdminPage showToast={showToast} />}
      </main>
      <Toast msg={msg} visible={visible} />
    </>
  )
}
