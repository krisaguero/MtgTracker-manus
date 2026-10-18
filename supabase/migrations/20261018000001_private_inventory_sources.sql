-- Private source objects are addressed by auth.uid()/sha256.csv.
-- This migration contains no scan data and creates no public access.
create policy "owners read inventory source objects"
  on storage.objects for select to authenticated
  using (bucket_id = 'mtg-inventory-sources' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners insert inventory source objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mtg-inventory-sources' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners update inventory source objects"
  on storage.objects for update to authenticated
  using (bucket_id = 'mtg-inventory-sources' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'mtg-inventory-sources' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners delete inventory source objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'mtg-inventory-sources' and (storage.foldername(name))[1] = auth.uid()::text);
