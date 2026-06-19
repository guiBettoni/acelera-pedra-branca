-- Adiciona coluna de foto/logo da empresa na tabela startups
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS foto_url TEXT;
