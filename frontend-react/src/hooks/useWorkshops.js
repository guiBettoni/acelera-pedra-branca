import { useState, useEffect, useCallback } from 'react'
import { fetchWorkshops, apiCreateWorkshop, apiUpdateWorkshop, apiDeleteWorkshop } from '../lib/api'

export default function useWorkshops() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await fetchWorkshops()
      setWorkshops(data)
    } catch {
      // keep empty array on error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function addWorkshop(data) {
    await apiCreateWorkshop(data)
    await load()
  }

  async function updateWorkshop(id, data) {
    await apiUpdateWorkshop(id, data)
    await load()
  }

  async function deleteWorkshop(id) {
    await apiDeleteWorkshop(id)
    await load()
  }

  return { workshops, loading, addWorkshop, updateWorkshop, deleteWorkshop }
}
