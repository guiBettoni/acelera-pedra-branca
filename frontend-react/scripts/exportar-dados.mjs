// Congela os dados do Supabase em arquivos estáticos do site.
//
// Uso (dentro de frontend-react):
//   npm run exportar-dados
//
// Gera:
//   src/data/static/{startups,mentores,workshops,meta}.json  -> lidos pelo site
//   public/fotos/{startups,mentores,workshops}/*             -> fotos (base64 ou Storage) viram arquivos
//   ../backup-supabase/AAAA-MM-DD/*.json                     -> cópia bruta de todas as tabelas (fora do git)
//
// Variáveis opcionais: SUPABASE_URL e SUPABASE_KEY (use a service_role do backend/.env
// para incluir no backup tabelas sem leitura pública, como sync_logs).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(FE, 'src', 'data', 'static')
const FOTOS = path.join(FE, 'public', 'fotos')
const HOJE = new Date().toISOString().slice(0, 10)
const BACKUP = path.join(FE, '..', 'backup-supabase', HOJE)

const BASE = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rircwnjahxebkgcvzfek.supabase.co'
const KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ABJiLcssFSB_ln-U_51fUw_KwHZAGDZ'

async function lerTabela(tabela, query) {
  const linhas = []
  const PAGINA = 1000
  for (let offset = 0; ; offset += PAGINA) {
    const url = `${BASE}/rest/v1/${tabela}?${query}&limit=${PAGINA}&offset=${offset}`
    const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!r.ok) {
      const corpo = await r.text()
      const detalhe = r.status >= 520 && r.status <= 530
        ? '(o servidor do Supabase ainda está subindo; aguarde alguns minutos e rode de novo)'
        : corpo.trimStart().startsWith('<') ? '' : corpo.slice(0, 200)
      throw new Error(`${tabela}: HTTP ${r.status} ${detalhe}`)
    }
    const lote = await r.json()
    linhas.push(...lote)
    if (lote.length < PAGINA) return linhas
  }
}

const EXT = { jpeg: 'jpg', jpg: 'jpg', png: 'png', webp: 'webp', gif: 'gif', 'svg+xml': 'svg', avif: 'avif' }

// Transforma uma foto (data URI ou URL externa/Storage) em arquivo dentro de public/fotos.
async function salvarFoto(src, tipo, id) {
  if (!src) return ''
  let buf, ext
  const dataUri = /^data:image\/([a-z0-9.+-]+);base64,(.+)$/is.exec(src)
  if (dataUri) {
    buf = Buffer.from(dataUri[2], 'base64')
    ext = EXT[dataUri[1].toLowerCase()]
  } else if (/^https?:\/\//i.test(src)) {
    try {
      const r = await fetch(src)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      buf = Buffer.from(await r.arrayBuffer())
      const mime = (r.headers.get('content-type') || '').split(';')[0].split('/')[1] || ''
      ext = EXT[mime.toLowerCase()] || EXT[path.extname(new URL(src).pathname).slice(1).toLowerCase()]
    } catch (e) {
      console.warn(`  ! não consegui baixar a foto de ${tipo}/${id} (${e.message}); mantendo a URL original`)
      return src
    }
  } else {
    return src // caminho local, ex.: /personas/delia.png
  }
  const arquivo = `${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext || 'jpg'}`
  fs.writeFileSync(path.join(FOTOS, tipo, arquivo), buf)
  return `/fotos/${tipo}/${arquivo}`
}

function limparPastaFotos(tipo) {
  fs.rmSync(path.join(FOTOS, tipo), { recursive: true, force: true })
  fs.mkdirSync(path.join(FOTOS, tipo), { recursive: true })
}

const json = v => JSON.stringify(v, null, 2) + '\n'

async function main() {
  console.log(`Lendo ${BASE} ...`)

  // Tabelas que o site exibe: se qualquer uma falhar, nada é sobrescrito.
  const [startupsRaw, mentoresRaw, workshopsRaw] = await Promise.all([
    lerTabela('startups', 'select=*&order=pontos.desc,nome.asc'),
    lerTabela('mentores', 'select=*&order=criado_em.asc'),
    lerTabela('workshops', 'select=*&order=ordem.asc'),
  ])

  // Backup bruto (inclui tabelas extras; essas podem falhar sem bloquear).
  fs.mkdirSync(BACKUP, { recursive: true })
  const backup = { startups: startupsRaw, mentores: mentoresRaw, workshops: workshopsRaw }
  for (const [tabela, query] of [
    ['pontuacoes', 'select=*&order=criado_em.asc'],
    ['sync_logs', 'select=*'],
  ]) {
    try { backup[tabela] = await lerTabela(tabela, query) }
    catch (e) { console.warn(`  ! backup de ${tabela} ignorado: ${e.message}`) }
  }
  for (const [tabela, linhas] of Object.entries(backup)) {
    fs.writeFileSync(path.join(BACKUP, `${tabela}.json`), json(linhas))
  }
  console.log(`Backup bruto salvo em ${path.relative(process.cwd(), BACKUP)}`)

  ;['startups', 'mentores', 'workshops'].forEach(limparPastaFotos)

  const startups = []
  for (const s of startupsRaw.filter(s => s.ativo !== false)) {
    startups.push({
      id: s.id,
      name: s.nome,
      area: s.area || '',
      stage: s.estagio || 1,
      pts: s.pontos || 0,
      foto: await salvarFoto(s.foto_url, 'startups', s.id),
      aulas: s.aulas || 0,
      mentorias: s.mentorias || 0,
      canvas_feito: !!s.canvas_feito,
      entrevistas: !!s.entrevistas,
      mvp_funcional: !!s.mvp_funcional,
      pessoas_testando: !!s.pessoas_testando,
      clientes_pagantes: !!s.clientes_pagantes,
      faltasMentoria: s.faltas_mentoria || 0,
    })
  }

  const mentores = []
  for (const m of mentoresRaw) {
    mentores.push({
      id: m.id,
      nome: m.nome,
      especialidade: m.especialidade || '',
      bio: m.bio || '',
      calendarUrl: m.calendar_url || '',
      status: m.status,
      photoUrl: await salvarFoto(m.photo_url, 'mentores', m.id),
      programa: m.programa || 'acelera',
    })
  }

  const workshops = []
  for (const w of workshopsRaw) {
    workshops.push({
      id: w.id,
      num: w.num,
      dataWorkshop: w.data_workshop,
      dateDisplay: w.date_display || '',
      tema: w.tema || '',
      nomeMentor: w.nome_mentor || '',
      roleMentor: w.role_mentor || '',
      bioMentor: w.bio_mentor || '',
      photoUrl: await salvarFoto(w.photo_url, 'workshops', w.id),
      ordem: w.ordem ?? 0,
    })
  }

  fs.mkdirSync(OUT, { recursive: true })
  fs.writeFileSync(path.join(OUT, 'startups.json'), json(startups))
  fs.writeFileSync(path.join(OUT, 'mentores.json'), json(mentores))
  fs.writeFileSync(path.join(OUT, 'workshops.json'), json(workshops))
  fs.writeFileSync(path.join(OUT, 'meta.json'), json({
    atualizadoEm: new Date().toISOString(),
    fonte: `Exportado do Supabase (${BASE})`,
    provisorio: false,
  }))

  const porPrograma = mentores.reduce((a, m) => ({ ...a, [m.programa]: (a[m.programa] || 0) + 1 }), {})
  console.log('Pronto:', { startups: startups.length, mentores: porPrograma, workshops: workshops.length })
}

main().catch(e => {
  console.error(`\nFalhou: ${e.cause?.code || ''} ${e.message}`)
  console.error('Nenhum arquivo do site foi alterado. O projeto Supabase está ativo?')
  // exitCode em vez de process.exit(): evita o "Assertion failed ... async.c" do Node no Windows
  process.exitCode = 1
})
