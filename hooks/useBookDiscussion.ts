'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Session, LiveServerMessage } from '@google/genai';

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

export function useBookDiscussion() {
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [partialUserText, setPartialUserText] = useState('');
  const [partialAiText, setPartialAiText] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

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

  // --- Cleanup ---

  const cleanup = useCallback(() => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
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

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // ignore
      }
      sessionRef.current = null;
    }
  }, []);

  // --- Start Session ---

  const startSession = useCallback(
    async (bookTitle: string, bookSummary?: string, childAge?: number) => {
      try {
        cleanedUpRef.current = false;
        updateStatus('connecting');
        setError(null);
        setTranscripts([]);
        setPartialUserText('');
        setPartialAiText('');
        setIsUserSpeaking(false);
        firstResponseDoneRef.current = false;

        // 1. Fetch ephemeral token
        const tokenRes = await fetch('/api/book-discussion/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookTitle, bookSummary, childAge }),
        });
        if (!tokenRes.ok) {
          const data = await tokenRes.json().catch(() => ({}));
          throw new Error(data.error || '토큰 발급에 실패했습니다.');
        }
        const { token, model } = await tokenRes.json();

        // 2. Get microphone access with echo cancellation
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        // 3. Create playback context
        playbackContextRef.current = new AudioContext({ sampleRate: 24000 });

        // 4. Connect to Gemini Live API
        // Use Promise.race to handle WebSocket failures where the SDK's
        // internal promise never resolves (onerror fires before onopen).
        const ai = new GoogleGenAI({ apiKey: token, apiVersion: 'v1alpha' });

        let rejectConnect: ((err: Error) => void) | null = null;

        const session = await Promise.race([
          ai.live.connect({
            model,
            callbacks: {
              onopen: () => {
                updateStatus('connected');
              },
              onmessage: (message: LiveServerMessage) => {
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
                    const finalText = inputT.text;
                    setTranscripts((prev) => [
                      ...prev,
                      { role: 'user', text: finalText },
                    ]);
                    setPartialUserText('');
                    setIsUserSpeaking(false);
                    if (userSpeakingTimeoutRef.current) {
                      clearTimeout(userSpeakingTimeoutRef.current);
                      userSpeakingTimeoutRef.current = null;
                    }
                  } else {
                    setPartialUserText(inputT.text);
                  }
                }

                // Handle output transcription (AI)
                const outputT = message.serverContent?.outputTranscription;
                if (outputT?.text) {
                  if (outputT.finished) {
                    const finalText = outputT.text;
                    setTranscripts((prev) => [
                      ...prev,
                      { role: 'ai', text: finalText },
                    ]);
                    setPartialAiText('');
                  } else {
                    setPartialAiText(outputT.text);
                  }
                }
              },
              onerror: (e: ErrorEvent) => {
                console.error('Live API WebSocket error:', e);
                if (rejectConnect) {
                  rejectConnect(
                    new Error('WebSocket 연결에 실패했습니다.')
                  );
                  rejectConnect = null;
                } else {
                  // Mid-session error
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
                  statusRef.current !== 'disconnecting' &&
                  statusRef.current !== 'idle' &&
                  statusRef.current !== 'error'
                ) {
                  updateStatus('idle');
                  cleanup();
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

        // 5. Set up microphone audio capture (16kHz)
        const captureCtx = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = captureCtx;

        const source = captureCtx.createMediaStreamSource(stream);
        const processor = captureCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (!sessionRef.current) return;
          const float32Data = e.inputBuffer.getChannelData(0);

          // Don't send mic audio until AI's first greeting is done
          if (!firstResponseDoneRef.current) return;

          // Local voice activity detection for responsive UI
          let sum = 0;
          for (let i = 0; i < float32Data.length; i++) {
            sum += float32Data[i] * float32Data[i];
          }
          const rms = Math.sqrt(sum / float32Data.length);
          if (rms > 0.01) {
            setIsUserSpeaking(true);
            if (userSpeakingTimeoutRef.current) {
              clearTimeout(userSpeakingTimeoutRef.current);
            }
            userSpeakingTimeoutRef.current = setTimeout(() => {
              setIsUserSpeaking(false);
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

          sessionRef.current.sendRealtimeInput({
            audio: {
              data: base64,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        };

        source.connect(processor);
        processor.connect(captureCtx.destination);
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
    [cleanup, enqueueAudio, updateStatus]
  );

  // --- Stop Session ---

  const stopSession = useCallback(() => {
    updateStatus('disconnecting');
    cleanup();
    updateStatus('idle');
    setPartialUserText('');
    setPartialAiText('');
    setIsAiSpeaking(false);
    setIsUserSpeaking(false);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    startSession,
    stopSession,
    resetError,
  };
}
