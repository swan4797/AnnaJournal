-- Create exam_topics table for tracking study topics per exam
create table public.exam_topics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Topic info
  topic_name text not null,
  description text,

  -- Progress tracking
  completed boolean default false,
  confidence integer default 0 check (confidence >= 0 and confidence <= 5),

  -- Ordering
  sort_order integer default 0,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.exam_topics enable row level security;

-- RLS Policies
create policy "Users can view own exam topics"
  on public.exam_topics for select
  using (auth.uid() = user_id);

create policy "Users can create own exam topics"
  on public.exam_topics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own exam topics"
  on public.exam_topics for update
  using (auth.uid() = user_id);

create policy "Users can delete own exam topics"
  on public.exam_topics for delete
  using (auth.uid() = user_id);

-- Indexes for common queries
create index idx_exam_topics_event on public.exam_topics(event_id);
create index idx_exam_topics_user on public.exam_topics(user_id);

-- Auto-update trigger for updated_at
create trigger on_exam_topics_updated
  before update on public.exam_topics
  for each row
  execute function public.handle_updated_at();
