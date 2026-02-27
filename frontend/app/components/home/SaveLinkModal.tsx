import { useEffect, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import LinkIcon from "@mui/icons-material/Link";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: string[];
  onSave: (url: string, category?: string | null, description?: string | null) => Promise<void>;
};

const URL_PATTERN = /^https?:\/\/.+/i;

export function SaveLinkModal({ open, onClose, categories, onSave }: Props) {
  const [url, setUrl] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryValue, setCategoryValue] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setUrl("");
      setCategoryInput("");
      setCategoryValue(null);
      setMemo("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  async function handleSave() {
    const normalizedUrl = url.trim();
    if (!URL_PATTERN.test(normalizedUrl)) {
      setError("URL은 http:// 또는 https:// 로 시작해야 합니다.");
      return;
    }

    const rawCategory = (categoryValue ?? categoryInput).trim();
    const normalizedCategory = rawCategory.length > 0 ? rawCategory : null;
    const normalizedMemo = memo.trim().length > 0 ? memo.trim() : null;

    setError(null);
    setIsSubmitting(true);
    try {
      await onSave(normalizedUrl, normalizedCategory, normalizedMemo);
      onClose();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "링크 저장에 실패했습니다.";
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
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden"
        }
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}>링크 저장</Typography>
            <Typography sx={{ mt: 0.5, color: "#94a3b8", fontSize: 15 }}>저장할 아티클 URL을 붙여넣어 주세요.</Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="링크 저장 모달 닫기">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>URL 주소</Typography>
        <TextField
          fullWidth
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com/article"
          error={Boolean(error)}
          helperText={error ?? " "}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LinkIcon sx={{ color: "#2563eb", fontSize: 18 }} />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>카테고리 (선택)</Typography>
        <Autocomplete
          freeSolo
          options={categories}
          value={categoryValue}
          inputValue={categoryInput}
          onChange={(_, nextValue) => {
            setCategoryValue(nextValue);
            if (typeof nextValue === "string") {
              setCategoryInput(nextValue);
            }
          }}
          onInputChange={(_, nextInputValue) => {
            setCategoryInput(nextInputValue);
          }}
          renderInput={(params) => <TextField {...params} placeholder="카테고리를 선택하거나 직접 입력" />}
          sx={{ mb: 2 }}
        />

        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>메모 (선택)</Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="이 링크에 대한 메모를 남겨보세요."
          sx={{ mb: 2 }}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button onClick={onClose} color="inherit" sx={{ px: 2.5, fontWeight: 700 }} disabled={isSubmitting}>
            취소
          </Button>
          <Button variant="contained" sx={{ px: 2.5, fontWeight: 700 }} onClick={() => void handleSave()} disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
