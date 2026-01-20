-- Add last_seen column to profiles table
-- Run this SQL command in your Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE;

-- Optional: Update existing profiles with current timestamp
-- UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;

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

-- Posts Policies
-- Enable RLS on posts (if not already enabled)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

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
-- Enable RLS on post_reactions
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