export const RKPAL = [
  '#E86060','#45D6A2','#FFD040','#60A8F0','#FF8A80',
  '#AB8BE0','#60C4BF','#FFB04A','#F07090','#90D060',
  '#60C0F4','#FF9050',
]

const LEVELS = [
  { min: 0,   max: 49,  n: 'Explorador', c: 'lv-exp' },
  { min: 50,  max: 149, n: 'Construtor', c: 'lv-con' },
  { min: 150, max: 299, n: 'Acelerador', c: 'lv-des' },
  { min: 300, max: 499, n: 'Destaque',   c: 'lv-eli' },
  { min: 500, max: Infinity, n: 'Elite', c: 'lv-eli' },
]

export function getLevel(pts) {
  return LEVELS.find(l => pts >= l.min && pts <= l.max) || LEVELS[0]
}

export function getInitials(name) {
  return (name || '')
    .trim()
    .split(/\s+/)
    .map(w => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'https://acelera-pedra-branca.onrender.com'

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://rircwnjahxebkgcvzfek.supabase.co'

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ABJiLcssFSB_ln-U_51fUw_KwHZAGDZ'

export const CAT_DEFS = [
  { k: 'Engajamento',    color: '#60C4D8' },
  { k: 'Desenvolvimento',color: 'var(--green)' },
  { k: 'Tração',         color: 'var(--orange)' },
  { k: 'Bônus',          color: '#F5C842' },
]

export const CAT_CSS = {
  Engajamento:    'lv-exp',
  Desenvolvimento:'lv-con',
  'Tração':       'lv-des',
  'Bônus':        'lv-eli',
}
