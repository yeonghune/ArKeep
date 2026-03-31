import { useEffect, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { Category } from "@/lib/categories";
import { CategoryInputField } from "./CategoryInputField";
import { TagInputField } from "./TagInputField";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  isLoggedIn: boolean;
  onSave: (url: string, category?: string | null, description?: string | null, tags?: string[]) => Promise<void>;
  onAddCategory: (name: string) => Promise<Category>;
};

const URL_PATTERN = /^https?:\/\/.+/i;
const CATEGORY_MAX_LENGTH = 10;
const CATEGORY_ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$/;
const CATEGORY_RESERVED = new Set(["모든 카테고리"]);
const MAX_TAGS = 5;
const MAX_TAG_LEN = 20;
const TAG_ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]+$/;

function normalizeTags(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    const v = String(t ?? "").trim().replace(/^#+/, "");
    if (!v) continue;
    if (v.length > MAX_TAG_LEN) continue;
    if (!TAG_ALLOWED.test(v)) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

function validateCategory(name: string): string | null {
  const trimmed = name.replace(/ {2,}/g, " ").trim();
  if (!trimmed) return null;
  if (CATEGORY_RESERVED.has(trimmed)) return `"${trimmed}"는 사용할 수 없습니다.`;
  if (trimmed.length > CATEGORY_MAX_LENGTH) return `카테고리 이름은 ${CATEGORY_MAX_LENGTH}자를 초과할 수 없습니다.`;
  if (!CATEGORY_ALLOWED.test(trimmed)) return "카테고리 이름은 한글, 영어, 숫자, 띄어쓰기만 사용할 수 있습니다.";
  return null;
}

export function SaveLinkModal({ open, onClose, categories, isLoggedIn, onSave, onAddCategory }: Props) {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [categoryValue, setCategoryValue] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [tagError, setTagError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl("");
      setCategoryValue(null);
      setMemo("");
      setTags([]);
      setTagInput("");
      setError(null);
      setCategoryError(null);
      setTagError(null);
      setIsSubmitting(false);
      return;
    }

    (async () => {
      try {
        await navigator.permissions.query({ name: "clipboard-read" as PermissionName });
        const text = await navigator.clipboard.readText();
        const trimmed = text.trim();
        if (URL_PATTERN.test(trimmed)) {
          setUrl(trimmed);
        }
      } catch {
        // 권한 거부 또는 미지원 브라우저
      }
    })();
  }, [open]);

  async function handleSave() {
    const normalizedUrl = url.trim();
    if (!URL_PATTERN.test(normalizedUrl)) {
      setError("URL은 http:// 또는 https:// 로 시작해야 합니다.");
      return;
    }

    const rawCategory = categoryValue?.trim().replace(/ {2,}/g, " ") ?? "";
    const normalizedCategory = rawCategory.length > 0 ? rawCategory : null;
    const normalizedMemo = memo.trim().length > 0 ? memo.trim() : null;

    const catValidationError = normalizedCategory ? validateCategory(normalizedCategory) : null;
    if (catValidationError) {
      setCategoryError(catValidationError);
      return;
    }

    if (tagInput.trim()) {
      const v = tagInput.trim().replace(/^#+/, "");
      if (!TAG_ALLOWED.test(v)) {
        setTagError("태그는 한글, 영어, 숫자만 입력할 수 있습니다.");
        return;
      }
      if (v.length > MAX_TAG_LEN) {
        setTagError(`태그는 ${MAX_TAG_LEN}자를 초과할 수 없습니다.`);
        return;
      }
      if (tags.includes(v)) {
        setTagError("이미 추가된 태그입니다.");
        return;
      }
    }

    setError(null);
    setCategoryError(null);
    setTagError(null);
    setIsSubmitting(true);
    try {
      if (normalizedCategory && !categories.some((c) => c.name === normalizedCategory)) {
        await onAddCategory(normalizedCategory);
      }
      const finalTags = tagInput.trim()
        ? normalizeTags([...tags, tagInput])
        : normalizeTags(tags);
      await onSave(normalizedUrl, normalizedCategory, normalizedMemo, finalTags);
      onClose();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "아티클 저장에 실패했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      TransitionProps={{
        onEntered: () => {
          const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
          if (!isMobile) {
            urlInputRef.current?.focus();
          }
        }
      }}
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); void handleSave(); }}
        sx={{ p: { xs: 2, sm: 3 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>아티클 저장</Typography>
            <Typography sx={{ mt: 0.5, color: "#94a3b8", fontSize: 15 }}>저장할 아티클 URL을 붙여넣어 주세요.</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="아티클 저장 모달 닫기">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>URL 주소</Typography>
        <TextField
          fullWidth
          inputRef={urlInputRef}
          value={url}
          onChange={(e) => { setUrl(e.target.value); if (error) setError(null); }}
          placeholder="https://example.com/article"
          error={Boolean(error)}
          helperText={error ?? (isSubmitting ? "URL 정보를 가져오는 중..." : " ")}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon sx={{ color: "#2563eb", fontSize: 18 }} />
              </InputAdornment>
            ),
            endAdornment: url ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setUrl("")} aria-label="URL 지우기" edge="end">
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{ mb: 2 }}
        />

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>태그 (선택)</Typography>
        <Box sx={{ mb: 2 }}>
          <TagInputField
            tags={tags}
            inputValue={tagInput}
            error={tagError}
            onTagsChange={setTags}
            onInputChange={setTagInput}
            onError={setTagError}
          />
        </Box>

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>카테고리 (선택)</Typography>
        <CategoryInputField
          value={categoryValue}
          onChange={(v) => { setCategoryValue(v); setCategoryError(null); }}
          options={categories.map((c) => c.name)}
          disabled={!isLoggedIn}
          error={categoryError}
          placeholder={isLoggedIn ? "선택 또는 새 카테고리 입력" : "게스트 모드는 카테고리를 설정할 수 없습니다."}
          sx={{ mb: 2 }}
        />

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>메모 (선택)</Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이 링크에 대한 메모를 남겨보세요."
          sx={{ mb: 2 }}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose} color="inherit" sx={{ px: 2.5, fontWeight: 700 }} disabled={isSubmitting}>
            취소
          </Button>
          <Button type="submit" variant="contained" sx={{ px: 2.5, fontWeight: 700 }} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
