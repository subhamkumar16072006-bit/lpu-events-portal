-- 1. Add new columns to registrations table
alter table public.registrations 
add column if not exists student_name text,
add column if not exists registration_number text,
add column if not exists course text;

-- 2. Update the book_ticket RPC function to accept new parameters
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

  -- Insert registration with new details
  insert into public.registrations (
    event_id, 
    student_id, 
    student_name, 
    registration_number, 
    course
  )
  values (
    p_event_id, 
    p_student_id, 
    p_student_name, 
    p_registration_number, 
    p_course
  )
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
