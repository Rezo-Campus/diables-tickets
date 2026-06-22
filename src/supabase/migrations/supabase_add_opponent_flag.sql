-- À exécuter une seule fois dans Supabase Dashboard > SQL Editor.
-- Additif et nullable : ne casse rien sur les matchs existants.

alter table public.matches
  add column if not exists opponent_country_code text
  check (opponent_country_code is null or opponent_country_code ~ '^[A-Z]{2}$');