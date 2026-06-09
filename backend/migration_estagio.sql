-- Migração: adiciona coluna `estagio` à tabela startups
-- Esta coluna armazena o estágio de desenvolvimento da startup (1-4)
-- SEPARADO do campo `nivel` (que é o nível de gamificação baseado em pontos)
--
-- Execute este script no SQL Editor do painel do Supabase (uma vez).

ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS estagio INTEGER NOT NULL DEFAULT 1;

-- Preenche estagio com base no nivel atual (preserva o que foi definido via admin)
UPDATE public.startups SET estagio = CASE nivel
  WHEN 'Explorador' THEN 1
  WHEN 'Construtor' THEN 2
  WHEN 'Acelerado'  THEN 3
  WHEN 'Acelerador' THEN 3
  WHEN 'Destaque'   THEN 4
  WHEN 'Elite'      THEN 4
  ELSE 1
END;

-- Constraint para garantir valor válido
ALTER TABLE public.startups
  ADD CONSTRAINT startups_estagio_check CHECK (estagio BETWEEN 1 AND 4);
