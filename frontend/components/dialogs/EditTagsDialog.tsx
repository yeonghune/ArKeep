import { useEffect, useMemo, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  title: string;
  initialTags: string[];
  onClose: () => void;
  onSave: (tags: string[]) => Promise<void>;
};

const MAX_TAGS = 5;
const MAX_TAG_LEN = 20;

function normalizeTags(raw: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    const v = String(t ?? "").trim().replace(/\s+/g, " ").replace(/^#+/, "");
    if (!v) continue;
    if (v.length > MAX_TAG_LEN) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

export function EditTagsDialog({ open, title, initialTags, onClose, onSave }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const helperText = useMemo(() => {
    if (error) return error;
    return `최대 ${MAX_TAGS}개 · 태그당 ${MAX_TAG_LEN}자`;
  }, [error]);

  useEffect(() => {
    if (!open) return;
    setTags(normalizeTags(initialTags ?? []));
    setInputValue("");
    setError(null);
    setIsSubmitting(false);
  }, [open, initialTags]);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await onSave(normalizeTags(tags));
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
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
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
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
            <Typography sx={{ mt: 0.5, color: "#94a3b8", fontSize: 13 }}>
              Enter 또는 콤마(,)로 태그를 추가할 수 있어요.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="태그 수정 모달 닫기">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>태그 (선택)</Typography>
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={tags}
          inputValue={inputValue}
          onInputChange={(_, v) => setInputValue(v)}
          onChange={(_, nextValue) => {
            const normalized = normalizeTags(nextValue as string[]);
            if ((nextValue as string[]).length > MAX_TAGS) setError(`태그는 최대 ${MAX_TAGS}개까지 가능합니다.`);
            else setError(null);
            setTags(normalized);
          }}
          renderTags={(value, getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip
                variant="outlined"
                size="small"
                label={`#${option}`}
                {...getTagProps({ index })}
                key={`${option}-${index}`}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={tags.length >= MAX_TAGS ? `최대 ${MAX_TAGS}개까지` : "예) Next.js, Docker"}
              error={Boolean(error)}
              helperText={helperText}
              onKeyDown={(e) => {
                if (e.key === "," && inputValue.trim().length > 0) {
                  e.preventDefault();
                  const merged = normalizeTags([...tags, inputValue]);
                  if (merged.length >= MAX_TAGS && normalizeTags([...tags, inputValue]).length === tags.length) return;
                  setTags(merged);
                  setInputValue("");
                }
              }}
            />
          )}
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

