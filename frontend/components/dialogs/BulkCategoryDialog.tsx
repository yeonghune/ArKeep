"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import type { Category } from "@/lib/categories";
import { CategoryInputField } from "./CategoryInputField";

type Props = {
  open: boolean;
  categories: Category[];
  selectedCount: number;
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

export function BulkCategoryDialog({ open, categories, selectedCount, onClose, onSave, onAddCategory }: Props) {
  const [categoryValue, setCategoryValue] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCategoryValue(null);
      setCategoryError(null);
      setIsSubmitting(false);
    }
  }, [open]);

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
      onClose={() => { if (!isSubmitting) onClose(); }}
      maxWidth="xs"
      fullWidth
    >
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); void handleSave(); }}
      >
        <DialogTitle>카테고리 일괄 수정</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 1, color: "text.secondary", fontSize: "0.875rem" }}>
            {selectedCount}개 아티클의 카테고리를 변경합니다.
          </Typography>
          <CategoryInputField
            value={categoryValue}
            onChange={(v) => { setCategoryValue(v); setCategoryError(null); }}
            options={categories.map((c) => c.name)}
            disabled={isSubmitting}
            error={categoryError}
            label="카테고리"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" disabled={isSubmitting} onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "저장"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
