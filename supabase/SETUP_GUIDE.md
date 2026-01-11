# Supabase 설정 가이드

이 가이드는 Tutor Bot 프로젝트를 위한 Supabase 데이터베이스 설정 방법을 안내합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase 웹사이트](https://supabase.com/)에 접속
2. "Start your project" 또는 "New Project" 클릭
3. Organization 선택 (없으면 새로 생성)
4. 프로젝트 정보 입력:
   - **Name**: tutor-bot (또는 원하는 이름)
   - **Database Password**: 안전한 비밀번호 생성 (나중에 필요하지 않음)
   - **Region**: 가장 가까운 지역 선택 (예: Northeast Asia (Seoul))
5. "Create new project" 클릭
6. 프로젝트 생성 완료까지 1-2분 대기

## 2. 데이터베이스 테이블 생성

1. Supabase 대시보드에서 왼쪽 메뉴의 **SQL Editor** 클릭
2. "New Query" 클릭
3. `migrations/001_create_tables.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행
5. 성공 메시지 확인

## 3. 샘플 데이터 삽입

1. SQL Editor에서 새 쿼리 생성
2. `migrations/002_seed_data.sql` 파일의 내용을 복사하여 붙여넣기
3. "Run" 버튼 클릭하여 실행
4. 성공 메시지 확인

## 4. API 키 및 URL 가져오기

1. 왼쪽 메뉴에서 **Settings** (톱니바퀴 아이콘) 클릭
2. **API** 섹션 클릭
3. 다음 정보를 복사:
   - **Project URL**: `https://xxx.supabase.co` 형식
   - **anon/public key**: `eyJ...` 로 시작하는 긴 문자열
   - **service_role key**: `eyJ...` 로 시작하는 또 다른 긴 문자열 (Show 버튼 클릭)

## 5. 환경 변수 설정

1. 프로젝트 루트에서 `.env.local.example` 파일을 복사하여 `.env.local` 생성:
   ```bash
   cp .env.local.example .env.local
   ```

2. `.env.local` 파일을 열어 Supabase 정보 입력:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

## 6. 데이터베이스 확인

1. Supabase 대시보드에서 **Table Editor** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - `profiles` (3개 행)
   - `activities` (5개 행)
   - `rewards` (5개 행)
   - `points_ledger` (0개 행 - 정상)
   - `reward_redemptions` (0개 행 - 정상)
   - `daily_streaks` (2개 행)

## 7. TypeScript 타입 업데이트 (선택사항)

Supabase에서 자동으로 TypeScript 타입을 생성하려면:

```bash
# Supabase CLI 설치 (필요한 경우)
npm install -g supabase

# 프로젝트 ID로 타입 생성
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.types.ts
```

**주의**: 현재 이미 수동으로 생성된 타입이 있으므로 이 단계는 선택사항입니다.

## 8. 테스트

1. 개발 서버 시작:
   ```bash
   npm run dev
   ```

2. 브라우저에서 http://localhost:3000 접속
3. 로그인 페이지가 표시되는지 확인

## 보안 참고사항

### 프로덕션 배포 전 필수 작업

1. **PIN 코드 해싱**:
   - 현재 샘플 데이터는 평문 PIN을 사용합니다
   - 프로덕션에서는 반드시 bcrypt로 해싱해야 합니다
   - `store/authStore.ts`에서 PIN 검증 로직 구현 시 해싱 적용 필요

2. **Row Level Security (RLS) 정책**:
   - 현재 RLS가 활성화되어 있지만 정책이 없습니다
   - Service Role Key를 사용하므로 API 레벨에서 권한 검증
   - 추후 RLS 정책 추가 권장

3. **환경 변수 보안**:
   - `.env.local` 파일은 절대 Git에 커밋하지 않습니다
   - `.gitignore`에 이미 포함되어 있습니다

## 문제 해결

### 테이블 생성 실패
- UUID extension이 활성화되었는지 확인
- SQL 구문 오류가 없는지 확인
- 각 migration을 순서대로 실행했는지 확인

### API 연결 실패
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 포함)
- 개발 서버를 재시작했는지 확인

### 권한 오류
- Service Role Key가 올바른지 확인
- RLS가 의도대로 설정되었는지 확인

## 다음 단계

Supabase 설정이 완료되면:
1. Phase 3: 핵심 인프라 구축 (Supabase 클라이언트 설정)
2. Phase 4: 인증 시스템 구현
3. 이후 단계들 순차적으로 진행
