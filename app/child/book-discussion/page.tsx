'use client';

import { useState } from 'react';
import { useBookDiscussion } from '@/hooks/useBookDiscussion';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import {
  BookOpen,
  Mic,
  MicOff,
  Loader2,
  ArrowLeft,
  Volume2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BookDiscussionPage() {
  const router = useRouter();
  const [bookTitle, setBookTitle] = useState('');
  const {
    status,
    error,
    isAiSpeaking,
    isUserSpeaking,
    startSession,
    stopSession,
    resetError,
  } = useBookDiscussion();

  const handleStart = async () => {
    const trimmed = bookTitle.trim();
    if (!trimmed) return;
    await startSession(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleStart();
    }
  };

  // --- Idle State: Book title input ---
  if (status === 'idle' && !error) {
    return (
      <div className="container mx-auto p-8 max-w-lg">
        <button
          onClick={() => router.push('/child/dashboard')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">대시보드</span>
        </button>

        <Card padding="lg">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-green-100 rounded-full">
              <BookOpen className="w-12 h-12 text-green-600" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                독서 토론
              </h1>
              <p className="text-gray-600">
                읽은 책의 제목을 입력하면 AI 선생님과 대화할 수 있어요!
              </p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <Input
                placeholder="책 제목을 입력해주세요"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                leftIcon={<BookOpen className="w-4 h-4" />}
                inputSize="lg"
                fullWidth
              />
              <Button
                onClick={handleStart}
                disabled={!bookTitle.trim()}
                size="lg"
                fullWidth
                icon={<Mic className="w-5 h-5" />}
              >
                토론 시작하기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- Connecting State ---
  if (status === 'connecting') {
    return (
      <div className="container mx-auto p-8 max-w-lg">
        <Card padding="lg">
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-lg text-gray-700 font-medium">
              AI 선생님과 연결하고 있어요...
            </p>
            <p className="text-sm text-gray-500">마이크 권한을 허용해주세요</p>
          </div>
        </Card>
      </div>
    );
  }

  // --- Error State ---
  if (status === 'error' || error) {
    return (
      <div className="container mx-auto p-8 max-w-lg">
        <Card padding="lg">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-4 bg-red-100 rounded-full">
              <MicOff className="w-10 h-10 text-red-500" />
            </div>
            <p className="text-lg text-red-600 font-medium text-center">
              {error || '연결에 실패했습니다.'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  resetError();
                }}
                variant="outline"
              >
                돌아가기
              </Button>
              <Button
                onClick={() => {
                  resetError();
                  handleStart();
                }}
              >
                다시 시도
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- Connected State: Voice-only UI ---
  return (
    <div className="container mx-auto p-4 max-w-2xl h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="px-3 py-1 bg-green-100 rounded-full flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            {bookTitle}
          </span>
        </div>
        <Button onClick={stopSession} variant="danger" size="sm">
          토론 끝내기
        </Button>
      </div>

      {/* Voice Status Area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          {isAiSpeaking ? (
            <>
              <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
                <Volume2 className="w-16 h-16 text-blue-500" />
              </div>
              <p className="text-lg font-medium text-blue-600">
                AI 선생님이 말하고 있어요
              </p>
            </>
          ) : isUserSpeaking ? (
            <>
              <div className="w-32 h-32 rounded-full bg-green-100 flex items-center justify-center animate-mic-pulse">
                <Mic className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-lg font-medium text-green-600">
                잘 듣고 있어요!
              </p>
            </>
          ) : (
            <>
              <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center">
                <Mic className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-500">
                말해보세요!
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
