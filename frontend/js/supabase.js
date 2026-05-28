// Leitura pública via Supabase REST API (chave anon — somente SELECT)
// Escrita protegida via backend local (BACKEND_URL em app.js)
const SUPABASE_URL = 'https://rircwnjahxebkgcvzfek.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcmN3bmphaHhlYmtnY3Z6ZmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzOTI0NTMsImV4cCI6MjA5NDk2ODQ1M30.9R25XApE3vKGfYe6kuEnBcCPphPU9tWh5rMSEgJBw_Y';
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
  // 'Acelerador' é valor legado no banco — mapeado igual a 'Acelerado'
  const m={'Explorador':1,'Construtor':2,'Acelerado':3,'Acelerador':3,'Destaque':4,'Elite':5};
  return {id:s.id,name:s.nome,area:s.area,stage:m[s.nivel]||1,email:s.email||'',pts:s.pontos||0};
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
        return '<div class="pod '+mi.cls+'">'+
          '<div class="pod-medal">'+mi.m+'</div>'+
          '<div class="pod-pos '+mi.p+'">'+mi.pos+'</div>'+
          '<div class="pod-name">'+safe(s.name)+'</div>'+
          '<div class="pod-area">'+safe(s.area)+'</div>'+
          '<div class="pod-pts '+mi.p+'">'+( s.pts||0)+'</div>'+
          '<div class="pod-lbl">pontos</div>'+
          '<div class="pod-lv '+lv.c+'">'+lv.n+'</div>'+
        '</div>';
      }).join('');
    }
  }

  const race=document.getElementById('race-area');
  if (race) {
    race.innerHTML=!ranked.length
      ? '<div class="empty">Nenhuma startup cadastrada ainda.</div>'
      : ranked.map((s,i)=>{
          const pct=maxP>0?Math.round((s.pts||0)/maxP*100):0;
          const lv=getLevel(s.pts||0);
          const bw=Math.max(pct,(s.pts||0)>0?2:0);
          return '<div class="rrow">'+
            '<div class="rpos">'+(i+1)+'</div>'+
            '<div class="rinfo">'+
              '<div class="rname">'+safe(s.name)+'</div>'+
              '<div class="rmeta">'+safe(s.area)+'</div>'+
              '<div class="rtrack"><div class="rbar-bg"><div class="rbar" style="width:'+bw+'%"></div></div></div>'+
            '</div>'+
            '<div class="rright">'+
              '<div class="rpts">'+(s.pts||0)+'</div>'+
              '<div class="rpts-l">pontos</div>'+
              '<div class="rlv '+lv.c+'">'+lv.n+'</div>'+
            '</div>'+
          '</div>';
        }).join('');
  }
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

  const tblS=document.getElementById('tbl-s');
  if(tblS){
    tblS.innerHTML=startups.map(s=>{
      const lv=getLevel(s.pts||0);
      return '<tr>'+ 
        '<td class="td-n">'+safe(s.name)+'</td>'+ 
        '<td>'+safe(s.area)+'</td>'+ 
        '<td><span class="chip-s '+(s.stage==1?'st1':s.stage==2?'st2':s.stage==3?'st3':'st4')+'">Est.'+safe(s.stage)+'</span></td>'+ 
        '<td class="td-pt">'+(s.pts||0)+'</td>'+ 
        '<td><span class="rlv '+lv.c+'">'+lv.n+'</span></td>'+ 
        '<td>'+ 
          '<button class="ab" onclick="editS(\'' + escapeJs(s.id) + '\')">Editar</button> '+
          '<button class="ab" onclick="selParaPontuar(\'' + escapeJs(s.id) + '\')">Pontuar</button>'+ 
        '</td>'+ 
      '</tr>';
    }).join('');
  }

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
          <td><button class="ab" onclick="editS('${escapeJs(s.id)}')">Editar</button><button class="ab del" onclick="deleteS('${escapeJs(s.id)}')">Excluir</button></td>
        </tr>`;
      }).join('');
  } else {
    _origRenderTS();
  }
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
    el.innerHTML = l.length===0
      ?`<div class="empty">Nenhum lançamento encontrado.</div>`
      :l.map(x=>{
          const d=x.date?x.date.split('-').reverse().join('/'):'—';
          return `<div class="hrow">
            <div class="hdate">${d}</div>
            <div class="hcont">
              <div class="hst">${safe(x.sname)||'—'}</div>
              <div class="hact">${safe(x.ativ)||'—'}</div>
              ${x.obs?`<div class="hnote">${safe(x.obs)}${x.by?' · por '+safe(x.by):''}</div>`:''}
            </div>
            <div class="hpts">+${safe(x.pts)}</div>
            <button class="hdel" onclick="deleteL('${escapeJs(x.id)}')" title="Remover lançamento">✕</button>
          </div>`;
        }).join('');
  } else {
    _origRenderHist();
  }
};

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
  const obs  = document.getElementById('ln-obs')?.value?.trim()||'';
  const by   = document.getElementById('ln-by')?.value?.trim()||'';
  const date = document.getElementById('ln-data')?.value||new Date().toISOString().slice(0,10);
  if(!sid||!pts||pts<1){showToast('Preencha startup e pontos');return;}

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
    // Post pontuação to backend; backend will update startup points
    const r = await fetch(BACKEND_URL+'/api/pontuacoes',{method:'POST',headers:authHeaders(),body:JSON.stringify({startup_id:sid,descricao:ativ?.name||'Atividade manual',categoria:ativ?.cat||'Manual',pontos:pts,obs,lancado_por:by,criado_em:date+'T12:00:00Z'})});
    if(handleUnauthorized(r)) return;
    if(!r.ok){ const d=await r.json().catch(()=>({error:'Erro desconhecido'})); showToast('Erro: '+d.error);return; }
    _sbCache=null;
    showToast('+'+pts+' pts registrados!');
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
      const r=await fetch(BACKEND_URL+'/api/startups/'+encodeURIComponent(eid),{method:'PUT',headers:authHeaders(),body:JSON.stringify({nome:name,area,email})});
      if(handleUnauthorized(r)) return;
      if(!r.ok){ showToast('Erro ao atualizar startup'); return; }
      showToast('Startup atualizada!');
    } else {
      const r=await fetch(BACKEND_URL+'/api/startups',{method:'POST',headers:authHeaders(),body:JSON.stringify({nome:name,area,email,nivel:'Explorador',pontos:0,ativo:true})});
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
    const logs = await sbFetchLogs();
    const totalPts = logs ? logs.reduce(function(s, l){ return s + (l.pontos || 0); }, 0) : 0;
    const hn = document.getElementById('hn-s');
    const hp = document.getElementById('hn-p');
    if (hn) hn.textContent = startups.length;
    if (hp) hp.textContent = totalPts;
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


(async function() {
  try {
    const data=await sbFetch();
    if(data!==null){
      _sbReady=true;
      _sbCache=data.length?data.map(s2l):null;
      console.info('[SB] Conectado: '+data.length+' startups');
      if (typeof fillDrops === 'function') fillDrops();
      const hn=document.getElementById('hn-s');
      if(hn&&data.length) hn.textContent=data.length;
    }
  } catch(e){ console.warn('[SB] Offline - localStorage'); }
})();
