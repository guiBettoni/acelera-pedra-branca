require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Endpoints will fail.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// CORS — restringe à origem configurada em produção
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors(corsOrigin ? { origin: corsOrigin } : {}));
app.use(express.json({ limit: '100kb' }));

// ── Middleware de autenticação para endpoints de escrita ────────────────────
function requireAuth(req, res, next) {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return next(); // Sem token configurado: dev mode, sem bloqueio
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  if (authHeader.slice(7) !== adminToken) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  next();
}

// ── Recalcula pontos da startup a partir da soma real das pontuações ────────
async function recalcStartupPoints(startupId) {
  const { data } = await supabase.from('pontuacoes').select('pontos').eq('startup_id', startupId);
  const total = (data || []).reduce((sum, p) => sum + (p.pontos || 0), 0);
  const nivel = total >= 800 ? 'Elite'
               : total >= 500 ? 'Destaque'
               : total >= 250 ? 'Acelerado'
               : total >= 100 ? 'Construtor'
               : 'Explorador';
  await supabase.from('startups').update({ pontos: total, nivel }).eq('id', startupId);
}

// ── Auth ────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminEmail || !adminPassword || !adminToken) {
    return res.status(503).json({ error: 'Autenticação não configurada no servidor' });
  }
  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos' });
  }
  res.json({ token: adminToken });
});

app.get('/api/auth/check', requireAuth, (req, res) => res.json({ ok: true }));

// ── Leitura pública ─────────────────────────────────────────────────────────

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

// ── Escrita protegida ───────────────────────────────────────────────────────

app.post('/api/startups', requireAuth, async (req, res) => {
  const { nome, area, email, nivel, pontos, ativo } = req.body || {};
  if (!nome?.trim() || !area?.trim()) {
    return res.status(400).json({ error: 'Nome e área são obrigatórios' });
  }
  try {
    const payload = {
      nome: nome.trim(),
      area: area.trim(),
      email: (email || '').trim(),
      nivel: ['Explorador','Construtor','Acelerado','Destaque','Elite'].includes(nivel) ? nivel : 'Explorador',
      pontos: Math.max(0, parseInt(pontos) || 0),
      ativo: ativo !== false,
    };
    const { data, error } = await supabase.from('startups').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/startups/:id', requireAuth, async (req, res) => {
  const allowed = ['nome', 'area', 'email', 'nivel', 'ativo'];
  const payload = {};
  for (const k of allowed) if (req.body[k] !== undefined) payload[k] = req.body[k];
  if (payload.nome !== undefined) payload.nome = String(payload.nome).trim();
  if (payload.area !== undefined) payload.area = String(payload.area).trim();
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
  const { startup_id, pontos, descricao, categoria, obs, lancado_por, criado_em } = req.body || {};
  if (!startup_id) return res.status(400).json({ error: 'startup_id é obrigatório' });
  const pts = parseInt(pontos);
  if (!pts || pts < 1) return res.status(400).json({ error: 'Pontos deve ser um número positivo' });
  try {
    const payload = {
      startup_id,
      pontos: pts,
      descricao: (descricao || '').trim() || 'Atividade manual',
      categoria: (categoria || 'Manual').trim(),
      obs: (obs || '').trim(),
      lancado_por: (lancado_por || '').trim(),
      ...(criado_em ? { criado_em } : {}),
    };
    const { data, error } = await supabase.from('pontuacoes').insert(payload).select().single();
    if (error) return res.status(500).json({ error: error.message });
    try { await recalcStartupPoints(startup_id); } catch (e) { console.warn('recalc pts failed', e.message); }
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/pontuacoes/:id', requireAuth, async (req, res) => {
  try {
    // Busca startup_id antes de deletar para poder recalcular depois
    const { data: pontuacao } = await supabase
      .from('pontuacoes').select('startup_id').eq('id', req.params.id).single();
    const { error } = await supabase.from('pontuacoes').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    if (pontuacao?.startup_id) {
      try { await recalcStartupPoints(pontuacao.startup_id); } catch (e) { console.warn('recalc pts failed', e.message); }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Backend listening on', port));
