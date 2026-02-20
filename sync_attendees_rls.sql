-- ============================================================
-- FIX: Allow Organizers to Update Registration Status
-- This enables the Scanner to mark tickets as "used"
-- ============================================================

-- 1. Drop existing update policy if any (unlikely based on my check)
drop policy if exists "Organizers can update registration status" on public.registrations;

-- 2. Create the UPDATE policy
-- Only organizers can update registrations, and ONLY for events they own
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
