-- Acelera Pedra Branca — Migration: grants de role
-- Execute UMA VEZ no Supabase SQL Editor para corrigir o banco existente.
-- Após isso, o site funcionará normalmente sem precisar voltar aqui.

grant select on public.startups   to anon, authenticated;
grant select on public.pontuacoes  to anon, authenticated;
grant insert, update, delete on public.startups   to authenticated;
grant insert, update, delete on public.pontuacoes to authenticated;
