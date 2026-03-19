# ArKeep Frontend 코드 리뷰 순서

## 리뷰 원칙

> 의존성 그래프 기준 **하위 레이어 → 상위 레이어** 순서로 진행.
> 기반이 되는 코드를 먼저 파악한 뒤 그것을 사용하는 코드를 리뷰한다.

---

## Phase 1 — 프로젝트 설정 & 타입

기반 설정 파일과 전역 타입을 먼저 파악한다.

| 순서 | 파일 | 리뷰 포인트 |
|:---:|---|---|
| 1 | `tsconfig.json` | strict 모드, 경로 별칭(`@/*`) 설정 |
| 2 | `next.config.js` | 백엔드 프록시 rewrites, standalone output |
| 3 | `package.json` | 의존성 버전, 스크립트 |
| 4 | `app/globals.css` | 전역 스타일, 폰트, scrollbar 커스터마이징 |
| 5 | `types/index.ts` | 공통 TypeScript 타입 정의 일관성 |
| 6 | `constants/theme.ts` | MUI 테마 (색상, 폰트, borderRadius) |
| 7 | `constants/layout.ts` | 레이아웃 상수 (너비, 높이, 오프셋) |

---

## Phase 2 — 라이브러리 / 유틸리티

비즈니스 로직의 가장 낮은 레이어. 재사용성과 에러 처리 품질이 핵심.

| 순서 | 파일 | 리뷰 포인트 |
|:---:|---|---|
| 8 | `lib/utils.ts` | 카테고리 색상, 시간 포맷팅 순수 함수 품질 |
| 9 | `lib/session.ts` | sessionStorage 직렬화/역직렬화, 커스텀 이벤트 |
| 10 | `lib/api.ts` | fetch 래퍼, 토큰 자동 갱신(401 재시도), 에러 한글화, bootstrap 초기화 |
| 11 | `lib/auth.ts` | Google 로그인/로그아웃 API 호출 |
| 12 | `lib/profile.ts` | 프로필 조회 API 호출 |
| 13 | `lib/articles.ts` | 서버/localStorage 폴백 전략, 게스트 마이그레이션, CRUD |

**중점 확인 사항**
- `lib/api.ts`: `refreshAccessToken()` 재시도 루프 무한 반복 가능성
- `lib/articles.ts`: 서버 ↔ localStorage 분기 로직의 일관성, 게스트 데이터 누락 엣지케이스

---

## Phase 3 — 커스텀 훅

상태 관리의 핵심 레이어. 각 훅의 단일 책임 원칙을 확인한다.

| 순서 | 파일 | 리뷰 포인트 |
|:---:|---|---|
| 14 | `hooks/useViewMode.ts` | localStorage 동기화, 초기값 처리 |
| 15 | `hooks/useArticleFilter.ts` | 필터/정렬/검색 상태, debounce 구현, 페이지 리셋 |
| 16 | `hooks/useSession.ts` | 인증 흐름, 마이그레이션 상태, 프로필 동기화 |
| 17 | `hooks/useArticles.ts` | 목록 조회, CRUD, 페이지네이션, 낙관적 업데이트 여부 |

**중점 확인 사항**
- `useArticles.ts` + `useArticleFilter.ts` 간 의존성 결합도
- `useSession.ts`: 로그인 후 마이그레이션 다이얼로그 오픈 타이밍
- `useArticles.ts`: `mutatingArticleId`로 개별 로딩 처리 vs 전체 리프레시 트레이드오프

---

## Phase 4 — 공통 아티클 컴포넌트

아티클 데이터를 렌더링하는 순수 UI 컴포넌트.

| 순서 | 파일 | 리뷰 포인트 |
|:---:|---|---|
| 18 | `components/article/ArticleMedia.tsx` | lazy loading, fallback placeholder |
| 19 | `components/article/CardSource.tsx` | 파비콘 직접 요청 → Google API 폴백 |
| 20 | `components/article/ArticleCardItem.tsx` | 카드 뷰 레이아웃, `memo()` 최적화, 3점 메뉴 |
| 21 | `components/article/ArticleListItem.tsx` | 리스트 뷰 레이아웃, 읽음 상태 점 표시 |

**중점 확인 사항**
- `ArticleCardItem` / `ArticleListItem`: props 중복, 두 컴포넌트 간 추상화 기회
- `memo()` 의존성 — 콜백 함수가 매번 새로 생성되면 메모이제이션이 무의미

---

## Phase 5 — 레이아웃 컴포넌트

페이지 골격을 구성하는 컴포넌트.

| 순서 | 파일 | 리뷰 포인트 |
|:---:|---|---|
| 22 | `components/layout/SyncBanner.tsx` | 배너 표시 조건, 닫기 상태 관리 |
| 23 | `components/layout/TopNavigation.tsx` | 검색 입력 연결, 사용자 메뉴, 프로필 이미지 폴백 |
| 24 | `components/layout/SidebarFilters.tsx` | 아코디언 UI, 반응형 (데스크톱 고정 / 모바일 드로어) |

**중점 확인 사항**
- `TopNavigation`: 검색 상태가 `useArticleFilter`와 어떻게 연결되는지 흐름 확인
- `SidebarFilters`: 모바일 드로어 열림/닫힘 상태 소유권 위치

---

## Phase 6 — 다이얼로그 컴포넌트

사용자 인터랙션의 핵심. UX 흐름과 폼 검증을 집중 확인.

| 순서 | 파일 | 리뷰 포인트 |
|:---:|---|---|
| 25 | `components/dialogs/LoginModal.tsx` | Google GSI 동적 로드, 로딩/에러 상태 |
| 26 | `components/dialogs/OnboardingDialog.tsx` | 최초 방문자 경험, 로그인 vs 게스트 분기 |
| 27 | `components/dialogs/GuestMigrationDialog.tsx` | 마이그레이션 확인 UX, 취소 시 데이터 처리 |
| 28 | `components/dialogs/CategoryEditDialog.tsx` | 자동완성 입력, 저장 트리거 |
| 29 | `components/dialogs/SaveLinkModal.tsx` | URL 유효성 검사, 카테고리 자동완성, 메모 |
| 30 | `components/dialogs/ArticleDetailModal.tsx` | 메모 편집, 읽음 토글, 링크 열기 |

**중점 확인 사항**
- `SaveLinkModal`: URL 검사 로직 완성도, 중복 URL 처리
- `ArticleDetailModal`: 메모 저장 타이밍 (blur vs 명시적 저장 버튼)
- `OnboardingDialog` → `LoginModal` 중복 Google 버튼 렌더링 여부

---

## Phase 7 — 페이지 (진입점)

최상위 조합 레이어. 훅과 컴포넌트가 올바르게 연결되는지 확인.

| 순서 | 파일 | 리뷰 포인트 |
|:---:|---|---|
| 31 | `app/layout.tsx` | 메타데이터, 폰트 로드, MUI 테마 주입 |
| 32 | `app/page.tsx` | 훅 조합, 컴포넌트 조합, 동적 임포트 전략, 전체 데이터 흐름 |

**중점 확인 사항**
- `page.tsx`: `next/dynamic`으로 모달을 지연 로드하는 이유와 SSR 제외 처리
- `page.tsx`: 훅 간 의존성 주입 방식 (props drilling vs context 필요성 검토)
- `layout.tsx`: 불필요한 클라이언트 컴포넌트 지정 여부

---

## 전체 흐름 교차 검토 (리뷰 마무리)

| 체크 항목 | 확인 방법 |
|---|---|
| 데이터 흐름 일관성 | `page.tsx` → hooks → lib 의존성 추적 |
| 에러 경계 | API 실패 시 사용자에게 피드백이 전달되는 경로 |
| 게스트 ↔ 로그인 상태 전환 | 마이그레이션 전후 상태 일관성 |
| 반응형 레이아웃 | xs / sm / lg breakpoint 동작 |
| 번들 크기 | 동적 임포트 대상 선정의 적절성 |
| 접근성 | 키보드 탐색, ARIA 속성 |

---

## 참고 — 의존성 다이어그램

```
app/layout.tsx
└── app/page.tsx
    ├── hooks/useSession.ts       → lib/auth.ts, lib/session.ts, lib/articles.ts, lib/profile.ts
    ├── hooks/useArticles.ts      → lib/articles.ts
    ├── hooks/useArticleFilter.ts
    ├── hooks/useViewMode.ts
    │
    ├── components/layout/TopNavigation.tsx
    ├── components/layout/SidebarFilters.tsx
    ├── components/layout/SyncBanner.tsx
    │
    ├── components/article/ArticleCardItem.tsx  → ArticleMedia, CardSource
    ├── components/article/ArticleListItem.tsx  → ArticleMedia, CardSource
    │
    ├── components/dialogs/SaveLinkModal.tsx
    ├── components/dialogs/LoginModal.tsx
    ├── components/dialogs/OnboardingDialog.tsx
    ├── components/dialogs/ArticleDetailModal.tsx
    ├── components/dialogs/CategoryEditDialog.tsx
    └── components/dialogs/GuestMigrationDialog.tsx

lib/articles.ts → lib/api.ts → lib/session.ts
lib/auth.ts     → lib/api.ts
lib/profile.ts  → lib/api.ts
```
