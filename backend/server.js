require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto    = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Warning: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados. Endpoints falharão.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Headers de segurança HTTP (sem CSP para não interferir em respostas JSON) ─
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const corsOrigin = process.env.CORS_ORIGIN;
if (!corsOrigin) {
  console.warn('Warning: CORS_ORIGIN não configurado — aceitando qualquer origem. Configure em produção.');
}
app.use(cors(corsOrigin ? { origin: corsOrigin } : {}));

app.use(express.json({ limit: '100kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Login: máximo 10 tentativas por IP em 15 minutos
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
}));

// API geral: máximo 200 requisições por IP por minuto
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
}));

// ── Comparação segura contra timing attacks ───────────────────────────────────
function safeEquals(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// ── Middleware de autenticação ────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    // Sem token configurado: bloqueia em vez de abrir (falha segura)
    return res.status(503).json({ error: 'Autenticação não configurada no servidor.' });
  }
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  if (!safeEquals(authHeader.slice(7), adminToken)) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  next();
}

function getLevel(pts) {
  return pts >= 800 ? 'Elite' : pts >= 500 ? 'Destaque' : pts >= 250 ? 'Acelerado' : pts >= 100 ? 'Construtor' : 'Explorador';
}

// Utilitário de reparo: recalcula pontos a partir do histórico (só entradas positivas)
async function recalcStartupPoints(startupId) {
  const { data } = await supabase.from('pontuacoes').select('pontos').eq('startup_id', startupId);
  const total = (data || []).reduce((sum, p) => sum + (p.pontos > 0 ? p.pontos : 0), 0);
  await supabase.from('startups').update({ pontos: total, nivel: getLevel(total) }).eq('id', startupId);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminToken    = process.env.ADMIN_TOKEN;
  if (!adminEmail || !adminPassword || !adminToken) {
    return res.status(503).json({ error: 'Autenticação não configurada no servidor' });
  }
  if (!safeEquals(email, adminEmail) || !safeEquals(password, adminPassword)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }
  res.json({ token: adminToken });
});

app.get('/api/auth/check', requireAuth, (req, res) => res.json({ ok: true }));

// ── Leitura pública ───────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/startups', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('startups').select('*').eq('ativo', true).order('pontos', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/startups/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('startups').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Startup não encontrada' });
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pontuacoes').select('*, startups(nome)').order('criado_em', { ascending: false }).limit(200);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Escrita protegida ─────────────────────────────────────────────────────────

app.post('/api/startups', requireAuth, async (req, res) => {
  const { nome, area, email, nivel, pontos, ativo } = req.body || {};
  if (!nome?.trim() || !area?.trim()) {
    return res.status(400).json({ error: 'Nome e área são obrigatórios' });
  }
  if (nome.trim().length > 100) return res.status(400).json({ error: 'Nome muito longo (máx 100)' });
  if (area.trim().length > 100) return res.status(400).json({ error: 'Área muito longa (máx 100)' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  const estagioNum = parseInt(req.body.estagio);
  try {
    const payload = {
      nome: nome.trim(),
      area: area.trim(),
      email: (email || '').trim(),
      nivel: ['Explorador','Construtor','Acelerado','Destaque','Elite'].includes(nivel) ? nivel : 'Explorador',
      estagio: [1,2,3,4].includes(estagioNum) ? estagioNum : 1,
      pontos: Math.max(0, parseInt(pontos) || 0),
      ativo: ativo !== false,
    };
    const { data, error } = await supabase.from('startups').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/startups/:id', requireAuth, async (req, res) => {
  const allowed = ['nome', 'area', 'email', 'nivel', 'estagio', 'ativo'];
  const payload = {};
  for (const k of allowed) if (req.body[k] !== undefined) payload[k] = req.body[k];
  if (payload.nome !== undefined) {
    payload.nome = String(payload.nome).trim();
    if (payload.nome.length > 100) return res.status(400).json({ error: 'Nome muito longo (máx 100)' });
  }
  if (payload.area !== undefined) {
    payload.area = String(payload.area).trim();
    if (payload.area.length > 100) return res.status(400).json({ error: 'Área muito longa (máx 100)' });
  }
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }
  if (payload.nivel && !['Explorador','Construtor','Acelerado','Destaque','Elite'].includes(payload.nivel)) {
    return res.status(400).json({ error: 'Nível inválido' });
  }
  if (payload.estagio !== undefined) {
    payload.estagio = parseInt(payload.estagio);
    if (![1,2,3,4].includes(payload.estagio)) return res.status(400).json({ error: 'Estágio inválido (1–4)' });
  }
  if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  try {
    const { error } = await supabase.from('startups').update(payload).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/startups/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('startups').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pontuacoes', requireAuth, async (req, res) => {
  const { startup_id, pontos, descricao, categoria, obs, lancado_por, criado_em, tipo } = req.body || {};
  if (!startup_id) return res.status(400).json({ error: 'startup_id é obrigatório' });
  const ptsAbs = Math.abs(parseInt(pontos) || 0);
  if (!ptsAbs) return res.status(400).json({ error: 'Pontos não pode ser zero' });
  if ((descricao || '').length > 200) return res.status(400).json({ error: 'Descrição muito longa (máx 200)' });
  if ((obs || '').length > 500)       return res.status(400).json({ error: 'Observação muito longa (máx 500)' });
  if ((lancado_por || '').length > 100) return res.status(400).json({ error: 'lancado_por muito longo (máx 100)' });
  const isRemoval = tipo === 'rem';
  try {
    // Valida que a startup existe antes de inserir
    const { data: startupExists } = await supabase.from('startups').select('id,pontos').eq('id', startup_id).single();
    if (!startupExists) return res.status(404).json({ error: 'Startup não encontrada' });

    // Valida criado_em se fornecido
    let criado_em_iso;
    if (criado_em) {
      const d = new Date(criado_em);
      if (isNaN(d.getTime())) return res.status(400).json({ error: 'criado_em inválido' });
      criado_em_iso = d.toISOString();
    }

    const payload = {
      startup_id,
      pontos: isRemoval ? 0 : ptsAbs,
      descricao: (descricao || '').trim() || (isRemoval ? `Remoção de ${ptsAbs} pts` : 'Atividade manual'),
      categoria: (categoria || (isRemoval ? 'Ajuste' : 'Manual')).trim(),
      obs: (obs || '').trim(),
      lancado_por: (lancado_por || '').trim(),
      ...(criado_em_iso ? { criado_em: criado_em_iso } : {}),
    };
    const { data, error } = await supabase.from('pontuacoes').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });

    // Atualiza saldo diretamente (incremental) sem recalcular da soma
    const newPts = (startupExists.pontos || 0) + (isRemoval ? -ptsAbs : ptsAbs);
    await supabase.from('startups').update({ pontos: newPts, nivel: getLevel(newPts) }).eq('id', startup_id);
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/startups/:id/redistribuir', requireAuth, async (req, res) => {
  const { categorias } = req.body || {};
  if (!categorias || typeof categorias !== 'object') {
    return res.status(400).json({ error: 'categorias é obrigatório' });
  }
  const allowed = ['Engajamento', 'Desenvolvimento', 'Tração', 'Bônus', 'Manual'];
  const distribuicao = {};
  for (const k of allowed) {
    const v = parseInt(categorias[k]) || 0;
    if (v > 0) distribuicao[k] = v;
  }
  const soma = Object.values(distribuicao).reduce((s, v) => s + v, 0);
  if (soma === 0) return res.status(400).json({ error: 'Informe ao menos uma categoria com pontos' });
  try {
    const { data: startup } = await supabase.from('startups').select('id').eq('id', req.params.id).single();
    if (!startup) return res.status(404).json({ error: 'Startup não encontrada' });

    await supabase.from('pontuacoes').delete().eq('startup_id', req.params.id);

    const now = new Date().toISOString();
    const inserts = Object.entries(distribuicao).map(([cat, pts]) => ({
      startup_id: req.params.id,
      pontos: pts,
      descricao: `Redistribuição — ${cat}`,
      categoria: cat,
      obs: 'Redistribuição de categorias via admin',
      lancado_por: 'Admin',
      criado_em: now,
    }));
    const { error } = await supabase.from('pontuacoes').insert(inserts);
    if (error) return res.status(500).json({ error: error.message });

    await recalcStartupPoints(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/pontuacoes/:id', requireAuth, async (req, res) => {
  const allowed = ['descricao', 'categoria', 'obs', 'lancado_por', 'criado_em'];
  const payload = {};
  for (const k of allowed) if (req.body[k] !== undefined) payload[k] = req.body[k];
  if (payload.descricao !== undefined) {
    payload.descricao = String(payload.descricao).trim();
    if (payload.descricao.length > 200) return res.status(400).json({ error: 'Descrição muito longa (máx 200)' });
  }
  if (payload.categoria !== undefined) payload.categoria = String(payload.categoria).trim();
  if (payload.obs !== undefined) payload.obs = String(payload.obs || '').trim();
  if (payload.lancado_por !== undefined) payload.lancado_por = String(payload.lancado_por || '').trim();
  if (payload.criado_em !== undefined) {
    const d = new Date(payload.criado_em);
    if (isNaN(d.getTime())) return res.status(400).json({ error: 'criado_em inválido' });
    payload.criado_em = d.toISOString();
  }
  if (!Object.keys(payload).length) return res.status(400).json({ error: 'Nenhum campo para atualizar' });
  try {
    const { error } = await supabase.from('pontuacoes').update(payload).eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pontuacoes/:id', requireAuth, async (req, res) => {
  try {
    const { data: pontuacao } = await supabase
      .from('pontuacoes').select('startup_id, pontos').eq('id', req.params.id).single();
    const { error } = await supabase.from('pontuacoes').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    // Só reverte o saldo se era uma entrada de adição (pontos > 0)
    if (pontuacao?.startup_id && pontuacao.pontos > 0) {
      const { data: startup } = await supabase.from('startups').select('pontos').eq('id', pontuacao.startup_id).single();
      const newPts = (startup?.pontos || 0) - pontuacao.pontos;
      await supabase.from('startups').update({ pontos: newPts, nivel: getLevel(newPts) }).eq('id', pontuacao.startup_id);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Zera todos os pontos e limpa o histórico de lançamentos
app.post('/api/admin/reset-pontos', requireAuth, async (req, res) => {
  try {
    // startup_id é NOT NULL em pontuacoes, então este filtro captura todos os registros
    const { error: delErr } = await supabase.from('pontuacoes').delete().not('startup_id', 'is', null);
    if (delErr) return res.status(500).json({ error: 'Falha ao limpar lançamentos: ' + delErr.message });
    // nome é NOT NULL em startups, então este filtro captura todas as startups
    const { error: updErr } = await supabase.from('startups').update({ pontos: 0, nivel: 'Explorador' }).not('nome', 'is', null);
    if (updErr) return res.status(500).json({ error: 'Falha ao zerar pontos: ' + updErr.message });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Sync via Google Sheets ────────────────────────────────────────────────────
app.post('/api/sheets/sync', requireAuth, async (req, res) => {
  const { startups: rows } = req.body || {};
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'startups deve ser um array não-vazio' });
  }

  function parseBoolean(val) {
    if (val === true) return true;
    const str = String(val).toLowerCase().trim();
    if (!str || str.startsWith('nao')) return false;
    if (str === 'sim') return true;
    const num = parseInt(val);
    return !isNaN(num) && num > 0;
  }

  function calcPoints(row) {
    const aulas    = Math.max(0, parseInt(row.aulas) || 0);
    const mentoria = Math.max(0, parseInt(row.mentoria) || 0);
    const canvas   = parseBoolean(row.canvas_feito) ? 15 : 0;
    const entrev   = parseBoolean(row.entrevistas) ? 15 : 0;
    const mvp      = parseBoolean(row.mvp_funcional) ? 30 : 0;
    const pessoas  = parseBoolean(row.pessoas_testando) ? 30 : 0;
    const clientes = parseBoolean(row.clientes_pagantes) ? 40 : 0;
    return {
      total: aulas * 10 + mentoria * 5 + canvas + entrev + mvp + pessoas + clientes,
      breakdown: {
        Engajamento:     aulas * 10 + mentoria * 5,
        Desenvolvimento: canvas + entrev + mvp,
        Tração:          pessoas + clientes,
      },
    };
  }

  const { data: allStartups, error: fetchErr } = await supabase
    .from('startups').select('id, nome, pontos').eq('ativo', true);
  if (fetchErr) return res.status(500).json({ error: fetchErr.message });

  const synced    = [];
  const unmatched = [];
  const errors    = [];
  const now       = new Date().toISOString();

  for (const row of rows) {
    const nomeLower = String(row.nome || '').trim().toLowerCase();
    if (!nomeLower) continue;

    const startup = allStartups.find(s => {
      const dbLower = s.nome.toLowerCase();
      return dbLower === nomeLower || dbLower.includes(nomeLower) || nomeLower.includes(dbLower);
    });

    if (!startup) { unmatched.push(row.nome); continue; }

    try {
      const { total, breakdown } = calcPoints(row);

      // Remove todas as entradas anteriores (planilha é fonte da verdade)
      await supabase.from('pontuacoes')
        .delete().eq('startup_id', startup.id);

      const inserts = Object.entries(breakdown)
        .filter(([, pts]) => pts > 0)
        .map(([cat, pts]) => ({
          startup_id:  startup.id,
          pontos:      pts,
          descricao:   `Sync planilha — ${cat}`,
          categoria:   cat,
          obs:         'Sincronizado via Google Sheets',
          lancado_por: 'Planilha',
          criado_em:   now,
        }));

      if (inserts.length > 0) {
        const { error: insErr } = await supabase.from('pontuacoes').insert(inserts);
        if (insErr) throw new Error(insErr.message);
      }

      // Recalcula total a partir de TODAS as pontuacoes (preserva bônus manuais)
      await recalcStartupPoints(startup.id);

      const metaUpdate = {
        aulas:             Math.max(0, parseInt(row.aulas) || 0),
        mentorias:         Math.max(0, parseInt(row.mentoria) || 0),
        canvas_feito:      parseBoolean(row.canvas_feito),
        entrevistas:       parseBoolean(row.entrevistas),
        mvp_funcional:     parseBoolean(row.mvp_funcional),
        pessoas_testando:  parseBoolean(row.pessoas_testando),
        clientes_pagantes: parseBoolean(row.clientes_pagantes),
      };
      const estagioNum = parseInt(row.estagio_atual);
      if ([1, 2, 3, 4].includes(estagioNum)) metaUpdate.estagio = estagioNum;
      await supabase.from('startups').update(metaUpdate).eq('id', startup.id);

      synced.push({ nome: startup.nome, pontos: total });
    } catch (e) {
      errors.push({ nome: row.nome, error: e.message });
    }
  }

  res.json({ synced, unmatched, errors });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Backend listening on', port));
