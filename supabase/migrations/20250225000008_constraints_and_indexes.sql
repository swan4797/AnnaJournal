-- Add missing constraints and indexes for data integrity and performance

-- =============================================
-- CONSTRAINTS
-- =============================================

-- Classes: Validate semester dates
alter table public.classes
  add constraint check_semester_dates
  check (semester_start <= semester_end);

-- Classes: Validate time order (start_time < end_time)
-- Note: PostgreSQL TIME comparison works correctly for 24-hour format
alter table public.classes
  add constraint check_class_times
  check (start_time < end_time);

-- Class exceptions: Validate rescheduled times
alter table public.class_exceptions
  add constraint check_exception_times
  check (new_start_time is null or new_end_time is null or new_start_time < new_end_time);

-- Assignments: Validate grade is within range
alter table public.assignments
  add constraint check_grade_positive
  check (grade is null or grade >= 0);

alter table public.assignments
  add constraint check_max_grade_positive
  check (max_grade is null or max_grade > 0);

alter table public.assignments
  add constraint check_grade_within_max
  check (grade is null or max_grade is null or grade <= max_grade);

-- Assignments: Validate weight percentage
alter table public.assignments
  add constraint check_weight_range
  check (weight is null or (weight >= 0 and weight <= 100));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Files: Index by user_id for listing user's files
create index if not exists idx_files_user on public.files(user_id);

-- Notes: Index by linked_exam_id for exam-related queries
create index if not exists idx_notes_exam on public.notes(linked_exam_id) where linked_exam_id is not null;

-- Notes: Index by linked_class_id for class-related queries
create index if not exists idx_notes_class on public.notes(linked_class_id) where linked_class_id is not null;

-- Exam topics: Partial index for incomplete topics
create index if not exists idx_exam_topics_incomplete on public.exam_topics(user_id, event_id) where completed = false;

-- Assignments: Composite index for common queries (user + status)
create index if not exists idx_assignments_user_status on public.assignments(user_id, status);

-- Assignments: Index for class-based queries with due date
create index if not exists idx_assignments_class_due on public.assignments(linked_class_id, due_date) where linked_class_id is not null;

-- Events: Index for assignment-related events
create index if not exists idx_events_parent_assignment on public.events(parent_assignment_id) where parent_assignment_id is not null;
