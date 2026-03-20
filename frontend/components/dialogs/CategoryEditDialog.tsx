"use client";

import { useEffect, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
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
  onSave: (category: string | null) => void;
};

export function CategoryEditDialog({ open, card, categories, isBusy, onClose, onSave }: Props) {
  const [categoryValue, setCategoryValue] = useState<string | null>(card.category ?? null);

  useEffect(() => {
    if (open) {
      setCategoryValue(card.category ?? null);
    }
  }, [open, card.category]);

  return (
    <Dialog
      open={open}
      onClose={() => { if (!isBusy) onClose(); }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>카테고리 수정</DialogTitle>
      <DialogContent>
        <Autocomplete
          options={categories.map((c) => c.name)}
          value={categoryValue}
          onChange={(_, value) => setCategoryValue(value)}
          noOptionsText="카테고리가 없습니다. 사이드바에서 먼저 추가해주세요."
          ListboxProps={{ sx: { maxHeight: 220, overflowY: "auto" } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="카테고리"
              placeholder="카테고리 선택"
              fullWidth
              sx={{ mt: 1 }}
            />
          )}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" disabled={isBusy} onClick={onClose}>
          취소
        </Button>
        <Button
          variant="contained"
          disabled={isBusy}
          onClick={() => onSave(categoryValue ?? null)}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
