-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Enable Read Access for All Users to Profiles
-- This allows the Driver to see the Farmer's name and location
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

create policy "Public profiles are viewable by everyone"
on public.profiles for select
to authenticated, anon
using ( true );

-- 2. Enable Realtime for Profiles
-- (You usually do this in the Table Editor UI, but this SQL ensures it's on)
alter publication supabase_realtime add table profiles;
