import { useState, useEffect, useCallback } from 'react'
import useAuth from '../hooks/useAuth'
import useStartups, { l2l } from '../hooks/useStartups'
import { getLevel, CAT_CSS, uid } from '../lib/utils'
import {
  apiCreateStartup, apiUpdateStartup, apiDeleteStartup,
  apiLancarPontos, apiDeleteLog,
} from '../lib/api'

const STAGE_NAMES = ['', 'Ideação', 'Operação', 'Tração', 'Escala']

const DEF_ATIV = [
  { id: 'A01', name: 'Workshop Presencial', cat: 'Engajamento', pts: 20, stages: '1,2,3,4', desc: '' },
  { id: 'A02', name: 'Workshop Online', cat: 'Engajamento', pts: 10, stages: '1,2,3,4', desc: '' },
  { id: 'A03', name: 'Mentoria Individual', cat: 'Desenvolvimento', pts: 15, stages: '1,2,3,4', desc: '' },
  { id: 'A04', name: 'Entrega Canvas', cat: 'Desenvolvimento', pts: 30, stages: '1,2', desc: '' },
  { id: 'A05', name: 'MVP Funcional', cat: 'Tração', pts: 50, stages: '2,3', desc: '' },
  { id: 'A06', name: 'Pitch de Tração', cat: 'Tração', pts: 40, stages: '3,4', desc: '' },
  { id: 'A07', name: 'Cliente Pagante', cat: 'Tração', pts: 60, stages: '3,4', desc: '' },
  { id: 'A08', name: 'Bônus Destaque', cat: 'Bônus', pts: 25, stages: '1,2,3,4', desc: '' },
]

// ── Login Gate ──────────────────────────────────────────────────────────────

function LoginGate({ onLogin }) {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [pass, setPass]   = useState('')

  async function submit(e) {
    e.preventDefault()
    const ok = await login(email, pass)
    if (ok) onLogin()
  }

  return (
    <div id="admin-gate" style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="gate-box">
        <div className="gate-logo">🔐</div>
        <h2 className="gate-title">Painel Administrativo</h2>
        <p className="gate-sub">Acesso restrito à equipe INAITEC.</p>
        <form onSubmit={submit} className="gate-form">
          <input
            className="fc-inp"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="fc-inp"
            type="password"
            placeholder="Senha"
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <div className="gate-err">{error}</div>}
          <button className="btn-p" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Admin Panel ─────────────────────────────────────────────────────────────

export default function AdminPage({ showToast }) {
  const { isAdmin, logout } = useAuth()
  const [authed, setAuthed] = useState(isAdmin)

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />
  return <Panel logout={() => { logout(); setAuthed(false) }} showToast={showToast} />
}

function Panel({ logout, showToast }) {
  const { startups, logs, loading, refresh } = useStartups()
  const [tab, setTab] = useState('lancar')
  const [atividades, setAtividades] = useState(() => {
    try { return JSON.parse(localStorage.getItem('apb_ativ')) || DEF_ATIV } catch { return DEF_ATIV }
  })

  useEffect(() => {
    localStorage.setItem('apb_ativ', JSON.stringify(atividades))
  }, [atividades])

  const totalPts = logs.reduce((s, l) => s + (l.pts || 0), 0)

  return (
    <div id="admin-panel" className="page on">
      <div className="ap-header">
        <div className="ap-title">Painel Admin</div>
        <button className="ab" onClick={logout}>Sair</button>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        <div className="as-card"><div className="as-n" id="as-s">{startups.length}</div><div className="as-l">Startups</div></div>
        <div className="as-card"><div className="as-n" id="as-l">{logs.length}</div><div className="as-l">Lançamentos</div></div>
        <div className="as-card"><div className="as-n" id="as-p">{totalPts}</div><div className="as-l">Pontos totais</div></div>
        <div className="as-card"><div className="as-n" id="as-a">{atividades.length}</div><div className="as-l">Atividades</div></div>
      </div>

      {/* Tabs */}
      <div className="atabs">
        {['lancar','startups','atividades','historico','config'].map(t => (
          <button
            key={t}
            className={`atab${tab === t ? ' on' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'lancar'      && <TabLancar startups={startups} atividades={atividades} onDone={refresh} showToast={showToast} />}
      {tab === 'startups'   && <TabStartups startups={startups} logs={logs} onDone={refresh} showToast={showToast} />}
      {tab === 'atividades' && <TabAtividades atividades={atividades} setAtividades={setAtividades} showToast={showToast} />}
      {tab === 'historico'  && <TabHistorico logs={logs} startups={startups} onDone={refresh} showToast={showToast} />}
      {tab === 'config'     && <TabConfig showToast={showToast} />}
    </div>
  )
}

// ── Tab: Lançar ─────────────────────────────────────────────────────────────

function TabLancar({ startups, atividades, onDone, showToast }) {
  const today = new Date().toISOString().split('T')[0]
  const [sid,   setSid]   = useState('')
  const [aid,   setAid]   = useState('')
  const [pts,   setPts]   = useState('')
  const [tipo,  setTipo]  = useState('add')
  const [date,  setDate]  = useState(today)
  const [obs,   setObs]   = useState('')
  const [by,    setBy]    = useState('')
  const [busy,  setBusy]  = useState(false)

  useEffect(() => {
    if (startups.length && !sid) setSid(startups[0].id)
  }, [startups])

  function onAidChange(e) {
    setAid(e.target.value)
    const a = atividades.find(a => a.id === e.target.value)
    if (a) setPts(String(a.pts))
  }

  async function submit(e) {
    e.preventDefault()
    if (!sid || !aid || !pts || !date) { showToast('Preencha todos os campos obrigatórios.'); return }
    const ptsN = parseInt(pts)
    if (!ptsN || ptsN < 1) { showToast('Pontos inválidos.'); return }
    const ativ    = atividades.find(a => a.id === aid)
    setBusy(true)
    try {
      await apiLancarPontos({
        startup_id: sid,
        pontos: ptsN,
        tipo,
        descricao: ativ?.name || 'Atividade',
        categoria: ativ?.cat || 'Manual',
        obs,
        lancado_por: by,
        criado_em: date,
      })
      const startup = startups.find(s => s.id === sid)
      showToast(tipo === 'rem'
        ? `-${ptsN} pts removidos de ${startup?.name}!`
        : `+${ptsN} pts lançados para ${startup?.name}!`)
      setObs(''); setBy(''); setPts(''); setAid('')
      setTipo('add'); setDate(today)
      onDone()
    } catch (e) {
      showToast('Erro: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div id="asec-lancar" className="asec on">
      <form className="admin-form" onSubmit={submit}>
        <h3 className="af-title">Lançar Pontos</h3>
        <div className="af-row">
          <label className="af-label">Startup</label>
          <select className="fc-inp" value={sid} onChange={e => setSid(e.target.value)}>
            {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="af-row">
          <label className="af-label">Atividade</label>
          <select className="fc-inp" value={aid} onChange={onAidChange}>
            <option value="">— selecione —</option>
            {atividades.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.pts} pts)</option>
            ))}
          </select>
        </div>
        <div className="af-row af-row-2">
          <div>
            <label className="af-label">Tipo</label>
            <select className="fc-inp" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="add">Adicionar</option>
              <option value="rem">Remover</option>
            </select>
          </div>
          <div>
            <label className="af-label">Pontos</label>
            <input className="fc-inp" type="number" min="1" value={pts} onChange={e => setPts(e.target.value)} />
          </div>
        </div>
        <div className="af-row">
          <label className="af-label">Data</label>
          <input className="fc-inp" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="af-row">
          <label className="af-label">Observação</label>
          <input className="fc-inp" type="text" value={obs} onChange={e => setObs(e.target.value)} placeholder="Opcional" />
        </div>
        <div className="af-row">
          <label className="af-label">Lançado por</label>
          <input className="fc-inp" type="text" value={by} onChange={e => setBy(e.target.value)} placeholder="Seu nome" />
        </div>
        <button className="btn-p" type="submit" disabled={busy}>{busy ? 'Lançando...' : 'Lançar pontos'}</button>
      </form>
    </div>
  )
}

// ── Tab: Startups ───────────────────────────────────────────────────────────

function StartupForm({ initial, onSave, onCancel, showToast }) {
  const [nome,    setNome]    = useState(initial?.name  || '')
  const [area,    setArea]    = useState(initial?.area  || '')
  const [estagio, setEstagio] = useState(String(initial?.stage || 1))
  const [email,   setEmail]   = useState(initial?.email || '')
  const [foto,    setFoto]    = useState(initial?.foto  || '')
  const [fotoB64, setFotoB64] = useState(null)
  const [busy,    setBusy]    = useState(false)

  function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const img    = new Image()
    const reader = new FileReader()
    reader.onload = ev => {
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 80; canvas.height = 80
        const ctx  = canvas.getContext('2d')
        const size = Math.min(img.width, img.height)
        const sx   = (img.width  - size) / 2
        const sy   = (img.height - size) / 2
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 80, 80)
        const b64 = canvas.toDataURL('image/jpeg', 0.82)
        setFotoB64(b64)
        setFoto(b64)
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  async function submit(e) {
    e.preventDefault()
    if (!nome.trim() || !area.trim()) { showToast('Nome e área são obrigatórios.'); return }
    setBusy(true)
    try {
      const payload = { nome: nome.trim(), area: area.trim(), estagio: parseInt(estagio), email: email.trim(), foto_url: (fotoB64 || foto).trim() || null }
      await onSave(payload)
    } catch (err) {
      showToast('Erro: ' + err.message)
    } finally {
      setBusy(false)
    }
  }

  const previewSrc = fotoB64 || foto

  return (
    <form className="admin-form" onSubmit={submit} style={{ marginTop: '1.5rem' }}>
      <div className="af-row af-row-2">
        <div>
          <label className="af-label">Nome</label>
          <input className="fc-inp" value={nome} onChange={e => setNome(e.target.value)} required />
        </div>
        <div>
          <label className="af-label">Área</label>
          <input className="fc-inp" value={area} onChange={e => setArea(e.target.value)} required />
        </div>
      </div>
      <div className="af-row af-row-2">
        <div>
          <label className="af-label">Estágio</label>
          <select className="fc-inp" value={estagio} onChange={e => setEstagio(e.target.value)}>
            {[1,2,3,4].map(n => <option key={n} value={n}>{n} – {STAGE_NAMES[n]}</option>)}
          </select>
        </div>
        <div>
          <label className="af-label">E-mail</label>
          <input className="fc-inp" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="af-row">
        <label className="af-label">Logo / Foto</label>
        <div className="foto-upload-wrap">
          <div className="foto-preview" style={{ backgroundImage: previewSrc ? `url(${previewSrc})` : 'none' }}>
            {!previewSrc && <span className="foto-preview-ph">Sem foto</span>}
          </div>
          <div className="foto-upload-actions">
            <label className="btn-upload" htmlFor={`foto-file-${initial?.id || 'new'}`}>📁 Escolher arquivo</label>
            <input type="file" id={`foto-file-${initial?.id || 'new'}`} accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
            <span className="foto-or">ou</span>
            <input className="fc-inp foto-url-inp" type="url" value={fotoB64 ? '' : foto} onChange={e => { setFoto(e.target.value); setFotoB64(null) }} placeholder="Cole uma URL de imagem" />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-p" type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</button>
        <button className="ab" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

function TabStartups({ startups, logs, onDone, showToast }) {
  const [editing, setEditing] = useState(null)
  const [adding,  setAdding]  = useState(false)

  const ptsByS = {}
  logs.forEach(l => { ptsByS[l.sid] = (ptsByS[l.sid] || 0) + (l.pts || 0) })

  async function handleSave(id, payload) {
    if (id) await apiUpdateStartup(id, payload)
    else     await apiCreateStartup(payload)
    showToast(id ? 'Startup atualizada!' : 'Startup cadastrada!')
    setEditing(null); setAdding(false); onDone()
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Excluir "${name}"? Os lançamentos associados serão mantidos.`)) return
    try { await apiDeleteStartup(id); showToast('Startup removida.'); onDone() }
    catch (e) { showToast('Erro: ' + e.message) }
  }

  return (
    <div id="asec-startups" className="asec on">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="af-title" style={{ margin: 0 }}>Startups</h3>
        <button className="btn-p" onClick={() => { setAdding(true); setEditing(null) }}>+ Nova startup</button>
      </div>

      {adding && (
        <StartupForm onSave={p => handleSave(null, p)} onCancel={() => setAdding(false)} showToast={showToast} />
      )}
      {editing && (
        <StartupForm initial={editing} onSave={p => handleSave(editing.id, p)} onCancel={() => setEditing(null)} showToast={showToast} />
      )}

      <div className="tbl-wrap">
        <table className="atbl">
          <thead><tr>
            <th>Nome</th><th>Área</th><th>Estágio</th><th>Pts</th><th>Nível</th><th></th>
          </tr></thead>
          <tbody id="tbl-s">
            {startups.length === 0 && (
              <tr><td colSpan={6} className="empty" style={{ padding: '2rem' }}>Nenhuma startup cadastrada.</td></tr>
            )}
            {startups.map(s => {
              const p  = ptsByS[s.id] || 0
              const lv = getLevel(p)
              return (
                <tr key={s.id}>
                  <td className="td-n">{s.name}</td>
                  <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{s.area}</td>
                  <td style={{ fontSize: 12 }}>Est. {s.stage} — {STAGE_NAMES[s.stage] || ''}</td>
                  <td className="td-pt">{p}</td>
                  <td><span className={`rlv ${lv.c}`}>{lv.n}</span></td>
                  <td>
                    <button className="ab" onClick={() => { setEditing(s); setAdding(false) }}>Editar</button>
                    <button className="ab del" onClick={() => handleDelete(s.id, s.name)}>Excluir</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Atividades ─────────────────────────────────────────────────────────

function AtivForm({ initial, onSave, onCancel }) {
  const [name,   setName]   = useState(initial?.name   || '')
  const [cat,    setCat]    = useState(initial?.cat    || 'Engajamento')
  const [pts,    setPts]    = useState(String(initial?.pts || ''))
  const [stages, setStages] = useState(initial?.stages || '1,2,3,4')
  const [desc,   setDesc]   = useState(initial?.desc   || '')

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || !parseInt(pts)) return
    onSave({ name: name.trim(), cat, pts: parseInt(pts), stages, desc })
  }

  return (
    <form className="admin-form" onSubmit={submit} style={{ marginTop: '1.5rem' }}>
      <div className="af-row af-row-2">
        <div>
          <label className="af-label">Nome</label>
          <input className="fc-inp" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="af-label">Categoria</label>
          <select className="fc-inp" value={cat} onChange={e => setCat(e.target.value)}>
            {['Engajamento','Desenvolvimento','Tração','Bônus'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="af-row af-row-2">
        <div>
          <label className="af-label">Pontos</label>
          <input className="fc-inp" type="number" min="1" value={pts} onChange={e => setPts(e.target.value)} required />
        </div>
        <div>
          <label className="af-label">Estágios</label>
          <input className="fc-inp" value={stages} onChange={e => setStages(e.target.value)} placeholder="1,2,3,4" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-p" type="submit">Salvar</button>
        <button className="ab" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}

function TabAtividades({ atividades, setAtividades, showToast }) {
  const [editing, setEditing] = useState(null)
  const [adding,  setAdding]  = useState(false)

  function handleSave(id, data) {
    if (id) setAtividades(av => av.map(a => a.id === id ? { ...a, ...data } : a))
    else    setAtividades(av => [...av, { id: 'A' + uid().slice(-3).toUpperCase(), ...data }])
    showToast(id ? 'Atividade atualizada!' : 'Atividade cadastrada!')
    setEditing(null); setAdding(false)
  }

  function handleDelete(id) {
    if (!window.confirm('Excluir esta atividade?')) return
    setAtividades(av => av.filter(a => a.id !== id))
    showToast('Atividade removida.')
  }

  return (
    <div id="asec-atividades" className="asec on">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 className="af-title" style={{ margin: 0 }}>Atividades</h3>
        <button className="btn-p" onClick={() => { setAdding(true); setEditing(null) }}>+ Nova atividade</button>
      </div>
      {adding  && <AtivForm onSave={d => handleSave(null, d)} onCancel={() => setAdding(false)} />}
      {editing && <AtivForm initial={editing} onSave={d => handleSave(editing.id, d)} onCancel={() => setEditing(null)} />}
      <div className="tbl-wrap">
        <table className="atbl">
          <thead><tr><th>Nome</th><th>Categoria</th><th>Estágios</th><th>Pts</th><th></th></tr></thead>
          <tbody id="tbl-a">
            {atividades.map(a => (
              <tr key={a.id}>
                <td className="td-n">{a.name}</td>
                <td><span className={`rlv ${CAT_CSS[a.cat] || 'lv-exp'}`}>{a.cat}</span></td>
                <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{a.stages}</td>
                <td className="td-pt">{a.pts}</td>
                <td>
                  <button className="ab" onClick={() => { setEditing(a); setAdding(false) }}>Editar</button>
                  <button className="ab del" onClick={() => handleDelete(a.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Histórico ───────────────────────────────────────────────────────────

function TabHistorico({ logs, startups, onDone, showToast }) {
  const [filter, setFilter] = useState('')

  const filtered = filter ? logs.filter(l => l.sid === filter) : logs

  async function handleDelete(id) {
    if (!window.confirm('Remover este lançamento? Os pontos serão descontados do ranking.')) return
    try { await apiDeleteLog(id); showToast('Lançamento removido.'); onDone() }
    catch (e) { showToast('Erro: ' + e.message) }
  }

  return (
    <div id="asec-historico" className="asec on">
      <h3 className="af-title">Histórico</h3>
      <select className="fc-inp" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 260, marginBottom: '1rem' }}>
        <option value="">Todas as startups</option>
        {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <div id="hist-list">
        {filtered.length === 0 && <div className="empty">Nenhum lançamento encontrado.</div>}
        {filtered.map(x => {
          const d = x.date ? x.date.split('-').reverse().join('/') : '—'
          const isAdj = x.cat === 'Ajuste'
          return (
            <div key={x.id} className="hrow">
              <div className="hdate">{d}</div>
              <div className="hcont">
                <div className="hst">{x.sname || '—'}</div>
                <div className="hact">{x.ativ || '—'}</div>
                {x.obs && <div className="hnote">{x.obs}{x.by ? ` · por ${x.by}` : ''}</div>}
              </div>
              <div className={`hpts${isAdj ? ' hpts-ajuste' : ''}`}>
                {isAdj ? 'ajuste' : `+${x.pts}`}
              </div>
              <button className="hdel" onClick={() => handleDelete(x.id)} title="Remover lançamento">✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Config ──────────────────────────────────────────────────────────────

function TabConfig({ showToast }) {
  const [demoday, setDemoday] = useState(
    () => localStorage.getItem('apb_demoday') || '2026-07-23'
  )

  function save() {
    if (!demoday) { showToast('Informe a data do Demoday.'); return }
    localStorage.setItem('apb_demoday', demoday)
    showToast('Configurações salvas!')
  }

  return (
    <div id="asec-config" className="asec on">
      <h3 className="af-title">Configurações</h3>
      <div className="admin-form">
        <div className="af-row">
          <label className="af-label">Data do Demoday</label>
          <input className="fc-inp" type="date" value={demoday} onChange={e => setDemoday(e.target.value)} style={{ maxWidth: 220 }} />
        </div>
        <button className="btn-p" onClick={save}>Salvar configurações</button>
      </div>
    </div>
  )
}
