# ArKeep 버그 분석 리포트

> 작성일: 2026-03-31

---

## 버그 1: 구글 이메일 대신 ID가 표시됨

### 증상

설정 페이지(`/settings`)에서 이메일 자리에 구글 이메일(`user@gmail.com`) 대신 구글 subject ID(`109876543210` 같은 숫자 문자열)가 표시됨.

### 원인

**근본 원인: `User` 모델에 `email` 컬럼이 없음**

`backend/app/models/user.py`의 `User` 테이블은 `provider_user_id`(Google OAuth `sub` 필드, 숫자로 된 고유 식별자)만 저장하고 실제 이메일을 저장하지 않는다.

```
User 테이블
├── provider_user_id  ← Google sub (숫자 ID, 예: "109876543210")
├── display_name
├── avatar_url
└── ...  ← email 컬럼 없음
```

이 때문에 토큰 갱신(refresh) 시 백엔드가 실제 이메일을 반환하지 못한다.

#### 버그 전파 경로

**1단계** — 최초 로그인 시 이메일은 올바르게 저장됨 (`auth_service.py:120`):
```python
return AuthResponse(token=access_token, email=payload.get("email") or subject), refresh_jti
```
Google ID 토큰 payload에서 `email` 필드를 꺼내므로 처음엔 정상.

**2단계** — 그러나 토큰 갱신(refresh) 시 이메일이 없어 ID로 대체됨 (`auth_service.py:175`):
```python
return AuthResponse(token=access_token, email=user.provider_user_id), new_jti
# ↑ email 없으므로 provider_user_id(구글 숫자 ID)를 email 자리에 넣음
```

**3단계** — 프론트엔드는 refresh 응답의 `email`을 sessionStorage에 저장 (`api.ts:88-93`):
```typescript
saveSession({
  token: payload.token,
  email: current?.email || payload.email,  // ← current가 없으면 payload.email(= 숫자 ID)
  name: current?.name,
  pictureUrl: current?.pictureUrl
});
```
같은 탭에서 페이지 새로고침하면 `current?.email`이 남아 있어 괜찮지만,
**새 탭에서 열거나 탭을 닫고 다시 열면** sessionStorage가 초기화되므로 `current`가 null이 되고 `payload.email`(= 숫자 ID)이 저장된다.

**4단계** — 설정 페이지가 sessionStorage의 email을 그대로 표시 (`settings/page.tsx:93`):
```typescript
const email = session?.email ?? "";
```

#### 부가 원인: `profile.py`의 displayName fallback도 ID 반환 가능

`backend/app/routers/profile.py:12-14`:
```python
display_name = current_user.display_name
if not display_name or not display_name.strip():
    display_name = current_user.provider_user_id  # ← display_name이 비어 있으면 숫자 ID 반환
```
`display_name`이 비어 있는 사용자(엣지 케이스)는 이름에도 숫자 ID가 표시됨.

### 관련 파일

| 파일 | 라인 | 내용 |
|------|------|------|
| [backend/app/models/user.py](backend/app/models/user.py) | 전체 | `User` 모델 — `email` 컬럼 없음 |
| [backend/app/services/auth_service.py](backend/app/services/auth_service.py) | 175 | refresh 시 `email=user.provider_user_id` 반환 |
| [backend/app/routers/profile.py](backend/app/routers/profile.py) | 12-14 | `display_name` fallback이 `provider_user_id` |
| [frontend/lib/api.ts](frontend/lib/api.ts) | 88-93 | refresh 응답의 email을 sessionStorage에 저장 |
| [frontend/app/settings/page.tsx](frontend/app/settings/page.tsx) | 93 | `session?.email`을 이메일로 표시 |

### 해결 방안

#### 방법 A (권장): `User` 모델에 `email` 컬럼 추가

1. `backend/app/models/user.py`에 `email` 컬럼 추가:
   ```python
   email: Mapped[str | None] = mapped_column(String(255))
   ```
2. `auth_service.py`의 upsert 로직에서 email 저장:
   ```python
   # login_with_google 내부
   email_from_google = payload.get("email")
   # User 생성/업데이트 시 email 필드에 저장
   ```
3. refresh 시 실제 email 반환:
   ```python
   return AuthResponse(token=access_token, email=user.email or user.provider_user_id), new_jti
   ```
4. DB 마이그레이션 필요 (Alembic 등)

#### 방법 B (단기 대응): `MyProfileResponse`에 email 추가

`/me` 엔드포인트가 email을 내려주고, 프론트에서 `/me` 응답의 email을 사용하도록 변경. 단, User 모델에 email이 없으면 결국 방법 A가 필요함.

---

## 버그 2: 모바일에서 태그 설정이 안 되는 경우가 있음

### 증상

태그 입력 후 Enter로 칩(chip)을 만들지 않고 바로 저장 버튼을 누르면 입력한 태그가 저장되지 않음. 모바일에서는 물리 Enter 키 대신 저장 버튼을 바로 탭하는 경우가 많아 더 자주 발생.

### 원인

**`handleSubmit`이 `inputValue`를 무시하고 `tags` 배열만 저장**

`EditTagsDialog.tsx:58-70`:
```typescript
async function handleSubmit() {
  setError(null);
  setIsSubmitting(true);
  try {
    await onSave(normalizeTags(tags));  // ← tags만 저장, inputValue는 버림
    onClose();
  } catch (e) { ... }
}
```

태그는 두 가지 상태로 존재한다:
- **`tags`**: Enter나 콤마로 확정되어 칩으로 변환된 태그 목록
- **`inputValue`**: input에 입력 중이지만 아직 칩으로 변환되지 않은 텍스트

사용자가 "개발"을 입력한 채 Enter 없이 저장을 누르면 `inputValue = "개발"`, `tags = []` 상태이므로 `normalizeTags(tags)`는 빈 배열이 되어 태그가 저장되지 않는다.

PC에서도 동일한 버그지만, 물리 키보드에서는 Enter를 눌러 칩을 먼저 만드는 흐름이 자연스러워 덜 발생한다. 모바일에서는 저장 버튼을 바로 탭하는 패턴이 흔해 더 눈에 띈다.

`SaveLinkModal.tsx`의 태그 입력(`handleSave`)도 동일한 구조라 같은 버그를 가진다.

### 관련 파일

| 파일 | 라인 | 내용 |
|------|------|------|
| [frontend/components/dialogs/EditTagsDialog.tsx](frontend/components/dialogs/EditTagsDialog.tsx) | 62 | `normalizeTags(tags)` — `inputValue` 미반영 |
| [frontend/components/dialogs/SaveLinkModal.tsx](frontend/components/dialogs/SaveLinkModal.tsx) | 124 | `normalizeTags(tags)` — 동일 문제 |

### 해결 방안

저장 시 `inputValue`가 비어 있지 않으면 `tags`에 합쳐서 저장:

**`EditTagsDialog.tsx` — `handleSubmit` 수정:**
```typescript
async function handleSubmit() {
  setError(null);
  setIsSubmitting(true);
  try {
    const finalTags = inputValue.trim()
      ? normalizeTags([...tags, inputValue])
      : normalizeTags(tags);
    await onSave(finalTags);
    onClose();
  } catch (e) {
    const message = e instanceof Error ? e.message : "태그 저장에 실패했습니다.";
    setError(message);
  } finally {
    setIsSubmitting(false);
  }
}
```

**`SaveLinkModal.tsx` — `handleSave` 수정:**
```typescript
// 기존
await onSave(normalizedUrl, normalizedCategory, normalizedMemo, normalizeTags(tags));

// 수정
const finalTags = tagInput.trim()
  ? normalizeTags([...tags, tagInput])
  : normalizeTags(tags);
await onSave(normalizedUrl, normalizedCategory, normalizedMemo, finalTags);
```

---

## 버그 3: 모바일 웹에서 클립보드 URL 붙여넣기 시 키보드가 뜸

### 증상

모바일 브라우저에서 아티클 저장 모달(`SaveLinkModal`)을 열었을 때:
1. 클립보드에 URL이 있으면 자동으로 URL 입력란에 붙여넣어짐
2. 동시에 URL 입력란에 포커스가 잡혀 모바일 가상 키보드가 올라옴
3. 이미 URL이 채워진 상태에서 키보드가 올라와 불필요하게 화면이 가려짐

### 원인

`SaveLinkModal.tsx`의 두 동작이 동시에 일어남:

**동작 1 — 클립보드 자동 붙여넣기** (`SaveLinkModal.tsx:83-94`):
```typescript
(async () => {
  try {
    await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
    const text = await navigator.clipboard.readText();
    const trimmed = text.trim();
    if (URL_PATTERN.test(trimmed)) {
      setUrl(trimmed);  // URL 자동 입력
    }
  } catch {
    // 권한 거부 또는 미지원 브라우저
  }
})();
```

**동작 2 — 다이얼로그 오픈 후 URL input 자동 포커스** (`SaveLinkModal.tsx:140`):
```typescript
<Dialog
  ...
  TransitionProps={{ onEntered: () => urlInputRef.current?.focus() }}
  // ↑ 다이얼로그 애니메이션이 끝나면 항상 URL input에 포커스를 줌
>
```

모바일에서는 input에 포커스가 잡히면 가상 키보드가 올라온다. 데스크톱에서는 문제없지만 모바일에서는 URL이 이미 채워진 상태에서 키보드까지 올라와 UX가 나빠진다.

### 관련 파일

| 파일 | 라인 | 내용 |
|------|------|------|
| [frontend/components/dialogs/SaveLinkModal.tsx](frontend/components/dialogs/SaveLinkModal.tsx) | 83-94 | 클립보드 URL 자동 입력 |
| [frontend/components/dialogs/SaveLinkModal.tsx](frontend/components/dialogs/SaveLinkModal.tsx) | 140 | `TransitionProps.onEntered`에서 무조건 focus |

### 해결 방안

모바일에서는 자동 포커스 자체를 하지 않도록 `matchMedia`로 터치 디바이스를 판별:

```typescript
TransitionProps={{
  onEntered: () => {
    const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (!isMobile) {
      urlInputRef.current?.focus();
    }
  }
}}
```

> `window.innerWidth < 600`보다 `matchMedia("(hover: none) and (pointer: coarse)")`로 판별하는 것이 정확함. 넓은 화면의 태블릿이나 좁은 화면의 노트북 모두 올바르게 처리됨.

---

## 태그 검증 로직 현황 및 보완

### 현재 검증 레이어별 현황

| 검증 항목 | FE UI | FE API | BE Schema | BE Service | DB |
|----------|-------|--------|-----------|------------|----|
| 최대 5개 | 에러 표시 (UI) / 조용히 잘림 (normalizeTags) | throw | 422 | 400 | 없음 |
| 태그당 20자 | **조용히 드롭** | throw | **없음** | 400 | 50자까지 허용 |
| 중복 제거 | 자동 제거 | 자동 제거 | 없음 | 자동 제거 | 없음 |
| 빈 문자열 | 자동 제거 | 자동 제거 | 없음 | 자동 제거 | 없음 |

**주요 불일치 3가지:**
1. **FE UI의 `normalizeTags`**: 20자 초과 태그를 에러 없이 조용히 드롭 → 사용자가 이유를 모름
2. **BE Schema**: 개수(5개)만 검증하고 개별 태그 길이 검증 없음 → service에만 의존
3. **DB 컬럼**: `String(50)`인데 앱은 20자로 제한 → 정합성 불일치

---

### 보완 방안

#### 프론트엔드 — UI 레이어

**1. `normalizeTags`의 조용한 드롭 → 에러 메시지로 변환**

현재 [EditTagsDialog.tsx:29](frontend/components/dialogs/EditTagsDialog.tsx#L29), [SaveLinkModal.tsx:39](frontend/components/dialogs/SaveLinkModal.tsx#L39):
```typescript
if (v.length > MAX_TAG_LEN) continue;  // 조용히 버림 — 사용자에게 피드백 없음
```

보완 — `normalizeTags` 호출 전 길이 사전 검사 후 에러 표시:
```typescript
onInputChange={(_, v) => {
  if (v.length > MAX_TAG_LEN) {
    setTagError(`태그는 ${MAX_TAG_LEN}자를 초과할 수 없습니다.`);
    return;
  }
  setTagInput(v);
}}
```

**2. `EditTagsDialog` line 135 guard 조건 버그 단순화**

현재 [EditTagsDialog.tsx:135](frontend/components/dialogs/EditTagsDialog.tsx#L135):
```typescript
// MAX_TAGS 미만이어도 중복 태그 입력 시 조용히 건너뜀
if (merged.length >= MAX_TAGS && normalizeTags([...tags, inputValue]).length === tags.length) return;
```

보완 — 경우를 분리해서 명확하게 처리:
```typescript
if (merged.length > MAX_TAGS) {
  setError(`태그는 최대 ${MAX_TAGS}개까지 가능합니다.`);
  return;
}
if (merged.length === tags.length) {
  // 중복 태그 — 조용히 input만 초기화
  setInputValue("");
  return;
}
```

**3. 저장 시 `inputValue` flush** ← 버그 2 해결 방안과 동일

---

#### 백엔드 — Schema 레이어

**4. `CreateArticleRequest`에 개별 태그 길이 검증 추가**

현재 [article.py:14-18](backend/app/schemas/article.py#L14) — 개수만 검증:
```python
@field_validator("tags")
@classmethod
def tags_max(cls, v):
    if v is not None and len(v) > 5:
        raise ValueError("Tags must be at most 5")
    return v
```

보완 — 길이 검증 추가:
```python
@field_validator("tags")
@classmethod
def validate_tags(cls, v):
    if v is None:
        return v
    if len(v) > 5:
        raise ValueError("Tags must be at most 5")
    for tag in v:
        if len(tag.strip()) > 20:
            raise ValueError("Each tag must be at most 20 characters")
    return v
```

**5. `UpdateArticleTagsRequest`에도 동일하게 적용**

[article.py:122-127](backend/app/schemas/article.py#L122) — 현재 개수만 체크. 위와 동일한 방식으로 길이 검증 추가.

---

#### DB 레이어

**6. 태그 컬럼 길이를 앱 제한(20자)과 일치**

현재 [0006_add_article_tags_array.py:22](backend/alembic/versions/0006_add_article_tags_array.py#L22):
```python
postgresql.ARRAY(sa.String(length=50))  # 앱은 20자 제한인데 DB는 50자
```

보완 — 새 Alembic 마이그레이션으로 컬럼 길이 수정:
```python
op.alter_column(
    "articles", "tags",
    type_=postgresql.ARRAY(sa.String(20)),
    existing_type=postgresql.ARRAY(sa.String(50))
)
```
> PostgreSQL은 기존 데이터가 새 제한 이내인 경우에만 변환 성공. 기존 DB에 20자 초과 태그가 없다면 무중단 적용 가능.

**7. DB 레벨 배열 크기 제약 — 생략 가능**

PostgreSQL의 `ARRAY` 타입은 크기를 선언해도 실제로 강제하지 않으므로, 배열 요소 개수 제한은 앱 레이어에서 충분히 막고 있다면 별도 트리거/CHECK 제약은 불필요.

---

### 보완 우선순위 요약

| 우선순위 | 레이어 | 항목 |
|---------|--------|------|
| 높음 | FE UI | `inputValue` flush on save (버그 2와 동일) |
| 높음 | FE UI | 20자 초과 입력 시 에러 메시지 표시 |
| 중간 | FE UI | guard 조건 버그 단순화 |
| 중간 | BE Schema | `CreateArticleRequest` / `UpdateArticleTagsRequest` 길이 검증 추가 |
| 낮음 | DB | `String(50)` → `String(20)` 마이그레이션 |

---

## 전체 요약

| # | 버그 | 핵심 파일 | 근본 원인 | 우선순위 |
|---|------|-----------|-----------|---------|
| 1 | 구글 ID가 이메일 자리에 표시 | `auth_service.py:175`, `models/user.py` | `User` 모델에 email 컬럼 없어 refresh 시 subject ID 반환 | 높음 |
| 2 | 모바일에서 태그 설정 불가 | `EditTagsDialog.tsx:62`, `SaveLinkModal.tsx:124` | 저장 시 `inputValue`를 무시하고 `tags` 배열만 저장 | 중간 |
| 3 | 클립보드 붙여넣기 시 키보드 팝업 | `SaveLinkModal.tsx:140` | URL 자동입력과 `onEntered` 포커스가 동시에 동작 | 낮음 |
