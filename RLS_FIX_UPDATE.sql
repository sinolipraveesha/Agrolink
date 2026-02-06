-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Check if an update policy already exists (optional, but good practice to clear old ones)
drop policy if exists "Users can update own profile" on public.profiles;

-- 2. Create Policy to Allow Users to Update their OWN Profile
-- (This is required for the Farmer App to save GPS coordinates)
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );
