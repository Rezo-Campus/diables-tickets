-- À exécuter UNE SEULE FOIS, après supabase_setup_roles.sql, pour créer
-- le premier compte admin (sinon personne ne peut attribuer de rôle via
-- l'écran /admin/users).
--
-- Le compte doit déjà exister : connecte-toi d'abord dans l'app (email/
-- mot de passe ou Google), PUIS lance ce script en remplaçant l'email.

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'REMPLACE_PAR_TON_EMAIL@exemple.com'
on conflict (user_id, role) do nothing;
