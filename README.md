# Family Learning Tutor (Tutor Bot)

두 아이(10세, 7세)를 위한 학습 관리 웹앱 (PWA)

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **State Management**: Zustand
- **PWA**: @ducanh2912/next-pwa

## 핵심 기능

- 학습 활동 추적
- 포인트/보상 시스템
- 진행 상황 대시보드
- 부모 관리 기능
- PWA 지원 (설치 가능한 앱)

## 시작하기

### 1. 환경 변수 설정

`.env.local.example` 파일을 복사하여 `.env.local` 파일을 생성하고 Supabase 정보를 입력하세요.

```bash
cp .env.local.example .env.local
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com/)에서 새 프로젝트 생성
2. SQL Editor에서 데이터베이스 스키마 실행 (계획서 참조)
3. Settings > API에서 프로젝트 URL과 API 키 복사
4. `.env.local`에 정보 입력

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 앱을 확인하세요.

## 프로젝트 구조

```
tutor-bot/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (child)/           # 아이용 인터페이스
│   ├── (parent)/          # 부모용 인터페이스
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── auth/
│   ├── child/
│   ├── parent/
│   ├── shared/
│   └── dashboard/
├── lib/                   # 유틸리티 및 라이브러리
│   ├── supabase/         # Supabase 클라이언트
│   ├── utils/            # 헬퍼 함수
│   └── constants/        # 상수
├── store/                 # Zustand 스토어
├── types/                 # TypeScript 타입
├── hooks/                 # Custom React Hooks
└── public/               # 정적 파일
```

## 개발 가이드

상세한 구현 계획은 `C:\Users\joon\.claude\plans\reflective-tickling-treehouse.md`를 참조하세요.
