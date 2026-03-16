"use client";

import { useEffect, useMemo, useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import type { ArticleCard } from "../../home-types";

type Props = {
  open: boolean;
  card: ArticleCard;
  categories: string[];
  isBusy: boolean;
  onClose: () => void;
  onSave: (category: string | null) => void;
};

export function CategoryEditDialog({ open, card, categories, isBusy, onClose, onSave }: Props) {
  const [categoryInput, setCategoryInput] = useState(card.category ?? "");

  useEffect(() => {
    if (open) {
      setCategoryInput(card.category ?? "");
    }
  }, [open, card.category]);

  const availableCategories = useMemo(
    () => categories.filter((c) => c.trim().length > 0),
    [categories]
  );

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
          freeSolo
          options={availableCategories}
          value={categoryInput}
          inputValue={categoryInput}
          onChange={(_, value) => setCategoryInput((value ?? "").trim())}
          onInputChange={(_, value) => setCategoryInput(value)}
          ListboxProps={{ sx: { maxHeight: 220, overflowY: "auto" } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="카테고리"
              placeholder="카테고리를 선택하거나 직접 입력"
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
          onClick={() => {
            const next = categoryInput.trim();
            onSave(next.length > 0 ? next : null);
          }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}
