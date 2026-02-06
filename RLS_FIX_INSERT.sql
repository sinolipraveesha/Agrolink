-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable INSERT Access for Authenticated Users to Profiles
-- This allows the Farmer App to create the profile row if it doesn't exist (needed for UPSERT)
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ( auth.uid() = id );

-- Optional: Ensure UPDATE is definitely correct (re-run does no harm if already there)
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ( auth.uid() = id )
with check ( auth.uid() = id );
