import { GoogleGenAI, Modality } from '@google/genai';

const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';

let _ai: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_ai) {
    _ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
      apiVersion: 'v1alpha',
    });
  }
  return _ai;
}

function buildSystemPrompt(bookTitle: string): string {
  return `너는 아이와 독서토론을 하는 친절한 AI 선생님이야.

## 규칙
- 아이가 읽은 책 "${bookTitle}"에 대해 이야기를 나눠.
- 아이의 눈높이에 맞춰 쉽고 따뜻한 말투로 대화해.
- 한국어로만 대화해.
- 열린 질문을 통해 아이가 스스로 생각하고 표현할 수 있도록 이끌어줘.
- 아이의 대답을 경청하고, 공감하면서 더 깊은 생각을 유도해.
- 책의 내용, 등장인물, 주제, 아이의 느낌과 생각에 대해 다양한 각도로 대화해.
- 대화를 시작할 때 자연스럽게 인사하고, 어떤 책을 읽었는지 확인한 뒤 토론을 시작해.`;
}

export async function createLiveSessionToken(bookTitle: string) {
  const ai = getClient();
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      liveConnectConstraints: {
        model: GEMINI_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: buildSystemPrompt(bookTitle),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      },
    },
  });

  return {
    token: token.name!,
    model: GEMINI_MODEL,
  };
}
