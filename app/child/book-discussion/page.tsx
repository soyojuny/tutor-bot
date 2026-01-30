'use client';

import { useState, useRef, useEffect } from 'react';
import { useBookDiscussion, TranscriptEntry } from '@/hooks/useBookDiscussion';
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
    transcripts,
    partialUserText,
    partialAiText,
    isAiSpeaking,
    startSession,
    stopSession,
    resetError,
  } = useBookDiscussion();

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, partialUserText, partialAiText]);

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

  // --- Connected State: Chat UI ---
  return (
    <div className="container mx-auto p-4 max-w-2xl h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-green-100 rounded-full flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {bookTitle}
            </span>
          </div>
          {isAiSpeaking && (
            <div className="flex items-center gap-1 text-blue-500">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-xs">말하는 중...</span>
            </div>
          )}
        </div>
        <Button onClick={stopSession} variant="danger" size="sm">
          토론 끝내기
        </Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto rounded-lg bg-white shadow-inner p-4 space-y-3">
        {transcripts.length === 0 && !partialAiText && !partialUserText && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            AI 선생님이 곧 말을 걸어줄 거예요...
          </div>
        )}

        {transcripts.map((entry: TranscriptEntry, i: number) => (
          <ChatBubble key={i} entry={entry} />
        ))}

        {/* Partial AI text (in progress) */}
        {partialAiText && (
          <ChatBubble
            entry={{ role: 'ai', text: partialAiText }}
            partial
          />
        )}

        {/* Partial user text (in progress) */}
        {partialUserText && (
          <ChatBubble
            entry={{ role: 'user', text: partialUserText }}
            partial
          />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-center gap-3 py-2">
        <div className="flex items-center gap-2 text-green-600">
          <Mic className="w-5 h-5" />
          <span className="text-sm font-medium">마이크 활성화됨</span>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  entry,
  partial = false,
}: {
  entry: TranscriptEntry;
  partial?: boolean;
}) {
  const isUser = entry.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-yellow-100 text-gray-800 rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        } ${partial ? 'opacity-60' : ''}`}
      >
        {entry.text}
      </div>
    </div>
  );
}
