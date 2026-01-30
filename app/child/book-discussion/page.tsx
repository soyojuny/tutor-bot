'use client';

import { useState } from 'react';
import { useBookDiscussion } from '@/hooks/useBookDiscussion';
import { useAuth } from '@/hooks/useAuth';
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
  Search,
  RotateCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BookSearchResult } from '@/types';

type PageState = 'idle' | 'searching' | 'selecting' | 'connecting' | 'connected' | 'error';

export default function BookDiscussionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookTitle, setBookTitle] = useState('');
  const [pageState, setPageState] = useState<PageState>('idle');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const {
    status,
    error,
    isAiSpeaking,
    isUserSpeaking,
    startSession,
    stopSession,
    resetError,
  } = useBookDiscussion();

  // Sync hook status to page state for connecting/connected/error
  const effectiveState: PageState =
    status === 'connecting'
      ? 'connecting'
      : status === 'connected'
        ? 'connected'
        : status === 'error' || error
          ? 'error'
          : pageState;

  const handleSearch = async () => {
    const trimmed = bookTitle.trim();
    if (!trimmed) return;

    setPageState('searching');
    setSearchError(null);

    try {
      const res = await fetch(
        `/api/book-discussion/search?q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        throw new Error('검색에 실패했습니다.');
      }
      const data = await res.json();
      setSearchResults(data.results ?? []);
      setPageState('selecting');
    } catch {
      setSearchError('책 검색에 실패했습니다. 다시 시도해주세요.');
      setPageState('idle');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      handleSearch();
    }
  };

  const handleSelectBook = async (book: BookSearchResult) => {
    await startSession(
      book.title,
      book.description || undefined,
      user?.age ?? undefined
    );
  };

  const handleStartWithoutBook = async () => {
    const trimmed = bookTitle.trim();
    if (!trimmed) return;
    await startSession(trimmed, undefined, user?.age ?? undefined);
  };

  const handleBackToSearch = () => {
    setPageState('idle');
    setSearchResults([]);
    setSearchError(null);
  };

  // --- Idle State: Book title input ---
  if (effectiveState === 'idle') {
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
                읽은 책의 제목을 입력하고 검색해보세요!
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
              {searchError && (
                <p className="text-sm text-red-600">{searchError}</p>
              )}
              <Button
                onClick={handleSearch}
                disabled={!bookTitle.trim()}
                size="lg"
                fullWidth
                icon={<Search className="w-5 h-5" />}
              >
                책 검색하기
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // --- Searching State ---
  if (effectiveState === 'searching') {
    return (
      <div className="container mx-auto p-8 max-w-lg">
        <Card padding="lg">
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-lg text-gray-700 font-medium">
              책을 찾고 있어요...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // --- Selecting State: Show search results ---
  if (effectiveState === 'selecting') {
    return (
      <div className="container mx-auto p-8 max-w-lg">
        <button
          onClick={handleBackToSearch}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">다시 검색</span>
        </button>

        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              어떤 책인가요?
            </h2>
            <p className="text-gray-500 text-sm">
              읽은 책을 선택해주세요
            </p>
          </div>

          {searchResults.length > 0 ? (
            <div className="flex flex-col gap-3">
              {searchResults.map((book, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectBook(book)}
                  className="flex items-start gap-4 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-400 hover:shadow-md transition-all text-left"
                >
                  {book.thumbnail ? (
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      className="w-16 h-22 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-22 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {book.title}
                    </p>
                    {book.authors.length > 0 && (
                      <p className="text-sm text-gray-500 truncate">
                        {book.authors.join(', ')}
                      </p>
                    )}
                    {book.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {book.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Card padding="lg">
              <div className="flex flex-col items-center gap-3 py-4">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleBackToSearch}
              variant="outline"
              fullWidth
              icon={<RotateCcw className="w-4 h-4" />}
            >
              다시 검색
            </Button>
            <Button
              onClick={handleStartWithoutBook}
              fullWidth
              icon={<Mic className="w-4 h-4" />}
            >
              바로 토론하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Connecting State ---
  if (effectiveState === 'connecting') {
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
  if (effectiveState === 'error') {
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
                  handleBackToSearch();
                }}
                variant="outline"
              >
                돌아가기
              </Button>
              <Button
                onClick={() => {
                  resetError();
                  handleStartWithoutBook();
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
