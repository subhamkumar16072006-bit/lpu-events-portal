-- 1. Create registrations table
create table public.registrations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_id uuid references public.tickets(id) on delete cascade not null,
  student_id uuid references auth.users(id) not null,
  status text default 'confirmed'::text,
  
  -- Prevent duplicate bookings
  unique(event_id, student_id)
);

-- 2. Enable RLS
alter table public.registrations enable row level security;

-- 3. Create RLS Policies
-- Students can view their own registrations
create policy "Students can view their own registrations"
on public.registrations for select
using (auth.uid() = student_id);

-- Organizers can view registrations for their events
create policy "Organizers can view registrations for their events"
on public.registrations for select
using (
  exists (
    select 1 from public.tickets
    where tickets.id = registrations.event_id
    and tickets.organizer_id = auth.uid()
  )
);

-- Students can insert their own registrations (via RPC mainly, but good to have)
create policy "Students can insert their own registrations"
on public.registrations for insert
with check (auth.uid() = student_id);

-- 4. Create Booking RPC Function (Transaction)
-- This ensures we don't overbook and handles the counter increment atomically
create or replace function public.book_ticket(
  p_event_id uuid,
  p_student_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  v_capacity int;
  v_booked int;
  v_registration_id uuid;
begin
  -- Check current capacity and booked count
  select total_capacity, tickets_booked into v_capacity, v_booked
  from public.tickets
  where id = p_event_id;

  if not found then
    return json_build_object('error', 'Event not found');
  end if;

  if v_booked >= v_capacity then
    return json_build_object('error', 'Sold Out');
  end if;

  -- Insert registration
  insert into public.registrations (event_id, student_id)
  values (p_event_id, p_student_id)
  returning id into v_registration_id;

  -- Increment ticket count
  update public.tickets
  set tickets_booked = tickets_booked + 1
  where id = p_event_id;

  return json_build_object('success', true, 'registration_id', v_registration_id);
exception
  when unique_violation then
    return json_build_object('error', 'You have already booked this event');
  when others then
    return json_build_object('error', SQLERRM);
end;
$$;
