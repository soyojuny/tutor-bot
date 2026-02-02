# 멀티 테넌시 리팩토링 요약

`plan.md`에 명시된 계획에 따라 애플리케이션에 가족(Family) 기반의 멀티 테넌시를 구현하는 작업을 완료했습니다. 이제 모든 주요 데이터는 `family_id`를 기준으로 격리되어, 한 가족의 데이터가 다른 가족에게 노출되지 않도록 보장합니다.

## 주요 변경 사항

### 1. 데이터베이스 스키마 및 보안 정책 (RLS)
- **신규 마이그레이션 파일 생성 (`supabase/migrations/003_multi_tenancy.sql`)**:
  - `activities`, `rewards`, `points_ledger` 등 모든 가족 단위 데이터 테이블에 `family_id` 컬럼을 추가했습니다.
  - 사용자가 자신의 가족 데이터에만 접근할 수 있도록 하는 행 수준 보안(Row Level Security) 정책을 모든 관련 테이블에 적용했습니다.
  - 이 정책을 위한 헬퍼 함수 `public.get_current_family_id()`를 생성했습니다. (기존 `auth` 스키마에서 `public`으로 이동하여 권한 문제를 해결했습니다.)

### 2. API 라우트 업데이트
- 프로젝트의 모든 API 라우트(`app/api/**/*.ts`)를 수정하여, 데이터 조회, 생성, 수정, 삭제 시 `family_id`를 사용해 필터링하도록 로직을 추가했습니다.
- 이를 통해 API 계층에서도 데이터 격리를 강제합니다.
- 더 이상 필요하지 않은 `assertProfileInFamily`, `getFamilyProfileIds` 헬퍼 함수를 제거하여 코드를 정리했습니다.

### 3. 타입 정의 업데이트
- `types` 디렉토리의 모든 관련 데이터 타입(`Activity`, `Reward` 등)과 Supabase 자동 생성 타입(`types/database.types.ts`)에 `family_id`를 추가하여 타입 안정성을 확보했습니다.
- 빌드 오류를 해결하기 위해 `database.types.ts` 파일을 수동으로 업데이트했습니다.

## 변경된 파일 목록

- **생성됨**:
  - `supabase/migrations/003_multi_tenancy.sql`
- **수정됨**:
  - `plan.md` (RLS 정책 계획 추가)
  - `types/activity.types.ts`
  - `types/book-discussion.types.ts`
  - `types/points.types.ts`
  - `types/reward.types.ts`
  - `types/streak.types.ts`
  - `types/database.types.ts` (수동 업데이트)
  - `lib/services/points.ts`
  - `lib/services/streaks.ts`
  - `lib/api/helpers.ts`
  - `app/api/activities/route.ts`
  - `app/api/activities/[id]/route.ts`
  - `app/api/activities/[id]/complete/route.ts`
  - `app/api/completions/route.ts`
  - `app/api/completions/[id]/verify/route.ts`
  - `app/api/book-discussions/route.ts`
  - `app/api/points/route.ts`
  - `app/api/rewards/route.ts`
  - `app/api/rewards/[id]/route.ts`
  - `app/api/rewards/redemptions/route.ts`
  - `app/api/rewards/redemptions/[id]/route.ts`
  - `app/api/streaks/[profileId]/route.ts`
  - `app/api/profiles/[id]/route.ts`

## 다음 단계 (사용자 확인 필요)

1.  **데이터베이스 마이그레이션 적용**:
    - 로컬 Supabase 환경에 새로운 마이그레이션 스크립트를 적용해야 합니다. 일반적으로 다음 명령어를 사용합니다.
      ```bash
      npx supabase db reset
      # 또는
      npx supabase migration up
      ```

2.  **Supabase 타입 재성성 (권장)**:
    - 빌드 오류를 해결하기 위해 `types/database.types.ts` 파일을 제가 수동으로 수정했습니다. 데이터베이스 스키마와 타입을 100% 동기화하기 위해 Supabase CLI를 사용하여 타입을 다시 생성하는 것이 좋습니다.
      ```bash
      npx supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
      ```

3.  **전체 기능 테스트**:
    - 코드베이스에 광범위한 변경이 적용되었습니다. 회원가입, 프로필 생성, 활동 및 보상 관리 등 애플리케이션의 모든 주요 기능을 철저히 테스트하여 멀티 테넌시가 의도대로 작동하는지 확인해야 합니다.
