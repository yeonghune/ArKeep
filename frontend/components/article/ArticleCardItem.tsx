import { memo, useMemo, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { formatRelativeTime, getCategoryColor, getCategoryLabel } from "@/lib/utils";
import type { Category } from "@/lib/categories";
import type { ArticleCard } from "@/types";
import { ArticleMedia } from "./ArticleMedia";
import { CardSource } from "./CardSource";
import { CategoryEditDialog } from "@/components/dialogs/CategoryEditDialog";

type Props = {
  card: ArticleCard;
  categories: Category[];
  isLoggedIn: boolean;
  isBusy?: boolean;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  onDelete: (card: ArticleCard) => Promise<void>;
  onToggleRead: (card: ArticleCard) => Promise<void>;
  onUpdateCategory: (card: ArticleCard, category: string | null) => Promise<void>;
  onAddCategory: (name: string) => Promise<Category>;
  onClick: () => void;
};

export const ArticleCardItem = memo(function ArticleCardItem({ card, categories, isLoggedIn, isBusy = false, isBulkMode = false, isSelected = false, onSelect, onDelete, onToggleRead, onUpdateCategory, onAddCategory, onClick }: Props) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isRead = card.isRead;
  const statusLabel = isRead ? "열람" : "미열람";
  const categoryLabel = getCategoryLabel(card.category);
  const categoryColor = getCategoryColor(card.category);
  const timeAgo = formatRelativeTime(card.createdAt);
  const isMenuOpen = Boolean(menuAnchorEl);
  const availableCategories = categories;

  const closeMenu = () => setMenuAnchorEl(null);

  function openCategoryDialog() {
    setIsCategoryDialogOpen(true);
    closeMenu();
  }

  const handleCardClick = () => {
    if (isBulkMode) {
      onSelect?.(card.id);
    } else {
      onClick();
    }
  };

  const showCheckbox = isHovered || isBulkMode || isSelected;

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick();
          }
        }}
        sx={{
          display: "flex",
          flexDirection: "column",
          border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
          borderRadius: "4px",
          boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
          overflow: "hidden",
          opacity: isRead ? 0.8 : 1,
          cursor: "pointer",
          transition: "transform 160ms ease, box-shadow 160ms ease, border-color 120ms ease",
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
          {/* 벌크 체크박스 */}
          <Checkbox
            checked={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(card.id);
            }}
            size="small"
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              color: "white",
              opacity: showCheckbox ? 1 : 0,
              transition: "opacity 140ms ease",
              bgcolor: "rgba(0,0,0,0.25)",
              borderRadius: "4px",
              p: 0.5,
              "&.Mui-checked": { color: "#2563eb", bgcolor: "white" },
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
        PaperProps={{ elevation: 0, sx: { boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", borderRadius: 1.5 } }}
        MenuListProps={{ dense: true }}
      >
        <MenuItem
          disabled={isBusy}
          sx={{ fontSize: 13 }}
          onClick={() => {
            closeMenu();
            void onToggleRead(card);
          }}
        >
          <ListItemIcon>
            {card.isRead
              ? <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
              : <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
            }
          </ListItemIcon>
          {card.isRead ? "미열람으로 표시" : "열람으로 표시"}
        </MenuItem>
        {isLoggedIn && (
          <MenuItem disabled={isBusy} onClick={openCategoryDialog} sx={{ fontSize: 13 }}>
            <ListItemIcon>
              <DriveFileRenameOutlineIcon sx={{ fontSize: 16 }} />
            </ListItemIcon>
            카테고리 수정
          </MenuItem>
        )}
        <MenuItem
          sx={{ fontSize: 13 }}
          onClick={() => {
            void navigator.clipboard.writeText(card.url);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          URL 복사
        </MenuItem>
        <MenuItem
          disabled={isBusy}
          sx={{ color: "error.main", fontSize: 13 }}
          onClick={() => {
            closeMenu();
            void onDelete(card);
          }}
        >
          <ListItemIcon>
            <DeleteOutlineIcon sx={{ fontSize: 16 }} color="error" />
          </ListItemIcon>
          삭제
        </MenuItem>
      </Menu>

      <CategoryEditDialog
        open={isCategoryDialogOpen}
        card={card}
        categories={availableCategories}
        isBusy={isBusy}
        onClose={() => setIsCategoryDialogOpen(false)}
        onAddCategory={onAddCategory}
        onSave={async (category) => {
          try {
            await onUpdateCategory(card, category);
            setIsCategoryDialogOpen(false);
          } catch {
            // Errors are surfaced by parent list error UI.
          }
        }}
      />
    </>
  );
});
