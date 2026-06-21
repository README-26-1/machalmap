# 불편핑 (Bulpyeonping)

시민이 일상 속 불편·위험을 사진으로 제보하면, 카카오맵 위에 실시간 핀으로 공유되는 생활 안전 지도 서비스.

## 기술 스택

- **Next.js 16 (App Router)** + React 19 + TypeScript
- **Tailwind CSS** (디자인 시스템 토큰 매핑)
- **Supabase** — PostgreSQL · Auth · Storage
- **Kakao Maps JavaScript API**
- 배포: Vercel 권장

> 프론트엔드는 DB에 직접 접근하지 않고 Next.js API route(`/app/api`)를 통해 Supabase와 통신한다.

## 빠른 시작

```bash
nvm use                            # Node.js 22
npm install
cp .env.local.example .env.local   # 값 채우기
npm run dev                        # http://localhost:3000
```

### 환경변수 (`.env.local`)

| 키 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 anon 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용(노출 금지) |
| `NEXT_PUBLIC_KAKAO_MAP_KEY` | 카카오맵 JS 키(도메인 등록 필요) |

### Supabase 준비

1. 프로젝트 생성 후 SQL Editor에서 `supabase/schema.sql` 실행.
2. Storage에서 `report-images` 버킷 생성(public).
3. Authentication에서 이메일 또는 Google OAuth 활성화.

## 폴더 구조

```
app/
  page.tsx                 # 메인 지도
  report/new, report/[id]  # 제보 등록·상세
  community/...            # 커뮤니티 목록·상세·작성
  login, me                # 인증·마이페이지
  api/                     # 백엔드 (reports, feedback, posts, comments, like, me)
components/                # Button, BottomNav, KakaoMap, CategoryFilter, FeedbackButtons, StatusBadge
lib/                       # supabase 클라이언트, auth, status 로직, markerColor, api 헬퍼
types/                     # report, user, community
supabase/schema.sql        # DB 스키마 + RLS
```

## 구현 우선순위 (해커톤)

1. 지도·제보·상세·피드백 (핵심 데모)
2. 인증(로그인/회원가입)
3. 커뮤니티(글·댓글·좋아요)
4. 디자인 마감·더미데이터

## 참고 문서

기획 문서(`01_API_백엔드_기획`, `02_웹_화면_기획`, `03_앱_화면_기획`, `04_디자인_시스템`)에 상세 설계가 정리되어 있다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사 |
