-- Add last_seen column to profiles table
-- Run this SQL command in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Optional: Update existing profiles with current timestamp
-- UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;

-- Create post_comments table if it doesn't exist
-- Note: If table exists, we'll modify it to ensure correct foreign keys
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If post_comments table already exists, modify the author_id foreign key to reference profiles instead of auth.users
-- First drop the existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'post_comments_author_id_fkey'
    AND table_name = 'post_comments'
  ) THEN
    ALTER TABLE post_comments DROP CONSTRAINT post_comments_author_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint to profiles table
ALTER TABLE post_comments
ADD CONSTRAINT post_comments_author_id_fkey
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Make sure content is NOT NULL
ALTER TABLE post_comments
ALTER COLUMN content SET NOT NULL;

-- Create post_reactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction)
);

-- If post_reactions table already exists, ensure the user_id foreign key is correct
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'post_reactions_user_id_fkey'
    AND table_name = 'post_reactions'
  ) THEN
    ALTER TABLE post_reactions DROP CONSTRAINT post_reactions_user_id_fkey;
  END IF;
END $$;

-- Add the correct foreign key constraint to profiles table
ALTER TABLE post_reactions
ADD CONSTRAINT post_reactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Enable Row Level Security on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles (for the user list feature)
CREATE POLICY "Users can view all profiles" ON profiles
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile (including last_seen)
CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure posts table has all required columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'shared'));
ALTER TABLE posts ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES profiles(id);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS related_goal_id UUID; -- Nullable, can reference goals(id) if goals table exists

-- Ensure posts table has correct foreign key for author_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_author_id_fkey'
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_author_id_fkey;
  END IF;
END $$;

ALTER TABLE posts
ADD CONSTRAINT posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Allow authenticated users to read all posts (for social feed)
CREATE POLICY "Users can view posts" ON posts
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to insert their own posts
CREATE POLICY "Users can insert own posts" ON posts
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own posts
CREATE POLICY "Users can update own posts" ON posts
FOR UPDATE USING (auth.uid() = author_id);

-- Allow users to delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
FOR DELETE USING (auth.uid() = author_id);

-- Post Reactions Policies
-- Enable RLS on post_reactions (if not already enabled)
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view all reactions
CREATE POLICY "Users can view all reactions" ON post_reactions
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to add reactions
CREATE POLICY "Users can add reactions" ON post_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to remove their own reactions
CREATE POLICY "Users can remove own reactions" ON post_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Post Comments Policies
-- Enable RLS on post_comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Allow users to view all comments
CREATE POLICY "Users can view all comments" ON post_comments
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to add comments
CREATE POLICY "Users can add comments" ON post_comments
FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update own comments" ON post_comments
FOR UPDATE USING (auth.uid() = author_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments" ON post_comments
FOR DELETE USING (auth.uid() = author_id);

-- Optional: Update existing posts to shared visibility for social feed
-- UPDATE posts SET visibility = 'shared' WHERE visibility = 'private';