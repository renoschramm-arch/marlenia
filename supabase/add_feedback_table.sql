-- Feedback-Funktion: angemeldete Nutzer:innen können über die App eine
-- Nachricht an den Entwickler schicken. Jede Nachricht landet in dieser
-- Tabelle (per SQL Editor / Table Editor einsehbar) und wird zusätzlich
-- per E-Mail zugestellt (siehe supabase/functions/send-feedback).
--
-- Einmalig im Supabase Dashboard → SQL Editor ausführen.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Nutzer:innen dürfen nur eigenes Feedback einfügen, kein Lesen/Ändern/
-- Löschen über die normale API — Einsicht erfolgt ausschließlich über das
-- Supabase Dashboard (Service-Role-Zugriff umgeht RLS ohnehin).
drop policy if exists "Eigenes Feedback einfügen" on public.feedback;
create policy "Eigenes Feedback einfügen"
  on public.feedback for insert
  with check (auth.uid() = user_id);
