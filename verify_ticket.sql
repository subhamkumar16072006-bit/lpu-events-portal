-- ============================================================
-- HELPER: Flexible Ticket Verification
-- This function allows lookups by Full ID, Short ID, or Reg No.
-- ============================================================

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
  event_date date
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
    t.event_date::date
  from public.registrations r
  join public.tickets t on r.event_id = t.id
  where 
    -- 1. Match full UUID
    (p_search_query ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' 
     and r.id = p_search_query::uuid)
    OR
    -- 2. Match short 8-char ID prefix
    (length(p_search_query) = 8 and r.id::text ilike p_search_query || '%')
    OR
    -- 3. Match Registration Number
    (r.registration_number = p_search_query);
end;
$$;
