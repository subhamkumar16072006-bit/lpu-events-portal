-- Drop potentially problematic policies
drop policy if exists "Organizers can view registrations for their events" on public.registrations;
drop policy if exists "Students can view their own registrations" on public.registrations;

-- Re-create simplified policies

-- 1. Organizer Policy: Use a more direct check if possible, or ensure syntax is clean
create policy "Organizers can view registrations"
on public.registrations for select
using (
  exists (
    select 1 from public.tickets
    where tickets.id = registrations.event_id
    and tickets.organizer_id = auth.uid()
  )
);

-- 2. Student Policy
create policy "Students can view own registrations"
on public.registrations for select
using (auth.uid() = student_id);

-- 3. Ensure Tickets are visible to Organizers (if RLS is on tickets)
alter table public.tickets enable row level security;

create policy "Organizers can view their own tickets"
on public.tickets for select
using (organizer_id = auth.uid());

-- Allow students to view all tickets (public)
create policy "Public can view tickets"
on public.tickets for select
using (true);
