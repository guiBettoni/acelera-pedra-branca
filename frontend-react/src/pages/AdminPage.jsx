import { useState, useEffect, useCallback } from 'react'
import useAuth from '../hooks/useAuth'
import useStartups from '../hooks/useStartups'
import useMentores, { STATUS_OPTIONS } from '../hooks/useMentores'
import useWorkshops from '../hooks/useWorkshops'
import { getLevel, CAT_CSS, uid } from '../lib/utils'
import PhotoCropModal from '../components/PhotoCropModal'
import {
  apiCreateStartup, apiUpdateStartup, apiDeleteStartup,
  apiLancarPontos, apiDeleteLog,
} from '../lib/api'

const STAGE_NAMES = ['', 'Ideação', 'Operação', 'Tração', 'Escala']

const DEF_ATIV = [
  { id: 'A01', name: 'Workshop Presencial',  cat: 'Engajamento',    pts: 20, stages: '1,2,3,4' },
  { id: 'A02', name: 'Workshop Online',      cat: 'Engajamento',    pts: 10, stages: '1,2,3,4' },
  { id: 'A03', name: 'Mentoria Individual',  cat: 'Desenvolvimento', pts: 15, stages: '1,2,3,4' },
  { id: 'A04', name: 'Entrega Canvas',       cat: 'Desenvolvimento', pts: 30, stages: '1,2' },
  { id: 'A05', name: 'MVP Funcional',        cat: 'Tração',         pts: 50, stages: '2,3' },
  { id: 'A06', name: 'Pitch de Tração',      cat: 'Tração',         pts: 40, stages: '3,4' },
  { id: 'A07', name: 'Cliente Pagante',      cat: 'Tração',         pts: 60, stages: '3,4' },
  { id: 'A08', name: 'Bônus Destaque',       cat: 'Bônus',          pts: 25, stages: '1,2,3,4' },
]

// ── Login Gate ──────────────────────────────────────────────────────────────

function LoginGate({ onLogin }) {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')

  async function submit(e) {
    e.preventDefault()
    const ok = await login(email, pass)
    if (ok) onLogin()
  }

  return (
    <div className="admin-gate" id="admin-gate"
      style={{ display: 'flex', minHeight: '70vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="gate-card">
        <h3>Entrar no Painel Admin</h3>
        <p>Autentique-se com seu e-mail corporativo INAITEC para acessar o painel administrativo.</p>
        <form onSubmit={submit}>
          <input
            className="ai"
            type="email"
            placeholder="seu email aqui"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="ai"
            type="password"
            placeholder="Senha"
            value={pass}
            onChange={e => setPass(e.target.value)}
            required
            autoComplete="current-password"
          />
          {error && <div className="gate-err" style={{ display: 'block' }}>{error}</div>}
          <button className="gate-btn" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
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
    <div className="admin-panel" id="admin-panel" style={{ display: 'block' }}>
      <div className="admin-top">
        <h2>Painel Administrativo</h2>
        <button className="logout-btn" onClick={logout}>Sair da sessão</button>
      </div>

      <div className="astats">
        <div className="astat"><div className="astat-l">Startups</div><div className="astat-v" id="as-s">{startups.length}</div></div>
        <div className="astat"><div className="astat-l">Lançamentos</div><div className="astat-v g" id="as-l">{logs.length}</div></div>
        <div className="astat"><div className="astat-l">Total de pontos</div><div className="astat-v au" id="as-p">{totalPts}</div></div>
        <div className="astat"><div className="astat-l">Atividades</div><div className="astat-v" id="as-a">{atividades.length}</div></div>
      </div>

      <div className="atabs">
        {[
          { id: 'lancar',      label: 'Lançar Pontos' },
          { id: 'startups',    label: 'Startups' },
          { id: 'atividades',  label: 'Atividades' },
          { id: 'mentorias',   label: 'Mentorias' },
          { id: 'workshops',   label: 'Workshops' },
          { id: 'historico',   label: 'Histórico' },
          { id: 'config',      label: 'Configurações' },
        ].map(t => (
          <button key={t.id} className={`atab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'lancar'      && <TabLancar startups={startups} atividades={atividades} onDone={refresh} showToast={showToast} />}
      {tab === 'startups'   && <TabStartups startups={startups} logs={logs} onDone={refresh} showToast={showToast} />}
      {tab === 'atividades' && <TabAtividades atividades={atividades} setAtividades={setAtividades} showToast={showToast} />}
      {tab === 'mentorias'  && <TabMentorias showToast={showToast} />}
      {tab === 'workshops'  && <TabWorkshops showToast={showToast} />}
      {tab === 'historico'  && <TabHistorico logs={logs} startups={startups} onDone={refresh} showToast={showToast} />}
      {tab === 'config'     && <TabConfig showToast={showToast} />}
    </div>
  )
}

// ── Tab: Lançar ─────────────────────────────────────────────────────────────

function TabLancar({ startups, atividades, onDone, showToast }) {
  const today = new Date().toISOString().split('T')[0]
  const [sid,  setSid]  = useState('')
  const [aid,  setAid]  = useState('')
  const [pts,  setPts]  = useState('')
  const [tipo, setTipo] = useState('add')
  const [date, setDate] = useState(today)
  const [obs,  setObs]  = useState('')
  const [by,   setBy]   = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (startups.length && !sid) setSid(startups[0].id) }, [startups])

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
    const ativ = atividades.find(a => a.id === aid)
    setBusy(true)
    try {
      await apiLancarPontos({
        startup_id: sid, pontos: ptsN, tipo,
        descricao: ativ?.name || 'Atividade',
        categoria: ativ?.cat  || 'Manual',
        obs, lancado_por: by, criado_em: date,
      })
      const startup = startups.find(s => s.id === sid)
      showToast(tipo === 'rem' ? `-${ptsN} pts removidos de ${startup?.name}!` : `+${ptsN} pts lançados para ${startup?.name}!`)
      setObs(''); setBy(''); setPts(''); setAid(''); setTipo('add'); setDate(today)
      onDone()
    } catch (err) { showToast('Erro: ' + err.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="asec on" id="asec-lancar">
      <form className="fc" onSubmit={submit}>
        <h4>Registrar pontuação</h4>
        <div className="frow f2">
          <div className="fg"><label className="fl">Startup</label>
            <select className="fc-inp" value={sid} onChange={e => setSid(e.target.value)}>
              {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fg"><label className="fl">Atividade</label>
            <select className="fc-inp" value={aid} onChange={onAidChange}>
              <option value="">— selecione —</option>
              {atividades.map(a => <option key={a.id} value={a.id}>{a.name} ({a.pts} pts)</option>)}
            </select>
          </div>
        </div>
        <div className="frow f3">
          <div className="fg"><label className="fl">Tipo</label>
            <select className="fc-inp" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="add">+ Adicionar pontos</option>
              <option value="rem">- Remover pontos</option>
            </select>
          </div>
          <div className="fg"><label className="fl">Pontos</label>
            <input className="fc-inp" type="number" min="1" value={pts} onChange={e => setPts(e.target.value)} placeholder="ex: 10" />
          </div>
          <div className="fg"><label className="fl">Data</label>
            <input className="fc-inp" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </div>
        <div className="frow f2">
          <div className="fg"><label className="fl">Registrado por</label>
            <input className="fc-inp" type="text" value={by} onChange={e => setBy(e.target.value)} placeholder="Seu nome" />
          </div>
          <div className="fg"><label className="fl">Observação (opcional)</label>
            <input className="fc-inp" type="text" value={obs} onChange={e => setObs(e.target.value)} placeholder="Contexto, evento, mentor..." />
          </div>
        </div>
        <div className="factions">
          <button className="btn-s" type="submit" disabled={busy}>{busy ? 'Lançando...' : 'Lançar pontos'}</button>
          <button className="btn-c" type="button" onClick={() => { setObs(''); setBy(''); setPts(''); setAid(''); setTipo('add'); setDate(today) }}>Limpar</button>
        </div>
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
  const [cropSrc, setCropSrc] = useState(null)
  const [busy,    setBusy]    = useState(false)

  function onFileChange(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function submit(e) {
    e.preventDefault()
    if (!nome.trim() || !area.trim()) { showToast('Nome e área são obrigatórios.'); return }
    setBusy(true)
    try {
      await onSave({ nome: nome.trim(), area: area.trim(), estagio: parseInt(estagio), email: email.trim(), foto_url: (fotoB64 || foto).trim() || null })
    } catch (err) { showToast('Erro: ' + err.message) }
    finally { setBusy(false) }
  }

  const previewSrc = fotoB64 || foto

  return (
    <form className="fc" onSubmit={submit} style={{ marginBottom: '1rem' }}>
      <h4>{initial ? 'Editar Startup' : 'Nova Startup'}</h4>
      <div className="frow f2">
        <div className="fg"><label className="fl">Nome</label>
          <input className="fc-inp" value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da startup" required />
        </div>
        <div className="fg"><label className="fl">Área</label>
          <input className="fc-inp" value={area} onChange={e => setArea(e.target.value)} placeholder="ex: Fintech, Saúde..." required />
        </div>
      </div>
      <div className="frow f2">
        <div className="fg"><label className="fl">Estágio</label>
          <select className="fc-inp" value={estagio} onChange={e => setEstagio(e.target.value)}>
            {[1,2,3,4].map(n => <option key={n} value={n}>{n} – {STAGE_NAMES[n]}</option>)}
          </select>
        </div>
        <div className="fg"><label className="fl">E-mail</label>
          <input className="fc-inp" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="fg" style={{ marginBottom: '0.875rem' }}>
        <label className="fl">Logo / Foto</label>
        <div className="foto-upload-wrap">
          <div className="foto-preview" style={{ backgroundImage: previewSrc ? `url(${previewSrc})` : 'none' }}>
            {!previewSrc && <span className="foto-preview-ph">Sem foto</span>}
          </div>
          <div className="foto-upload-actions">
            <label className="btn-upload" htmlFor={`foto-file-${initial?.id||'new'}`}>📁 Escolher arquivo</label>
            <input type="file" id={`foto-file-${initial?.id||'new'}`} accept="image/*" style={{ display:'none' }} onChange={onFileChange} />
            <span className="foto-or">ou</span>
            <input className="fc-inp foto-url-inp" type="url" value={fotoB64 ? '' : foto} onChange={e => { setFoto(e.target.value); setFotoB64(null) }} placeholder="Cole uma URL de imagem" />
          </div>
        </div>
      </div>
      <div className="factions">
        <button className="btn-s" type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar'}</button>
        <button className="btn-c" type="button" onClick={onCancel}>Cancelar</button>
      </div>
      {cropSrc && (
        <PhotoCropModal
          src={cropSrc}
          onConfirm={b64 => { setFotoB64(b64); setFoto(b64); setCropSrc(null) }}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </form>
  )
}

function TabStartups({ startups, logs, onDone, showToast }) {
  const [editing, setEditing] = useState(null)
  const [adding,  setAdding]  = useState(false)
  const ptsByS = {}
  logs.forEach(l => { ptsByS[l.sid] = (ptsByS[l.sid] || 0) + (l.pts || 0) })

  async function handleSave(id, payload) {
    if (id) await apiUpdateStartup(id, payload); else await apiCreateStartup(payload)
    showToast(id ? 'Startup atualizada!' : 'Startup cadastrada!')
    setEditing(null); setAdding(false); onDone()
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Excluir "${name}"? Os lançamentos associados serão mantidos.`)) return
    try { await apiDeleteStartup(id); showToast('Startup removida.'); onDone() }
    catch (e) { showToast('Erro: ' + e.message) }
  }

  return (
    <div className="asec on" id="asec-startups">
      {!adding && !editing && (
        <button className="btn-add" onClick={() => setAdding(true)}>+ Nova startup</button>
      )}
      {adding  && <StartupForm onSave={p => handleSave(null, p)} onCancel={() => setAdding(false)} showToast={showToast} />}
      {editing && <StartupForm initial={editing} onSave={p => handleSave(editing.id, p)} onCancel={() => setEditing(null)} showToast={showToast} />}
      <div className="tbl-wrap">
        <table className="atbl">
          <thead><tr><th>Nome</th><th>Área</th><th>Estágio</th><th>Pts</th><th>Nível</th><th></th></tr></thead>
          <tbody>
            {startups.length === 0 && <tr><td colSpan={6} className="empty" style={{ padding:'1.5rem' }}>Nenhuma startup cadastrada.</td></tr>}
            {startups.map(s => {
              const p = ptsByS[s.id] || 0; const lv = getLevel(p)
              return (
                <tr key={s.id}>
                  <td className="td-n">{s.name}</td>
                  <td style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{s.area}</td>
                  <td style={{ fontSize:12 }}>Est. {s.stage} — {STAGE_NAMES[s.stage]||''}</td>
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

  function submit(e) {
    e.preventDefault()
    if (!name.trim() || !parseInt(pts)) return
    onSave({ name: name.trim(), cat, pts: parseInt(pts), stages })
  }

  return (
    <form className="fc" onSubmit={submit} style={{ marginBottom: '1rem' }}>
      <h4>{initial ? 'Editar Atividade' : 'Nova Atividade'}</h4>
      <div className="frow f2">
        <div className="fg"><label className="fl">Nome</label>
          <input className="fc-inp" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="fg"><label className="fl">Categoria</label>
          <select className="fc-inp" value={cat} onChange={e => setCat(e.target.value)}>
            {['Engajamento','Desenvolvimento','Tração','Bônus'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="frow f2">
        <div className="fg"><label className="fl">Pontos</label>
          <input className="fc-inp" type="number" min="1" value={pts} onChange={e => setPts(e.target.value)} required />
        </div>
        <div className="fg"><label className="fl">Estágios</label>
          <input className="fc-inp" value={stages} onChange={e => setStages(e.target.value)} placeholder="1,2,3,4" />
        </div>
      </div>
      <div className="factions">
        <button className="btn-s" type="submit">Salvar</button>
        <button className="btn-c" type="button" onClick={onCancel}>Cancelar</button>
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
    <div className="asec on" id="asec-atividades">
      {!adding && !editing && <button className="btn-add" onClick={() => setAdding(true)}>+ Nova atividade</button>}
      {adding  && <AtivForm onSave={d => handleSave(null, d)} onCancel={() => setAdding(false)} />}
      {editing && <AtivForm initial={editing} onSave={d => handleSave(editing.id, d)} onCancel={() => setEditing(null)} />}
      <div className="tbl-wrap">
        <table className="atbl">
          <thead><tr><th>Nome</th><th>Categoria</th><th>Estágios</th><th>Pts</th><th></th></tr></thead>
          <tbody>
            {atividades.map(a => (
              <tr key={a.id}>
                <td className="td-n">{a.name}</td>
                <td><span className={`rlv ${CAT_CSS[a.cat]||'lv-exp'}`}>{a.cat}</span></td>
                <td style={{ fontSize:12, color:'rgba(255,255,255,0.55)' }}>{a.stages}</td>
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

// ── Tab: Mentorias ───────────────────────────────────────────────────────────

function MentorForm({ initial, onSave, onCancel }) {
  const [nome,         setNome]         = useState(initial?.nome         || '')
  const [especialidade,setEspecialidade] = useState(initial?.especialidade || '')
  const [bio,          setBio]          = useState(initial?.bio          || '')
  const [calendarUrl,  setCalendarUrl]  = useState(initial?.calendarUrl  || '')
  const [status,       setStatus]       = useState(initial?.status ?? 'aberta')
  const [foto,         setFoto]         = useState(initial?.photoUrl     || '')
  const [fotoB64,      setFotoB64]      = useState(null)
  const [cropSrc,      setCropSrc]      = useState(null)

  function onFileChange(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  function submit(e) {
    e.preventDefault()
    if (!nome.trim()) return
    onSave({ nome: nome.trim(), especialidade: especialidade.trim(), bio: bio.trim(), calendarUrl: calendarUrl.trim(), status, photoUrl: (fotoB64 || foto).trim() || '' })
  }

  const previewSrc = fotoB64 || foto

  return (
    <form className="fc" onSubmit={submit} style={{ marginBottom: '1rem' }}>
      <h4>{initial ? 'Editar Mentor' : 'Novo Mentor'}</h4>
      <div className="frow f2">
        <div className="fg">
          <label className="fl">Nome *</label>
          <input className="fc-inp" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome do mentor" />
        </div>
        <div className="fg">
          <label className="fl">Especialidade</label>
          <input className="fc-inp" value={especialidade} onChange={e => setEspecialidade(e.target.value)} placeholder="ex: Marketing & Growth" />
        </div>
      </div>
      <div className="fg">
        <label className="fl">Link do Google Calendar</label>
        <input className="fc-inp" value={calendarUrl} onChange={e => setCalendarUrl(e.target.value)} placeholder="https://calendar.app.google/..." />
      </div>
      <div className="fg">
        <label className="fl">Bio curta</label>
        <input className="fc-inp" value={bio} onChange={e => setBio(e.target.value)} placeholder="Opcional — aparece no card" />
      </div>
      <div className="fg" style={{ marginBottom: '0.875rem' }}>
        <label className="fl">Foto</label>
        <div className="foto-upload-wrap">
          <div className="foto-preview" style={{ backgroundImage: previewSrc ? `url(${previewSrc})` : 'none', borderRadius: '50%' }}>
            {!previewSrc && <span className="foto-preview-ph">Sem foto</span>}
          </div>
          <div className="foto-upload-actions">
            <label className="btn-upload" htmlFor={`mentor-foto-${initial?.id||'new'}`}>📁 Escolher arquivo</label>
            <input type="file" id={`mentor-foto-${initial?.id||'new'}`} accept="image/*" style={{ display:'none' }} onChange={onFileChange} />
            <span className="foto-or">ou</span>
            <input className="fc-inp foto-url-inp" type="url" value={fotoB64 ? '' : foto} onChange={e => { setFoto(e.target.value); setFotoB64(null) }} placeholder="Cole uma URL de imagem" />
          </div>
        </div>
      </div>
      <div className="fg">
        <label className="fl">Status da agenda</label>
        <select className="fc-inp" value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="factions">
        <button className="btn-s" type="submit">Salvar</button>
        <button className="btn-c" type="button" onClick={onCancel}>Cancelar</button>
      </div>
      {cropSrc && (
        <PhotoCropModal
          src={cropSrc}
          onConfirm={b64 => { setFotoB64(b64); setFoto(b64); setCropSrc(null) }}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </form>
  )
}

function TabMentorias({ showToast }) {
  const { mentores, addMentor, updateMentor, deleteMentor, setMentorStatus } = useMentores()
  const [editing, setEditing] = useState(null)
  const [adding,  setAdding]  = useState(false)

  async function handleSave(id, data) {
    try {
      if (id) await updateMentor(id, data)
      else    await addMentor(data)
      showToast(id ? 'Mentor atualizado!' : 'Mentor cadastrado!')
      setEditing(null); setAdding(false)
    } catch (err) {
      showToast('Erro ao salvar: ' + (err?.message || 'verifique o servidor'))
    }
  }

  async function handleDelete(id, nome) {
    if (!window.confirm(`Remover mentor "${nome}"?`)) return
    try {
      await deleteMentor(id)
      showToast('Mentor removido.')
    } catch (err) {
      showToast('Erro ao remover: ' + (err?.message || 'verifique o servidor'))
    }
  }

  const dispCount = mentores.filter(m => m.status === 'aberta').length

  return (
    <div className="asec on" id="asec-mentorias">
      <div className="fc" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
          {mentores.length} mentor{mentores.length !== 1 ? 'es' : ''} cadastrado{mentores.length !== 1 ? 's' : ''} · {dispCount} com agenda aberta
        </span>
        {!adding && !editing && (
          <button className="btn-add" onClick={() => setAdding(true)}>+ Novo mentor</button>
        )}
      </div>

      {adding  && <MentorForm onSave={d => handleSave(null, d)} onCancel={() => setAdding(false)} />}
      {editing && <MentorForm initial={editing} onSave={d => handleSave(editing.id, d)} onCancel={() => setEditing(null)} />}

      <div className="tbl-wrap">
        <table className="atbl">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Especialidade</th>
              <th>Link Calendar</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {mentores.map(m => (
              <tr key={m.id}>
                <td className="td-n">{m.nome}</td>
                <td>{m.especialidade || <span style={{ opacity: .4 }}>—</span>}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.calendarUrl
                    ? <a href={m.calendarUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--orange)', fontSize: 12 }}>Ver link ↗</a>
                    : <span style={{ opacity: .4 }}>—</span>
                  }
                </td>
                <td>
                  <select
                    value={m.status ?? 'aberta'}
                    onChange={async e => {
                      try {
                        await setMentorStatus(m.id, e.target.value)
                      } catch (err) {
                        showToast('Erro ao salvar: ' + (err?.message || 'verifique o servidor'))
                      }
                    }}
                    style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                      border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
                      background: m.status === 'aberta'
                        ? 'rgba(34,197,94,0.18)'
                        : m.status === 'em_breve'
                          ? 'rgba(74,158,224,0.18)'
                          : 'rgba(255,255,255,0.08)',
                      color: m.status === 'aberta'
                        ? '#4ade80'
                        : m.status === 'em_breve'
                          ? '#60b4f0'
                          : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td>
                  <button className="ab" onClick={() => { setEditing(m); setAdding(false) }}>✎</button>
                  <button className="ab del" onClick={() => handleDelete(m.id, m.nome)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Workshops ───────────────────────────────────────────────────────────

function WorkshopForm({ initial, onSave, onCancel }) {
  const [num,      setNum]      = useState(String(initial?.num      || ''))
  const [data,     setData]     = useState(initial?.dataWorkshop    || '')
  const [tema,     setTema]     = useState(initial?.tema            || '')
  const [nome,     setNome]     = useState(initial?.nomeMentor      || '')
  const [role,     setRole]     = useState(initial?.roleMentor      || '')
  const [bio,      setBio]      = useState(initial?.bioMentor       || '')
  const [foto,     setFoto]     = useState(initial?.photoUrl        || '')
  const [fotoB64,  setFotoB64]  = useState(null)
  const [cropSrc,  setCropSrc]  = useState(null)

  function deriveDateDisplay(dateStr) {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return ''
    return parts[2] + '/' + parts[1]
  }

  function onFileChange(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setCropSrc(ev.target.result)
    reader.readAsDataURL(file)
  }

  function submit(e) {
    e.preventDefault()
    if (!nome.trim()) return
    onSave({
      num: parseInt(num) || 0,
      dataWorkshop: data,
      dateDisplay: deriveDateDisplay(data),
      tema: tema.trim(),
      nomeMentor: nome.trim(),
      roleMentor: role.trim(),
      bioMentor: bio.trim(),
      photoUrl: (fotoB64 || foto).trim() || '',
      ordem: parseInt(num) || 0,
    })
  }

  const previewSrc = fotoB64 || foto

  return (
    <form className="fc" onSubmit={submit} style={{ marginBottom: '1rem' }}>
      <h4>{initial ? 'Editar Workshop' : 'Novo Workshop'}</h4>
      <div className="frow f2">
        <div className="fg"><label className="fl">Número (#)</label>
          <input className="fc-inp" type="number" min="1" value={num} onChange={e => setNum(e.target.value)} placeholder="ex: 1" />
        </div>
        <div className="fg"><label className="fl">Data</label>
          <input className="fc-inp" type="date" value={data} onChange={e => setData(e.target.value)} required />
        </div>
      </div>
      <div className="fg"><label className="fl">Tema</label>
        <input className="fc-inp" value={tema} onChange={e => setTema(e.target.value)} placeholder="Título do workshop" required />
      </div>
      <div className="frow f2">
        <div className="fg"><label className="fl">Nome do mentor *</label>
          <input className="fc-inp" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome completo" />
        </div>
        <div className="fg"><label className="fl">Especialidade (role)</label>
          <input className="fc-inp" value={role} onChange={e => setRole(e.target.value)} placeholder="ex: Design & Estratégia" />
        </div>
      </div>
      <div className="fg"><label className="fl">Mini-bio</label>
        <textarea className="fc-inp" value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Breve descrição do mentor" style={{ resize: 'vertical' }} />
      </div>
      <div className="fg" style={{ marginBottom: '0.875rem' }}>
        <label className="fl">Foto</label>
        <div className="foto-upload-wrap">
          <div className="foto-preview" style={{ backgroundImage: previewSrc ? `url(${previewSrc})` : 'none', borderRadius: '50%' }}>
            {!previewSrc && <span className="foto-preview-ph">Sem foto</span>}
          </div>
          <div className="foto-upload-actions">
            <label className="btn-upload" htmlFor={`ws-foto-${initial?.id||'new'}`}>📁 Escolher arquivo</label>
            <input type="file" id={`ws-foto-${initial?.id||'new'}`} accept="image/*" style={{ display:'none' }} onChange={onFileChange} />
            <span className="foto-or">ou</span>
            <input className="fc-inp foto-url-inp" type="url" value={fotoB64 ? '' : foto} onChange={e => { setFoto(e.target.value); setFotoB64(null) }} placeholder="Cole uma URL de imagem" />
          </div>
        </div>
      </div>
      <div className="factions">
        <button className="btn-s" type="submit">Salvar</button>
        <button className="btn-c" type="button" onClick={onCancel}>Cancelar</button>
      </div>
      {cropSrc && (
        <PhotoCropModal
          src={cropSrc}
          onConfirm={b64 => { setFotoB64(b64); setFoto(b64); setCropSrc(null) }}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </form>
  )
}

function TabWorkshops({ showToast }) {
  const { workshops, addWorkshop, updateWorkshop, deleteWorkshop } = useWorkshops()
  const [editing, setEditing] = useState(null)
  const [adding,  setAdding]  = useState(false)

  async function handleSave(id, data) {
    try {
      if (id) await updateWorkshop(id, data)
      else    await addWorkshop(data)
      showToast(id ? 'Workshop atualizado!' : 'Workshop cadastrado!')
      setEditing(null); setAdding(false)
    } catch (err) {
      showToast('Erro ao salvar: ' + (err?.message || 'verifique o servidor'))
    }
  }

  async function handleDelete(id, tema) {
    if (!window.confirm(`Remover workshop "${tema}"?`)) return
    try {
      await deleteWorkshop(id)
      showToast('Workshop removido.')
    } catch (err) {
      showToast('Erro ao remover: ' + (err?.message || 'verifique o servidor'))
    }
  }

  return (
    <div className="asec on" id="asec-workshops">
      <div className="fc" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
          {workshops.length} workshop{workshops.length !== 1 ? 's' : ''} cadastrado{workshops.length !== 1 ? 's' : ''}
        </span>
        {!adding && !editing && (
          <button className="btn-add" onClick={() => setAdding(true)}>+ Novo workshop</button>
        )}
      </div>

      {adding  && <WorkshopForm onSave={d => handleSave(null, d)} onCancel={() => setAdding(false)} />}
      {editing && <WorkshopForm initial={editing} onSave={d => handleSave(editing.id, d)} onCancel={() => setEditing(null)} />}

      <div className="tbl-wrap">
        <table className="atbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Data</th>
              <th>Tema</th>
              <th>Mentor</th>
              <th>Especialidade</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workshops.length === 0 && <tr><td colSpan={6} className="empty" style={{ padding:'1.5rem' }}>Nenhum workshop cadastrado.</td></tr>}
            {workshops.map(w => (
              <tr key={w.id}>
                <td style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{String(w.num).padStart(2,'0')}</td>
                <td style={{ fontSize:12 }}>{w.dateDisplay || w.dataWorkshop}</td>
                <td className="td-n">{w.tema}</td>
                <td>{w.nomeMentor}</td>
                <td style={{ color:'rgba(255,255,255,0.55)', fontSize:12 }}>{w.roleMentor || <span style={{ opacity:.4 }}>—</span>}</td>
                <td>
                  <button className="ab" onClick={() => { setEditing(w); setAdding(false) }}>✎</button>
                  <button className="ab del" onClick={() => handleDelete(w.id, w.tema)}>✕</button>
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
    <div className="asec on" id="asec-historico">
      <div className="fc">
        <h4>Histórico de lançamentos</h4>
        <select className="fc-inp" value={filter} onChange={e => setFilter(e.target.value)} style={{ maxWidth: 260, marginBottom: '1rem' }}>
          <option value="">Todas as startups</option>
          {startups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div id="hist-list">
          {filtered.length === 0 && <div className="empty">Nenhum lançamento encontrado.</div>}
          {filtered.map(x => {
            const d = x.date ? x.date.split('-').reverse().join('/') : '—'
            const isRemocao = x.pts < 0
            return (
              <div key={x.id} className="hrow">
                <div className="hdate">{d}</div>
                <div className="hcont">
                  <div className="hst">{x.sname || '—'}</div>
                  <div className="hact">{x.ativ || '—'}</div>
                  {x.obs && <div className="hnote">{x.obs}{x.by ? ` · por ${x.by}` : ''}</div>}
                </div>
                <div className={`hpts${isRemocao ? ' hpts-remocao' : ''}`}>{x.pts > 0 ? `+${x.pts}` : x.pts}</div>
                <button className="hdel" onClick={() => handleDelete(x.id)} title="Remover">✕</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Config ──────────────────────────────────────────────────────────────

function TabConfig({ showToast }) {
  const [demoday, setDemoday] = useState(() => localStorage.getItem('apb_demoday') || '2026-07-23')

  function save() {
    if (!demoday) { showToast('Informe a data do Demoday.'); return }
    localStorage.setItem('apb_demoday', demoday)
    showToast('Configurações salvas!')
  }

  return (
    <div className="asec on" id="asec-config">
      <div className="fc">
        <h4>Configurações</h4>
        <div className="fg" style={{ maxWidth: 280 }}>
          <label className="fl">Data do Demoday</label>
          <input className="fc-inp" type="date" value={demoday} onChange={e => setDemoday(e.target.value)} />
        </div>
        <div className="factions">
          <button className="btn-s" onClick={save}>Salvar configurações</button>
        </div>
      </div>
    </div>
  )
}
