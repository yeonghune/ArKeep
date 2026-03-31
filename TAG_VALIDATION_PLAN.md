# 태그 입력 검증 개선 계획

> 작성일: 2026-03-31

---

## 요구사항 정리

- 태그는 **한글 · 영어 · 숫자**만 허용 (특수문자, 공백, 이모지 불가)
- 허용 문자셋: `[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]`
  - 숫자 포함 이유: `React18`, `CSS3`, `ES2024` 같은 실용적 태그를 위해 포함 권장
- 특수문자 입력 시 → UI 에러 메시지 즉시 표시
- 중복 태그 추가 시도 시 → "이미 추가된 태그입니다." 에러 표시 (현재: 조용히 무시)

---

## 현재 상태 (문제점)

### Frontend — `TagInputField.tsx`

| 문제 | 위치 | 현상 |
|------|------|------|
| 특수문자 허용 | `addTag()` | `replace(/^#+/, "")` 이후 문자 검증 없음 |
| 중복 태그 무시 | `addTag()` line 36-39 | `onInputChange("")` 호출 후 에러 없이 return |
| onChange 미검증 | onChange handler | 타이핑 중 실시간 문자 검증 없음 |
| normalizeTags 미검증 | `EditTagsDialog`, `SaveLinkModal` | flush 시 특수문자 태그가 그대로 통과 |
| 플레이스홀더 | `TagInputField` | `"예) Next.js, Docker"` → `.`이 특수문자이므로 오해 유발 |

### Backend — `article.py`

| 문제 | 위치 | 현상 |
|------|------|------|
| 문자 검증 없음 | `validate_tags()` | 개수(5개)·길이(20자)만 체크, 특수문자 통과 |
| 중복 체크 없음 | `validate_tags()` | `["react", "react"]` 그대로 DB에 저장됨 |

### DB — articles.tags 컬럼

| 문제 | 현상 |
|------|------|
| 문자 제약 없음 | `ARRAY(String(20))` — 앱 레이어 우회 시 특수문자 저장 가능 |
| 중복 제약 없음 | DB 레벨에서 배열 내 중복값 허용 |

---

## 수정 계획

### 1. Frontend — `TagInputField.tsx`

#### 1-1. 허용 문자 정규식 상수 추가

```typescript
const TAG_ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/;
```

#### 1-2. `addTag()` — 특수문자 + 중복 에러 메시지 추가

```typescript
// 현재
if (tags.includes(v)) {
  onInputChange("");   // ← 조용히 무시
  return;
}

// 수정
if (!TAG_ALLOWED.test(v)) {
  onError("태그는 한글, 영어, 숫자만 입력할 수 있습니다.");
  return;
}
if (tags.includes(v)) {
  onError("이미 추가된 태그입니다.");  // ← 명시적 피드백
  return;
}
```

#### 1-3. `onChange` — 타이핑 중 실시간 특수문자 감지

```typescript
// 현재
onChange={(e) => {
  onInputChange(e.target.value);
  if (e.target.value.length <= MAX_TAG_LEN) onError(null);
}}

// 수정
onChange={(e) => {
  const v = e.target.value;
  onInputChange(v);
  const normalized = v.trim().replace(/^#+/, "");
  if (normalized && !TAG_ALLOWED.test(normalized)) {
    onError("태그는 한글, 영어, 숫자만 입력할 수 있습니다.");
  } else if (v.length > MAX_TAG_LEN) {
    onError(`태그는 ${MAX_TAG_LEN}자를 초과할 수 없습니다.`);
  } else {
    onError(null);
  }
}}
```

#### 1-4. `+` 버튼 — 유효하지 않은 입력 시 시각적 비활성화

```typescript
// 현재: isOverLen 일 때만 red
const isInvalidInput =
  isOverLen ||
  Boolean(inputValue.trim() && !TAG_ALLOWED.test(inputValue.trim().replace(/^#+/, "")));

// + 버튼 color/bgcolor를 isInvalidInput 기준으로 변경 (기존 isOverLen 대신)
const accentColor = isInvalidInput
  ? theme.palette.error.main
  : theme.palette.primary.main;
```

#### 1-5. `normalizeTags` (EditTagsDialog, SaveLinkModal) — 특수문자 태그 필터

```typescript
// 현재
if (v.length > MAX_TAG_LEN) continue;

// 수정: 길이 체크 다음에 문자 검증 추가
if (v.length > MAX_TAG_LEN) continue;
if (!TAG_ALLOWED.test(v)) continue;   // ← 추가
```

#### 1-6. 플레이스홀더 수정

```typescript
// 현재
placeholder={tags.length === 0 ? "예) Next.js, Docker" : ""}

// 수정 (특수문자가 포함된 예시 제거)
placeholder={tags.length === 0 ? "예) React, 자바스크립트, CSS3" : ""}
```

---

### 2. Backend — `backend/app/schemas/article.py`

#### 2-1. `CreateArticleRequest.validate_tags` — 문자 검증 + 중복 검증

```python
import re

TAG_ALLOWED = re.compile(r'^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$')

@field_validator("tags")
@classmethod
def validate_tags(cls, v: Optional[list[str]]) -> Optional[list[str]]:
    if v is None:
        return v
    if len(v) > 5:
        raise ValueError("Tags must be at most 5")
    seen = set()
    for tag in v:
        stripped = tag.strip()
        if len(stripped) > 20:
            raise ValueError("Each tag must be at most 20 characters")
        if not TAG_ALLOWED.match(stripped):
            raise ValueError("Tags may only contain Korean, English letters, and numbers")
        if stripped in seen:
            raise ValueError(f"Duplicate tag: {stripped}")
        seen.add(stripped)
    return v
```

#### 2-2. `UpdateArticleTagsRequest.validate_tags` — 동일하게 적용

```python
@field_validator("tags")
@classmethod
def validate_tags(cls, v: list[str]) -> list[str]:
    if len(v) > 5:
        raise ValueError("Tags must be at most 5")
    seen = set()
    for tag in v:
        stripped = tag.strip()
        if len(stripped) > 20:
            raise ValueError("Each tag must be at most 20 characters")
        if not TAG_ALLOWED.match(stripped):
            raise ValueError("Tags may only contain Korean, English letters, and numbers")
        if stripped in seen:
            raise ValueError(f"Duplicate tag: {stripped}")
        seen.add(stripped)
    return v
```

> `TAG_ALLOWED` 정규식은 모듈 상단에 한 번만 선언하고 두 validator에서 공유.

---

### 3. DB — Alembic 마이그레이션 (선택, 낮은 우선순위)

PostgreSQL은 `ARRAY` 컬럼에 인라인 `CHECK` 제약을 바로 걸 수 없어서,
`CREATE FUNCTION` + `CHECK` 조합이 필요하다. 앱 레이어에서 이미 충분히 막고 있으므로 생략해도 무방하나, 직접 DB 접근(psql, 마이그레이션 스크립트 등)을 통한 우회를 막으려면 아래와 같이 추가한다.

```python
# 0009_add_tag_character_constraint.py

def upgrade() -> None:
    # 각 태그 원소의 문자셋 검증 함수
    op.execute("""
        CREATE OR REPLACE FUNCTION check_tags_allowed(tags text[])
        RETURNS boolean AS $$
        DECLARE
            tag text;
        BEGIN
            FOREACH tag IN ARRAY tags LOOP
                IF tag !~ '^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$' THEN
                    RETURN false;
                END IF;
                IF array_length(array_positions(tags, tag), 1) > 1 THEN
                    RETURN false;
                END IF;
            END LOOP;
            RETURN true;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
    """)
    op.execute("""
        ALTER TABLE articles
        ADD CONSTRAINT chk_tags_allowed CHECK (check_tags_allowed(tags));
    """)

def downgrade() -> None:
    op.execute("ALTER TABLE articles DROP CONSTRAINT IF EXISTS chk_tags_allowed;")
    op.execute("DROP FUNCTION IF EXISTS check_tags_allowed(text[]);")
```

> **주의**: 기존 DB에 특수문자가 포함된 태그가 있다면 `ALTER TABLE`이 실패한다.
> 마이그레이션 전 아래 쿼리로 위반 행을 확인해야 한다.
> ```sql
> SELECT id, tags FROM articles
> WHERE NOT check_tags_allowed(tags);
> ```

---

## 수정 파일 목록 요약

| 우선순위 | 레이어 | 파일 | 수정 내용 |
|---------|--------|------|-----------|
| 높음 | FE | `components/dialogs/TagInputField.tsx` | `TAG_ALLOWED` 추가, `addTag` 문자·중복 에러, `onChange` 실시간 검증, `+` 버튼 상태, 플레이스홀더 수정 |
| 높음 | FE | `components/dialogs/EditTagsDialog.tsx` | `normalizeTags`에 문자 필터 추가 |
| 높음 | FE | `components/dialogs/SaveLinkModal.tsx` | `normalizeTags`에 문자 필터 추가 |
| 높음 | BE | `app/schemas/article.py` | `validate_tags`에 `TAG_ALLOWED` 정규식 + 중복 검증 |
| 낮음 | DB | `alembic/versions/0009_...py` | PostgreSQL CHECK 제약 (함수 기반) |

---

## 에러 메시지 정의 (UI 표시 기준)

| 상황 | 메시지 | 표시 시점 |
|------|--------|-----------|
| 특수문자 포함 | "태그는 한글, 영어, 숫자만 입력할 수 있습니다." | 타이핑 중 실시간 + 추가 시도 시 |
| 20자 초과 | "태그는 20자를 초과할 수 없습니다." | 타이핑 중 실시간 + 추가 시도 시 |
| 중복 태그 | "이미 추가된 태그입니다." | 추가 시도 시 |
| 5개 초과 | "태그는 최대 5개까지 가능합니다." | 추가 시도 시 |

---

## UI 피드백 플로우 (TagInputField 기준)

```
사용자 타이핑
    │
    ├─ 특수문자 포함? → 에러 메시지 표시 + + 버튼 빨간색
    ├─ 20자 초과?     → 에러 메시지 표시 + + 버튼 빨간색 + n/20 빨간색
    └─ 정상           → 에러 클리어

Enter / 쉼표 / + 버튼
    │
    ├─ 빈 값?         → 무시
    ├─ 특수문자?      → "태그는 한글, 영어, 숫자만 입력할 수 있습니다."
    ├─ 20자 초과?     → "태그는 20자를 초과할 수 없습니다."
    ├─ 중복?          → "이미 추가된 태그입니다."
    ├─ 5개 초과?      → "태그는 최대 5개까지 가능합니다."
    └─ 정상           → 칩 추가, 입력 초기화, 에러 클리어
```
