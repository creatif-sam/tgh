'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Camera, Save } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [goalStats, setGoalStats] = useState({ total: 0, completed: 0 });
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setName(data?.name || '');
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!profile) return;
    const supabase = createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, name });
      setEditing(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!profile) return;
    if (!file) {
      alert('No file selected!');
      return;
    }
    console.log('Uploading file:', file);
    console.log('File type:', file?.type, 'File size:', file?.size);
    setUploading(true);
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}.${fileExt}`; // Store at bucket root
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert('Failed to upload avatar!');
      setUploading(false);
      return;
    }
    // Get public URL
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    if (data?.publicUrl) {
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id);
      if (!updateError) {
        setProfile({ ...profile, avatar_url: data.publicUrl });
      } else {
        alert('Failed to update profile avatar!');
      }
    }
    setUploading(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/login';
  };

  const fetchStats = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found.');
      return;
    }

    console.log('Authenticated user:', user);

    // Fetch goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('owner_id', user.id);

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      console.log('Supabase query response:', goals);
    } else {
      console.log('Fetched goals:', goals);
    }

    const totalGoals = goals?.length || 0;
    const completedGoals = goals?.filter((goal) => goal.status === 'done').length || 0;
    setGoalStats({ total: totalGoals, completed: completedGoals });

    // Fetch posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      console.log('Supabase query response:', posts);
    } else {
      console.log('Fetched posts:', posts);
    }

    setPostCount(posts?.length || 0);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : 'Change Photo'}
            </Button>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            {editing ? (
              <div className="flex gap-2">
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
                <Button onClick={updateProfile} size="sm">
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} size="sm">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span>{name || 'No name set'}</span>
                <Button variant="outline" onClick={() => setEditing(true)} size="sm">
                  Edit
                </Button>
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-muted-foreground">{profile?.id}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Total Goals</span>
            <span>{goalStats.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Completed Goals</span>
            <span>{((goalStats.completed / goalStats.total) * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Total Posts</span>
            <span>{postCount}</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card>
        <CardContent className="p-4">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}