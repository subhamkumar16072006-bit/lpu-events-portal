-- ============================================================
-- FIX: Make all events (tickets) visible to ALL users
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Enable RLS on tickets (idempotent)
alter table public.tickets enable row level security;

-- 2. Drop ALL existing SELECT policies on tickets
drop policy if exists "Organizers can view their own tickets" on public.tickets;
drop policy if exists "Public can view tickets" on public.tickets;
drop policy if exists "Anyone can view tickets" on public.tickets;

-- 3. Create a single permissive SELECT policy: everyone can read all events
create policy "Anyone can view tickets"
on public.tickets for select
using (true);

-- 4. Allow authenticated users to INSERT events
drop policy if exists "Authenticated users can create tickets" on public.tickets;
create policy "Authenticated users can create tickets"
on public.tickets for insert
to authenticated
with check (true);

-- 5. Allow organizers to UPDATE their own events
drop policy if exists "Organizers can update their own tickets" on public.tickets;
create policy "Organizers can update their own tickets"
on public.tickets for update
to authenticated
using (organizer_id = auth.uid());

-- 6. Allow organizers to DELETE their own events
drop policy if exists "Organizers can delete their own tickets" on public.tickets;
create policy "Organizers can delete their own tickets"
on public.tickets for delete
to authenticated
using (organizer_id = auth.uid());

-- ============================================================
-- Registrations table policies
-- ============================================================

alter table public.registrations enable row level security;

drop policy if exists "Organizers can view registrations for their events" on public.registrations;
drop policy if exists "Organizers can view registrations" on public.registrations;
drop policy if exists "Students can view their own registrations" on public.registrations;
drop policy if exists "Students can view own registrations" on public.registrations;
drop policy if exists "Anyone can view registrations" on public.registrations;

-- Organizers can see registrations for their events
create policy "Organizers can view registrations"
on public.registrations for select
using (
  exists (
    select 1 from public.tickets
    where tickets.id = registrations.event_id
    and tickets.organizer_id = auth.uid()
  )
);

-- Students can see their own registrations
create policy "Students can view own registrations"
on public.registrations for select
using (auth.uid() = student_id);

-- Students can insert registrations (book tickets)
drop policy if exists "Students can register" on public.registrations;
create policy "Students can register"
on public.registrations for insert
to authenticated
with check (true);

-- Organizers can update registrations (confirm attendance)
drop policy if exists "Organizers can update registration status" on public.registrations;
create policy "Organizers can update registration status"
on public.registrations for update
to authenticated
using (
  exists (
    select 1 from public.tickets
    where tickets.id = registrations.event_id
    and tickets.organizer_id = auth.uid()
  )
);
