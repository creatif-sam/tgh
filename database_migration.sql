-- Add last_seen column to profiles table
-- Run this SQL command in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE;

-- Optional: Update existing profiles with current timestamp
-- UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;