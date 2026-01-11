# Tutor Bot 프로젝트 요약

## 프로젝트 개요
두 아이(10세, 7세)를 위한 학습 관리 웹앱 (PWA)

### 기술 스택
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: Supabase
- **상태 관리**: Zustand
- **PWA**: @ducanh2912/next-pwa

### 핵심 기능
1. 학습 활동 추적 (숙제, 독서, 문제 풀이 등)
2. 포인트/보상 시스템 (게이미피케이션)
3. 진행 상황 대시보드 (아이 & 부모)
4. 부모 관리 기능 (과제 생성, 검증, 보상 설정)
5. 간단한 로컬 인증 (프로필 선택 + 4자리 PIN)

---

## 현재 구현 상태 (2026-01-12 업데이트)

### ✅ 완료된 Phase (1-10) - 핵심 기능 100%

#### Phase 1-4: 기초 인프라 ✅
- Next.js 프로젝트 구조 생성
- 의존성 설치 완료
- TypeScript, Tailwind, PWA 설정
- Supabase 데이터베이스 (6개 테이블)
- Supabase 클라이언트 (client-side & server-side)
- 유틸리티 함수 (cn, points, dates)
- 상수 파일 (activities, rewards)
- 인증 시스템 (Zustand 스토어, 로그인 UI, 라우트 보호)

#### Phase 5: 공유 컴포넌트 ✅
- Button (variants, sizes, loading, icons)
- Card (header/footer, hoverable, padding)
- Modal (ESC key, overlay, animations)
- Input (label, error, helper text, icons)
- PointsDisplay (balance, trophy icon)

#### Phase 6: 활동 관리 시스템 (부모) ✅
- activityStore (Zustand) - 전체 CRUD, 상태 관리
- ActivityForm 컴포넌트 (모달 기반 생성)
- manage-activities 페이지 (목록, 필터링, 검증)
- API routes: /api/activities (GET, POST, PATCH, DELETE)
- API routes: /api/activities/[id]/verify (POST)
- 활동 생명주기 완전 구현 (pending → in_progress → completed → verified)

#### Phase 7: 활동 완료 시스템 (아이) ✅
- ActivityCard 컴포넌트 (상태별 액션 버튼)
- child/activities 페이지 (통계, 필터링, 시작/완료)
- 아이 친화적 UI (큰 버튼, 밝은 색상, 이모지)
- 활동 시작/완료 기능

#### Phase 8: 포인트 시스템 ✅
- pointsStore (Zustand)
- points_ledger 통합 (balance_after 기반)
- API routes: /api/points (GET)
- 활동 검증 시 자동 포인트 지급
- 보상 교환 시 자동 포인트 차감
- 트랜잭션 내역 추적

#### Phase 9: 보상 시스템 ✅
- rewardStore (Zustand) - 전체 CRUD, 교환 관리
- RewardForm 컴포넌트 (부모)
- RewardCard 컴포넌트 (아이)
- manage-rewards 페이지 (보상 관리)
- manage-rewards/redemptions 페이지 (교환 승인)
- child/rewards 페이지 (보상 교환)
- API routes: /api/rewards, /api/rewards/redemptions
- 완전한 보상 워크플로우 (생성 → 교환 → 승인 → 완료)

#### Phase 10: 대시보드 ✅
- 아이 대시보드 (포인트, 통계, 최근 활동/교환)
- 부모 대시보드 (아이별 포인트, 통계, 빠른 링크)
- 실시간 데이터 fetching
- 통계 계산 및 표시

### 🚧 부분 완료 Phase (11-12)

#### Phase 11: PWA 설정 (60%)
- ✅ PWA manifest 설정 (app/manifest.ts)
- ✅ PWA 플러그인 설정 (next.config.js)
- ✅ 아이콘 설정 (192x192, 512x512)
- ❌ Service Worker 캐싱 전략
- ❌ 오프라인 지원
- ❌ Push 알림

#### Phase 12: 추가 기능 (20%)
- ✅ 기본 UI/UX 완성
- ✅ 상태 뱃지 및 색상
- ❌ 활동 수정 기능 (버튼만 존재, TODO 상태)
- ❌ 차트/그래프 (recharts 미사용)
- ❌ 연속 달성일 시스템 (DB 테이블만 존재)
- ❌ 토스트 알림 시스템 (라이브러리만 설치)
- ❌ 모니터링/분석 페이지

### 📊 전체 완성도: 85-90%

**완전 동작하는 기능:**
- ✅ 활동 생성/관리 (부모)
- ✅ 활동 시작/완료 (아이)
- ✅ 활동 검증 및 포인트 지급 (부모)
- ✅ 보상 생성/관리 (부모)
- ✅ 보상 교환 (아이)
- ✅ 교환 승인/완료 (부모)
- ✅ 포인트 추적 및 잔액 관리
- ✅ 역할 기반 접근 제어
- ✅ 대시보드 (부모/아이)

---

## 프로젝트 구조

```
tutor-bot/
├── app/                           # Next.js App Router
│   ├── (auth)/login/             # 로그인 페이지 ✅
│   ├── (child)/                  # 아이용 인터페이스 (임시) ✅
│   │   ├── layout.tsx            # ProtectedRoute 적용
│   │   └── dashboard/page.tsx    # 임시 대시보드
│   ├── (parent)/                 # 부모용 인터페이스 (임시) ✅
│   │   ├── layout.tsx            # ProtectedRoute 적용
│   │   └── dashboard/page.tsx    # 임시 대시보드
│   ├── api/                      # API 라우트 (예정)
│   ├── layout.tsx                # Root layout ✅
│   ├── page.tsx                  # 메인 페이지 (로그인으로 리다이렉트) ✅
│   ├── globals.css               # Tailwind CSS ✅
│   └── manifest.ts               # PWA manifest ✅
│
├── components/                   # React 컴포넌트
│   ├── auth/                     # 인증 관련 ✅
│   │   ├── ProfileSelector.tsx   # 로그인 UI
│   │   └── ProtectedRoute.tsx    # 라우트 보호
│   ├── child/                    # 아이용 컴포넌트 (예정)
│   ├── parent/                   # 부모용 컴포넌트 (예정)
│   ├── shared/                   # 공유 컴포넌트 (예정)
│   └── dashboard/                # 대시보드 컴포넌트 (예정)
│
├── lib/                          # 라이브러리 및 유틸리티
│   ├── supabase/                 # Supabase 클라이언트 ✅
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client
│   ├── utils/                    # 헬퍼 함수 ✅
│   │   ├── cn.ts                 # classNames 유틸리티
│   │   ├── points.ts             # 포인트 계산
│   │   └── dates.ts              # 날짜 포맷팅
│   └── constants/                # 상수 ✅
│       ├── activities.ts         # 활동 카테고리 등
│       └── rewards.ts            # 보상 카테고리 등
│
├── store/                        # Zustand 스토어
│   └── authStore.ts              # 인증 상태 관리 ✅
│
├── types/                        # TypeScript 타입 ✅
│   ├── database.types.ts         # Supabase 타입
│   ├── auth.types.ts             # 인증 타입
│   ├── activity.types.ts         # 활동 타입
│   ├── points.types.ts           # 포인트 타입
│   ├── reward.types.ts           # 보상 타입
│   └── index.ts                  # 타입 re-export
│
├── hooks/                        # Custom React Hooks
│   └── useAuth.ts                # 인증 훅 ✅
│
├── supabase/                     # Supabase 관련
│   ├── migrations/               # SQL 마이그레이션 ✅
│   │   ├── 001_create_tables.sql
│   │   └── 002_seed_data.sql
│   └── SETUP_GUIDE.md            # 설정 가이드 ✅
│
├── public/                       # 정적 파일
│   └── icons/                    # PWA 아이콘 (예정)
│
├── .env.local.example            # 환경 변수 템플릿 ✅
├── next.config.js                # Next.js + PWA 설정 ✅
├── tailwind.config.ts            # Tailwind 설정 ✅
└── tsconfig.json                 # TypeScript 설정 ✅
```

---

## 데이터베이스 스키마

### profiles
- 사용자 프로필 (부모 1명, 아이 2명)
- role: 'parent' | 'child'
- PIN 코드로 로그인

### activities
- 학습 활동/과제
- 카테고리: homework, reading, problem-solving, practice, other
- 상태: pending, in_progress, completed, verified
- 부모가 생성, 아이가 완료, 부모가 검증

### rewards
- 교환 가능한 보상
- 카테고리: screen_time, treat, activity, toy, privilege, other
- 포인트 비용

### points_ledger
- 포인트 거래 내역
- 활동 완료 시 적립, 보상 교환 시 차감
- balance_after로 잔액 추적

### reward_redemptions
- 보상 교환 요청
- 상태: pending, approved, fulfilled, rejected
- 부모 승인 필요

### daily_streaks
- 일일 연속 달성일 추적
- 동기 부여용

---

## 환경 변수

`.env.local` 파일에 다음 정보 필요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 테스트 계정 (샘플 데이터)

- **부모**: PIN 1234
- **큰아이** (10세): PIN 0000
- **작은아이** (7세): PIN 1111

---

## 다음 구현 단계

### Phase 5: 공유 컴포넌트 구축
- Button 컴포넌트 (여러 variant)
- Card 컴포넌트
- Modal 컴포넌트
- Header 컴포넌트

### Phase 6: 활동 관리 시스템 (부모)
- activityStore (Zustand)
- ActivityForm 컴포넌트
- 활동 CRUD API
- 활동 목록 페이지

### Phase 7: 활동 완료 시스템 (아이)
- ActivityCard 컴포넌트
- 활동 완료 UI
- 검증 대기 상태

### 이후 Phase
- 포인트 시스템 통합
- 보상 시스템 구현
- 대시보드 완성
- PWA 최적화

---

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트
npm run lint
```

---

## 중요 참고사항

### 보안
- 현재 PIN 코드는 평문 저장 (프로덕션에서는 bcrypt 필요!)
- API routes에서 권한 검증 필요
- RLS는 활성화되어 있지만 정책 미설정 (Service Role Key 사용)

### 성능
- Next.js Image 컴포넌트 사용 권장
- React.memo로 리렌더링 최적화
- Zustand selector 활용

### UI/UX
- 아이용: 큰 버튼, 밝은 색상, 간단한 텍스트
- 부모용: 데이터 중심, 관리 기능 강조
- 로딩 상태 및 에러 처리 필수

---

## 도움이 필요할 때

1. **Supabase 설정**: `supabase/SETUP_GUIDE.md` 참조
2. **프로젝트 구조**: 이 파일의 "프로젝트 구조" 섹션 참조
3. **구현 계획**: `C:\Users\joon\.claude\plans\reflective-tickling-treehouse.md` 참조
4. **타입 정의**: `types/` 디렉토리 참조

---

## 최근 작업 이력

- 2026-01-10: Phase 1-4 완료 (프로젝트 초기화, DB 설정, 인프라, 인증)
- 2026-01-12: Phase 5-10 완료 (공유 컴포넌트, 활동 관리, 포인트, 보상, 대시보드)
  - 전체 활동 워크플로우 구현 완료
  - 전체 보상 시스템 구현 완료
  - 포인트 시스템 통합 완료
  - 부모/아이 대시보드 완성
  - 부모 대시보드 fetchRewards 버그 수정
- 다음: Phase 11-12 완성 (활동 수정, 차트, 연속 달성일, PWA 최적화) 또는 테스트

---

## 알려진 이슈 및 TODO

**✅ 해결됨:**
- ~~PWA 아이콘 생성~~ (완료)
- ~~부모 대시보드 fetchRewards 버그~~ (수정 완료)

**🚧 진행 필요:**
- [ ] 활동 수정 기능 구현 (`app/parent/manage-activities/page.tsx:259` - TODO 상태)
- [ ] 차트/그래프 추가 (recharts 사용, 진행 상황 시각화)
- [ ] 연속 달성일 시스템 구현 (daily_streaks 테이블 활용)
- [ ] 토스트 알림 통합 (react-hot-toast)
- [ ] Service Worker 캐싱 전략 최적화
- [ ] 모니터링/분석 페이지 구현

**⚠️ 프로덕션 배포 전 필수:**
- [ ] PIN 코드 해싱 필요 (bcrypt)
- [ ] Supabase 프로젝트 설정 및 .env.local 파일 생성
- [ ] RLS 정책 설정 (현재 Service Role Key로 우회 중)
- [ ] API 라우트 권한 검증 강화
