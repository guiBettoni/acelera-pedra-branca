import { mentoresDoPrograma } from '../lib/staticData'

export const STATUS_OPTIONS = [
  { value: 'aberta',   label: 'Aberta' },
  { value: 'fechada',  label: 'Fechada' },
  { value: 'em_breve', label: 'Em breve' },
]

export default function useMentores(programa = 'acelera') {
  return { mentores: mentoresDoPrograma(programa) }
}
