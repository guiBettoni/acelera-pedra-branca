// Leitura pública via Supabase REST API (chave anon — somente SELECT)
// Escrita protegida via backend local (BACKEND_URL em app.js)
const SUPABASE_URL = 'https://rircwnjahxebkgcvzfek.supabase.co';
var _RKPAL = ['#E86060','#45D6A2','#FFD040','#60A8F0','#FF8A80','#AB8BE0','#60C4BF','#FFB04A','#F07090','#90D060','#60C0F4','#FF9050'];
const SUPABASE_ANON_KEY = 'sb_publishable_ABJiLcssFSB_ln-U_51fUw_KwHZAGDZ';
const _sbHeaders = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY };

window.sb = null;
let _sbReady = false, _sbCache = null;

async function sbFetch() {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/startups?ativo=eq.true&order=pontos.desc', { headers: _sbHeaders });
    if (!r.ok) return null;
    const data = await r.json();
    _sbReady = true;
    return data;
  } catch(e){ console.warn('[SB] fetch error', e); return null; }
}
async function sbFetchLogs() {
  try {
    const r = await fetch(SUPABASE_URL + '/rest/v1/pontuacoes?select=*,startups(nome)&order=criado_em.desc&limit=200', { headers: _sbHeaders });
    if (!r.ok) return null;
    const data = await r.json();
    _sbReady = true;
    return data;
  } catch(e){ return null; }
}
// Retorna headers com auth token quando disponível
function authHeaders() {
  const token = sessionStorage.getItem('admin_token');
  const h = {'Content-Type':'application/json'};
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

// Se a escrita retornar 401, desloga e informa o usuário
function handleUnauthorized(r) {
  if (r.status === 401) { doLogout(); showToast('Sessão expirada. Faça login novamente.'); return true; }
  return false;
}

function s2l(s) {
  return {
    id:s.id, name:s.nome, area:s.area, stage:s.estagio||1, email:s.email||'', pts:s.pontos||0, foto:s.foto_url||'',
    aulas:s.aulas||0, mentorias:s.mentorias||0,
    canvas_feito:s.canvas_feito||false, entrevistas:s.entrevistas||false,
    mvp_funcional:s.mvp_funcional||false, pessoas_testando:s.pessoas_testando||false,
    clientes_pagantes:s.clientes_pagantes||false,
  };
}
function l2l(l) {
  return {id:l.id,sid:l.startup_id,sname:l.startups?.nome||'?',ativ:l.descricao||'Atividade',cat:l.categoria||'Manual',pts:l.pontos,obs:l.obs||'',by:l.lancado_por||'',date:(l.criado_em||'').slice(0,10)};
}
async function getSB() {
  if (_sbReady && _sbCache) return _sbCache;
  const d = await sbFetch();
  if (d) { _sbCache = d.map(s2l); return _sbCache; }
  return getS();
}

// Override renderRanking
window.renderRanking = async function() {
  const ranked = await getSB();
  const maxP = ranked[0]?.pts||0;
  const avgP = ranked.length ? Math.round(ranked.reduce((s,r)=>s+(r.pts||0),0)/ranked.length) : 0;

  const t=document.getElementById('rs-t'); if(t) t.textContent=ranked.length;
  const m=document.getElementById('rs-m'); if(m) m.textContent=maxP||'Sem pontos ainda';
  const a=document.getElementById('rs-a'); if(a) a.textContent=avgP||'—';

  const top3=ranked.slice(0,3);
  const pod=document.getElementById('podium-area');
  if (pod) {
    if (!top3.length) { pod.innerHTML=''; }
    else {
      const medals=[{m:'🥇',p:'g',pos:'1º lugar',cls:'p1'},{m:'🥈',p:'s',pos:'2º lugar',cls:'p2'},{m:'🥉',p:'b',pos:'3º lugar',cls:'p3'}];
      const vis  = top3.length>=2?[top3[1],top3[0],top3[2]].filter(Boolean):top3;
      const mvis = top3.length>=2?[medals[1],medals[0],medals[2]].filter(Boolean):medals;
      pod.innerHTML=vis.map((s,i)=>{
        const mi=mvis[i],lv=getLevel(s.pts||0);
        const ini=s.name.trim().split(/\s+/).map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
        const rn=mi.cls==='p1'?'1':mi.cls==='p2'?'2':'3';
        const avHtml=`<div class="pod-av-wrap"><div class="rav-ini">${ini}</div>${s.foto?`<img src="${safe(s.foto)}" class="rav-img" alt="">`:''}</div>`;
        return `<div class="pod ${mi.cls}">
          <div class="pod-rank-num">${rn}</div>
          <div class="pod-shield">
            <div class="pod-ico">${mi.m}</div>
            ${avHtml}
            <div class="pod-nm">${safe(s.name)}</div>
            <div class="pod-area-s">${safe(s.area)}</div>
            <div class="pod-ptsrow"><span class="pod-ptsn">${s.pts||0}</span><span class="pod-ptsl">pts</span></div>
            <div class="pod-lvb">${lv.n}</div>
          </div>
        </div>`;
      }).join('');
    }
  }

  const rawLogs = await sbFetchLogs();
  const catBySid = {};
  if (rawLogs) {
    rawLogs.forEach(l => {
      const sid = l.startup_id;
      const cat = l.categoria || 'Manual';
      if (!catBySid[sid]) catBySid[sid] = {};
      catBySid[sid][cat] = (catBySid[sid][cat] || 0) + (l.pontos || 0);
    });
  }

  const catDefs=[
    {k:'Engajamento',color:'#60C4D8'},
    {k:'Desenvolvimento',color:'var(--green)'},
    {k:'Tração',color:'var(--orange)'},
    {k:'Bônus',color:'#F5C842'},
  ];

  // Clouds init (once)
  if (!document.querySelector('.rk-clouds')) {
    const rp=document.getElementById('page-ranking');
    if(rp){
      rp.style.position='relative';
      rp.insertAdjacentHTML('afterbegin','<div class="rk-clouds" aria-hidden="true">'
        +'<div class="rk-cloud lg" style="top:3%;left:-2%;animation:cloud-drift-a 8s ease-in-out infinite"></div>'
        +'<div class="rk-cloud" style="top:6%;right:3%;animation:cloud-drift-b 11s ease-in-out infinite 1.5s"></div>'
        +'<div class="rk-cloud sm" style="top:1.5%;left:30%;animation:cloud-drift-c 9s ease-in-out infinite 2.5s"></div>'
        +'<div class="rk-cloud sm" style="top:11%;right:20%;animation:cloud-drift-a 12s ease-in-out infinite 3.5s"></div>'
        +'<div class="rk-cloud lg" style="bottom:6%;right:-1%;animation:cloud-drift-b 10s ease-in-out infinite 2s;opacity:0.35"></div>'
        +'<div class="rk-cloud" style="bottom:16%;left:1%;animation:cloud-drift-c 13s ease-in-out infinite 4s;opacity:0.3"></div>'
        +'</div>');
    }
  }

  const race=document.getElementById('race-area');
  if (race) {
    race.innerHTML=!ranked.length
      ? '<div class="empty">Nenhuma startup cadastrada ainda.</div>'
      : ranked.map((s,i)=>{
          const pts=s.pts||0;
          const pct=maxP>0?Math.round(pts/maxP*100):0;
          const lv=getLevel(pts);
          const bw=Math.max(pct,pts>0?2:0);
          const sCats=catBySid[s.id]||{};
          const rawTotal=catDefs.reduce((sum,c)=>sum+Math.max(0,sCats[c.k]||0),0);
          const scale=(rawTotal>pts&&rawTotal>0)?pts/rawTotal:1;
          const catsHtml=pts>0
            ?catDefs.map(c=>{
                const p=Math.round(Math.max(0,sCats[c.k]||0)*scale);
                const w=pts>0?Math.min(100,Math.round(p/pts*100)):0;
                return `<div class="rcat-item">
                  <div class="rcat-lbl">${c.k}</div>
                  <div class="rcat-bar-bg"><div class="rcat-bar" style="width:${w}%;background:${c.color}"></div></div>
                  <div class="rcat-pts">${p||'—'}</div>
                </div>`;
              }).join('')
            :`<div class="rcat-empty">Nenhum ponto lançado ainda.</div>`;
          const ini=s.name.trim().split(/\s+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
          const avColor=_RKPAL[i%_RKPAL.length];
          const avHtml=`<div class="rav" style="flex-shrink:0"><div class="rav-ini" style="background:${avColor}">${ini}</div>${s.foto?`<img src="${safe(s.foto)}" class="rav-img" alt="">`:''}</div>`;
          const badgesHtml=[
            s.canvas_feito      ? '<span class="rbadge">🗺️ Canvas</span>'  : '',
            s.entrevistas       ? '<span class="rbadge">🗣️ Entrevistas</span>' : '',
            s.mvp_funcional     ? '<span class="rbadge">🚀 MVP</span>'     : '',
            s.pessoas_testando  ? '<span class="rbadge">👥 Usuários</span>': '',
            s.clientes_pagantes ? '<span class="rbadge gold">💰 Cliente</span>' : '',
          ].filter(Boolean).join('');
          const statsHtml=`<div class="rrow-stats">${s.aulas>0?`<span class="rstat">📚 ${s.aulas} aulas</span>`:''}${s.mentorias>0?`<span class="rstat">🧑‍💼 ${s.mentorias} mentorias</span>`:''}${badgesHtml}</div>`;
          return `<div class="rrow" data-sid="${safe(s.id)}" onclick="toggleRrow(this)">
            <div class="rrow-main">
              <div class="rpos">${i+1}</div>
              ${avHtml}
              <div class="rinfo"><div class="rname">${safe(s.name)}</div><div class="rmeta">Est. ${s.stage} · ${safe(s.area)}</div>${statsHtml}</div>
              <div class="rtrack"><div class="rbar-bg"><div class="rbar" style="width:${bw}%"></div></div></div>
              <div class="rright">
                <div class="rpts">${pts}</div>
                <div class="rpts-l">pontos</div>
                <div class="rlv ${lv.c}">${lv.n}</div>
              </div>
              <div class="rrow-chev">▾</div>
            </div>
            <div class="rrow-panel">
              <div class="rrow-cats">${catsHtml}</div>
            </div>
          </div>`;
        }).join('');
  }

  renderMap(ranked);
};

// Override refreshAdmin
window.refreshAdmin = async function() {
  const startups = await getSB();
  const rawLogs  = _sbReady ? await sbFetchLogs() : null;
  const logs     = rawLogs ? rawLogs.map(l2l) : getL();

  const totalPts=startups.reduce((a,s)=>a+(s.pts||0),0);
  const asS=document.getElementById('as-s'); if(asS) asS.textContent=startups.length;
  const asP=document.getElementById('as-p'); if(asP) asP.textContent=totalPts;
  const asA=document.getElementById('as-a'); if(asA) asA.textContent=getA().length;
  const asL=document.getElementById('as-l'); if(asL) asL.textContent=logs.length;

  renderTS();

  const histEl=document.getElementById('hist-list');
  if(histEl){
    histEl.innerHTML=logs.slice(0,100).map(l=>
      '<div class="hrow">'+
        '<div class="hdate">'+(l.date||'—')+'</div>'+ 
        '<div class="hcont">'+
          '<div class="hst">'+safe(l.sname||l.sid)+'</div>'+ 
          '<div class="hact">'+safe(l.ativ)+'</div>'+ 
          (l.obs?'<div class="hnote">'+safe(l.obs)+'</div>':'' )+
        '</div>'+ 
        '<div class="hpts">+'+l.pts+'</div>'+ 
      '</div>'
    ).join('') || '<div class="empty">Sem histórico ainda.</div>';
  }
  fillDrops();
};

const _origRenderTS = window.renderTS;
window.renderTS = async function(){
  if(_sbReady){
    const startups = await getSB();
    const sn=['','Ideação','Operação','Tração','Escala'];
    const tblS=document.getElementById('tbl-s');
    if(!tblS) return;
    tblS.innerHTML = startups.length===0
      ?`<tr><td colspan="6" class="empty" style="padding:2rem">Nenhuma startup cadastrada.</td></tr>`
      :startups.map(s=>{
        const p=s.pts||0;
        const lv=getLevel(p);
        return `<tr>
          <td class="td-n">${safe(s.name)}</td>
          <td style="color:rgba(255,255,255,0.55);font-size:12px">${safe(s.area)}</td>
          <td style="font-size:12px">Est. ${safe(s.stage)} — ${safe(sn[s.stage]||'')}</td>
          <td class="td-pt">${p}</td>
          <td><span class="rlv ${lv.c}">${lv.n}</span></td>
          <td><button class="ab" onclick="editS('${escapeJs(s.id)}')">Editar</button><button class="ab" onclick="openRedistribuir('${escapeJs(s.id)}','${escapeJs(s.name)}',${p})">Redistribuir</button><button class="ab del" onclick="deleteS('${escapeJs(s.id)}')">Excluir</button></td>
        </tr>`;
      }).join('');
  } else {
    _origRenderTS();
  }
};

// editS usa getS() (localStorage) para buscar pelo id, mas com Supabase os IDs são UUIDs
// que não existem no localStorage — por isso o formulário não abria
const _origEditS = window.editS;
window.editS = async function(id){
  if(!_sbReady){ _origEditS && _origEditS(id); return; }
  const startups = await getSB();
  const s = startups.find(x=>x.id===id);
  if(!s) return;
  document.getElementById('form-startup').style.display='block';
  document.getElementById('fst-title').textContent='Editar Startup';
  document.getElementById('st-nome').value=s.name;
  document.getElementById('st-area').value=s.area;
  document.getElementById('st-estagio').value=s.stage;
  document.getElementById('st-email').value=s.email||'';
  document.getElementById('st-foto').value=s.foto||'';
  document.getElementById('st-eid').value=id;
  _fotoFile = null;
  var fi = document.getElementById('st-foto-file'); if(fi) fi.value='';
  _setFotoPreview(s.foto||'');
  document.getElementById('form-startup').scrollIntoView({behavior:'smooth'});
};

const _origRenderHist = window.renderHist;
window.renderHist = async function(){
  if(_sbReady){
    const filter=document.getElementById('hist-filter')?.value||'';
    const rawLogs = await sbFetchLogs();
    const logs = rawLogs ? rawLogs.map(l2l) : [];
    let l = logs;
    if(filter) l = l.filter(x=>x.sid===filter);
    const el=document.getElementById('hist-list');
    if(!el) return;
    const cats=['Engajamento','Desenvolvimento','Tração','Bônus','Manual','Ajuste'];
    el.innerHTML = l.length===0
      ?`<div class="empty">Nenhum lançamento encontrado.</div>`
      :l.map(x=>{
          const d=x.date?x.date.split('-').reverse().join('/'):'—';
          const catOpts=cats.map(c=>`<option value="${c}"${x.cat===c?' selected':''}>${c}</option>`).join('');
          return `<div class="hrow-wrap" id="hwrap-${escapeJs(x.id)}">
            <div class="hrow">
              <div class="hdate">${d}</div>
              <div class="hcont">
                <div class="hst">${safe(x.sname)||'—'}</div>
                <div class="hact">${safe(x.ativ)||'—'}</div>
                ${x.obs?`<div class="hnote">${safe(x.obs)}${x.by?' · por '+safe(x.by):''}</div>`:''}
              </div>
              <div class="hpts">+${safe(x.pts)}</div>
              <button class="hedit" onclick="editL('${escapeJs(x.id)}')" title="Editar lançamento">✎</button>
              <button class="hdel" onclick="deleteL('${escapeJs(x.id)}')" title="Remover lançamento">✕</button>
            </div>
            <div class="hedit-panel">
              <div class="hedit-grid">
                <div>
                  <div class="hedit-label">Categoria</div>
                  <select class="fc-inp" id="hef-cat-${escapeJs(x.id)}">${catOpts}</select>
                </div>
                <div>
                  <div class="hedit-label">Descrição</div>
                  <input class="fc-inp" type="text" id="hef-desc-${escapeJs(x.id)}" value="${safe(x.ativ)}" maxlength="200">
                </div>
                <div>
                  <div class="hedit-label">Observação</div>
                  <input class="fc-inp" type="text" id="hef-obs-${escapeJs(x.id)}" value="${safe(x.obs)}" maxlength="500">
                </div>
                <div>
                  <div class="hedit-label">Data</div>
                  <input class="fc-inp" type="date" id="hef-date-${escapeJs(x.id)}" value="${x.date||''}">
                </div>
              </div>
              <div class="hedit-actions">
                <button class="btn-s" onclick="saveEditL('${escapeJs(x.id)}')">Salvar</button>
                <button class="hedit-cancel" onclick="closeEditL('${escapeJs(x.id)}')">Cancelar</button>
              </div>
            </div>
          </div>`;
        }).join('');
  } else {
    _origRenderHist();
  }
};

function editL(id){
  document.querySelectorAll('.hrow-wrap.editing').forEach(function(w){
    if(w.id!=='hwrap-'+id) w.classList.remove('editing');
  });
  var wrap=document.getElementById('hwrap-'+id);
  if(wrap) wrap.classList.toggle('editing');
}

function closeEditL(id){
  var wrap=document.getElementById('hwrap-'+id);
  if(wrap) wrap.classList.remove('editing');
}

async function saveEditL(id){
  var cat=document.getElementById('hef-cat-'+id)?.value;
  var desc=document.getElementById('hef-desc-'+id)?.value?.trim();
  var obs=document.getElementById('hef-obs-'+id)?.value?.trim();
  var date=document.getElementById('hef-date-'+id)?.value;
  if(!cat){showToast('Selecione uma categoria.');return;}
  var body={categoria:cat};
  if(desc) body.descricao=desc;
  if(obs!==undefined) body.obs=obs;
  if(date) body.criado_em=date+'T12:00:00Z';
  var r=await fetch(BACKEND_URL+'/api/pontuacoes/'+encodeURIComponent(id),{method:'PUT',headers:authHeaders(),body:JSON.stringify(body)});
  if(handleUnauthorized(r)) return;
  if(!r.ok){var d=await r.json().catch(function(){return{error:'Erro desconhecido'};});showToast('Erro: '+d.error);return;}
  showToast('Lançamento atualizado!');
  renderHist();
}

const _origDeleteS = window.deleteS;
window.deleteS = async function(id){
  if(_sbReady){
    if(!confirm('Excluir esta startup? Os lançamentos associados serão removidos junto.')) return;
    const r = await fetch(BACKEND_URL+'/api/startups/'+encodeURIComponent(id),{method:'DELETE',headers:authHeaders()});
    if(handleUnauthorized(r)) return;
    if(!r.ok){ const d=await r.json().catch(()=>({error:'Erro desconhecido'})); showToast('Erro: '+d.error); return; }
    _sbCache = null;
    showToast('Startup removida.');
    refreshAdmin();
  } else {
    _origDeleteS(id);
  }
};

const _origDeleteL = window.deleteL;
window.deleteL = async function(id){
  if(_sbReady){
    if(!confirm('Remover este lançamento? Os pontos serão descontados do ranking.')) return;
    const r = await fetch(BACKEND_URL+'/api/pontuacoes/'+encodeURIComponent(id),{method:'DELETE',headers:authHeaders()});
    if(handleUnauthorized(r)) return;
    if(!r.ok){ const d=await r.json().catch(()=>({error:'Erro desconhecido'})); showToast('Erro: '+d.error); return; }
    showToast('Lançamento removido.');
    refreshAdmin();
  } else {
    _origDeleteL(id);
  }
};

// Override lancarPontos
window.lancarPontos = async function() {
  const sid  = document.getElementById('ln-startup')?.value;
  const aid  = document.getElementById('ln-ativ')?.value;
  const pts  = parseInt(document.getElementById('ln-pts')?.value)||0;
  const tipo = document.getElementById('ln-tipo')?.value||'add';
  const obs  = document.getElementById('ln-obs')?.value?.trim()||'';
  const by   = document.getElementById('ln-by')?.value?.trim()||'';
  const date = document.getElementById('ln-data')?.value||new Date().toISOString().slice(0,10);
  if(!sid||!pts||pts<1){showToast('Preencha startup e pontos');return;}
  const finalPts = tipo === 'rem' ? -pts : pts;

  // Se ainda não conectou, tenta uma vez antes de desistir
  if (!_sbReady) {
    const retry = await sbFetch();
    if (retry !== null) {
      _sbReady = true;
      _sbCache = retry.map(s2l);
      if (typeof fillDrops === 'function') await fillDrops();
    }
  }

  const ativ=getA().find(a=>a.id===aid);
  if(_sbReady){
    const descricao = tipo==='rem'
      ? `Remoção de ${pts} pts${ativ?' ('+ativ.name+')':''}`
      : (ativ?.name||'Atividade manual');
    const categoria = tipo==='rem' ? 'Ajuste' : (ativ?.cat||'Manual');
    const r = await fetch(BACKEND_URL+'/api/pontuacoes',{method:'POST',headers:authHeaders(),body:JSON.stringify({startup_id:sid,descricao,categoria,pontos:pts,tipo,obs,lancado_por:by,criado_em:date+'T12:00:00Z'})});
    if(handleUnauthorized(r)) return;
    if(!r.ok){ const d=await r.json().catch(()=>({error:'Erro desconhecido'})); showToast('Erro: '+d.error);return; }
    _sbCache=null;
    showToast(tipo==='rem'?'-'+pts+' pts removidos!':'+'+pts+' pts registrados!');
    clearLancar();
    refreshAdmin();
  } else {
    showToast('Conexão ao Supabase indisponível. Não é possível lançar pontos.');
  }
};

// ── Foto upload helpers ──────────────────────────────────────
var _fotoFile = null; // file selected locally

window.onFotoFileChange = function(input) {
  _fotoFile = input.files[0] || null;
  if (_fotoFile) {
    var reader = new FileReader();
    reader.onload = function(e) { _setFotoPreview(e.target.result); };
    reader.readAsDataURL(_fotoFile);
    document.getElementById('st-foto').value = '';
  }
};

window.onFotoUrlChange = function(input) {
  _fotoFile = null;
  _setFotoPreview(input.value.trim());
};

function _setFotoPreview(src) {
  var p = document.getElementById('foto-preview');
  if (!p) return;
  if (src) {
    p.innerHTML = '<img src="'+src+'" alt="" onerror="this.style.display=\'none\'">';
  } else {
    p.innerHTML = '<span class="foto-preview-ph">Sem foto</span>';
  }
}

async function _uploadFotoStorage(file) {
  var url = BACKEND_URL + '/api/upload-foto?name=' + encodeURIComponent(file.name);
  var r = await fetch(url, {
    method: 'POST',
    headers: Object.assign(authHeaders(), {'Content-Type': file.type}),
    body: file
  });
  if (!r.ok) {
    var e = await r.json().catch(function(){ return {}; });
    throw new Error(e.error || ('HTTP ' + r.status));
  }
  var d = await r.json();
  return d.url;
}

// Override saveStartup
window.saveStartup = async function() {
  const name  = document.getElementById('st-nome')?.value.trim();
  const area  = document.getElementById('st-area')?.value.trim();
  const stage = parseInt(document.getElementById('st-estagio')?.value)||1;
  const email = document.getElementById('st-email')?.value.trim()||'';
  const eid   = document.getElementById('st-eid')?.value;
  if(!name||!area){showToast('Preencha nome e área');return;}

  let foto = document.getElementById('st-foto')?.value.trim()||'';

  if (_fotoFile) {
    try {
      showToast('Enviando foto…');
      foto = await _uploadFotoStorage(_fotoFile);
    } catch(err) {
      showToast('Erro no upload da foto: ' + err.message);
      return;
    }
  }

  if(_sbReady){
    if(eid){
      const r=await fetch(BACKEND_URL+'/api/startups/'+encodeURIComponent(eid),{method:'PUT',headers:authHeaders(),body:JSON.stringify({nome:name,area,email,estagio:stage,foto_url:foto})});
      if(handleUnauthorized(r)) return;
      if(!r.ok){ showToast('Erro ao atualizar startup'); return; }
      showToast('Startup atualizada!');
    } else {
      const r=await fetch(BACKEND_URL+'/api/startups',{method:'POST',headers:authHeaders(),body:JSON.stringify({nome:name,area,email,estagio:stage,nivel:'Explorador',pontos:0,ativo:true,foto_url:foto})});
      if(handleUnauthorized(r)) return;
      if(!r.ok){ showToast('Erro ao cadastrar startup'); return; }
      showToast('Startup cadastrada!');
    }
    _fotoFile = null;
    _sbCache=null; closeForm('form-startup'); refreshAdmin();
  } else {
    showToast('Conexão ao Supabase indisponível. Não é possível salvar startup.');
  }
};

// Override updateHome — usa Supabase quando disponível
const _origUH = window.updateHome;
window.updateHome = async function() {
  if (_sbReady) {
    const startups = await getSB();
    const totalPts = startups.reduce(function(a, s){ return a + (s.pts || 0); }, 0);
    const hn = document.getElementById('hn-s');
    const hp = document.getElementById('hn-p');
    if (hn) hn.textContent = startups.length;
    if (hp) hp.textContent = totalPts;
    const h = document.getElementById('hn-startups-h');
    if (h) h.textContent = startups.length + ' startups';
    const chips = document.getElementById('startups-chips');
    if (chips) chips.innerHTML = startups.map(s => `<div class="chip"><div class="chip-n">${safe(s.name)}</div><div class="chip-a">${safe(s.area)}</div><span class="chip-s st${s.stage}">Est. ${s.stage}</span></div>`).join('');
  } else {
    _origUH();
  }
};

// Override fillDrops — sempre tenta Supabase (getSB faz fallback p/ localStorage se falhar)
window.fillDrops = async function() {
  const ss  = await getSB();   // retorna UUIDs do Supabase ou IDs do localStorage
  const av  = getA();
  const selS = document.getElementById('ln-startup');
  const selA = document.getElementById('ln-ativ');
  const hf   = document.getElementById('hist-filter');
  if (selS) selS.innerHTML = ss.map(s => `<option value="${safe(s.id)}">${safe(s.name)}</option>`).join('');
  if (selA) selA.innerHTML = av.map(a => `<option value="${safe(a.id)}" data-pts="${safe(a.pts)}">${safe(a.name)} (${safe(a.pts)} pts)</option>`).join('');
  if (hf)   hf.innerHTML   = `<option value="">Todas as startups</option>` + ss.map(s => `<option value="${safe(s.id)}">${safe(s.name)}</option>`).join('');
};

function selParaPontuar(id) {
  aTab('lancar');
  const sel=document.getElementById('ln-startup');
  if(sel) sel.value=id;
  document.getElementById('asec-lancar')?.scrollIntoView({behavior:'smooth'});
}


async function openRedistribuir(id, name, pts) {
  const rawLogs = await sbFetchLogs();
  const sCats = {};
  if (rawLogs) {
    rawLogs.filter(function(l){ return l.startup_id===id && l.pontos>0; }).forEach(function(l){
      var cat = l.categoria||'Manual';
      sCats[cat] = (sCats[cat]||0) + l.pontos;
    });
  }
  const cats = [
    {k:'Engajamento',label:'🔵 Engajamento'},
    {k:'Desenvolvimento',label:'🟢 Desenvolvimento'},
    {k:'Tração',label:'🟠 Tração'},
    {k:'Bônus',label:'🟡 Bônus'},
  ];
  const rawTotal = cats.reduce(function(s,c){ return s+Math.max(0,sCats[c.k]||0); },0);
  const scale = rawTotal>pts && rawTotal>0 ? pts/rawTotal : 1;

  var panel = document.getElementById('form-redistribuir');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'form-redistribuir';
    var asec = document.getElementById('asec-startups');
    if (asec) asec.insertBefore(panel, asec.firstChild);
  }

  var inputs = cats.map(function(c){
    var cur = Math.round(Math.max(0,sCats[c.k]||0)*scale);
    return '<div><div class="fc-label">'+c.label+'</div>'
      +'<input class="fc-inp" type="number" min="0" id="rd-'+c.k+'" value="'+cur+'" oninput="updateRedistribSum()"></div>';
  }).join('');

  panel.innerHTML = '<div class="fc-card" style="margin-bottom:1.5rem">'
    +'<div class="fc-head">Atribuir Pontos por Categoria — '+safe(name)+'</div>'
    +'<p style="font-size:12px;color:rgba(255,255,255,.6);margin:8px 0 16px">'
    +'Os lançamentos anteriores serão substituídos pelo total que você definir abaixo. Pontos atuais: <strong style="color:var(--orange)">'+pts+'</strong>.</p>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">'+inputs+'</div>'
    +'<p style="font-size:12px;color:rgba(255,255,255,.55);margin-bottom:14px">'
    +'Total novo: <strong id="redistrib-sum" style="color:var(--orange)">0</strong> pts</p>'
    +'<div style="display:flex;gap:10px">'
    +'<button class="btn-s" onclick="saveRedistribuicao(\''+escapeJs(id)+'\')">Confirmar</button>'
    +'<button class="btn-s" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)" onclick="closeRedistribuir()">Cancelar</button>'
    +'</div></div>';

  panel.style.display = 'block';
  updateRedistribSum();
  panel.scrollIntoView({behavior:'smooth'});
}

function updateRedistribSum() {
  var cats = ['Engajamento','Desenvolvimento','Tração','Bônus'];
  var sum = cats.reduce(function(s,c){ return s+(parseInt(document.getElementById('rd-'+c)?.value)||0); },0);
  var sumEl = document.getElementById('redistrib-sum');
  if (sumEl) { sumEl.textContent = sum; sumEl.style.color = sum>0 ? 'var(--orange)' : 'rgba(255,255,255,.5)'; }
}

function closeRedistribuir() {
  var panel = document.getElementById('form-redistribuir');
  if (panel) panel.style.display = 'none';
}

async function resetAllPontos() {
  if (!confirm('⚠️ Zerar TODOS os pontos e TODOS os lançamentos de TODAS as startups?\n\nEsta ação não pode ser desfeita.')) return;
  const r = await fetch(BACKEND_URL+'/api/admin/reset-pontos', {method:'POST', headers:authHeaders()});
  if (handleUnauthorized(r)) return;
  if (!r.ok) { const d=await r.json().catch(()=>({error:'Erro desconhecido'})); showToast('Erro: '+d.error); return; }
  _sbCache = null;
  showToast('Todos os pontos e lançamentos foram zerados.');
  refreshAdmin();
  renderRanking();
}

async function saveRedistribuicao(id) {
  var cats = ['Engajamento','Desenvolvimento','Tração','Bônus'];
  var categorias = {};
  var sum = 0;
  cats.forEach(function(c){
    var v = parseInt(document.getElementById('rd-'+c)?.value)||0;
    if (v>0) categorias[c]=v;
    sum += v;
  });
  if (sum === 0) { showToast('Informe pelo menos uma categoria.'); return; }
  var r = await fetch(BACKEND_URL+'/api/startups/'+encodeURIComponent(id)+'/redistribuir', {
    method:'POST', headers:authHeaders(), body:JSON.stringify({categorias:categorias})
  });
  if (handleUnauthorized(r)) return;
  if (!r.ok) { var d=await r.json().catch(function(){return{error:'Erro'};}); showToast('Erro: '+d.error); return; }
  showToast('Pontos atribuídos com sucesso!');
  closeRedistribuir();
  _sbCache = null;
  refreshAdmin();
  renderRanking();
}

function renderMap(ranked) {
  var box = document.getElementById('expmap-box');
  if (!box) return;

  var maxPts = ranked.reduce(function(m,s){ return Math.max(m,s.pts||0); }, 0);
  var goal = Math.max(300, Math.ceil(maxPts / 50) * 50);

  function pct(pts) {
    return (!pts||!goal) ? 0 : Math.min((pts/goal)*92, 92);
  }

  var lanesHtml = ranked.map(function(s, i) {
    var pts = s.pts || 0;
    var p = pct(pts);
    var color = _RKPAL[i % _RKPAL.length];
    var ini = s.name.trim().split(/\s+/).map(function(w){ return w[0]||''; }).join('').slice(0,2).toUpperCase();
    var rankIco = i===0?'🥇':i===1?'🥈':i===2?'🥉':null;
    var leadCls = i===0?' lead':'';
    var avInner = s.foto
      ? '<div class="rav-ini" style="background:'+color+'">'+ini+'</div><img src="'+safe(s.foto)+'" class="rav-img" alt="">'
      : '<div class="rav-ini" style="background:'+color+'">'+ini+'</div>';
    return '<div class="race-lane'+leadCls+'" data-sid="'+safe(s.id)+'">'
      + '<div class="rl-info">'
      +   '<div class="rl-rk">'+(rankIco?'<span>'+rankIco+'</span>':'<span class="rl-rn">'+(i+1)+'</span>')+'</div>'
      +   '<div class="rl-nm" title="'+safe(s.name)+'">'+safe(s.name)+'</div>'
      + '</div>'
      + '<div class="rl-track">'
      +   '<div class="rl-fin"></div>'
      +   '<div class="rl-prog" data-w="'+p+'%">'
      +     '<div class="rl-bar" style="background:linear-gradient(90deg,'+color+'88,'+color+')"></div>'
      +     '<div class="rl-piece"><div class="rl-rav">'+avInner+'</div></div>'
      +   '</div>'
      + '</div>'
      + '<div class="rl-pts">'+pts+'</div>'
      + '</div>';
  }).join('');

  box.innerHTML = '<div class="race-wrap">'
    + '<div class="race-hd">'
    +   '<span class="race-hd-t">🏇 Corrida de Pontos</span>'
    +   '<span class="race-hd-m">🏁 Meta: '+goal+' pts</span>'
    + '</div>'
    + '<div class="race-ls">'+lanesHtml+'</div>'
    + '</div>';

  // Animate pieces into position with stagger
  setTimeout(function() {
    box.querySelectorAll('.rl-prog').forEach(function(el, i) {
      el.style.transitionDelay = (i * 0.055) + 's';
      el.style.width = el.dataset.w;
    });
  }, 150);

  // Click → highlight card in ranking
  box.querySelectorAll('.race-lane').forEach(function(lane) {
    lane.addEventListener('click', function() {
      var sid = lane.dataset.sid;
      var card = document.querySelector('.rrow[data-sid="'+sid+'"]');
      if (card) {
        document.querySelectorAll('.rrow').forEach(function(r){ r.classList.remove('rrow-highlight'); });
        card.classList.add('rrow-highlight');
        card.scrollIntoView({behavior:'smooth', block:'center'});
        setTimeout(function(){ card.classList.remove('rrow-highlight'); }, 2500);
      }
    });
  });
}

(async function() {
  try {
    const data=await sbFetch();
    if(data!==null){
      _sbReady=true;
      _sbCache=data.length?data.map(s2l):null;
      console.info('[SB] Conectado: '+data.length+' startups');
      if (typeof fillDrops === 'function') fillDrops();
      if (typeof updateHome === 'function') updateHome();
      const rankPage = document.getElementById('page-ranking');
      if (rankPage && rankPage.classList.contains('on') && typeof renderRanking === 'function') renderRanking();
      const hn=document.getElementById('hn-s');
      if(hn&&data.length) hn.textContent=data.length;
    }
  } catch(e){ console.warn('[SB] Offline - localStorage'); }
})();
