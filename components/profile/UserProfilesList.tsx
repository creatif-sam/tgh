'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface UserProfile extends Profile {
  isOnline?: boolean;
}

export default function UserProfilesList() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const supabase = createClient();

    // Get all profiles except current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id)
      .order('last_seen', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
      return;
    }

    // Mark users as online if last_seen is within last 5 minutes
    const now = new Date();
    const onlineThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds

    const usersWithOnlineStatus = data?.map(user => ({
      ...user,
      isOnline: user.last_seen ? (now.getTime() - new Date(user.last_seen).getTime()) < onlineThreshold : false
    })) || [];

    setUsers(usersWithOnlineStatus);
    setLoading(false);
  };

  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return 'Never seen';

    try {
      return `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`;
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading users...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Other Users</h2>
      {users.length === 0 ? (
        <p className="text-gray-500">No other users found.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} alt={user.name || 'User'} />
                    <AvatarFallback>
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {user.name || 'Anonymous User'}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge
                        variant={user.isOnline ? "default" : "secondary"}
                        className={user.isOnline ? "bg-green-500" : ""}
                      >
                        {user.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {getLastSeenText(user.last_seen)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Joined {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'Unknown'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}