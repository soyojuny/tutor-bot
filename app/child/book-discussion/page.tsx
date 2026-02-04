'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useBookDiscussion } from '@/hooks/useBookDiscussion';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import Input from '@/components/shared/Input';
import AudioLevelMeter from '@/components/child/AudioLevelMeter';
import VadThresholdSlider from '@/components/child/VadThresholdSlider';
import {
  BookOpen,
  Mic,
  MicOff,
  Loader2,
  ArrowLeft,
  Volume2,
  Search,
  RotateCcw,
  Camera,
  WifiOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BookSearchResult, BookCoverInfo } from '@/types';
import type { TranscriptEntry } from '@/hooks/useBookDiscussion';

type PageState = 'idle' | 'searching' | 'selecting' | 'connecting' | 'connected' | 'error';

export default function BookDiscussionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookTitle, setBookTitle] = useState('');
  const [pageState, setPageState] = useState<PageState>('idle');
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isRecognizingCover, setIsRecognizingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    status,
    error,
    transcripts,
    partialUserText,
    partialAiText,
    isAiSpeaking,
    isUserSpeaking,
    hasAiResponded,
    isSaving,
    isReconnecting,
    audioDebugInfo,
    micState,
    vadThreshold,
    startSession,
    stopSession,
    resetError,
    saveDiscussion,
  } = useBookDiscussion();
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // 연속된 같은 역할의 항목을 턴 단위로 그룹핑
  const groupedTranscripts = useMemo(() => {
    const groups: TranscriptEntry[] = [];
    for (const entry of transcripts) {
      const last = groups[groups.length - 1];
      if (last && last.role === entry.role) {
        groups[groups.length - 1] = { role: last.role, text: last.text + ' ' + entry.text };
      } else {
        groups.push({ ...entry });
      }
    }
    return groups;
  }, [transcripts]);

  const {
    isListening,
    transcript,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  // Sync speech recognition transcript to bookTitle
  useEffect(() => {
    if (transcript) {
      setBookTitle(transcript);
    }
  }, [transcript]);

  // Auto-scroll transcript to bottom on new messages
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, partialUserText, partialAiText]);

  // Sync hook status to page state for connecting/connected/error
  // Stay in 'connecting' until AI actually starts speaking
  const effectiveState: PageState =
    status === 'connecting' || (status === 'connected' && !hasAiResponded)
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

  const handleSearchStructured = async (info: BookCoverInfo) => {
    setPageState('searching');
    setSearchError(null);

    try {
      const params = new URLSearchParams();
      if (info.title) params.set('title', info.title);
      if (info.author) params.set('author', info.author);
      if (info.publisher) params.set('publisher', info.publisher);

      const res = await fetch(
        `/api/book-discussion/search?${params.toString()}`
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

  const handleCoverCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input for re-selection
    e.target.value = '';

    setIsRecognizingCover(true);
    setSearchError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/book-discussion/recognize-cover', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '표지 인식에 실패했습니다.');
      }

      const info: BookCoverInfo = await res.json();

      if (!info.title && !info.author && !info.publisher) {
        setSearchError('책 정보를 인식하지 못했어요. 다시 시도해주세요.');
        setIsRecognizingCover(false);
        return;
      }

      if (info.title) {
        setBookTitle(info.title);
      }

      setIsRecognizingCover(false);
      await handleSearchStructured(info);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : '표지 인식에 실패했습니다.'
      );
      setIsRecognizingCover(false);
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

  // --- Saving State ---
  if (isSaving) {
    return (
      <div className="container mx-auto p-8 max-w-lg">
        <Card padding="lg">
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-lg text-gray-700 font-medium">
              토론 기록을 저장하고 있어요...
            </p>
          </div>
        </Card>
      </div>
    );
  }

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

              <div className="flex gap-2">
                {isSpeechSupported && (
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                      isListening
                        ? 'border-red-400 bg-red-50 text-red-600'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Mic className="w-5 h-5 animate-pulse" />
                        듣고 있어요...
                      </>
                    ) : (
                      <>
                        <Mic className="w-5 h-5" />
                        말로 하기
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecognizingCover}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-green-400 hover:bg-green-50 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRecognizingCover ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      인식 중...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      사진으로 찍기
                    </>
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCoverCapture}
                  className="hidden"
                />
              </div>

              {(searchError || speechError) && (
                <p className="text-sm text-red-600">
                  {searchError || speechError}
                </p>
              )}
              <Button
                onClick={handleSearch}
                disabled={!bookTitle.trim() || isRecognizingCover}
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

  // --- Connected State: Voice UI with transcript ---
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
        <Button
          onClick={async () => {
            await saveDiscussion(bookTitle);
            stopSession();
          }}
          variant="danger"
          size="sm"
          disabled={isSaving}
        >
          {isSaving ? '저장 중...' : '토론 끝내기'}
        </Button>
      </div>

      {/* Reconnection Banner */}
      {isReconnecting && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
          <WifiOff className="w-4 h-4 text-yellow-600 animate-pulse" />
          <span className="text-sm font-medium text-yellow-700">
            다시 연결하고 있어요...
          </span>
        </div>
      )}

      {/* Audio Level Meter */}
      <div className="mb-3 space-y-2">
        <AudioLevelMeter
          micState={micState}
          debugInfo={audioDebugInfo}
          vadThreshold={vadThreshold}
          showDebug={process.env.NODE_ENV === 'development'}
        />
        <VadThresholdSlider />
      </div>

      {/* Voice Status Indicator (compact) */}
      <div className="flex items-center justify-center gap-3 py-3">
        {isAiSpeaking ? (
          <>
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
              <Volume2 className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-base font-medium text-blue-600">
              AI 선생님이 말하고 있어요
            </p>
          </>
        ) : isUserSpeaking ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-mic-pulse">
              <Mic className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-base font-medium text-green-600">
              잘 듣고 있어요!
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Mic className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-500">
              말해보세요!
            </p>
          </>
        )}
      </div>

      {/* Transcript Panel */}
      <div className="flex-1 overflow-y-auto rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
        {groupedTranscripts.length === 0 && !partialAiText && !partialUserText && (
          <p className="text-center text-gray-400 text-sm py-8">
            대화 내용이 여기에 표시됩니다
          </p>
        )}
        {groupedTranscripts.map((entry, idx) => (
          <div
            key={idx}
            className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                entry.role === 'user'
                  ? 'bg-green-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
              }`}
            >
              {entry.text}
            </div>
          </div>
        ))}
        {partialAiText && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2 text-sm bg-white text-gray-800 border border-gray-200 opacity-70">
              {partialAiText}
            </div>
          </div>
        )}
        {partialUserText && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2 text-sm bg-green-400 text-white opacity-70">
              {partialUserText}
            </div>
          </div>
        )}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}
