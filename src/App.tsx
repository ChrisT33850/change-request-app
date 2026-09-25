-- ============================================================
-- Authentification "table personnalisée" sécurisée avec pgcrypto
-- À exécuter une fois dans Supabase → SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- Table des comptes (les mêmes personnes que "The Signatory")
create table if not exists public.app_users (
  username text primary key,
  display_name text not null,
  password_hash text,              -- NULL tant que l'utilisateur n'a pas choisi son mot de passe
  created_at timestamptz default now()
);

-- Seed : les mêmes usernames que AVAILABLE_STAKEHOLDERS + christophe (requester)
insert into public.app_users (username, display_name) values
  ('christophe', 'Christophe Trevise'),
  ('marco.fallea', 'Marco Fallea'),
  ('michael.hamadouche', 'Michael Hamadouche'),
  ('arianne.bryant', 'Arianne Bryant'),
  ('ernesto.filizzola', 'Ernesto Filizzola'),
  ('kevin.allan', 'Kevin Allan'),
  ('joan.pascual', 'Joan Pascual')
on conflict (username) do nothing;

-- IMPORTANT : RLS activé SANS policy => la table n'est jamais lisible/écrivable
-- directement via la clé anon. Seules les fonctions ci-dessous (security definer)
-- peuvent la toucher, et elles ne renvoient jamais le hash au client.
alter table public.app_users enable row level security;

-- Est-ce que ce user a déjà choisi un mot de passe ?
create or replace function public.has_password(p_username text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select password_hash is not null
  from app_users
  where username = p_username;
$$;

-- Premier choix de mot de passe (uniquement si aucun n'est encore défini)
create or replace function public.set_initial_password(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(p_password) < 8 then
    return false;
  end if;

  update app_users
  set password_hash = crypt(p_password, gen_salt('bf'))
  where username = p_username and password_hash is null;

  return found;
end;
$$;

-- Vérifie un identifiant + mot de passe (retourne juste true/false, jamais le hash)
create or replace function public.verify_login(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  select password_hash into v_hash from app_users where username = p_username;

  if v_hash is null then
    return false;
  end if;

  return v_hash = crypt(p_password, v_hash);
end;
$$;

-- Changement de mot de passe (demande l'ancien pour confirmer l'identité)
create or replace function public.change_password(p_username text, p_old_password text, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(p_new_password) < 8 then
    return false;
  end if;

  update app_users
  set password_hash = crypt(p_new_password, gen_salt('bf'))
  where username = p_username
    and password_hash = crypt(p_old_password, password_hash);

  return found;
end;
$$;

-- Seules ces 4 fonctions sont exposées à l'app (rôle "anon" = clé publique du client)
grant execute on function public.has_password(text) to anon;
grant execute on function public.set_initial_password(text, text) to anon;
grant execute on function public.verify_login(text, text) to anon;
grant execute on function public.change_password(text, text, text) to anon;

-- La table elle-même reste inaccessible en direct (ni lecture ni écriture) via anon,
-- ce qui empêche quiconque de lire les hash de mots de passe depuis le navigateur.
