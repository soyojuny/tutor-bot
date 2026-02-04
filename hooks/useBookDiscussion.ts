'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Session, LiveServerMessage } from '@google/genai';
import type { MicState, AudioDebugInfo } from '@/components/child/AudioLevelMeter';
import { useDebounce } from '@/hooks/useDebounce';
import { useSettingsStore } from '@/store/settingsStore';

type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

export interface TranscriptEntry {
  role: 'user' | 'ai';
  text: string;
}

const MAX_RMS_FOR_NORMALIZATION = 0.1;
const MAX_RECONNECT_ATTEMPTS = 3;

export function useBookDiscussion() {
  // Get VAD threshold from settings store
  const vadThreshold = useSettingsStore((state) => state.vadThreshold);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [rawPartialUserText, setRawPartialUserText] = useState('');
  const [rawPartialAiText, setRawPartialAiText] = useState('');
  // 디바운싱을 적용하여 텍스트 깜빡임 방지
  const partialUserText = useDebounce(rawPartialUserText, 100);
  const partialAiText = useDebounce(rawPartialAiText, 100);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [hasAiResponded, setHasAiResponded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Audio debugging state
  const [audioDebugInfo, setAudioDebugInfo] = useState<AudioDebugInfo>({
    currentRms: 0,
    normalizedLevel: 0,
    isAboveThreshold: false,
    totalChunksSent: 0,
    isTransmitting: false,
  });
  const [micState, setMicState] = useState<MicState>('waiting');
  const chunksSentRef = useRef(0);
  const lastDebugUpdateRef = useRef(0);
  const vadThresholdRef = useRef(vadThreshold);

  // Keep vadThresholdRef in sync with the store value
  useEffect(() => {
    vadThresholdRef.current = vadThreshold;
  }, [vadThreshold]);

  const transcriptsRef = useRef<TranscriptEntry[]>([]);
  const partialUserTextRef = useRef('');
  const accumulatedUserTextRef = useRef('');
  const accumulatedAiTextRef = useRef('');

  const sessionRef = useRef<Session | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const playbackQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const activeSourceCountRef = useRef(0);
  const cleanedUpRef = useRef(false);
  const statusRef = useRef<ConnectionStatus>('idle');
  const userSpeakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstResponseDoneRef = useRef(false);

  // Reconnection state
  const reconnectAttemptsRef = useRef(0);
  const resumptionHandleRef = useRef<string | null>(null);
  const bookInfoRef = useRef<{ bookTitle: string; bookSummary?: string; childAge?: number } | null>(null);
  const manualDisconnectRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectSessionRef = useRef<() => void>(() => {});

  // Keep statusRef in sync
  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  }, []);

  // --- Audio Playback (AI → Speaker) ---

  const playNext = useCallback(() => {
    const ctx = playbackContextRef.current;
    if (!ctx || ctx.state === 'closed') {
      isPlayingRef.current = false;
      setIsAiSpeaking(false);
      return;
    }

    if (playbackQueueRef.current.length === 0) return;

    // Schedule all queued buffers with precise timing to eliminate gaps
    while (playbackQueueRef.current.length > 0) {
      const buffer = playbackQueueRef.current.shift()!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;
      activeSourceCountRef.current++;

      source.onended = () => {
        activeSourceCountRef.current--;
        if (activeSourceCountRef.current === 0 && playbackQueueRef.current.length === 0) {
          isPlayingRef.current = false;
          setIsAiSpeaking(false);
          firstResponseDoneRef.current = true;
          // Update mic state when AI finishes speaking
          setMicState('ready');
        }
      };
    }

    isPlayingRef.current = true;
    setIsAiSpeaking(true);
  }, []);

  const enqueueAudio = useCallback(
    (base64Pcm: string) => {
      const ctx = playbackContextRef.current;
      if (!ctx || ctx.state === 'closed') return;

      setHasAiResponded(true);

      const binaryStr = atob(base64Pcm);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const sampleRate = 24000;
      const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32);

      playbackQueueRef.current.push(audioBuffer);
      playNext();
    },
    [playNext]
  );

  // --- Message Handler (extracted for reuse in reconnect) ---

  const handleMessage = useCallback(
    (message: LiveServerMessage) => {
      // Handle session resumption updates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resumptionUpdate = (message as any).sessionResumptionUpdate;
      if (resumptionUpdate?.newHandle) {
        resumptionHandleRef.current = resumptionUpdate.newHandle;
      }

      // Handle goAway (server signals imminent disconnect)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((message as any).goAway) {
        console.log('[BookDiscussion] Received goAway, initiating preemptive reconnect');
        reconnectSessionRef.current();
        return;
      }

      // Handle audio data
      const parts = message.serverContent?.modelTurn?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData?.data) {
            enqueueAudio(part.inlineData.data);
          }
        }
      }

      // Handle interruption
      if (message.serverContent?.interrupted) {
        playbackQueueRef.current = [];
        isPlayingRef.current = false;
        nextPlayTimeRef.current = 0;
        activeSourceCountRef.current = 0;
        setIsAiSpeaking(false);
      }

      // Handle input transcription (user)
      const inputT = message.serverContent?.inputTranscription;
      if (inputT?.text) {
        setIsUserSpeaking(true);
        if (userSpeakingTimeoutRef.current) {
          clearTimeout(userSpeakingTimeoutRef.current);
        }
        userSpeakingTimeoutRef.current = setTimeout(() => {
          setIsUserSpeaking(false);
        }, 1500);

        if (inputT.finished) {
          accumulatedUserTextRef.current += inputT.text;
          const finalText = accumulatedUserTextRef.current;
          accumulatedUserTextRef.current = '';
          setTranscripts((prev) => {
            const last = prev[prev.length - 1];
            const next = last?.role === 'user'
              ? [...prev.slice(0, -1), { role: 'user' as const, text: last.text + ' ' + finalText }]
              : [...prev, { role: 'user' as const, text: finalText }];
            transcriptsRef.current = next;
            return next;
          });
          setRawPartialUserText('');
          partialUserTextRef.current = '';
          setIsUserSpeaking(false);
          if (userSpeakingTimeoutRef.current) {
            clearTimeout(userSpeakingTimeoutRef.current);
            userSpeakingTimeoutRef.current = null;
          }
        } else {
          accumulatedUserTextRef.current += inputT.text;
          setRawPartialUserText(accumulatedUserTextRef.current);
          partialUserTextRef.current = accumulatedUserTextRef.current;
        }
      }

      // Handle output transcription (AI)
      const outputT = message.serverContent?.outputTranscription;
      if (outputT?.text) {
        if (outputT.finished) {
          accumulatedAiTextRef.current += outputT.text;
          const finalText = accumulatedAiTextRef.current;
          accumulatedAiTextRef.current = '';
          setTranscripts((prev) => {
            const last = prev[prev.length - 1];
            const next = last?.role === 'ai'
              ? [...prev.slice(0, -1), { role: 'ai' as const, text: last.text + ' ' + finalText }]
              : [...prev, { role: 'ai' as const, text: finalText }];
            transcriptsRef.current = next;
            return next;
          });
          setRawPartialAiText('');
        } else {
          accumulatedAiTextRef.current += outputT.text;
          setRawPartialAiText(accumulatedAiTextRef.current);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enqueueAudio]
  );

  // --- Cleanup (partial: only WebSocket + mic capture, preserves playback for reconnect) ---

  const cleanupConnection = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // ignore
      }
      sessionRef.current = null;
    }
  }, []);

  // --- Full Cleanup ---

  const cleanup = useCallback(() => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    cleanupConnection();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;
    activeSourceCountRef.current = 0;

    if (
      playbackContextRef.current &&
      playbackContextRef.current.state !== 'closed'
    ) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, [cleanupConnection]);

  // --- Setup Mic Capture (extracted for reuse in reconnect) ---

  const setupMicCapture = useCallback(
    (session: Session, stream: MediaStream) => {
      const captureCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = captureCtx;

      const resumeAndSetup = async () => {
        if (captureCtx.state === 'suspended') {
          await captureCtx.resume();
        }

        const source = captureCtx.createMediaStreamSource(stream);
        const processor = captureCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (!sessionRef.current) return;
          const float32Data = e.inputBuffer.getChannelData(0);

          // Local voice activity detection for responsive UI
          let sum = 0;
          for (let i = 0; i < float32Data.length; i++) {
            sum += float32Data[i] * float32Data[i];
          }
          const rms = Math.sqrt(sum / float32Data.length);
          const isAboveThreshold = rms > vadThresholdRef.current;
          const normalizedLevel = Math.min((rms / MAX_RMS_FOR_NORMALIZATION) * 100, 100);

          // Update debug info with throttling (every 50ms)
          const now = Date.now();
          if (now - lastDebugUpdateRef.current > 50) {
            lastDebugUpdateRef.current = now;
            setAudioDebugInfo((prev) => ({
              ...prev,
              currentRms: rms,
              normalizedLevel,
              isAboveThreshold,
              totalChunksSent: chunksSentRef.current,
              isTransmitting: firstResponseDoneRef.current,
            }));
          }

          // Don't send mic audio until AI's first greeting is done
          if (!firstResponseDoneRef.current) return;

          if (isAboveThreshold) {
            setIsUserSpeaking(true);
            setMicState('transmitting');
            if (userSpeakingTimeoutRef.current) {
              clearTimeout(userSpeakingTimeoutRef.current);
            }
            userSpeakingTimeoutRef.current = setTimeout(() => {
              setIsUserSpeaking(false);
              setMicState('ready');
            }, 1000);
          }

          // Float32 → Int16 PCM
          const int16 = new Int16Array(float32Data.length);
          for (let i = 0; i < float32Data.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Data[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Int16 → Base64
          const uint8 = new Uint8Array(int16.buffer);
          let binary = '';
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = btoa(binary);

          try {
            sessionRef.current.sendRealtimeInput({
              audio: {
                data: base64,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
            chunksSentRef.current++;
          } catch (err) {
            console.error('[BookDiscussion] sendRealtimeInput failed:', err);
            setError('음성 전송에 실패했습니다. 다시 시도해주세요.');
            setMicState('error');
            updateStatus('error');
            cleanup();
          }
        };

        source.connect(processor);
        processor.connect(captureCtx.destination);
      };

      resumeAndSetup();
    },
    [cleanup, updateStatus]
  );

  // --- Reconnect Session ---

  const reconnectSession = useCallback(async () => {
    if (manualDisconnectRef.current) return;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[BookDiscussion] Max reconnect attempts reached');
      setError('연결이 끊어졌습니다. 다시 시도해주세요.');
      updateStatus('error');
      cleanup();
      return;
    }

    const bookInfo = bookInfoRef.current;
    if (!bookInfo) {
      console.error('[BookDiscussion] No book info for reconnection');
      updateStatus('error');
      cleanup();
      return;
    }

    const attempt = reconnectAttemptsRef.current;
    reconnectAttemptsRef.current++;
    const delay = Math.min(1000 * Math.pow(2, attempt), 8000);

    console.log(`[BookDiscussion] Reconnecting (attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);
    setIsReconnecting(true);

    // Clean up old connection but keep mic stream and playback
    cleanupConnection();

    // Clear partial text state
    accumulatedUserTextRef.current = '';
    accumulatedAiTextRef.current = '';
    setRawPartialUserText('');
    setRawPartialAiText('');

    reconnectTimerRef.current = setTimeout(async () => {
      try {
        // Request a new token
        const tokenResult = await fetch('/api/book-discussion/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookInfo),
        });
        if (!tokenResult.ok) {
          throw new Error('토큰 재발급에 실패했습니다.');
        }
        const { token, model } = await tokenResult.json();

        // Ensure playback context exists
        if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
          playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
        if (playbackContextRef.current.state === 'suspended') {
          await playbackContextRef.current.resume();
        }

        // Connect to Gemini Live API
        const ai = new GoogleGenAI({ apiKey: token, apiVersion: 'v1alpha' });
        let rejectConnect: ((err: Error) => void) | null = null;

        const session = await Promise.race([
          ai.live.connect({
            model,
            callbacks: {
              onopen: () => {
                console.log('[BookDiscussion] Reconnected successfully');
                reconnectAttemptsRef.current = 0;
                setIsReconnecting(false);
                updateStatus('connected');
              },
              onmessage: handleMessage,
              onerror: (e: ErrorEvent) => {
                console.error('[BookDiscussion] Reconnect WebSocket error:', e);
                if (rejectConnect) {
                  rejectConnect(new Error('재연결 WebSocket 오류'));
                  rejectConnect = null;
                } else {
                  reconnectSession();
                }
              },
              onclose: (e: CloseEvent) => {
                console.log('[BookDiscussion] Reconnect WebSocket closed:', e.code, e.reason);
                if (rejectConnect) {
                  rejectConnect(new Error(e.reason || `재연결 실패 (code: ${e.code})`));
                  rejectConnect = null;
                } else if (!manualDisconnectRef.current) {
                  reconnectSession();
                }
              },
            },
          }),
          new Promise<never>((_, reject) => {
            rejectConnect = reject;
          }),
        ]);

        rejectConnect = null;
        sessionRef.current = session;
        cleanedUpRef.current = false;

        // Send conversation context so AI can continue
        const currentTranscripts = transcriptsRef.current;
        if (currentTranscripts.length > 0) {
          const contextTurns = currentTranscripts.map((t) => ({
            role: t.role === 'user' ? 'user' : ('model' as const),
            parts: [{ text: t.text }],
          }));
          session.sendClientContent({
            turns: contextTurns,
            turnComplete: true,
          });
        }

        // Re-setup mic capture if stream is still alive
        const stream = streamRef.current;
        if (stream && stream.active) {
          setupMicCapture(session, stream);
        } else {
          // Need a new mic stream
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          streamRef.current = newStream;
          setupMicCapture(session, newStream);
        }
      } catch (err) {
        console.error('[BookDiscussion] Reconnect failed:', err);
        // Try again
        reconnectSession();
      }
    }, delay);
  }, [cleanup, cleanupConnection, handleMessage, setupMicCapture, updateStatus]);

  // Keep ref in sync for use in handleMessage (breaks circular dependency)
  reconnectSessionRef.current = reconnectSession;

  // --- Start Session ---

  const startSession = useCallback(
    async (bookTitle: string, bookSummary?: string, childAge?: number) => {
      try {
        cleanedUpRef.current = false;
        manualDisconnectRef.current = false;
        reconnectAttemptsRef.current = 0;
        resumptionHandleRef.current = null;
        bookInfoRef.current = { bookTitle, bookSummary, childAge };
        updateStatus('connecting');
        setError(null);
        setIsReconnecting(false);
        setTranscripts([]);
        transcriptsRef.current = [];
        setRawPartialUserText('');
        partialUserTextRef.current = '';
        setRawPartialAiText('');
        accumulatedUserTextRef.current = '';
        accumulatedAiTextRef.current = '';
        setIsUserSpeaking(false);
        setHasAiResponded(false);
        firstResponseDoneRef.current = false;

        // Reset audio debug state
        chunksSentRef.current = 0;
        lastDebugUpdateRef.current = 0;
        setMicState('waiting');
        setAudioDebugInfo({
          currentRms: 0,
          normalizedLevel: 0,
          isAboveThreshold: false,
          totalChunksSent: 0,
          isTransmitting: false,
        });

        // 1. Fetch token & request mic in parallel (independent operations)
        const [tokenResult, stream] = await Promise.all([
          fetch('/api/book-discussion/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookTitle, bookSummary, childAge }),
          }),
          navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }),
        ]);
        if (!tokenResult.ok) {
          stream.getTracks().forEach((t) => t.stop());
          const data = await tokenResult.json().catch(() => ({}));
          throw new Error(data.error || '토큰 발급에 실패했습니다.');
        }
        const { token, model } = await tokenResult.json();
        streamRef.current = stream;

        // 3. Create playback context
        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });
        if (playbackContextRef.current.state === 'suspended') {
          await playbackContextRef.current.resume();
        }

        // 4. Connect to Gemini Live API
        const ai = new GoogleGenAI({ apiKey: token, apiVersion: 'v1alpha' });

        let rejectConnect: ((err: Error) => void) | null = null;

        const session = await Promise.race([
          ai.live.connect({
            model,
            callbacks: {
              onopen: () => {
                updateStatus('connected');
              },
              onmessage: handleMessage,
              onerror: (e: ErrorEvent) => {
                console.error('Live API WebSocket error:', e);
                if (rejectConnect) {
                  rejectConnect(
                    new Error('WebSocket 연결에 실패했습니다.')
                  );
                  rejectConnect = null;
                } else if (!manualDisconnectRef.current) {
                  // Mid-session error: attempt reconnect
                  reconnectSession();
                } else {
                  setError('연결 중 오류가 발생했습니다.');
                  updateStatus('error');
                  cleanup();
                }
              },
              onclose: (e: CloseEvent) => {
                console.log('WebSocket closed:', e.code, e.reason);
                if (rejectConnect) {
                  rejectConnect(
                    new Error(
                      e.reason ||
                        `WebSocket 연결이 거부되었습니다. (code: ${e.code})`
                    )
                  );
                  rejectConnect = null;
                } else if (
                  !manualDisconnectRef.current &&
                  statusRef.current !== 'disconnecting' &&
                  statusRef.current !== 'idle' &&
                  statusRef.current !== 'error'
                ) {
                  // Unexpected close: attempt reconnect
                  reconnectSession();
                }
              },
            },
          }),
          new Promise<never>((_, reject) => {
            rejectConnect = reject;
          }),
        ]);

        // Connection succeeded, disable the reject shortcut
        rejectConnect = null;
        sessionRef.current = session;

        // Trigger AI to speak first by sending an initial user turn
        session.sendClientContent({
          turns: [
            {
              role: 'user',
              parts: [{ text: `안녕하세요! "${bookTitle}" 다 읽었어요.` }],
            },
          ],
          turnComplete: true,
        });

        // Safety timeout: if AI greeting never finishes playing, enable mic anyway
        setTimeout(() => {
          if (!firstResponseDoneRef.current && statusRef.current === 'connected') {
            console.warn('[BookDiscussion] AI greeting timeout - enabling mic');
            firstResponseDoneRef.current = true;
          }
        }, 15000);

        // 5. Set up microphone audio capture (16kHz)
        setupMicCapture(session, stream);
      } catch (err) {
        console.error('Failed to start session:', err);
        const message =
          err instanceof Error ? err.message : '연결에 실패했습니다.';

        if (
          message.includes('Permission denied') ||
          message.includes('NotAllowedError')
        ) {
          setError('마이크 권한을 허용해주세요.');
        } else {
          setError(message);
        }
        updateStatus('error');
        cleanup();
      }
    },
    [cleanup, handleMessage, reconnectSession, setupMicCapture, updateStatus]
  );

  // --- Stop Session ---

  const stopSession = useCallback(() => {
    manualDisconnectRef.current = true;
    updateStatus('disconnecting');
    cleanup();
    updateStatus('idle');
    setRawPartialUserText('');
    setRawPartialAiText('');
    accumulatedUserTextRef.current = '';
    accumulatedAiTextRef.current = '';
    setIsAiSpeaking(false);
    setIsUserSpeaking(false);
    setIsReconnecting(false);
    if (userSpeakingTimeoutRef.current) {
      clearTimeout(userSpeakingTimeoutRef.current);
      userSpeakingTimeoutRef.current = null;
    }
  }, [cleanup, updateStatus]);

  // --- Reset Error ---

  const resetError = useCallback(() => {
    setError(null);
    updateStatus('idle');
  }, [updateStatus]);

  const saveDiscussion = useCallback(
    async (bookTitle: string) => {
      setIsSaving(true);
      try {
        // Use refs to get the latest values, avoiding stale closure
        const latestTranscripts = [...transcriptsRef.current];
        const remainingPartial = partialUserTextRef.current.trim();
        if (remainingPartial) {
          latestTranscripts.push({ role: 'user', text: remainingPartial });
        }

        const res = await fetch('/api/book-discussions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookTitle, transcripts: latestTranscripts }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Failed to save discussion:', data.error);
        }
      } catch (err) {
        console.error('Failed to save discussion:', err);
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manualDisconnectRef.current = true;
      cleanup();
      if (userSpeakingTimeoutRef.current) {
        clearTimeout(userSpeakingTimeoutRef.current);
      }
    };
  }, [cleanup]);

  return {
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
    // Audio debug info
    audioDebugInfo,
    micState,
    vadThreshold,
    startSession,
    stopSession,
    resetError,
    saveDiscussion,
  };
}
