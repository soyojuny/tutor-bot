# AI 독서토론 기능 개선

## Google Books API를 활용하여 도서 줄거리 검색

* 작동 원리 및 엔드포인트
요청 URL: https://www.googleapis.com/books/v1/volumes

파라미터: q={검색어}

반환값: JSON 데이터 중 items[0].volumeInfo.description 필드에 줄거리가 들어있습니다.

주의사항: 줄거리(description)가 없는 책도 있고, HTML 태그(<p>, <br>)가 섞여 있을 수 있습니다. 이걸 텍스트만 깔끔하게 발라내야 AI가 잘 이해합니다.

// utils/googleBooks.ts

const GOOGLE_BOOKS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;

export async function getBookSummary(query: string): Promise<string | null> {
  try {
    // 1. 정확도를 높이기 위해 'intitle' 검색어 사용
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}&maxResults=1`
    );

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return null;
    }

    const bookInfo = data.items[0].volumeInfo;
    const rawDescription = bookInfo.description;

    if (!rawDescription) {
      return null;
    }

    // 2. HTML 태그 제거 (AI에게 깨끗한 텍스트를 주기 위해)
    const cleanDescription = rawDescription.replace(/<[^>]*>?/gm, '');
    
    // 3. (옵션) 제목과 저자 정보도 같이 주면 좋습니다.
    return `제목: ${bookInfo.title}, 저자: ${bookInfo.authors?.join(', ')}\n줄거리: ${cleanDescription}`;

  } catch (error) {
    console.error("Google Books API Error:", error);
    return null;
  }
}

* 시나리오에 적용하기 (AI 연동)
이제 이 함수를 아까 만든 시스템 프롬프트 생성기와 연결하면 **"책 내용을 아는 AI"**가 완성됩니다.

[실행 로직]

아이가 "구름빵"이라고 입력(혹은 말함).

백엔드에서 getBookSummary("구름빵") 호출.

성공 시: 가져온 줄거리를 시스템 프롬프트에 주입.

"너는 '구름빵' 내용을 알고 있어. 줄거리는 ~~~야."

실패 시 (null): 시스템 프롬프트에 모른다고 명시.

"줄거리를 모르는 책이야. 아이에게 어떤 내용인지 물어보면서 대화를 시작해."

💡 한 가지 팁: "검색 결과 선택하기" UI
API가 항상 1등으로 검색된 책이 내가 읽은 책이라는 보장은 없습니다. (동명의 다른 책일 수도 있음)

그래서 UI를 이렇게 구성하면 완벽합니다.

아이가 "백설공주"라고 말함.

화면에 백설공주 책 표지 3개가 뜹니다. (Books API는 imageLinks.thumbnail로 표지 이미지도 줍니다.)

아이가 읽은 책을 **[터치]**합니다.

그 책의 description을 가지고 대화방으로 입장!

없으면 없다고 없음을 선택하고 넘어갈 수 있어야함.


## lib/gemini/client.ts 프롬프트 개선
  * 아래 프롬프트 내용을 바탕으로 개선 필요.
  * Google Books에서 가져온 책과 줄거리가 있고 아이가 선택을 했으면 줄거리를 프롬프트에 전달해야함.


function buildSystemPrompt(bookTitle: string, bookSummary?: string, childAge: number = 7): string {
  // 나이에 따른 페르소나 설정
  const persona = childAge <= 7 
    ? "너는 책 속의 주인공 친구처럼 장난기 많고 리액션이 큰 '단짝 친구'야." 
    : "너는 아이의 생각을 존중해주고 논리적인 대화를 이끄는 '독서 토론 멘토'야.";

  // 줄거리 정보가 있으면 추가, 없으면 아이에게 물어보게 유도
  const contextInstruction = bookSummary 
    ? `책의 줄거리는 다음과 같아: "${bookSummary}". 이 내용을 바탕으로 대화해.`
    : `만약 이 책의 구체적인 줄거리를 모른다면, 아는 척하지 말고 아이에게 "우와, 그 책은 무슨 내용이야? 선생님한테도 알려줘!"라고 물어봐서 내용을 파악해.`;

  return `
${persona}
아이가 읽은 책은 "${bookTitle}"이야.

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
- 첫 마디는 밝고 활기차게 시작해.

${contextInstruction}
`;
}