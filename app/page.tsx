'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function Home() {
  const router = useRouter();
  const [bibleVerse, setBibleVerse] = useState<string>('');

  useEffect(() => {
    const fetchBibleVerse = async () => {
      try {
        const response = await fetch('https://beta.ourmanna.com/api/v1/get/?format=text');
        const verse = await response.text();
        setBibleVerse(verse);
      } catch (error) {
        console.error('Failed to fetch Bible verse:', error);
      }
    };

    fetchBibleVerse();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        router.push('/protected');
      } else {
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <div className="w-full bg-gradient-to-r from-violet-600 to-blue-500 text-white py-4 px-6">
        <h1 className="text-2xl font-bold">Together</h1>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center max-w-lg">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-4">
            Welcome to Together
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Collaborate, plan, and achieve your goals with ease. Join us today and make your dreams a reality.
          </p>
          <Button
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-none shadow-lg"
            onClick={() => router.push('/auth/sign-up')}
          >
            Get Started
          </Button>
          {bibleVerse && (
            <div className="mt-6 text-gray-700 italic">
              <p>Daily Bible Verse:</p>
              <p>{bibleVerse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
