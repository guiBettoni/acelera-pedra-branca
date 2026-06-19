// Leitura pública via Supabase REST API (chave anon — somente SELECT)
// Escrita protegida via backend local (BACKEND_URL em app.js)
const SUPABASE_URL = 'https://rircwnjahxebkgcvzfek.supabase.co';
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
    id:s.id, name:s.nome, area:s.area, stage:s.estagio||1, email:s.email||'', pts:s.pontos||0,
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
        return `<div class="pod ${mi.cls}">
          <div class="pod-rank-num">${rn}</div>
          <div class="pod-shield">
            <div class="pod-ico">${mi.m}</div>
            <div class="pod-av">${ini}</div>
            <div class="pod-nm">${safe(s.name)}</div>
            <div class="pod-area-s">${safe(s.area)}</div>
            <div class="pod-ptsrow"><span class="pod-ptsn">${s.pts||0}</span><span class="pod-ptsl">pts</span></div>
            <div class="pod-lvb">${lv.n}</div>
          </div>
          <div class="pod-pedestal"></div>
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
  document.getElementById('st-eid').value=id;
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

// Override saveStartup
window.saveStartup = async function() {
  const name  = document.getElementById('st-nome')?.value.trim();
  const area  = document.getElementById('st-area')?.value.trim();
  const stage = parseInt(document.getElementById('st-estagio')?.value)||1;
  const email = document.getElementById('st-email')?.value.trim()||'';
  const eid   = document.getElementById('st-eid')?.value;
  if(!name||!area){showToast('Preencha nome e área');return;}
  if(_sbReady){
    if(eid){
      const r=await fetch(BACKEND_URL+'/api/startups/'+encodeURIComponent(eid),{method:'PUT',headers:authHeaders(),body:JSON.stringify({nome:name,area,email,estagio:stage})});
      if(handleUnauthorized(r)) return;
      if(!r.ok){ showToast('Erro ao atualizar startup'); return; }
      showToast('Startup atualizada!');
    } else {
      const r=await fetch(BACKEND_URL+'/api/startups',{method:'POST',headers:authHeaders(),body:JSON.stringify({nome:name,area,email,estagio:stage,nivel:'Explorador',pontos:0,ativo:true})});
      if(handleUnauthorized(r)) return;
      if(!r.ok){ showToast('Erro ao cadastrar startup'); return; }
      showToast('Startup cadastrada!');
    }
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
  var svg = document.getElementById('expmap-svg');
  if (!svg) return;

  var ns = 'http://www.w3.org/2000/svg';
  function mk(tag, attrs, txt) {
    var el = document.createElementNS(ns, tag);
    if (attrs) Object.keys(attrs).forEach(function(k){ el.setAttribute(k, attrs[k]); });
    if (txt !== undefined) el.textContent = txt;
    return el;
  }

  var PALETTE = ['#E86060','#45D6A2','#FFD040','#60A8F0','#FF8A80','#AB8BE0','#60C4BF','#FFB04A','#F07090','#90D060','#60C0F4','#FF9050'];
  var MAX_PTS = 300;
  svg.innerHTML = '';

  // ── ÁGUA ──
  svg.appendChild(mk('rect', {x:0, y:0, width:800, height:380, fill:'#3A7DC4'}));
  for (var wy = 14; wy < 380; wy += 18) {
    svg.appendChild(mk('path', {
      d:'M0,'+wy+' Q200,'+(wy-5)+' 400,'+wy+' Q600,'+(wy+5)+' 800,'+wy,
      stroke:'rgba(255,255,255,0.06)', 'stroke-width':'10', fill:'none'
    }));
  }
  [[48,28],[140,68],[276,22],[418,52],[558,26],[698,62],[22,188],[782,168],[88,286],[498,336],[656,276],[348,356]].forEach(function(xy){
    svg.appendChild(mk('ellipse', {cx:xy[0], cy:xy[1], rx:5, ry:2, fill:'rgba(255,255,255,0.22)', transform:'rotate(-15,'+xy[0]+','+xy[1]+')'}));
  });

  // ── ILHAS (brown cliff + green terrain + trees) ──
  var islands = [
    { brown:'32,378 182,378 188,332 164,282 116,263 66,267 28,307 20,352',
      green:'42,332 176,328 170,279 116,252 68,257 34,299',
      cx:104, cy:298, name:'IDEAÇÃO',
      trees:[[70,252],[100,244],[130,247],[158,254],[86,238],[118,236],[148,240]] },
    { brown:'210,370 402,365 410,317 384,272 330,252 266,256 218,294 206,342',
      green:'220,320 394,316 396,275 362,244 326,239 268,244 226,286',
      cx:304, cy:292, name:'VALIDAÇÃO',
      trees:[[270,239],[300,231],[332,233],[360,241],[286,224],[316,219],[346,227]] },
    { brown:'486,316 698,306 710,263 683,222 635,195 568,189 503,207 476,259',
      green:'496,273 692,263 698,235 664,205 626,183 566,177 510,195 488,253',
      cx:590, cy:235, name:'TRAÇÃO',
      trees:[[512,177],[546,169],[576,171],[608,177],[542,158],[576,155],[606,163]] },
    { brown:'230,218 464,209 474,167 447,123 389,91 327,85 264,102 226,147',
      green:'240,170 456,162 461,139 428,109 380,79 324,73 266,90 238,131',
      cx:348, cy:137, name:'ESCALA',
      trees:[[272,74],[306,64],[338,68],[368,74],[318,54],[352,50],[382,60]] },
    { brown:'586,156 762,148 770,107 741,67 694,37 643,25 592,33 569,77 565,121',
      green:'595,113 754,105 760,81 726,49 686,25 641,13 598,23 578,69',
      cx:664, cy:79, name:'DEMO DAY',
      trees:[[606,17],[634,7],[662,11],[688,17],[646,3],[610,3]] }
  ];

  islands.forEach(function(isl) {
    svg.appendChild(mk('polygon', {points:isl.brown, fill:'#7C4E28'}));
    svg.appendChild(mk('polygon', {points:isl.green, fill:'#3F8034'}));
    isl.trees.forEach(function(t) {
      svg.appendChild(mk('ellipse', {cx:t[0]+2, cy:t[1]+5, rx:9, ry:5.5, fill:'rgba(0,0,0,0.20)'}));
      svg.appendChild(mk('circle',  {cx:t[0], cy:t[1], r:'9', fill:'#2A6820'}));
      svg.appendChild(mk('ellipse', {cx:t[0]-3, cy:t[1]-3, rx:4, ry:3, fill:'#52A840'}));
    });
    svg.appendChild(mk('text', {
      x:isl.cx, y:isl.cy+18, 'text-anchor':'middle',
      fill:'rgba(255,255,255,0.65)', 'font-size':'7.5', 'font-weight':'700',
      'font-family':'system-ui,sans-serif', 'letter-spacing':'0.09em', 'pointer-events':'none'
    }, isl.name));
  });

  // ── PATH BEADS (Mario style dotted trail) ──
  var pathD = 'M 104,300 C 194,300 246,300 304,292 C 374,284 448,262 574,238 C 636,226 694,213 736,193 C 770,176 750,151 708,135 C 680,122 640,117 598,113 C 556,109 510,109 466,111 C 426,113 388,117 348,135 C 326,145 316,127 328,105 C 342,79 496,67 664,79';
  var refPath = mk('path', {d:pathD, fill:'none', stroke:'transparent', 'stroke-width':'1'});
  svg.appendChild(refPath);

  var pathLen = refPath.getTotalLength();
  var numDots = Math.floor(pathLen / 13);
  for (var di = 0; di <= numDots; di++) {
    var dp = refPath.getPointAtLength(di * 13);
    svg.appendChild(mk('circle', {cx:dp.x, cy:dp.y, r:'3.5', fill:'rgba(255,248,195,0.88)', 'pointer-events':'none'}));
  }

  // ── CHECKPOINT NODES (numbered, gold) ──
  [{f:0.00,n:'1'},{f:0.20,n:'2'},{f:0.42,n:'3'},{f:0.65,n:'4'},{f:0.88,n:'5'}].forEach(function(cp) {
    var cpt = refPath.getPointAtLength(cp.f * pathLen);
    svg.appendChild(mk('circle', {cx:cpt.x, cy:cpt.y, r:16, fill:'rgba(255,210,40,0.14)', 'pointer-events':'none'}));
    svg.appendChild(mk('circle', {cx:cpt.x, cy:cpt.y, r:11, fill:'#0D2E38', stroke:'#FFD040', 'stroke-width':'2.5', 'pointer-events':'none'}));
    svg.appendChild(mk('text', {x:cpt.x, y:cpt.y+4.5, 'text-anchor':'middle', fill:'#FFD040', 'font-size':'10.5', 'font-weight':'900', 'font-family':'system-ui,sans-serif', 'pointer-events':'none'}, cp.n));
  });

  // ── STARTUP PIECES ──
  var tooltip = document.getElementById('map-tooltip');
  var posTrack = {};
  ranked.slice().sort(function(a,b){ return (a.pts||0)-(b.pts||0); }).forEach(function(s) {
    var origIdx = ranked.findIndex(function(r){ return r.id===s.id; });
    var color = PALETTE[origIdx % PALETTE.length];
    var pts = s.pts || 0;
    var frac = pts <= 0 ? 0.01 + (origIdx % 8) * 0.008 : Math.min(pts / MAX_PTS, 0.97);
    var sp = refPath.getPointAtLength(frac * pathLen);
    var px = Math.round(frac * 100);
    var off = posTrack[px] || 0;
    posTrack[px] = off + 1;
    var bx = sp.x + (off % 3) * 9 - 9;
    var by = sp.y - 2 + Math.floor(off / 3) * -9;
    var ini = s.name.trim().split(/\s+/).map(function(w){ return w[0]||''; }).join('').slice(0,2).toUpperCase();

    var g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'map-piece');
    g.setAttribute('data-id', s.id);
    g.style.cursor = 'pointer';
    g.appendChild(mk('ellipse', {cx:bx+2, cy:by+5, rx:10, ry:5.5, fill:'rgba(0,0,0,0.32)'}));
    var c = mk('circle', {cx:bx, cy:by, r:'11', fill:color, stroke:'rgba(255,255,255,0.92)', 'stroke-width':'2'});
    g.appendChild(c);
    g.appendChild(mk('ellipse', {cx:bx-3, cy:by-4, rx:4.5, ry:3.5, fill:'rgba(255,255,255,0.32)', 'pointer-events':'none'}));
    g.appendChild(mk('text', {x:bx, y:by+3.5, 'text-anchor':'middle', fill:'rgba(0,0,0,0.82)', 'font-size':'7.5', 'font-weight':'900', 'font-family':'system-ui,sans-serif', 'pointer-events':'none'}, ini));

    (function(_s, _c, _col) {
      g.addEventListener('click', function() {
        document.querySelectorAll('.map-piece circle').forEach(function(pc){ if(pc.getAttribute('r')==='11') pc.setAttribute('stroke-width','2'); });
        _c.setAttribute('stroke-width','3.5');
        var card = document.querySelector('.rrow[data-sid="'+_s.id+'"]');
        if (card) {
          document.querySelectorAll('.rrow').forEach(function(r){ r.classList.remove('rrow-highlight'); });
          card.classList.add('rrow-highlight');
          card.scrollIntoView({behavior:'smooth', block:'center'});
          setTimeout(function(){ card.classList.remove('rrow-highlight'); }, 2500);
        }
        if (tooltip) {
          tooltip.textContent = _s.name + ' · ' + (_s.pts||0) + ' pts';
          tooltip.style.background = _col;
          tooltip.classList.add('show');
          setTimeout(function(){ tooltip.classList.remove('show'); }, 2500);
        }
      });
    })(s, c, color);

    svg.appendChild(g);
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
