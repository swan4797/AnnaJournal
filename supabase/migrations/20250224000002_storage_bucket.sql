-- =============================================
-- Storage Bucket for Event Files
-- =============================================

-- Create the storage bucket for event file uploads
insert into storage.buckets (id, name, public)
values ('event-files', 'event-files', false);

-- Storage policies (users can only access their own files)
-- Files are stored in folders named by user_id: {user_id}/filename.pdf

create policy "Users can upload files"
  on storage.objects for insert
  with check (
    bucket_id = 'event-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own files"
  on storage.objects for select
  using (
    bucket_id = 'event-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'event-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'event-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
