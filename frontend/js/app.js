// URL do backend — preencha com a URL do seu servidor em produção
// Exemplo: 'https://meu-backend.railway.app'
// Deixe vazio apenas se frontend e backend rodarem no mesmo servidor
const BACKEND_URL = 'https://acelera-pedra-branca.onrender.com';

// ─── DATA ───────────────────────────────────────────

// ─── XSS PROTECTION ──────────────────────────────────
function safe(str){
  if(str==null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#x27;');
}
function escapeJs(str){
  return String(str||'')
    .replace(/\\/g,'\\\\')
    .replace(/'/g,"\\'")
    .replace(/\"/g,'\\\"');
}
const DEF_STARTUPS = [
  {id:'S03',name:'MomCar',area:'Mobilidade / Carona',stage:1,email:''},
  {id:'S05',name:'Nitemapp',area:'Entretenimento / Geo',stage:1,email:''},
  {id:'S06',name:'IziTag',area:'Tráfego / Analytics',stage:2,email:''},
  {id:'S07',name:'LUMA',area:'Saúde da Mulher',stage:1,email:''},
  {id:'S08',name:'PDV Fluxo',area:'Varejo / PME',stage:2,email:''},
  {id:'S10',name:'Mr Foster',area:'Hotelaria / Check-in',stage:3,email:''},
  {id:'S11',name:'CompliDataX',area:'Compliance / LGPD',stage:2,email:''},
  {id:'S12',name:'Cuida.VC',area:'RH / GRC',stage:2,email:''},
  {id:'S13',name:'L. Bonenberger',area:'Edtech / Conteúdo',stage:1,email:''},
  {id:'S14',name:'Baos Innovation',area:'IA Generativa',stage:4,email:''},
  {id:'S15',name:'Délia',area:'Fintech / Mulheres MEI',stage:1,email:''},
];

const DEF_ATIV = [
  {id:'A01',name:'Presença em workshop',cat:'Engajamento',pts:5,stages:'Todos',desc:'Participação confirmada em cada workshop'},
  {id:'A02',name:'Entregável do workshop',cat:'Engajamento',pts:10,stages:'Todos',desc:'Envio do material proposto (BMC, persona...)'},
  {id:'A03',name:'Mentoria individual realizada',cat:'Engajamento',pts:8,stages:'Todos',desc:'Sessão de mentoria com resumo enviado'},
  {id:'A04',name:'Uso do laboratório / coworking',cat:'Engajamento',pts:6,stages:'Todos',desc:'Presença mínima de 4h/semana no espaço'},
  {id:'A05',name:'Pesquisa com usuário realizada',cat:'Desenvolvimento',pts:15,stages:'Todos',desc:'Entrevista com ao menos 5 potenciais clientes'},
  {id:'A06',name:'Networking entre startups',cat:'Desenvolvimento',pts:10,stages:'Todos',desc:'Reunião de troca documentada com outra empresa'},
  {id:'A07',name:'Presença integral no mês',cat:'Bônus',pts:20,stages:'Todos',desc:'100% de participação obrigatória no mês'},
  {id:'A08',name:'BMC completo e validado',cat:'Desenvolvimento',pts:20,stages:'Est. 1-2',desc:'Canvas aprovado pela equipe'},
  {id:'A09',name:'Protótipo funcional',cat:'Desenvolvimento',pts:25,stages:'Est. 1-2',desc:'MVP testado com ao menos 3 usuários'},
  {id:'A10',name:'Persona com dados primários',cat:'Desenvolvimento',pts:15,stages:'Est. 1-2',desc:'Persona a partir de entrevistas reais'},
  {id:'A11',name:'Primeiro teste com usuário real',cat:'Tração',pts:30,stages:'Est. 1-2',desc:'Sessão de teste com feedback documentado'},
  {id:'A12',name:'Primeiro cliente pagante / LOI',cat:'Tração',pts:40,stages:'Est. 1-2',desc:'Receita gerada ou LOI assinada'},
  {id:'A13',name:'Salto de estágio 1→2',cat:'Bônus',pts:50,stages:'Est. 1-2',desc:'Bônus ao evoluir do estágio 1 para o 2'},
  {id:'A14',name:'Reunião ou demo realizada',cat:'Desenvolvimento',pts:15,stages:'Est. 3-4',desc:'Demo com potencial cliente documentada'},
  {id:'A15',name:'Proposta comercial enviada',cat:'Desenvolvimento',pts:25,stages:'Est. 3-4',desc:'Proposta formal com escopo e valor'},
  {id:'A16',name:'Contrato assinado',cat:'Tração',pts:50,stages:'Est. 3-4',desc:'Novo contrato fechado durante o programa'},
  {id:'A17',name:'Meta de MRR atingida',cat:'Tração',pts:40,stages:'Est. 3-4',desc:'Atinge ou supera meta de receita recorrente'},
  {id:'A18',name:'Taxa de conversão documentada',cat:'Tração',pts:35,stages:'Est. 3-4',desc:'Relatório de funil com percentuais'},
  {id:'A19',name:'Novo canal de aquisição ativado',cat:'Tração',pts:30,stages:'Est. 3-4',desc:'Canal novo validado durante o programa'},
  {id:'A20',name:'Salto de estágio 3→4',cat:'Bônus',pts:60,stages:'Est. 3-4',desc:'Bônus ao evoluir do estágio 3 para o 4'},
];

const ld = (k,d) => { try{ const v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } };
const sv = (k,v) => localStorage.setItem(k,JSON.stringify(v));

const getS = () => ld('apb_s', DEF_STARTUPS);
const setS = v => sv('apb_s',v);
const getA = () => ld('apb_a', DEF_ATIV);
const setA = v => sv('apb_a',v);
const getL = () => ld('apb_l',[]);
const setL = v => sv('apb_l',v);

function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,5); }

function ptsByS(){
  const map={};
  getL().forEach(l=>{ map[l.sid]=(map[l.sid]||0)+Number(l.pts); });
  return map;
}

function getLevel(p){
  if(p>=800) return {n:'Elite',c:'lv-eli'};
  if(p>=500) return {n:'Destaque',c:'lv-des'};
  if(p>=250) return {n:'Acelerado',c:'lv-ace'};
  if(p>=100) return {n:'Construtor',c:'lv-con'};
  return {n:'Explorador',c:'lv-exp'};
}

function getRanked(){
  const pm=ptsByS();
  return getS().map(s=>({...s,pts:pm[s.id]||0})).sort((a,b)=>b.pts-a.pts);
}

// ─── NAVIGATION ──────────────────────────────────────
function goPage(name,btn){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('on'));
  document.getElementById('page-'+name).classList.add('on');
  if(btn) btn.classList.add('on');
  else document.querySelectorAll('.nav-btn').forEach(b=>{
    if((b.getAttribute('onclick')||'').includes("'"+name+"'")) b.classList.add('on');
  });
  if(name==='ranking') renderRanking();
  if(name==='admin') checkAdmin();
  if(name==='home') updateHome();
  window.scrollTo({top:0,behavior:'smooth'});
}

// ─── HOME ─────────────────────────────────────────────
function updateHome(){
  const lanc=getL();
  const startups=getS();
  document.getElementById('hn-s').textContent=startups.length;
  document.getElementById('hn-p').textContent=lanc.reduce((s,l)=>s+Number(l.pts),0);
  const h=document.getElementById('hn-startups-h');
  if(h) h.textContent=startups.length+' startups';
  const chips=document.getElementById('startups-chips');
  if(chips) chips.innerHTML=startups.map(s=>`<div class="chip"><div class="chip-n">${safe(s.name)}</div><div class="chip-a">${safe(s.area)}</div><span class="chip-s st${s.stage}">Est. ${s.stage}</span></div>`).join('');
}

// ─── RANKING ──────────────────────────────────────────
function renderRanking(){
  const ranked=getRanked();
  const maxP=ranked[0]?.pts||0;
  const avgP=ranked.length?Math.round(ranked.reduce((s,r)=>s+r.pts,0)/ranked.length):0;
  document.getElementById('rs-t').textContent=ranked.length;
  document.getElementById('rs-m').textContent=maxP||'Sem pontos ainda';
  document.getElementById('rs-a').textContent=avgP||'—';

  const top3=ranked.slice(0,3);
  const podEl=document.getElementById('podium-area');
  if(top3.length===0){podEl.innerHTML='';return;}

  const medals=[{m:'🥇',p:'g',pos:'1º lugar',cls:'p1'},{m:'🥈',p:'s',pos:'2º lugar',cls:'p2'},{m:'🥉',p:'b',pos:'3º lugar',cls:'p3'}];
  // visual order: 2nd left, 1st center, 3rd right
  const vis = top3.length>=2 ? [top3[1],top3[0],top3[2]].filter(Boolean) : top3;
  const mvis = top3.length>=2 ? [medals[1],medals[0],medals[2]].filter(Boolean) : medals;

  podEl.innerHTML=vis.map((s,i)=>{
    const mi=mvis[i], lv=getLevel(s.pts);
    return `<div class="pod ${mi.cls}">
      <div class="pod-medal">${mi.m}</div>
      <div class="pod-pos ${mi.p}">${mi.pos}</div>
      <div class="pod-name">${safe(s.name)}</div>
      <div class="pod-area">${safe(s.area)}</div>
      <div class="pod-pts ${mi.p}">${s.pts}</div>
      <div class="pod-lbl">pontos</div>
      <div class="pod-lv ${lv.c}">${lv.n}</div>
    </div>`;
  }).join('');

  const raceEl=document.getElementById('race-area');
  raceEl.innerHTML=ranked.length===0
    ?`<div class="empty">Nenhuma startup cadastrada ainda.</div>`
    :ranked.map((s,i)=>{
        const pct=maxP>0?Math.round(s.pts/maxP*100):0;
        const lv=getLevel(s.pts);
        const bw=Math.max(pct,s.pts>0?2:0);
        return `<div class="rrow">
          <div class="rpos">${i+1}</div>
          <div class="rinfo"><div class="rname">${s.name}</div><div class="rmeta">Est. ${s.stage} · ${s.area}</div></div>
          <div class="rtrack"><div class="rbar-bg"><div class="rbar" style="width:${bw}%"></div></div></div>
          <div class="rright">
            <div class="rpts">${s.pts}</div>
            <div class="rpts-l">pontos</div>
            <div class="rlv ${lv.c}">${lv.n}</div>
          </div>
        </div>`;
      }).join('');
}

// ─── ADMIN AUTH ───────────────────────────────────────
async function checkAdmin(){
  const gate=document.getElementById('admin-gate');
  const panel=document.getElementById('admin-panel');
  gate.style.display='flex';
  panel.style.display='none';
  const token=sessionStorage.getItem('admin_token');
  if(!token) return;
  try {
    const r=await fetch(BACKEND_URL+'/api/auth/check',{headers:{'Authorization':'Bearer '+token}});
    if(r.ok){ gate.style.display='none'; panel.style.display='block'; refreshAdmin(); }
    else { sessionStorage.removeItem('admin_token'); }
  } catch(e) {}
}

async function doLogin(){
  const email=document.getElementById('gate-email').value.trim();
  const password=document.getElementById('gate-pass').value;
  const err=document.getElementById('gate-err');
  if(!email||!password){
    err.textContent='Preencha e-mail e senha.';
    err.style.display='block';
    return;
  }
  try {
    const r=await fetch(BACKEND_URL+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const d=await r.json();
    if(!r.ok){
      err.textContent=d.error||'E-mail ou senha incorretos';
      err.style.display='block';
      document.getElementById('gate-pass').value='';
      return;
    }
    sessionStorage.setItem('admin_token',d.token);
    err.style.display='none';
    document.getElementById('admin-gate').style.display='none';
    document.getElementById('admin-panel').style.display='block';
    refreshAdmin();
  } catch(e){
    err.textContent='Erro de conexão com o servidor.';
    err.style.display='block';
  }
}

function doLogout(){
  sessionStorage.removeItem('admin_token');
  document.getElementById('admin-gate').style.display='flex';
  document.getElementById('admin-panel').style.display='none';
  document.getElementById('gate-pass').value='';
  document.getElementById('gate-email').value='';
}

// ─── ADMIN CORE ───────────────────────────────────────
function refreshAdmin(){
  updateStats();
  fillDrops();
  renderTS();
  renderTA();
  renderHist();
  document.getElementById('ln-data').value=new Date().toISOString().split('T')[0];
}

function updateStats(){
  const l=getL();
  document.getElementById('as-s').textContent=getS().length;
  document.getElementById('as-l').textContent=l.length;
  document.getElementById('as-p').textContent=l.reduce((s,x)=>s+Number(x.pts),0);
  document.getElementById('as-a').textContent=getA().length;
}

function aTab(name,btn){
  document.querySelectorAll('.asec').forEach(s=>s.classList.remove('on'));
  document.querySelectorAll('.atab').forEach(b=>b.classList.remove('on'));
  document.getElementById('asec-'+name).classList.add('on');
  if(btn) btn.classList.add('on');
  if(name==='startups') renderTS();
  if(name==='atividades') renderTA();
  if(name==='historico') renderHist();
}

function fillDrops(){
  const ss=getS(), av=getA();
  document.getElementById('ln-startup').innerHTML=ss.map(s=>`<option value="${safe(s.id)}">${safe(s.name)}</option>`).join('');
  document.getElementById('ln-ativ').innerHTML=av.map(a=>`<option value="${safe(a.id)}" data-pts="${safe(a.pts)}">${safe(a.name)} (${safe(a.pts)} pts)</option>`).join('');
  const hf=document.getElementById('hist-filter');
  hf.innerHTML=`<option value="">Todas as startups</option>`+ss.map(s=>`<option value="${safe(s.id)}">${safe(s.name)}</option>`).join('');
}

// ─── LANÇAR ───────────────────────────────────────────
function autoFillPts(){
  const sel=document.getElementById('ln-ativ');
  const opt=sel.options[sel.selectedIndex];
  if(opt) document.getElementById('ln-pts').value=opt.getAttribute('data-pts');
}

function lancarPontos(){
  const sid=document.getElementById('ln-startup').value;
  const aid=document.getElementById('ln-ativ').value;
  const pts=parseInt(document.getElementById('ln-pts').value);
  const tipo=document.getElementById('ln-tipo').value;
  const date=document.getElementById('ln-data').value;
  const obs=document.getElementById('ln-obs').value.trim();
  const by=document.getElementById('ln-by').value.trim();
  if(!sid||!aid||!pts||pts<1||!date){ showToast('Preencha todos os campos obrigatórios.'); return; }
  const finalPts = tipo === 'rem' ? -pts : pts;
  const startup=getS().find(s=>s.id===sid);
  const ativ=getA().find(a=>a.id===aid);
  const l=getL();
  l.unshift({id:uid(),sid,sname:startup?.name||'',aid,aname:ativ?.name||'',pts:finalPts,date,obs,by,ts:Date.now()});
  setL(l);
  updateStats();
  updateHome();
  showToast(tipo==='rem'?`-${pts} pts removidos de ${safe(startup?.name)}!`:`+${pts} pts lançados para ${safe(startup?.name)}!`);
  clearLancar();
}

function clearLancar(){
  document.getElementById('ln-tipo').value='add';
  document.getElementById('ln-pts').value='';
  document.getElementById('ln-obs').value='';
  document.getElementById('ln-by').value='';
  document.getElementById('ln-data').value=new Date().toISOString().split('T')[0];
}

// ─── STARTUPS CRUD ────────────────────────────────────
function renderTS(){
  const ss=getS(), pm=ptsByS();
  const sn=['','Ideação','Operação','Tração','Escala'];
  document.getElementById('tbl-s').innerHTML=ss.length===0
    ?`<tr><td colspan="6" class="empty" style="padding:2rem">Nenhuma startup cadastrada.</td></tr>`
    :ss.map(s=>{const p=pm[s.id]||0;const lv=getLevel(p);
      return `<tr>
        <td class="td-n">${safe(s.name)}</td>
        <td style="color:rgba(255,255,255,0.55);font-size:12px">${safe(s.area)}</td>
        <td style="font-size:12px">Est. ${safe(s.stage)} — ${safe(sn[s.stage]||'')}</td>
        <td class="td-pt">${p}</td>
        <td><span class="rlv ${lv.c}">${lv.n}</span></td>
        <td><button class="ab" onclick="editS('${escapeJs(s.id)}')">Editar</button><button class="ab del" onclick="deleteS('${escapeJs(s.id)}')">Excluir</button></td>
      </tr>`;}).join('');
}

let editSid='';
function toggleForm(fid,tid,label){
  const f=document.getElementById(fid);
  const open=f.style.display==='none'||!f.style.display;
  if(open){ f.style.display='block'; document.getElementById(tid).textContent=label; }
  else { f.style.display='none'; }
}
function closeForm(fid){ document.getElementById(fid).style.display='none'; }

function editS(id){
  const s=getS().find(x=>x.id===id); if(!s) return;
  document.getElementById('form-startup').style.display='block';
  document.getElementById('fst-title').textContent='Editar Startup';
  document.getElementById('st-nome').value=s.name;
  document.getElementById('st-area').value=s.area;
  document.getElementById('st-estagio').value=s.stage;
  document.getElementById('st-email').value=s.email||'';
  document.getElementById('st-eid').value=id;
  editSid=id;
  document.getElementById('form-startup').scrollIntoView({behavior:'smooth'});
}

function saveStartup(){
  const name=document.getElementById('st-nome').value.trim();
  const area=document.getElementById('st-area').value.trim();
  const stage=parseInt(document.getElementById('st-estagio').value);
  const email=document.getElementById('st-email').value.trim();
  if(!name||!area){ showToast('Nome e área são obrigatórios.'); return; }
  const ss=getS();
  const eid=document.getElementById('st-eid').value;
  if(eid){ const i=ss.findIndex(s=>s.id===eid); if(i>-1) ss[i]={...ss[i],name,area,stage,email}; }
  else ss.push({id:'S'+uid().slice(-4).toUpperCase(),name,area,stage,email});
  setS(ss);
  closeForm('form-startup');
  document.getElementById('st-eid').value='';
  renderTS(); fillDrops(); updateStats();
  showToast(eid?'Startup atualizada!':'Startup cadastrada!');
}

function deleteS(id){
  if(!confirm('Excluir esta startup? Os lançamentos associados serão mantidos no histórico.')) return;
  setS(getS().filter(s=>s.id!==id));
  renderTS(); fillDrops(); updateStats();
  showToast('Startup removida.');
}

// ─── ATIVIDADES CRUD ──────────────────────────────────
const catC={Engajamento:'lv-exp',Desenvolvimento:'lv-con','Tração':'lv-des','Bônus':'lv-eli'};

function renderTA(){
  const av=getA();
  document.getElementById('tbl-a').innerHTML=av.length===0
    ?`<tr><td colspan="5" class="empty" style="padding:2rem">Nenhuma atividade cadastrada.</td></tr>`
    :av.map(a=>`<tr>
        <td class="td-n">${safe(a.name)}</td>
        <td><span class="rlv ${catC[safe(a.cat)]||'lv-exp'}">${safe(a.cat)}</span></td>
        <td style="font-size:12px;color:rgba(255,255,255,0.55)">${safe(a.stages)}</td>
        <td class="td-pt">${safe(a.pts)}</td>
        <td><button class="ab" onclick="editA('${escapeJs(a.id)}')">Editar</button><button class="ab del" onclick="deleteA('${escapeJs(a.id)}')">Excluir</button></td>
      </tr>`).join('');
}

function editA(id){
  const a=getA().find(x=>x.id===id); if(!a) return;
  document.getElementById('form-ativ').style.display='block';
  document.getElementById('fatv-title').textContent='Editar Atividade';
  document.getElementById('atv-nome').value=a.name;
  document.getElementById('atv-cat').value=a.cat;
  document.getElementById('atv-pts').value=a.pts;
  document.getElementById('atv-stages').value=a.stages;
  document.getElementById('atv-desc').value=a.desc||'';
  document.getElementById('atv-eid').value=id;
  document.getElementById('form-ativ').scrollIntoView({behavior:'smooth'});
}

function saveAtiv(){
  const name=document.getElementById('atv-nome').value.trim();
  const cat=document.getElementById('atv-cat').value;
  const pts=parseInt(document.getElementById('atv-pts').value);
  const stages=document.getElementById('atv-stages').value;
  const desc=document.getElementById('atv-desc').value.trim();
  if(!name||!pts||pts<1){ showToast('Nome e pontos são obrigatórios.'); return; }
  const av=getA();
  const eid=document.getElementById('atv-eid').value;
  if(eid){ const i=av.findIndex(a=>a.id===eid); if(i>-1) av[i]={...av[i],name,cat,pts,stages,desc}; }
  else av.push({id:'A'+uid().slice(-3).toUpperCase(),name,cat,pts,stages,desc});
  setA(av);
  closeForm('form-ativ');
  document.getElementById('atv-eid').value='';
  renderTA(); fillDrops(); updateStats();
  showToast(eid?'Atividade atualizada!':'Atividade cadastrada!');
}

function deleteA(id){
  if(!confirm('Excluir esta atividade?')) return;
  setA(getA().filter(a=>a.id!==id));
  renderTA(); fillDrops(); updateStats();
  showToast('Atividade removida.');
}

// ─── HISTÓRICO ────────────────────────────────────────
function renderHist(){
  const filter=document.getElementById('hist-filter')?.value||'';
  let l=getL();
  if(filter) l=l.filter(x=>x.sid===filter);
  const el=document.getElementById('hist-list');
  el.innerHTML=l.length===0
    ?`<div class="empty">Nenhum lançamento encontrado.</div>`
    :l.map(x=>{
        const d=x.date?x.date.split('-').reverse().join('/'):'—';
        return `<div class="hrow">
          <div class="hdate">${d}</div>
          <div class="hcont">
            <div class="hst">${safe(x.sname)||'—'}</div>
            <div class="hact">${safe(x.aname)||'—'}</div>
            ${x.obs?`<div class="hnote">${safe(x.obs)}${x.by?' · por '+safe(x.by):''}</div>`:''}
          </div>
          <div class="hpts">+${safe(x.pts)}</div>
          <button class="hdel" onclick="deleteL('${escapeJs(x.id)}')" title="Remover lançamento">✕</button>
        </div>`;}).join('');
}

function deleteL(id){
  if(!confirm('Remover este lançamento? Os pontos serão descontados do ranking.')) return;
  setL(getL().filter(l=>l.id!==id));
  renderHist(); updateStats(); updateHome();
  showToast('Lançamento removido.');
}

// ─── TOAST ────────────────────────────────────────────
let toastT;
function showToast(msg){
  const t=document.getElementById('toast');
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT=setTimeout(()=>t.classList.remove('show'),3000);
}

// ─── NAV TOGGLE ───────────────────────────────────────
function toggleNav(){
  const center=document.getElementById('nav-center');
  const btn=document.getElementById('nav-hamburger');
  const open=center.classList.toggle('open');
  btn.classList.toggle('open',open);
}
function closeNav(){
  document.getElementById('nav-center').classList.remove('open');
  document.getElementById('nav-hamburger').classList.remove('open');
}

// ─── HERO MOUSE EFFECT ────────────────────────────────
(function(){
  const hero = document.getElementById('hero');
  if(!hero) return;
  const grid   = document.getElementById('hero-grid');
  const glow   = document.getElementById('hero-glow-inner');
  const spot   = document.getElementById('hero-spotlight');

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const cx = r.width  / 2;
    const cy = r.height / 2;
    // normalized -1 to 1
    const nx = (x - cx) / cx;
    const ny = (y - cy) / cy;

    // glow follows mouse slowly
    glow.style.left = x + 'px';
    glow.style.top  = y + 'px';

    // tight spotlight follows closely
    spot.style.left = x + 'px';
    spot.style.top  = y + 'px';

    // grid parallax — subtle offset opposite to mouse
    grid.style.transform = `translate(${nx * -10}px, ${ny * -8}px)`;
  });

  hero.addEventListener('mouseleave', () => {
    glow.style.left = '50%';
    glow.style.top  = '40%';
    spot.style.left = '50%';
    spot.style.top  = '40%';
    grid.style.transform = 'translate(0,0)';
  });
})();

// ─── PARALLAX SCROLL ──────────────────────────────────
(function(){
  const bg = document.getElementById('parallax-bg');
  if (!bg) return;
  const section = document.getElementById('hero');
  let ticking = false;

  function update() {
    const scrollY = window.pageYOffset;
    const sectionH = section.offsetHeight;
    if (scrollY <= sectionH + 200) {
      bg.style.transform = 'translateY(' + (scrollY * 0.32) + 'px)';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });

  update();
})();

/* -- Workshop bio toggle -- */
function toggleWs(card) {
  var isOpen = card.classList.contains('expanded');
  // Close all others
  document.querySelectorAll('.ws-card.expanded').forEach(function(c){ c.classList.remove('expanded'); });
  if (!isOpen) card.classList.add('expanded');
}

/* -- Workshop status dinâmico --
   Calcula status de cada ws-card com base na data atual.
   Requer atributo data-date="YYYY-MM-DD" em cada .ws-card.
   Estados: Realizado | Hoje | Próximo | Em breve
*/
function computeWorkshopStatuses() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cards = document.querySelectorAll('.ws-card[data-date]');
  let nextFound = false;

  cards.forEach(function(card) {
    const wsDate = new Date(card.getAttribute('data-date') + 'T00:00:00');
    const badge  = card.querySelector('.ws-badge');
    const diff   = wsDate.getTime() - today.getTime();

    // Reset state classes — preserva 'expanded' se aberto
    card.classList.remove('done', 'next');

    if (diff < 0) {
      // Passou: Realizado
      card.classList.add('done');
      if (badge) { badge.className = 'ws-badge past'; badge.textContent = 'Realizado'; }

    } else if (diff === 0) {
      // Hoje (dia do workshop)
      card.classList.add('next');
      if (badge) {
        badge.className = 'ws-badge next-badge';
        badge.innerHTML = '<span class="ws-blink"></span>Hoje';
      }

    } else if (!nextFound) {
      // Próximo (primeiro futuro)
      nextFound = true;
      card.classList.add('next');
      if (badge) {
        badge.className = 'ws-badge next-badge';
        badge.innerHTML = '<span class="ws-blink"></span>Próximo';
      }

    } else {
      // Demais futuros: Em breve
      if (badge) { badge.className = 'ws-badge upcoming'; badge.textContent = 'Em breve'; }
    }
  });
}

// /* -- Custom Cursor -- */
// /* ══ CUSTOM CURSOR — Alta Performance ══════════════════════════════════════
//    Técnica: CSS Custom Properties + transform:translate3d()
//    - Nenhum repaint: só mudamos variáveis CSS, o browser aplica via GPU
//    - requestAnimationFrame: sincroniza com o ciclo de render do browser (60fps)
//    - will-change declarado no CSS: browser pré-aloca camada de composição
// ═══════════════════════════════════════════════════════════════════════════ */
// (function () {

//   const cursor = document.getElementById('js-cursor');
//   if (!cursor) return;

//   // Posição "real" do mouse (atualizada no evento — pode ser 1000x/s)
//   let mouseX = -160, mouseY = -160;

//   // Posição "suavizada" do ring (interpolada no rAF)
//   let ringX  = -160, ringY  = -160;

//   // Fator de suavização do ring (0 = parado, 1 = instantâneo)
//   // 0.12 dá um lag elegante sem parecer lento
//   const LERP = 0.12;

//   // Flag: só agenda um rAF por frame, nunca empilha chamadas
//   let rafId = null;

//   // ── Detecta se é dispositivo touch (sem cursor físico) ──────────────────
//   const isTouchDevice =
//     window.matchMedia('(hover: none) and (pointer: coarse)').matches;

//   if (isTouchDevice) {
//     cursor.style.display = 'none';
//     return; // Sem mouse físico = sem cursor customizado
//   }

//   // ── Esconde o cursor nativo do browser ──────────────────────────────────
//   document.documentElement.classList.add('has-custom-cursor');

//   // ── Listener de mouse: só salva coordenadas, não faz DOM work ───────────
//   document.addEventListener('mousemove', function (e) {
//     mouseX = e.clientX;
//     mouseY = e.clientY;

//     // Só agenda o rAF se ainda não tem um pendente
//     if (!rafId) {
//       rafId = requestAnimationFrame(renderCursor);
//     }
//   }, { passive: true });

//   // ── Loop de render: roda no máximo 1x por frame ─────────────────────────
//   function renderCursor() {
//     rafId = null; // libera para o próximo evento

//     // Dot: segue o mouse instantaneamente (sem lag)
//     cursor.style.setProperty('--dot-x', mouseX + 'px');
//     cursor.style.setProperty('--dot-y', mouseY + 'px');

//     // Ring: interpola suavemente em direção ao mouse (efeito de "peso")
//     ringX += (mouseX - ringX) * LERP;
//     ringY += (mouseY - ringY) * LERP;

//     cursor.style.setProperty('--ring-x', ringX.toFixed(2) + 'px');
//     cursor.style.setProperty('--ring-y', ringY.toFixed(2) + 'px');

//     // Se o ring ainda não chegou no destino, continua animando
//     const dx = Math.abs(mouseX - ringX);
//     const dy = Math.abs(mouseY - ringY);
//     if (dx > 0.1 || dy > 0.1) {
//       rafId = requestAnimationFrame(renderCursor);
//     }
//   }

//   // ── Estados especiais do cursor ─────────────────────────────────────────

//   // Hover em links e botões: cursor fica maior e mais transparente
//   const clickables = 'a, button, [role="button"], input, select, textarea, label, .chip, .ws-card, .pod, .rrow, .nav-btn, .nav-cta';

//   document.addEventListener('mouseover', function (e) {
//     if (e.target.closest(clickables)) {
//       cursor.classList.add('is-hovering');
//     }
//   }, { passive: true });

//   document.addEventListener('mouseout', function (e) {
//     if (e.target.closest(clickables)) {
//       cursor.classList.remove('is-hovering');
//     }
//   }, { passive: true });

//   // Clique: animação de "pulse" no cursor
//   document.addEventListener('mousedown', function () {
//     cursor.classList.add('is-clicking');
//   });
//   document.addEventListener('mouseup', function () {
//     cursor.classList.remove('is-clicking');
//   });

//   // Cursor some quando o mouse sai da janela
//   document.addEventListener('mouseleave', function () {
//     cursor.classList.add('is-hidden');
//   });
//   document.addEventListener('mouseenter', function () {
//     cursor.classList.remove('is-hidden');
//   });

// })();

/* -- Back to Top -- */
/* ══ BOTÃO VOLTAR AO TOPO — Performance-first ══════════════════════════════
   Técnica: IntersectionObserver é mais eficiente que scroll listener.
   Observamos um elemento sentinel no topo da página — quando ele sai
   do viewport, o botão aparece. Sem throttle manual, sem cálculos de
   offsetTop, sem reflow/repaint desnecessário.
═══════════════════════════════════════════════════════════════════════════ */
(function () {
  const btn = document.getElementById('js-back-to-top');
  if (!btn) return;

  // Sentinel: elemento invisível que fica no topo da página.
  // Quando ele sai do viewport (usuário rolou para baixo), o botão aparece.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
  document.body.insertBefore(sentinel, document.body.firstChild);

  const observer = new IntersectionObserver(
    function (entries) {
      // isIntersecting = true → topo visível → esconde botão
      // isIntersecting = false → rolou para baixo → mostra botão
      btn.classList.toggle('is-visible', !entries[0].isIntersecting);
    },
    { threshold: 0 }
  );

  observer.observe(sentinel);

  // Acessibilidade: suporte à tecla Enter quando focado via teclado
  btn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
})();

/* -- INIT: espera o DOM antes de chamar funcoes que tocam em elementos -- */
document.addEventListener('DOMContentLoaded', function () {
  updateHome();
  goPage('home', null);
  checkAdmin();
  computeWorkshopStatuses();
});
