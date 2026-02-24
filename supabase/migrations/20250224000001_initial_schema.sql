-- =============================================
-- Physio Student Calendar App - Initial Schema
-- =============================================

-- 1. EVENTS TABLE
-- The core table storing all calendar events
-- =============================================

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Basic event info
  title text not null,
  description text,  -- Short description/subtitle
  notes text,        -- Rich text/markdown for detailed notes

  -- Timing
  start_time timestamptz not null,
  end_time timestamptz,
  all_day boolean default false,

  -- Categorization (9 categories from the spec)
  category text not null check (category in (
    'clinical',   -- Clinical Placements (Green)
    'lecture',    -- Lectures (Blue)
    'study',      -- Study Sessions (Purple)
    'task',       -- Tasks (Gray)
    'homework',   -- Homework & Assignments (Amber)
    'exam',       -- Exams (Red)
    'meeting',    -- Meetings (Cyan)
    'personal',   -- Personal (Pink)
    'deadline'    -- Deadlines (Dark Red)
  )),

  -- Status & priority
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  completed boolean default false,

  -- Recurring events (stores pattern like: {"frequency": "weekly", "interval": 1, "until": "2025-06-01"})
  recurring_pattern jsonb,
  parent_event_id uuid references public.events(id) on delete cascade,  -- For recurring instances

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. FILES TABLE
-- Files attached to events (PDFs, images, documents)
-- =============================================

create table public.files (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- File metadata
  file_name text not null,           -- Original filename
  file_path text not null,           -- Path in Supabase storage
  file_type text not null,           -- MIME type (application/pdf, image/png, etc.)
  file_size bigint,                  -- Size in bytes

  created_at timestamptz default now()
);

-- 3. ROW LEVEL SECURITY
-- Ensures users can only access their own data
-- =============================================

alter table public.events enable row level security;
alter table public.files enable row level security;

-- Events policies
create policy "Users can view own events"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Users can create own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can update own events"
  on public.events for update
  using (auth.uid() = user_id);

create policy "Users can delete own events"
  on public.events for delete
  using (auth.uid() = user_id);

-- Files policies
create policy "Users can view own files"
  on public.files for select
  using (auth.uid() = user_id);

create policy "Users can upload own files"
  on public.files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own files"
  on public.files for delete
  using (auth.uid() = user_id);

-- 4. INDEXES
-- Optimize common queries
-- =============================================

-- Fast lookup by user and date range (most common query)
create index idx_events_user_time on public.events(user_id, start_time);

-- Filter by category
create index idx_events_category on public.events(user_id, category);

-- Find incomplete tasks/homework
create index idx_events_incomplete on public.events(user_id, completed) where completed = false;

-- Files by event
create index idx_files_event on public.files(event_id);

-- 5. AUTO-UPDATE TIMESTAMP
-- Automatically update updated_at on row changes
-- =============================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_events_updated
  before update on public.events
  for each row
  execute function public.handle_updated_at();
