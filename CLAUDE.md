# CLAUDE.md

이 파일은 프로젝트의 아키텍처, 핵심 패턴, 개발 표준에 대한 가이드를 제공합니다.

## 프로젝트 개요

Tutor Bot은 가족용 학습 관리 PWA입니다. 활동, 포인트, 보상을 통해 학습을 게임화하며, 아이와 부모를 위한 별도의 인터페이스를 제공합니다.

**기술 스택**: Next.js (App Router), TypeScript, Tailwind CSS, Supabase, Zustand

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 코드 품질 검사
npm run lint
```

## 핵심 아키텍처 및 보안 모델

### 1. 인증 및 세션 관리 (JWT)

- **인증 방식**: PIN 코드는 `bcrypt`로 해시되어 데이터베이스에 저장됩니다. 평문 PIN을 사용하지 않습니다.
- **로그인 흐름**:
    1. 사용자가 UI에서 프로필을 선택하고 PIN을 입력합니다.
    2. 프론트엔드는 `POST /api/auth/login`으로 `profileId`와 `pin`을 전송합니다.
    3. 서버는 전달받은 PIN을 해시하여 DB에 저장된 해시와 비교합니다.
    4. 인증 성공 시, 서버는 JWT를 생성하고 이를 `httpOnly` 쿠키에 담아 응답합니다.
- **세션 유지**: `useAuth` 훅과 `authStore`가 `/api/auth/me` 엔드포인트를 호출하여 사용자 세션을 확인하고 상태를 관리합니다.

### 2. 데이터 접근 (Supabase & RLS)

- **RLS (Row Level Security) 정책**: **모든 테이블에 대해 기본적으로 `DENY` 정책이 적용됩니다.** 이는 클라이언트(브라우저)에서 직접 Supabase 데이터를 쿼리하는 것을 원천적으로 차단합니다.
- **API를 통한 데이터 접근**:
    - 데이터베이스와의 모든 상호작용은 반드시 `app/api/...` 경로의 API 라우트를 통해서만 이루어져야 합니다.
    - API 라우트는 **서비스 역할 키(Service Role Key)**를 사용하는 Supabase Admin Client를 이용해 RLS 정책을 우회하여 데이터에 접근합니다.
- **API 보안**: 각 API 엔드포인트는 요청을 처리하기 전, 반드시 다음을 검증해야 합니다.
    1.  **세션 검증**: 요청에 포함된 JWT 쿠키를 통해 사용자가 인증되었는지 확인합니다.
    2.  **인가 (Authorization)**: 인증된 사용자가 해당 리소스에 접근할 권한이 있는지 확인합니다. (예: 부모는 자신의 자녀 데이터에만 접근 가능)

### 3. AI 서비스 연동 (Gemini Live API)

- **API 키 보호**: `GOOGLE_GENERATIVE_AI_API_KEY`는 서버에서만 사용합니다. 절대 클라이언트에 노출하지 않습니다.
- **Ephemeral Token 패턴**: 클라이언트가 Gemini Live API에 직접 WebSocket 연결할 때, 서버에서 발급한 **Ephemeral Token**을 사용합니다. 이를 통해 API 키 없이 안전하게 연결합니다.
- **시스템 프롬프트 잠금**: Ephemeral Token 생성 시 `liveConnectConstraints`에 시스템 프롬프트, 모델, 설정을 포함하여 잠급니다. 클라이언트에서 이를 변조할 수 없습니다.
- **지연 초기화**: `GoogleGenAI` 클라이언트는 모듈 로드 시점이 아닌 **첫 호출 시점에 초기화**합니다. 빌드 시 환경변수가 없어 발생하는 오류를 방지합니다.
- **클라이언트 모듈**: `lib/gemini/client.ts`에서 Gemini 관련 서버 로직을 관리합니다.
- **토큰 발급 API**: `POST /api/book-discussion/token` — 인증된 사용자에게 1회용 Ephemeral Token을 발급합니다.

### 4. 상태 관리 (Zustand)

- 스토어는 도메인(`auth`, `activity`, `reward` 등)을 기준으로 분리하여 관리합니다.
- `authStore`는 `persist` 미들웨어를 사용해 인증 상태를 유지하고, 나머지 스토어는 필요 시 API를 통해 최신 데이터를 가져옵니다.

### 5. 타입 시스템

- `types/database.types.ts`: Supabase 스키마에서 자동 생성된 타입입니다.
- `types/*.types.ts`: 애플리케이션에서 사용하는 더 엄격한 커스텀 타입입니다.
- 모든 타입은 `types/index.ts`를 통해 `barrel export`되어 단일 경로로 임포트합니다. (`@/types`)

## 개발 핵심 원칙

### 새 기능 추가 시
1.  **API 우선 설계**: 기능을 위한 API 엔드포인트를 먼저 `app/api/...`에 설계합니다.
2.  **철저한 검증**: API 라우트 내에서 **세션과 권한을 반드시 검증**하는 로직을 최우선으로 작성합니다.
3.  **프론트엔드 연동**: 검증 로직이 완료된 API를 프론트엔드 컴포넌트나 Zustand 스토어에서 호출하여 사용합니다.

### 포인트 및 활동 처리
- **포인트 원장**: `points_ledger` 테이블은 추가 전용(append-only)입니다. 잔액 계산 시에는 특정 사용자의 `created_at`이 가장 최신인 레코드의 `balance_after` 필드를 사용합니다.
- **활동 생명주기**: 활동 상태(`pending` → `in_progress` → `completed` → `verified`)는 순서대로 변경되어야 합니다. 포인트는 `verified` 상태로 변경될 때만 지급됩니다.

## 파일 구조

- **`app/`**: 라우팅. 역할 기반 그룹(`(child)`, `(parent)`) 및 API 라우트(`api/`)로 구성됩니다.
- **`components/`**: 재사용 가능한 UI 컴포넌트. 기능 도메인(`child`, `parent`, `shared`)별로 분류됩니다.
- **`lib/`**: 외부 서비스(Supabase) 클라이언트 및 공통 유틸리티 함수.
- **`store/`**: Zustand 글로벌 상태 관리 스토어.
- **`types/`**: TypeScript 타입 정의.
- **`supabase/`**: 데이터베이스 마이그레이션 스크립트.