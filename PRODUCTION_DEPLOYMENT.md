# 프로덕션 배포 가이드

이 문서는 Tutor Bot을 프로덕션 환경에 배포하기 전에 완료해야 할 필수 보안 및 설정 작업을 설명합니다.

## ⚠️ 프로덕션 배포 전 필수 체크리스트

### 1. PIN 코드 해싱 (🔴 Critical)

**현재 상태:** PIN 코드가 데이터베이스에 평문으로 저장됨
**프로덕션 요구사항:** bcrypt를 사용하여 모든 PIN을 해싱해야 함

**구현 단계:**

#### Step 1: 해싱 함수 구현 완료 ✅
- `lib/utils/auth.ts`에 `hashPin()`, `verifyPin()` 함수 구현됨
- `store/authStore.ts`에서 해싱된 PIN 검증 로직 추가됨
- 평문 PIN과 해싱된 PIN 모두 호환 (하위 호환성)

#### Step 2: 기존 PIN 마이그레이션 (수동 실행 필요)

```bash
# 1. Node.js 환경에서 PIN 해싱
node
> const bcrypt = require('bcryptjs');
> await bcrypt.hash('1234', 10);  // 부모 PIN
> await bcrypt.hash('0000', 10);  // 큰아이 PIN
> await bcrypt.hash('1111', 10);  // 작은아이 PIN
```

```sql
-- 2. supabase/migrations/003_hash_pins.sql 파일 수정
-- 주석을 제거하고 해싱된 PIN으로 교체

UPDATE profiles
SET pin_code = '$2a$10$생성된해시값'
WHERE name = '엄마' AND pin_code = '1234';

-- 나머지 프로필도 동일하게 업데이트
```

```bash
# 3. Supabase에서 마이그레이션 실행
supabase migration up
```

#### Step 3: 신규 프로필 생성 시 해싱 적용

API 라우트나 관리 페이지에서 신규 프로필을 생성할 때:

```typescript
import { hashPin } from '@/lib/utils/auth';

const hashedPin = await hashPin(newPin);
// hashedPin을 데이터베이스에 저장
```

---

### 2. Supabase 환경 변수 설정 (🔴 Critical)

**필수 환경 변수:**

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**주의사항:**
- `.env.local`을 절대 Git에 커밋하지 마세요
- Service Role Key는 서버 사이드에서만 사용
- 프로덕션과 개발 환경의 키를 분리하세요

---

### 3. Row Level Security (RLS) 정책 (🟡 Recommended)

**현재 상태:** RLS가 활성화되어 있지만 정책이 없음 (Service Role Key로 우회)
**프로덕션 권장사항:** RLS 정책을 적용하여 데이터 접근 제어

#### 옵션 A: 현재 구조 유지 (빠른 배포)
- Service Role Key를 계속 사용
- API 라우트에서 수동으로 권한 검증
- 장점: 추가 작업 없음
- 단점: 클라이언트에서 Service Key 노출 위험

#### 옵션 B: RLS 정책 적용 (권장)

```bash
# RLS 정책 마이그레이션 실행
supabase migration up

# supabase/migrations/004_rls_policies.sql 적용됨
```

**추가 작업 필요:**
1. Supabase Auth 통합
2. 프로필과 auth.users 연결
3. API 라우트에서 인증된 사용자 컨텍스트 사용
4. 클라이언트 코드에서 Service Role Key 제거

---

### 4. PWA 최적화 (✅ 완료)

**구현 완료:**
- Service Worker 캐싱 전략 설정 완료
- 오프라인 리소스 캐싱 (이미지, 폰트, CSS, JS)
- 네트워크 우선 전략으로 API 제외
- 프로덕션 빌드 시 자동 적용

**확인 방법:**
```bash
npm run build
npm start
# Chrome DevTools > Application > Service Workers 확인
```

---

### 5. 보안 헤더 설정 (🟡 Recommended)

`next.config.js`에 보안 헤더 추가:

```javascript
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

---

### 6. 에러 로깅 및 모니터링 (🟡 Recommended)

프로덕션에서 에러를 추적하기 위해 다음 중 하나를 통합하세요:

- **Sentry**: 실시간 에러 모니터링
- **LogRocket**: 세션 리플레이
- **Vercel Analytics**: 성능 모니터링 (Vercel 배포 시)

---

### 7. 성능 최적화 (🟢 Optional)

#### 이미지 최적화
```typescript
import Image from 'next/image';

// 항상 Next.js Image 컴포넌트 사용
<Image src="/path" alt="desc" width={100} height={100} />
```

#### 폰트 최적화
```javascript
// app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
```

#### 번들 크기 분석
```bash
npm run build
# .next/analyze 폴더 확인
```

---

## 배포 플랫폼별 가이드

### Vercel 배포

1. GitHub 저장소에 푸시
2. Vercel에서 프로젝트 Import
3. 환경 변수 설정 (Dashboard > Settings > Environment Variables)
4. 자동 배포 활성화

**장점:**
- Zero-config 배포
- 자동 HTTPS
- 글로벌 CDN
- PWA 자동 지원

### Docker 배포

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t tutor-bot .
docker run -p 3000:3000 --env-file .env.local tutor-bot
```

---

## 배포 후 확인 사항

### ✅ 기능 테스트
- [ ] 로그인 (부모/아이)
- [ ] 활동 생성/수정/삭제
- [ ] 활동 시작/완료/검증
- [ ] 보상 생성/교환/승인
- [ ] 포인트 지급/차감
- [ ] 연속 달성일 업데이트
- [ ] 대시보드 차트 표시

### ✅ 보안 테스트
- [ ] PIN 해싱 동작 확인
- [ ] Service Role Key 노출 여부 확인 (Chrome DevTools > Network)
- [ ] HTTPS 적용 확인
- [ ] 보안 헤더 확인 (securityheaders.com)

### ✅ 성능 테스트
- [ ] Lighthouse 점수 (90+ 권장)
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] PWA 설치 가능 확인

---

## 롤백 절차

문제 발생 시:

1. **Vercel**: Dashboard에서 이전 배포로 롤백
2. **Docker**: 이전 이미지 태그로 재배포
3. **데이터베이스**: Supabase Dashboard > Database > Backups

---

## 지원 및 문의

- 프로젝트 문서: `CLAUDE.md`
- Supabase 설정: `supabase/SETUP_GUIDE.md`
- 이슈 리포트: GitHub Issues

---

## 마지막 체크리스트

배포 전 다음을 확인하세요:

- [ ] PIN 코드가 모두 해싱됨
- [ ] 환경 변수가 프로덕션 값으로 설정됨
- [ ] `.env.local`이 `.gitignore`에 포함됨
- [ ] Service Role Key가 서버 사이드에서만 사용됨
- [ ] 프로덕션 빌드가 성공함 (`npm run build`)
- [ ] PWA가 정상 동작함
- [ ] 보안 헤더가 설정됨
- [ ] 에러 로깅이 구성됨 (선택)
- [ ] 백업 전략이 수립됨

**준비가 완료되면 배포하세요! 🚀**
