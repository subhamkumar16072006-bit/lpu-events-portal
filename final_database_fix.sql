-- ============================================================
-- FINAL SYSTEM FIX: Unique Codes & Attendee Visibility
-- ============================================================

-- 1. Add verification_code to registrations
alter table public.registrations 
add column if not exists verification_code text;

-- 2. Generate codes for existing registrations (if any)
update public.registrations 
set verification_code = floor(random() * 90000 + 10000)::text 
where verification_code is null;

-- 3. Update book_ticket RPC to generate unique 5-digit code
-- We drop it first to avoid "cannot change return type" errors if it already exists
drop function if exists public.book_ticket(uuid, uuid, text, text, text);

create or replace function public.book_ticket(
  p_event_id uuid,
  p_student_id uuid,
  p_student_name text,
  p_registration_number text,
  p_course text
)
returns json
language plpgsql
security definer
as $$
declare
  v_capacity int;
  v_booked int;
  v_registration_id uuid;
  v_code text;
begin
  -- Check capacity
  select total_capacity, tickets_booked into v_capacity, v_booked
  from public.tickets
  where id = p_event_id;

  if not found then
    return json_build_object('error', 'Event not found');
  end if;

  if v_booked >= v_capacity then
    return json_build_object('error', 'Sold Out');
  end if;

  -- Generate a 5-digit code that is unique for this event
  -- Loop to ensure uniqueness within the event (unlikely to collide but safe)
  loop
    v_code := floor(random() * 90000 + 10000)::text;
    exit when not exists (
      select 1 from public.registrations 
      where event_id = p_event_id and verification_code = v_code
    );
  end loop;

  -- Insert registration with new details & code
  insert into public.registrations (
    event_id, 
    student_id, 
    student_name, 
    registration_number, 
    course,
    verification_code,
    status
  )
  values (
    p_event_id, 
    p_student_id, 
    p_student_name, 
    p_registration_number, 
    p_course,
    v_code,
    'confirmed'
  )
  returning id into v_registration_id;

  -- Increment ticket count
  update public.tickets
  set tickets_booked = tickets_booked + 1
  where id = p_event_id;

  return json_build_object('success', true, 'registration_id', v_registration_id, 'verification_code', v_code);
exception
  when unique_violation then
    return json_build_object('error', 'You have already booked this event');
  when others then
    return json_build_object('error', SQLERRM);
end;
$$;

-- 4. Update verify_ticket RPC to support 5-digit code
drop function if exists public.verify_ticket(text);

create or replace function public.verify_ticket(
  p_search_query text
)
returns table (
  id uuid,
  student_name text,
  registration_number text,
  course text,
  status text,
  event_name text,
  event_date date,
  verification_code text
) 
language plpgsql
security definer
as $$
begin
  return query
  select 
    r.id,
    r.student_name,
    r.registration_number,
    r.course,
    r.status,
    t.event_name,
    t.event_date::date,
    r.verification_code
  from public.registrations r
  join public.tickets t on r.event_id = t.id
  where 
    -- 1. Match 5-digit verification code (Highest Priority)
    (r.verification_code = p_search_query)
    OR
    -- 2. Match full UUID
    (p_search_query ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
     and r.id = p_search_query::uuid)
    OR
    -- 3. Match short 8-char ID prefix
    (length(p_search_query) = 8 and r.id::text ilike p_search_query || '%');
end;
$$;

-- 5. Fix RLS for Attendee Visibility
-- Drop restrictive policies
drop policy if exists "Organizers can view registrations" on public.registrations;
drop policy if exists "Organizers can view registrations for their events" on public.registrations;

-- Create robust policy: Organizers can see ALL columns for registrations of THEIR events
create policy "Organizers can view registrations"
on public.registrations for select
to authenticated
using (
  exists (
    select 1 from public.tickets
    where tickets.id = registrations.event_id
    and tickets.organizer_id = auth.uid()
  )
);
