-- Assignments table
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Basic info
  title text not null,
  description text,
  instructions text, -- Detailed instructions (rich text)

  -- Scheduling
  due_date timestamptz not null,

  -- Linking
  linked_class_id uuid references public.classes(id) on delete set null,

  -- Status and tracking
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'submitted', 'graded')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  completed boolean default false,

  -- Grading
  grade numeric(5,2), -- e.g., 95.50
  max_grade numeric(5,2) default 100, -- e.g., 100
  weight numeric(5,2), -- percentage weight in final grade, e.g., 10.00
  feedback text, -- instructor feedback

  -- Timestamps
  submitted_at timestamptz,
  graded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Link events back to their parent assignment
alter table public.events add column parent_assignment_id uuid references public.assignments(id) on delete cascade;

-- Enable RLS
alter table public.assignments enable row level security;

-- Assignments policies
create policy "Users can view own assignments"
  on public.assignments for select
  using (auth.uid() = user_id);

create policy "Users can create own assignments"
  on public.assignments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own assignments"
  on public.assignments for update
  using (auth.uid() = user_id);

create policy "Users can delete own assignments"
  on public.assignments for delete
  using (auth.uid() = user_id);

-- Indexes
create index idx_assignments_user on public.assignments(user_id);
create index idx_assignments_class on public.assignments(linked_class_id);
create index idx_assignments_due_date on public.assignments(due_date);
create index idx_assignments_status on public.assignments(status);
create index idx_events_parent_assignment on public.events(parent_assignment_id);

-- Auto-update trigger
create trigger on_assignments_updated
  before update on public.assignments
  for each row
  execute function public.handle_updated_at();
