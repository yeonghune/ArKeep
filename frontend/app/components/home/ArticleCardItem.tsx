import { useMemo, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { formatRelativeTime, getCategoryColor, getCategoryLabel } from "../../home-data";
import type { ArticleCard } from "../../home-types";
import { ArticleMedia } from "./ArticleMedia";
import { CardSource } from "./CardSource";

type Props = {
  card: ArticleCard;
  categories: string[];
  isBusy?: boolean;
  onDelete: (card: ArticleCard) => Promise<void>;
  onUpdateCategory: (card: ArticleCard, category: string | null) => Promise<void>;
  onClick: () => void;
};

export function ArticleCardItem({ card, categories, isBusy = false, onDelete, onUpdateCategory, onClick }: Props) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryInput, setCategoryInput] = useState(card.category ?? "");
  const isRead = card.isRead;
  const statusLabel = isRead ? "읽음" : "읽지 않음";
  const categoryLabel = getCategoryLabel(card.category);
  const categoryColor = getCategoryColor(card.category);
  const timeAgo = formatRelativeTime(card.createdAt);
  const isMenuOpen = Boolean(menuAnchorEl);
  const availableCategories = useMemo(() => categories.filter((category) => category.trim().length > 0), [categories]);

  const closeMenu = () => setMenuAnchorEl(null);

  function openCategoryDialog() {
    setCategoryInput(card.category ?? "");
    setIsCategoryDialogOpen(true);
    closeMenu();
  }

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        }}
        sx={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid #e2e8f0",
          borderRadius: 3,
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
          opacity: isRead ? 0.8 : 1,
          cursor: "pointer",
          transition: "transform 160ms ease, box-shadow 160ms ease",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)"
          }
        }}
      >
        <Box sx={{ position: "relative" }}>
          <ArticleMedia card={card} />
          <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.45), transparent)" }} />
          <Chip
            size="small"
            label={statusLabel}
            sx={{
              position: "absolute",
              left: 12,
              top: 12,
              color: "white",
              fontWeight: 700,
              bgcolor: isRead ? "#475569" : "#2563eb"
            }}
          />
        </Box>

        <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: categoryColor }}>{categoryLabel}</Typography>
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>{timeAgo}</Typography>
          </Stack>

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              lineHeight: 1.35,
              mb: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              overflowWrap: "anywhere",
              wordBreak: "break-word"
            }}
          >
            {card.title}
          </Typography>

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              mt: "auto",
              pt: 1.5,
              borderTop: "none !important",
              boxShadow: "none !important",
              "&::before, &::after": {
                display: "none !important"
              }
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
              <CardSource card={card} />
              <Typography noWrap sx={{ fontSize: 12, color: "#64748b" }}>
                {card.domain}
              </Typography>
            </Stack>
            <IconButton
              size="small"
              disabled={isBusy}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMenuAnchorEl(event.currentTarget);
              }}
            >
              <MoreHorizIcon fontSize="small" />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={closeMenu}
        onClick={(event) => event.stopPropagation()}
      >
        <MenuItem onClick={openCategoryDialog}>
          <ListItemIcon>
            <DriveFileRenameOutlineIcon fontSize="small" />
          </ListItemIcon>
          카테고리 수정
        </MenuItem>
        <MenuItem
          disabled={isBusy}
          sx={{ color: "error.main" }}
          onClick={() => {
            closeMenu();
            void onDelete(card);
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon fontSize="small" color="error" />
          </ListItemIcon>
          삭제
        </MenuItem>
      </Menu>

      <Dialog
        open={isCategoryDialogOpen}
        onClose={() => {
          if (!isBusy) {
            setIsCategoryDialogOpen(false);
          }
        }}
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
            ListboxProps={{
              sx: {
                maxHeight: 220,
                overflowY: "auto"
              }
            }}
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
          <Button
            color="inherit"
            disabled={isBusy}
            onClick={() => {
              setIsCategoryDialogOpen(false);
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            disabled={isBusy}
            onClick={() => {
              const nextCategory = categoryInput.trim();
              void (async () => {
                try {
                  await onUpdateCategory(card, nextCategory.length > 0 ? nextCategory : null);
                  setIsCategoryDialogOpen(false);
                } catch {
                  // Errors are surfaced by parent list error UI.
                }
              })();
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
