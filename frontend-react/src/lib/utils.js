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

export const SCORE_WEIGHTS = {
  aula: 10, mentoria: 5, canvas: 15, entrevistas: 15, mvp: 30, testando: 30, pagantes: 40,
}

export function scoreBreakdown(startup) {
  const aulas = startup.aulas || 0
  const mentorias = startup.mentorias || 0
  const faltas = startup.faltasMentoria || 0
  const w = SCORE_WEIGHTS

  const penalidade = faltas * -5
  const engSub = aulas * w.aula + mentorias * w.mentoria + penalidade
  const devSub = (startup.canvas_feito ? w.canvas : 0) + (startup.entrevistas ? w.entrevistas : 0) + (startup.mvp_funcional ? w.mvp : 0)
  const traSub = (startup.pessoas_testando ? w.testando : 0) + (startup.clientes_pagantes ? w.pagantes : 0)

  const engItems = [
    { type: 'count', label: 'Aulas assistidas', qty: aulas, unit: ' aulas', per: w.aula, pts: aulas * w.aula },
    { type: 'count', label: 'Horas de mentoria', qty: mentorias, unit: 'h', per: w.mentoria, pts: mentorias * w.mentoria },
  ]
  if (faltas > 0) {
    engItems.push({ type: 'adj', label: `Faltas em mentoria (${faltas}×)`, pts: penalidade })
  }

  const groups = [
    {
      key: 'Engajamento', color: CAT_DEFS[0].color, subtotal: engSub,
      items: engItems,
    },
    {
      key: 'Desenvolvimento', color: CAT_DEFS[1].color, subtotal: devSub,
      items: [
        { type: 'bool', label: 'Canvas feito', ok: !!startup.canvas_feito, val: w.canvas },
        { type: 'bool', label: 'Entrevistas realizadas', ok: !!startup.entrevistas, val: w.entrevistas },
        { type: 'bool', label: 'MVP funcional', ok: !!startup.mvp_funcional, val: w.mvp },
      ],
    },
    {
      key: 'Tração', color: CAT_DEFS[2].color, subtotal: traSub,
      items: [
        { type: 'bool', label: 'Pessoas testando', ok: !!startup.pessoas_testando, val: w.testando },
        { type: 'bool', label: 'Clientes pagantes', ok: !!startup.clientes_pagantes, val: w.pagantes },
      ],
    },
  ]

  const formulaTotal = engSub + devSub + traSub
  const adj = (startup.pts || 0) - formulaTotal
  if (adj !== 0) {
    groups.push({
      key: 'Ajustes', color: CAT_DEFS[3].color, subtotal: adj,
      items: [{ type: 'adj', label: adj > 0 ? 'Bônus extra' : 'Desconto aplicado', pts: adj }],
    })
  }

  return groups
}

export const CAT_CSS = {
  Engajamento:    'lv-exp',
  Desenvolvimento:'lv-con',
  'Tração':       'lv-des',
  'Bônus':        'lv-eli',
}
