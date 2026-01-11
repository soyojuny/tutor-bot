# CLAUDE.md

이 파일은 Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 필요한 가이드를 제공합니다.

## 프로젝트 개요

Tutor Bot은 두 아이(10세, 7세)를 위한 가족용 학습 관리 PWA입니다. 활동, 포인트, 보상을 통해 학습을 게임화하며, 아이와 부모를 위한 별도의 인터페이스를 제공합니다.

**기술 스택**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Supabase, Zustand, PWA 지원

## 개발 명령어

```bash
# 개발
npm run dev          # 개발 서버 시작 (기본: localhost:3000)

# 빌드 & 프로덕션
npm run build        # 프로덕션 빌드 생성
npm start           # 프로덕션 서버 실행

# 코드 품질
npm run lint        # ESLint 실행
```

## 아키텍처 & 핵심 패턴

### 인증 흐름
- **로컬 인증**: 간단한 PIN 기반 시스템 (OAuth 아님)
- 사용자가 프로필 선택(부모/아이) → 4자리 PIN 입력
- Zustand의 persist 미들웨어로 `store/authStore.ts`에 인증 상태 유지
- `ProtectedRoute` 컴포넌트로 사용자 역할 기반 라우트 보호
- 테스트 PIN: 부모=1234, 큰아이=0000, 작은아이=1111

### 라우트 그룹 & 역할 기반 접근
- `app/(auth)/` - 로그인 페이지 (공개)
- `app/(child)/` - 아이 인터페이스 ('child' 역할만 허용)
- `app/(parent)/` - 부모 인터페이스 ('parent' 역할만 허용)
- 각 그룹은 자체 layout으로 역할별 테마와 보호 적용

### Supabase 통합
컨텍스트에 따라 두 가지 클라이언트 사용:
- **브라우저 클라이언트** (`lib/supabase/client.ts`): 클라이언트 컴포넌트용, `createBrowserClient`로 생성
- **서버 클라이언트** (`lib/supabase/server.ts`): 서버 컴포넌트/액션용, 쿠키로 세션 관리

인증은 Supabase Auth를 우회 - PIN 검증으로 직접 테이블 쿼리 사용. 데이터베이스는 API 라우트에서 Service Role Key 사용.

### 상태 관리 패턴
Zustand 스토어는 도메인 기반 분리 원칙:
- `authStore.ts` - 현재 사용자, 인증 상태
- 향후 스토어: activities, points, rewards (각각 독립적)

persist 미들웨어는 인증 상태에만 사용. 다른 스토어는 로드 시 최신 데이터 가져오기.

### 데이터베이스 스키마 흐름
앱은 다음 활동 워크플로우를 따름:
1. **부모가 생성** - activity 테이블에 추가 (status: 'pending')
2. **아이가 완료** - status를 'completed'로 변경
3. **부모가 검증** - status를  'verified'로 변경
4. **포인트 지급** - 아이에게 포인트 부여 (points_ledger에 balance_after와 함께 삽입)
5. **아이가 교환** - 보상 요청 (reward_redemptions 삽입, status: 'pending')
6. **부모가 승인** - status를 'approved' 또는 'fulfilled'로 변경

`points_ledger` 테이블은 `balance_after` 필드로 누적 잔액 유지 - points_change 합산이 아닌 이 필드로 현재 잔액 계산.

### 타입 시스템
- `types/database.types.ts` - DB 스키마와 일치하는 Supabase 생성 타입
- `types/*.types.ts` - 더 엄격한 제약의 애플리케이션 타입
- 모든 타입은 `types/index.ts`에서 재export (단일 import 지점)

Supabase 쿼리에는 `Database['public']['Tables']['table_name']['Row']` 사용, 컴포넌트 props에는 애플리케이션 타입 사용.

### 스타일링 패턴
`tailwind.config.ts`에 정의된 두 가지 테마 시스템:
- **아이 테마**: 밝은 색상 (금색 #FFD700, 분홍 #FF69B4), 재미있는 느낌
- **부모 테마**: 전문적인 파랑/보라, 데이터 중심

테마 클래스 사용: `bg-child-primary`, `bg-parent-primary` 등

`cn()` 유틸리티(`lib/utils/cn.ts`)로 클래스 결합 - Tailwind 클래스를 올바르게 병합.

### 상수 & 설정
활동과 보상 카테고리는 `lib/constants/`에 정의:
- `activities.ts` - 아이콘, 색상, 기본 포인트가 있는 카테고리
- `rewards.ts` - 아이콘, 추천 이모지가 있는 카테고리

상태 레이블과 색상도 여기 중앙화. 문자열 하드코딩 대신 항상 이 상수 참조.

## 환경 설정

실행 전 필수 사항:
1. `.env.local.example`에서 `.env.local` 생성
2. Supabase 프로젝트 설정 및 `supabase/migrations/` 마이그레이션 실행
3. `.env.local`에 Supabase URL과 키 추가

상세한 Supabase 설정은 `supabase/SETUP_GUIDE.md` 참조.

## 구현 상태

**완료 (Phase 1-4)**:
- 프로젝트 스캐폴딩, 의존성, 설정
- 데이터베이스 스키마와 마이그레이션 (6개 테이블)
- Supabase 클라이언트 (브라우저/서버)
- 유틸리티 함수 (cn, points, dates)
- 인증 시스템 (Zustand 스토어, 로그인 UI, 라우트 보호)
- 부모와 아이를 위한 플레이스홀더 대시보드

**예정 (Phase 5-12)**:
- 공유 컴포넌트 (Button, Card, Modal)
- 활동 관리 (CRUD, 부모 인터페이스)
- 활동 완료 (아이 인터페이스)
- 포인트 시스템 통합
- 보상 시스템
- 차트가 있는 대시보드 완성
- PWA 최적화
- 추가 기능 (연속 달성일, 알림)

## 따라야 할 핵심 패턴

### 새 기능 추가 시

1. **데이터 흐름**: 부모 생성 → 아이 행동 → 부모 검증 → 포인트 지급
2. **역할 분리**: 같은 컴포넌트에서 아이와 부모 기능 절대 혼합 금지
3. **포인트 원장**: 항상 `balance_after`와 함께 트랜잭션 사용, 단순 증가 금지
4. **Supabase 쿼리**: API 라우트에서 인가 우회를 위해 Service Role Key 사용 (RLS 미설정)
5. **타입 안전성**: `@/types` barrel export에서 import, 전체적으로 엄격한 타입 사용

### 활동 작업 시

활동은 반드시 지켜야 할 생명주기 상태:
- `pending` - 부모가 생성, 시작 안 됨
- `in_progress` - 아이가 시작했지만 완료 안 됨
- `completed` - 아이가 완료, 검증 대기 중
- `verified` - 부모 승인, 포인트 지급됨 (최종 상태)

상태 건너뛰기 금지. 포인트는 `verified`로 전환될 때만 지급.

### 포인트 작업 시

`points_ledger` 테이블은 추가 전용(append-only):
- 현재 잔액 계산: `SELECT balance_after FROM points_ledger WHERE profile_id = X ORDER BY created_at DESC LIMIT 1`
- 트랜잭션 생성: 항상 `balance_after = previous_balance + points_change` 포함
- 트랜잭션 타입: 'earned'(활동에서), 'spent'(교환에서), 'adjusted'(수동), 'bonus'(연속/특별)

### 보안 고려사항

⚠️ **개발 모드**: PIN 코드가 데이터베이스에 평문으로 저장됨
- 프로덕션에는 bcrypt 해싱 구현 필요
- `store/authStore.ts` 로그인 메서드를 PIN 비교 전 해싱하도록 업데이트
- PIN 삽입 전 해싱하도록 마이그레이션 업데이트

RLS는 활성화되었지만 정책 없음 (Service Role Key가 우회). API 라우트는 다음을 검증해야 함:
- 사용자 신원 (세션/상태에서)
- 사용자 역할 권한 (부모 vs 아이)
- 리소스 소유권 (부모는 자신의 아이 활동만 검증 가능)

## 파일 구조 논리

- **`app/` 라우트**: 라우트 그룹으로 사용자 역할별 정리 `(auth)`, `(child)`, `(parent)`
- **`components/`**: 기능 도메인별 정리 (auth, child, parent, shared, dashboard)
- **`lib/`**: 외부 서비스 통합 (supabase)과 순수 유틸리티 (utils, constants)
- **`store/`**: Zustand 스토어, 도메인당 하나 (auth, activities, points, rewards)
- **`types/`**: TypeScript 정의, 데이터베이스 스키마와 정렬
- **`hooks/`**: 스토어나 유틸리티를 구성하는 재사용 가능한 React 훅
- **`supabase/`**: 데이터베이스 마이그레이션과 설정 문서 (배포 코드 아님)

## 추가 컨텍스트

현재 구현 상태와 최근 작업 이력은 `.claude/summary.md` 참조. 상세한 구현 계획은 Claude Code 계획 파일에 있음 (summary에서 참조).

Supabase 설정 상세 내용은 `supabase/SETUP_GUIDE.md` 참조.
