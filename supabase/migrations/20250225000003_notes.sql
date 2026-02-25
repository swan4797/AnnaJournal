-- Create notes table
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Note content
  title text not null,
  content text, -- Rich text HTML from TipTap

  -- Organization
  subject text, -- e.g., "Anatomy", "Physiology"
  tags text[], -- Array of tags
  color text, -- Optional color coding
  pinned boolean default false,

  -- Optional linking
  linked_exam_id uuid references public.events(id) on delete set null,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.notes enable row level security;

-- RLS Policies
create policy "Users can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can create own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Indexes
create index idx_notes_user on public.notes(user_id);
create index idx_notes_subject on public.notes(subject);
create index idx_notes_updated on public.notes(updated_at desc);
create index idx_notes_pinned on public.notes(pinned) where pinned = true;

-- Full-text search index
create index idx_notes_search on public.notes
  using gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Auto-update trigger (reuse existing handle_updated_at function)
create trigger on_notes_updated
  before update on public.notes
  for each row
  execute function public.handle_updated_at();

-- Note files junction table (extends existing files infrastructure)
create table public.note_files (
  id uuid primary key default gen_random_uuid(),
  note_id uuid references public.notes(id) on delete cascade not null,
  file_id uuid references public.files(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(note_id, file_id)
);

alter table public.note_files enable row level security;

create policy "Users can manage own note files"
  on public.note_files for all
  using (
    exists (
      select 1 from public.notes
      where id = note_id and user_id = auth.uid()
    )
  );
