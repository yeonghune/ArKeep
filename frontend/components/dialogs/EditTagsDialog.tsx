import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { TagInputField } from "./TagInputField";

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

type Props = {
  open: boolean;
  title: string;
  initialTags: string[];
  onClose: () => void;
  onSave: (tags: string[]) => Promise<void>;
};

export function EditTagsDialog({ open, title, initialTags, onClose, onSave }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTags(normalizeTags(initialTags ?? []));
    setInputValue("");
    setError(null);
    setIsSubmitting(false);
  }, [open, initialTags]);

  async function handleSubmit() {
    if (inputValue.trim()) {
      const v = inputValue.trim().replace(/^#+/, "");
      if (!TAG_ALLOWED.test(v)) {
        setError("태그는 한글, 영어, 숫자만 입력할 수 있습니다.");
        return;
      }
      if (v.length > MAX_TAG_LEN) {
        setError(`태그는 ${MAX_TAG_LEN}자를 초과할 수 없습니다.`);
        return;
      }
      if (tags.includes(v)) {
        setError("이미 추가된 태그입니다.");
        return;
      }
    }
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}
    >
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
        sx={{ p: { xs: 2, sm: 3 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
          <IconButton onClick={onClose} aria-label="태그 수정 모달 닫기">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>태그 (선택)</Typography>
        <TagInputField
          tags={tags}
          inputValue={inputValue}
          error={error}
          onTagsChange={setTags}
          onInputChange={setInputValue}
          onError={setError}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 2 }}>
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
