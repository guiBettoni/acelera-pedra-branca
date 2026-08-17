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


grant select on public.startups  to anon, authenticated;
grant select on public.pontuacoes to anon, authenticated;
grant insert, update, delete on public.startups   to authenticated;
grant insert, update, delete on public.pontuacoes to authenticated;


create policy "public_select_startups" on public.startups for select using (true);
create policy "admin_write_startups" on public.startups for insert with check (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
);
create policy "admin_update_startups" on public.startups for update using (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
) with check (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
);
create policy "admin_delete_startups" on public.startups for delete using (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
);

create policy "public_select_pontuacoes" on public.pontuacoes for select using (true);
create policy "admin_write_pontuacoes" on public.pontuacoes for insert with check (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
);
create policy "admin_update_pontuacoes" on public.pontuacoes for update using (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
) with check (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
);
create policy "admin_delete_pontuacoes" on public.pontuacoes for delete using (
  auth.role() = 'authenticated' AND auth.email() = 'guilherme@inaitec.com.br'
);

create table if not exists public.mentores (
  id text primary key,
  nome text not null,
  especialidade text not null default '',
  bio text not null default '',
  calendar_url text not null default '',
  status text not null default 'aberta' check (status in ('aberta','fechada','em_breve')),
  photo_url text not null default '',
  programa text not null default 'acelera',
  criado_em timestamptz not null default now()
);

alter table public.mentores enable row level security;
grant select on public.mentores to anon, authenticated;
create policy "public_select_mentores" on public.mentores for select using (true);

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
('00000001-0000-0000-0000-000000000011','MedScribe','Compliance / LGPD','Explorador',0),
('00000001-0000-0000-0000-000000000012','Cuida.VC','RH / GRC','Explorador',0),
('00000001-0000-0000-0000-000000000013','OCHS','Conteúdo Mobile','Explorador',0),
('00000001-0000-0000-0000-000000000014','Baos Innovation','IA Generativa','Explorador',0),
('00000001-0000-0000-0000-000000000015','Délia','Fintech / Mulheres MEI','Explorador',0)
on conflict (id) do nothing;

create table if not exists public.workshops (
  id text primary key,
  num integer not null default 0,
  data_workshop date not null,
  date_display text not null default '',
  tema text not null default '',
  nome_mentor text not null default '',
  role_mentor text not null default '',
  bio_mentor text not null default '',
  photo_url text not null default '',
  ordem integer not null default 0,
  criado_em timestamptz default now()
);
alter table public.workshops enable row level security;
create policy "public read workshops" on public.workshops for select using (true);
grant select on public.workshops to anon, authenticated;
grant all on public.workshops to postgres, service_role;
