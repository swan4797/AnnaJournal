-- Add linked_exam_id column to events table
-- This allows study sessions to be linked to a specific exam

alter table public.events
  add column linked_exam_id uuid references public.events(id) on delete set null;

-- Add index for efficient lookups
create index idx_events_linked_exam on public.events(linked_exam_id);

-- Add comment for documentation
comment on column public.events.linked_exam_id is 'Links a study session to a specific exam event';
