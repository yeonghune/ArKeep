"use client";

import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import type { Category } from "@/lib/categories";
import type { ArticleCard } from "@/types";

type Props = {
  open: boolean;
  card: ArticleCard;
  categories: Category[];
  isBusy: boolean;
  onClose: () => void;
  onSave: (category: string | null) => Promise<void>;
  onAddCategory: (name: string) => Promise<Category>;
};

const CATEGORY_MAX_LENGTH = 10;
const CATEGORY_ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]+$/;
const CATEGORY_RESERVED = new Set(["모든 카테고리"]);

function validateCategory(name: string): string | null {
  const trimmed = name.replace(/ {2,}/g, " ").trim();
  if (!trimmed) return null;
  if (CATEGORY_RESERVED.has(trimmed)) return `"${trimmed}"는 사용할 수 없습니다.`;
  if (trimmed.length > CATEGORY_MAX_LENGTH) return `카테고리 이름은 ${CATEGORY_MAX_LENGTH}자를 초과할 수 없습니다.`;
  if (!CATEGORY_ALLOWED.test(trimmed)) return "카테고리 이름은 한글, 영어, 숫자, 띄어쓰기만 사용할 수 있습니다.";
  return null;
}

export function CategoryEditDialog({ open, card, categories, isBusy, onClose, onSave, onAddCategory }: Props) {
  const [categoryValue, setCategoryValue] = useState<string | null>(card.category ?? null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = isBusy || isSubmitting;

  useEffect(() => {
    if (open) {
      setCategoryValue(card.category ?? null);
      setCategoryError(null);
      setIsSubmitting(false);
    }
  }, [open, card.category]);

  async function handleSave() {
    const raw = categoryValue?.trim().replace(/ {2,}/g, " ") ?? "";
    const normalized = raw.length > 0 ? raw : null;

    if (!normalized) {
      setCategoryError("카테고리를 선택하거나 입력해주세요.");
      return;
    }

    const validationError = validateCategory(normalized);
    if (validationError) {
      setCategoryError(validationError);
      return;
    }

    setCategoryError(null);
    setIsSubmitting(true);
    try {
      if (normalized && !categories.some((c) => c.name === normalized)) {
        await onAddCategory(normalized);
      }
      await onSave(normalized);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => { if (!isDisabled) onClose(); }}
      maxWidth="xs"
      fullWidth
    >
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); void handleSave(); }}
      >
        <DialogTitle>카테고리 수정</DialogTitle>
        <DialogContent>
          <Autocomplete
            freeSolo
            options={categories.map((c) => c.name)}
            value={categoryValue ?? ""}
            onChange={(_, value) => {
              setCategoryValue(value || null);
              setCategoryError(null);
            }}
            onInputChange={(_, newValue, reason) => {
              if (reason === "input") {
                setCategoryValue(newValue || null);
                setCategoryError(null);
              }
            }}
            noOptionsText="직접 입력하여 새 카테고리를 만들 수 있습니다."
            ListboxProps={{ sx: { maxHeight: 220, overflowY: "auto" } }}
            disabled={isDisabled}
            renderInput={(params) => (
              <TextField
                {...params}
                label="카테고리"
                placeholder="선택 또는 새 이름 입력"
                fullWidth
                error={Boolean(categoryError)}
                helperText={categoryError ?? ` ${(categoryValue ?? "").length > 0 ? `${(categoryValue ?? "").trim().length}/${CATEGORY_MAX_LENGTH}` : ""}`}
                slotProps={{ htmlInput: { ...params.inputProps, maxLength: CATEGORY_MAX_LENGTH } }}
                sx={{ mt: 1 }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={isDisabled} onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="contained" disabled={isDisabled}>
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
