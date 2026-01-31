'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Profile, BookDiscussionWithProfile } from '@/types';
import Card from '@/components/shared/Card';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ReadingRecordsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [discussions, setDiscussions] = useState<BookDiscussionWithProfile[]>([]);
  const [childProfiles, setChildProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDiscussions(selectedProfileId === 'all' ? undefined : selectedProfileId);
    }
  }, [user, selectedProfileId]);

  async function loadData() {
    setIsLoading(true);
    try {
      await Promise.all([fetchChildProfiles(), fetchDiscussions()]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchChildProfiles() {
    try {
      const res = await fetch('/api/profiles?role=child');
      const data = await res.json();
      if (res.ok) {
        const profiles = (data.profiles || []).sort(
          (a: Profile, b: Profile) => (b.age || 0) - (a.age || 0)
        );
        setChildProfiles(profiles);
      }
    } catch (err) {
      console.error('Failed to fetch child profiles:', err);
    }
  }

  async function fetchDiscussions(profileId?: string) {
    try {
      const params = new URLSearchParams();
      if (profileId) params.set('profile_id', profileId);
      const res = await fetch(`/api/book-discussions?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setDiscussions(data.discussions || []);
      }
    } catch (err) {
      console.error('Failed to fetch discussions:', err);
    }
  }

  function formatDate(dateString: string) {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateString;
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 max-w-3xl">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-3xl">
      <button
        onClick={() => router.push('/parent/dashboard')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">대시보드</span>
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <BookOpen className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">독서 기록</h1>
            <p className="text-sm text-gray-500">아이들의 독서 토론 기록</p>
          </div>
        </div>

        {childProfiles.length > 1 && (
          <select
            value={selectedProfileId}
            onChange={(e) => setSelectedProfileId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">전체</option>
            {childProfiles.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {discussions.length === 0 ? (
        <Card padding="lg">
          <div className="flex flex-col items-center gap-3 py-8">
            <BookOpen className="w-12 h-12 text-gray-300" />
            <p className="text-gray-500">아직 독서 토론 기록이 없습니다.</p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {discussions.map((d) => (
            <Card key={d.id} padding="md">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-green-50 rounded-lg flex-shrink-0 mt-1">
                  <BookOpen className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {d.book_title}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                      {d.profile_name}
                    </span>
                  </div>
                  {d.summary && (
                    <p className="text-sm text-gray-600 mb-2">{d.summary}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    {formatDate(d.discussed_at)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
