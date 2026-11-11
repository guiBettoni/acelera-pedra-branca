import { STARTUPS, ATUALIZADO_EM } from '../lib/staticData'

// Dados estáticos: nada para recarregar.
function refresh() {}

export default function useStartups() {
  return {
    startups: STARTUPS,
    logs: [],
    loading: false,
    error: null,
    refresh,
    lastUpdated: ATUALIZADO_EM,
  }
}
