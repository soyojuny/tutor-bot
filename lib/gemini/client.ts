import { GoogleGenAI, Modality, EndSensitivity, StartSensitivity } from '@google/genai';
import { BookCoverInfo } from '@/types';

const GEMINI_MODEL = 'gemini-2.5-flash-native-audio-preview-12-2025';
const GEMINI_VISION_MODEL = 'gemini-2.5-flash';

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

function buildSystemPrompt(
  bookTitle: string,
  bookSummary?: string,
  childAge: number = 7
): string {
  const persona =
    childAge <= 7
      ? '너는 아이와 독서토론을 하는 장난기 많고 재미있는 친구야. 아이가 편하게 느끼도록 밝고 유쾌한 톤으로 대화해.'
      : '너는 아이와 독서토론을 하는 다정한 토론 멘토야. 아이의 생각을 존중하며 더 깊이 생각할 수 있도록 이끌어줘.';

  const trimmedSummary = bookSummary
    ? bookSummary.slice(0, 500)
    : null;

  const summarySection = trimmedSummary
    ? `\n## 이 책의 줄거리\n${trimmedSummary}\n- 위 줄거리를 참고하되, 아이에게 줄거리를 읽어주지 마. 아이가 직접 이야기하도록 유도해.`
    : `\n## 줄거리 정보 없음\n- 이 책의 줄거리 정보가 없어. 아는 척하지 말고 아이에게 "우와, 그 책은 무슨 내용이야? 선생님한테도 알려줘!"라고 물어봐서 내용을 파악해.`;

  return `${persona}
아이가 읽은 책은 "${bookTitle}"이야. 너는 이 책 제목을 이미 알고 있어.
${summarySection}

## 핵심 규칙 (반드시 지킬 것)
1. **길이 제약:** 답변은 무조건 **공백 포함 150자 이내(1~2문장)**로 짧게 해. 아이가 듣기에 지루하지 않아야 해.
2. **질문 원칙:** 한 번에 **질문은 딱 한 가지**만 해. 여러 개를 동시에 묻지 마.
3. **대화 패턴:** [공감/리액션] -> [짧은 내 생각] -> [질문] 순서로 말해. 질문만 계속 던지지 마.
4. **언어:** 아이 눈높이에 맞는 쉬운 한국어를 사용해. (${childAge}살 아이 수준)
5. **금지 사항:** - "${bookTitle}"이 무슨 책이냐고 제목을 다시 묻지 마.
   - 너무 교훈적인 척하거나 가르치려 들지 마.

## 대화 가이드
- 아이의 엉뚱한 대답도 "정말? 기발한 생각이다!"라고 칭찬해 줘.
- "네 생각은 어때?", "만약 너라면 어떻게 했을까?" 같은 열린 질문을 사용해.
- 책의 내용, 등장인물, 주제, 아이의 느낌과 생각에 대해 다양한 각도로 대화해.
- 첫 인사는 한두 문장으로 짧게 해. 예: "안녕! ${bookTitle} 읽었구나, 어떤 내용이었어?"
- 절대 책 제목을 다시 물어보지 마. 이미 알고 있으니까 바로 토론을 시작해.`;
}

export async function extractBookInfoFromImage(
  imageBase64: string,
  mimeType: string
): Promise<BookCoverInfo> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: GEMINI_VISION_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: '이 이미지는 책 표지입니다. 이미지에서 눈으로 직접 읽을 수 있는 텍스트만을 기반으로 책의 제목과 저자를 추출해주세요.\n\n중요 규칙:\n- 이미지에 글자로 보이는 정보만 추출하세요.\n- 배경지식으로 추측하거나 보충하지 마세요.\n- 이미지에서 읽을 수 없는 항목은 반드시 null로 표시하세요.\n\n반드시 아래 JSON 형식으로만 응답하세요.\n{"title": "책 제목", "author": "저자"}',
          },
        ],
      },
    ],
  });

  const text = response.text ?? '';

  try {
    const cleaned = text.replace(/```(?:json)?\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: typeof parsed.title === 'string' ? parsed.title : null,
      author: typeof parsed.author === 'string' ? parsed.author : null,
      publisher: null,
    };
  } catch {
    return { title: null, author: null, publisher: null };
  }
}

export async function generateDiscussionSummary(
  bookTitle: string,
  transcripts: { role: 'user' | 'ai'; text: string }[]
): Promise<string> {
  try {
    const userUtterances = transcripts
      .filter((t) => t.role === 'user')
      .map((t) => t.text)
      .join('\n');

    if (!userUtterances.trim()) {
      return `"${bookTitle}"에 대해 토론했습니다.`;
    }

    const ai = getClient();
    const response = await ai.models.generateContent({
      model: GEMINI_VISION_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `아이가 "${bookTitle}"이라는 책에 대해 독서 토론을 했습니다. 아래는 아이가 한 말들입니다.\n\n${userUtterances}\n\n위 내용을 바탕으로 아이가 이 책에 대해 어떤 이야기를 나눴는지 정리해주세요.\n\n작성 규칙:\n- 아이가 언급한 주요 내용, 의견, 느낌을 구체적으로 포함해주세요.\n- "아이가 ~라고 말했습니다" 형태로 아이의 실제 발언을 반영해주세요.\n- 3~5문장으로, 부모가 빠르게 읽을 수 있도록 간결하게 유지해주세요.\n- 부모가 읽을 용도이며, 따뜻하지만 구체적인 톤으로 작성해주세요.`,
            },
          ],
        },
      ],
    });

    const text = response.text?.trim();
    if (text) return text;
    return `"${bookTitle}"에 대해 토론했습니다.`;
  } catch (error) {
    console.error('Failed to generate discussion summary:', error);
    return `"${bookTitle}"에 대해 토론했습니다.`;
  }
}

export async function createLiveSessionToken(
  bookTitle: string,
  bookSummary?: string,
  childAge?: number
) {
  const ai = getClient();
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      liveConnectConstraints: {
        model: GEMINI_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: buildSystemPrompt(bookTitle, bookSummary, childAge),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
              prefixPaddingMs: 300,
              silenceDurationMs: 300,
            },
          },
        },
      },
    },
  });

  return {
    token: token.name!,
    model: GEMINI_MODEL,
  };
}
