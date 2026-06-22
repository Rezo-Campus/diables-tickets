-- ============================================================
-- À exécuter une seule fois dans Supabase Dashboard > SQL Editor.
-- Script additif : ne touche à aucune donnée existante, n'ajoute
-- que des tables/fonctions/policies nouvelles + restreint l'accès
-- à validate_ticket.
-- ============================================================

-- ============================================================
-- 1. Enum de rôles + table user_roles
--    Pas de valeur 'client' : l'absence de ligne = client normal.
-- ============================================================
do $$ begin
  create type public.app_role as enum ('commercial', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

alter table public.user_roles enable row level security;

drop policy if exists "user_roles_select_own" on public.user_roles;
create policy "user_roles_select_own" on public.user_roles
  for select using (auth.uid() = user_id);

-- Pas de policy d'écriture directe : toute attribution de rôle passe
-- par les RPC admin_grant_role / admin_revoke_role ci-dessous.

-- ============================================================
-- 2. has_role() -- utilisée dans les policies et RPC pour éviter
--    toute récursion RLS sur user_roles.
-- ============================================================
create or replace function public.has_role(p_user_id uuid, p_role public.app_role)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = p_user_id and role = p_role
  );
$$;

revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

-- ============================================================
-- 3. RPC admin pour attribuer / retirer un rôle (utilisées par
--    l'écran /admin/users).
-- ============================================================
create or replace function public.admin_grant_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized';
  end if;
  insert into public.user_roles (user_id, role)
  values (p_user_id, p_role)
  on conflict (user_id, role) do nothing;
end;
$$;

create or replace function public.admin_revoke_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized';
  end if;
  delete from public.user_roles
  where user_id = p_user_id and role = p_role;
end;
$$;

revoke all on function public.admin_grant_role(uuid, public.app_role) from public;
revoke all on function public.admin_revoke_role(uuid, public.app_role) from public;
grant execute on function public.admin_grant_role(uuid, public.app_role) to authenticated;
grant execute on function public.admin_revoke_role(uuid, public.app_role) to authenticated;

-- ============================================================
-- 4. admin_list_users() -- liste des comptes pour l'écran admin.
--    auth.users n'est pas accessible via PostgREST : on passe par
--    une RPC SECURITY DEFINER réservée aux admins.
-- ============================================================
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  roles public.app_role[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'not authorized';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '') as full_name,
    u.created_at,
    coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}'::public.app_role[]) as roles
  from auth.users u
  left join public.user_roles ur on ur.user_id = u.id
  group by u.id, u.email, u.raw_user_meta_data, u.created_at
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- ============================================================
-- 5. Policies admin sur competitions / matches (INSERT/UPDATE/DELETE)
--    + policy SELECT publique (additive, n'enlève rien si une
--    lecture publique existe déjà).
-- ============================================================
alter table public.competitions enable row level security;
alter table public.matches enable row level security;

drop policy if exists "competitions_public_select" on public.competitions;
create policy "competitions_public_select" on public.competitions
  for select using (true);

drop policy if exists "competitions_admin_insert" on public.competitions;
create policy "competitions_admin_insert" on public.competitions
  for insert with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "competitions_admin_update" on public.competitions;
create policy "competitions_admin_update" on public.competitions
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "competitions_admin_delete" on public.competitions;
create policy "competitions_admin_delete" on public.competitions
  for delete using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "matches_public_select" on public.matches;
create policy "matches_public_select" on public.matches
  for select using (true);

drop policy if exists "matches_admin_insert" on public.matches;
create policy "matches_admin_insert" on public.matches
  for insert with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "matches_admin_update" on public.matches;
create policy "matches_admin_update" on public.matches
  for update using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "matches_admin_delete" on public.matches;
create policy "matches_admin_delete" on public.matches
  for delete using (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. Verrouillage de validate_ticket() : seuls commercial/admin
--    peuvent valider un billet, vérifié côté Postgres (pas
--    seulement caché côté client).
-- ============================================================
revoke execute on function public.validate_ticket(text) from public;
revoke execute on function public.validate_ticket(text) from anon;
revoke execute on function public.validate_ticket(text) from authenticated;

create or replace function public.validate_ticket_secure(p_code text)
returns setof jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.has_role(auth.uid(), 'commercial') or public.has_role(auth.uid(), 'admin')) then
    raise exception 'not authorized';
  end if;

  return query
  select row_to_json(t)::jsonb
  from public.validate_ticket(p_code) as t;
end;
$$;

revoke all on function public.validate_ticket_secure(text) from public;
grant execute on function public.validate_ticket_secure(text) to authenticated;

-- IMPORTANT : pour que validate_ticket_secure puisse appeler
-- validate_ticket après le REVOKE ci-dessus, les deux fonctions
-- doivent être possédées par le même rôle (normalement `postgres`
-- par défaut sur un projet Supabase non personnalisé -- le SQL
-- Editor s'y connecte déjà en tant que `postgres`, donc rien à
-- faire de plus dans le cas standard).
-- Pour vérifier le propriétaire de validate_ticket :
--   select proowner::regrole from pg_proc where proname = 'validate_ticket';
-- Si ce n'est pas le même rôle que celui utilisé pour exécuter ce
-- script, lancer :
--   alter function public.validate_ticket_secure(text) owner to <ce_role>;
