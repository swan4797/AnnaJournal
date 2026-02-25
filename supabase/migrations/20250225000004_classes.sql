-- Classes table (recurring schedule patterns)
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Basic info
  title text not null,
  module_code text,
  module_name text,
  instructor text,
  location text,

  -- Schedule pattern
  days_of_week integer[] not null,  -- 0=Sun, 1=Mon, 2=Tue, etc.
  start_time time not null,
  end_time time not null,

  -- Semester bounds
  semester_start date not null,
  semester_end date not null,

  -- Visual
  color text default 'blue',
  notes text,
  linked_exam_id uuid references public.events(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Class exceptions (cancellations, reschedules)
create table public.class_exceptions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade not null,
  exception_date date not null,
  exception_type text not null check (exception_type in ('cancelled', 'rescheduled', 'moved')),
  new_start_time time,
  new_end_time time,
  new_location text,
  reason text,
  created_at timestamptz default now()
);

-- Link events back to their parent class
alter table public.events add column parent_class_id uuid references public.classes(id) on delete cascade;

-- Enable RLS
alter table public.classes enable row level security;
alter table public.class_exceptions enable row level security;

-- Classes policies
create policy "Users can view own classes"
  on public.classes for select
  using (auth.uid() = user_id);

create policy "Users can create own classes"
  on public.classes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own classes"
  on public.classes for update
  using (auth.uid() = user_id);

create policy "Users can delete own classes"
  on public.classes for delete
  using (auth.uid() = user_id);

-- Class exceptions policies
create policy "Users can view own class exceptions"
  on public.class_exceptions for select
  using (exists (
    select 1 from public.classes c where c.id = class_id and c.user_id = auth.uid()
  ));

create policy "Users can create own class exceptions"
  on public.class_exceptions for insert
  with check (exists (
    select 1 from public.classes c where c.id = class_id and c.user_id = auth.uid()
  ));

create policy "Users can update own class exceptions"
  on public.class_exceptions for update
  using (exists (
    select 1 from public.classes c where c.id = class_id and c.user_id = auth.uid()
  ));

create policy "Users can delete own class exceptions"
  on public.class_exceptions for delete
  using (exists (
    select 1 from public.classes c where c.id = class_id and c.user_id = auth.uid()
  ));

-- Indexes
create index idx_classes_user on public.classes(user_id);
create index idx_classes_days on public.classes using gin(days_of_week);
create index idx_class_exceptions_class on public.class_exceptions(class_id);
create index idx_class_exceptions_date on public.class_exceptions(exception_date);
create index idx_events_parent_class on public.events(parent_class_id);

-- Auto-update trigger
create trigger on_classes_updated
  before update on public.classes
  for each row
  execute function public.handle_updated_at();
