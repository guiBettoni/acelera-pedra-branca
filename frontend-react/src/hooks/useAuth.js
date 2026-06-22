import { useState, useCallback } from 'react'
import { apiLogin } from '../lib/api'

export default function useAuth() {
  const [isAdmin, setIsAdmin] = useState(
    () => Boolean(sessionStorage.getItem('admin_token'))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError('')
    try {
      const data = await apiLogin(email, password)
      sessionStorage.setItem('admin_token', data.token)
      setIsAdmin(true)
      return true
    } catch (e) {
      setError(e.message || 'Credenciais inválidas.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_token')
    setIsAdmin(false)
  }, [])

  return { isAdmin, login, logout, loading, error }
}
