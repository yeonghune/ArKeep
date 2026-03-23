# 모바일 스크롤 UX 문제 분석 및 해결 방안

## 문제 요약

| # | 증상 | 원인 |
|---|------|------|
| 1 | 하단 초과 스크롤 시 페이지가 치즈처럼 위로 늘어남 | iOS/Android 기본 overscroll(rubber-band) 효과 |
| 2 | 스크롤 시 주소창이 사라지면서 TNB가 일렁거림 | `body` 전체가 스크롤됨 → 뷰포트 높이 변동 → sticky TNB 재계산 |

두 문제는 **같은 근본 원인**에서 비롯됩니다.
현재 `body` 전체가 스크롤되는 구조이기 때문입니다.

---

## 근본 원인 분석

### 현재 구조

```
html / body  ← 이 레벨이 스크롤됨
  └─ page.tsx 최상위 Box (minHeight: 100vh)
       ├─ SyncBanner
       ├─ SidebarFilters
       └─ main
            ├─ [sticky] TNB (position: sticky, top: 0)
            └─ 콘텐츠 영역 (카드/리스트)
```

`body`가 스크롤되므로 모바일 브라우저가 **뷰포트 높이(window.innerHeight)를 주소창 유무에 따라 동적으로 변경**합니다.
`100vh`는 이 변화에 대응하지 못하고, `position: sticky`도 뷰포트 기준이 흔들리면서 TNB가 덜컹거립니다.

### 문제 1 — Rubber-band (overscroll)

iOS Safari(bounce)와 Android Chrome(glow/stretch) 모두 스크롤 끝에서 추가 스크롤 시 기본 탄성 효과를 줍니다.
`body` 자체가 스크롤 컨테이너이므로 이 효과가 페이지 전체에 적용됩니다.

### 문제 2 — TNB 일렁임 (address bar jitter)

모바일 브라우저의 주소창 표시/숨김 사이클:

```
스크롤 다운 → 주소창 숨김 → 뷰포트 높이 +56px 증가
→ body 리플로우 → sticky TNB top 기준점 재계산 → 시각적 점프
```

`100vh` 단위는 주소창이 없는 최대 높이를 기준으로 잡기 때문에,
주소창이 있을 때 레이아웃이 의도치 않게 잘리거나 달라집니다.

---

## 해결 방안: 스크롤 격리 (Scroll Isolation)

핵심 아이디어: **`body`는 고정, 카드/리스트 영역만 독립적으로 스크롤**

```
html / body  ← overflow: hidden, height: 100dvh  (스크롤 안 됨)
  └─ page wrapper  ← height: 100dvh, display: flex, flex-direction: column
       ├─ SyncBanner  ← flex-shrink: 0 (고정 높이)
       ├─ TNB  ← flex-shrink: 0 (고정 높이, sticky 불필요해짐)
       └─ 콘텐츠 영역  ← flex: 1, overflow-y: auto, overscroll-behavior: contain
```

`body`가 스크롤되지 않으므로 **주소창이 나타나지도, 사라지지도 않습니다.**
따라서 TNB 높이가 변하지 않고 일렁임이 원천 차단됩니다.

### 핵심 CSS 속성

| 속성 | 값 | 효과 |
|------|-----|------|
| `height: 100dvh` | `dvh` = Dynamic Viewport Height | 주소창 유무를 실시간 반영하는 뷰포트 단위 (iOS 15.4+, Chrome 108+) |
| `overflow: hidden` | body/html | body 스크롤 차단 |
| `overflow-y: auto` | 콘텐츠 영역 | 콘텐츠만 독립 스크롤 |
| `overscroll-behavior: contain` | 콘텐츠 영역 | rubber-band 방지, 부모 전파 차단 |

### `dvh` vs `vh` 차이

```
vh  = 브라우저 최대 뷰포트 높이 (주소창 없을 때 기준) → 고정값
dvh = 현재 실제 뷰포트 높이 (주소창 포함/제외 실시간 반영) → 동적값
```

`body`를 고정하면 `dvh`가 변하지 않으므로 리플로우도 발생하지 않습니다.

---

## 변경 필요 파일

### 1. `frontend/app/globals.css`

```css
html,
body {
  height: 100%;
  overflow: hidden;
}

/* 모바일 overscroll 전역 방지 */
body {
  overscroll-behavior: none;
}
```

### 2. `frontend/app/layout.tsx`

viewport 메타 태그 추가 (현재 누락됨):

```tsx
export const metadata: Metadata = {
  // ... 기존 내용
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};
```

> `viewport-fit=cover`: 노치/홈바 영역까지 콘텐츠 확장 (Safe Area 대응)

### 3. `frontend/app/page.tsx`

**최상위 wrapper Box**
`minHeight: "100vh"` → `height: "100dvh"`, `display: flex`, `flexDirection: column`, `overflow: hidden`

```tsx
// 변경 전
<Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "#1e293b" }}>

// 변경 후
<Box sx={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default", color: "#1e293b" }}>
```

**SyncBanner / spacing Box**
`flex-shrink: 0` 추가 (고정 높이 유지)

**사이드바 + main 영역 (display: flex 컨테이너)**
`flex: 1`, `minHeight: 0` 추가 (자식이 넘치지 않도록)

```tsx
// 변경 전
<Box sx={{ display: "flex" }}>

// 변경 후
<Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
```

**main Box**
`minHeight: "100vh"` → `height: "100%"`, `display: flex`, `flexDirection: column`, `overflow: hidden`

```tsx
// 변경 전
<Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: "#ffffff", minHeight: "100vh" }}>

// 변경 후
<Box component="main" sx={{ flex: 1, minWidth: 0, bgcolor: "#ffffff", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
```

**sticky TNB Box**
`position: sticky` 제거 → `flex-shrink: 0`으로 전환 (body가 고정되므로 sticky 불필요)

```tsx
// 변경 전
<Box sx={{ position: "sticky", top: `${sidebarTopOffset}px`, zIndex: 10, bgcolor: "#ffffff" }}>

// 변경 후
<Box sx={{ flexShrink: 0, zIndex: 10, bgcolor: "#ffffff" }}>
```

**콘텐츠 영역 Box**
스크롤을 이 영역으로 격리

```tsx
// 변경 전
<Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, pt: 2, pb: 3 }}>

// 변경 후
<Box sx={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", px: { xs: 2, sm: 3, lg: 4 }, pt: 2, pb: 3 }}>
```

---

## 예상 효과

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 주소창 동작 | 스크롤 시 사라짐/나타남 | 항상 표시 (body 스크롤 없음) |
| TNB 일렁임 | 뷰포트 변화마다 덜컹거림 | 고정, 움직임 없음 |
| Rubber-band | 페이지 전체가 늘어남 | 콘텐츠 영역 내에서만, 전파 차단 |
| 페이지네이션 | 스크롤 후 하단에 위치 | 콘텐츠 영역 하단에 위치 |

---

## 주의 사항

- **사이드바 높이**: 사이드바(Drawer)도 `height: 100%` 또는 `height: 100dvh`로 맞춰야 함
- **모달/다이얼로그**: 모달 오픈 시 콘텐츠 영역 스크롤이 막혀야 하면 `overflow: hidden` 토글 필요 (MUI Dialog는 기본 처리됨)
- **페이지네이션 스크롤 복귀**: 페이지 변경 시 콘텐츠 영역을 `scrollTop = 0`으로 리셋하는 로직 추가 필요
- **SyncBanner 높이 변화**: SyncBanner 표시/숨김 시 `sidebarTopOffset` 대신 flex 레이아웃이 자연스럽게 처리함 → `sidebarTopOffset` 관련 코드 단순화 가능
