-- Add class link to notes table
alter table public.notes
  add column linked_class_id uuid references public.classes(id) on delete set null;

-- Index for querying notes by class
create index idx_notes_class on public.notes(linked_class_id);
