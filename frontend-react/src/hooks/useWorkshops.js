import { WORKSHOPS } from '../lib/staticData'

export default function useWorkshops() {
  return { workshops: WORKSHOPS, loading: false }
}
