-- Acelera Pedra Branca - Schema Supabase
-- Cole no SQL Editor e clique em Run

create table if not exists public.startups (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  area text not null default '',
  email text default '',
  nivel text not null default 'Explorador',
  pontos integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.pontuacoes (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  descricao text not null default '',
  categoria text not null default 'Manual',
  pontos integer not null default 0,
  obs text default '',
  lancado_por text default '',
  criado_em timestamptz not null default now()
);

alter table public.startups enable row level security;
alter table public.pontuacoes enable row level security;

-- Permitir leitura pública, mas gravar apenas para o usuário admin autenticado
create policy "public_select_startups" on public.startups for select using (true);
create policy "admin_write_startups" on public.startups for insert with check (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
);
create policy "admin_update_startups" on public.startups for update using (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
) with check (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
);
create policy "admin_delete_startups" on public.startups for delete using (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
);

create policy "public_select_pontuacoes" on public.pontuacoes for select using (true);
create policy "admin_write_pontuacoes" on public.pontuacoes for insert with check (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
);
create policy "admin_update_pontuacoes" on public.pontuacoes for update using (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
) with check (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
);
create policy "admin_delete_pontuacoes" on public.pontuacoes for delete using (
  auth.role() = 'authenticated' AND auth.email() = 'admin@inaitec.com.br'
);

insert into public.startups (id,nome,area,nivel,pontos) values
('00000001-0000-0000-0000-000000000001','Oktopus','ISP / Monitoramento','Explorador',0),
('00000001-0000-0000-0000-000000000002','Smartcitytec','GovTech / Smart Cities','Explorador',0),
('00000001-0000-0000-0000-000000000003','MomCar','Mobilidade / Carona','Explorador',0),
('00000001-0000-0000-0000-000000000004','Navegou','Marketplace Náutico','Explorador',0),
('00000001-0000-0000-0000-000000000005','Nitemapp','Entretenimento / Geo','Explorador',0),
('00000001-0000-0000-0000-000000000006','IziTag','Tráfego / Analytics','Explorador',0),
('00000001-0000-0000-0000-000000000007','LUMA','Saúde da Mulher','Explorador',0),
('00000001-0000-0000-0000-000000000008','PDV Fluxo','Varejo / PME','Explorador',0),
('00000001-0000-0000-0000-000000000009','ZOOME','Audiovisual / Eventos','Explorador',0),
('00000001-0000-0000-0000-000000000010','Mr Foster','Hotelaria / Check-in','Explorador',0),
('00000001-0000-0000-0000-000000000011','CompliDataX','Compliance / LGPD','Explorador',0),
('00000001-0000-0000-0000-000000000012','Cuida.VC','RH / GRC','Explorador',0),
('00000001-0000-0000-0000-000000000013','L. Bonenberger','Edtech / Conteúdo','Explorador',0),
('00000001-0000-0000-0000-000000000014','Baos Innovation','IA Generativa','Explorador',0),
('00000001-0000-0000-0000-000000000015','Délia','Fintech / Mulheres MEI','Explorador',0)
on conflict (id) do nothing;
