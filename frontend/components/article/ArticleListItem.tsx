import { memo, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatRelativeTime, getCategoryColor, getCategoryLabel } from "@/lib/utils";
import type { Category } from "@/lib/categories";
import type { ArticleCard } from "@/types";
import { CardSource } from "./CardSource";
import { CategoryEditDialog } from "@/components/dialogs/CategoryEditDialog";

const PLACEHOLDER_SRC = "/thumbnail-placeholder.svg";

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

export const ArticleListItem = memo(function ArticleListItem({ card, categories, isLoggedIn, isBusy = false, isBulkMode = false, isSelected = false, onSelect, onDelete, onToggleRead, onUpdateCategory, onAddCategory, onClick }: Props) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(card.thumbnailUrl ?? PLACEHOLDER_SRC);
  const [isHovered, setIsHovered] = useState(false);
  const isRead = card.isRead;
  const categoryLabel = getCategoryLabel(card.category);
  const categoryColor = getCategoryColor(card.category);
  const timeAgo = formatRelativeTime(card.createdAt);
  const isMenuOpen = Boolean(menuAnchorEl);
  const availableCategories = categories;

  const closeMenu = () => setMenuAnchorEl(null);

  const handleRowClick = () => {
    if (isBulkMode) {
      onSelect?.(card.id);
    } else {
      onClick();
    }
  };

  const showCheckbox = isHovered || isBulkMode || isSelected;

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        role="button"
        tabIndex={0}
        onClick={handleRowClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleRowClick();
          }
        }}
        sx={{
          px: 2,
          py: 1.5,
          cursor: "pointer",
          opacity: isRead ? 0.7 : 1,
          bgcolor: isSelected ? "rgba(37,99,235,0.06)" : "transparent",
          borderBottom: "1px solid #e2e8f0",
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
          "&:last-child": { borderBottom: "none" },
          "&:hover": { bgcolor: isSelected ? "rgba(37,99,235,0.1)" : "rgba(0,0,0,0.02)" },
          transition: "background-color 120ms ease"
        }}
      >
        {/* 벌크 체크박스 (썸네일 왼쪽) */}
        <Box
          sx={{
            width: 24,
            flexShrink: 0,
            opacity: showCheckbox ? 1 : 0,
            transition: "opacity 140ms ease",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onChange={() => onSelect?.(card.id)}
            size="small"
            sx={{ p: 0 }}
          />
        </Box>

        {/* 썸네일 */}
        <Box
          component="img"
          src={imgSrc}
          alt={card.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== PLACEHOLDER_SRC) setImgSrc(PLACEHOLDER_SRC);
          }}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            objectFit: "cover",
            flexShrink: 0,
            bgcolor: "#f1f5f9"
          }}
        />

        {/* 텍스트 */}
        <Box sx={{ flex: 1, minWidth: 0, width: 0, overflow: "hidden" }}>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              lineHeight: 1.4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {card.title}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25, overflow: "hidden" }}>
            <CardSource card={card} />
            <Typography noWrap sx={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis" }}>{card.domain}</Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: categoryColor, fontWeight: 600, flexShrink: 0 }}>{categoryLabel}</Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{timeAgo}</Typography>
          </Stack>
        </Box>

        {/* 읽음 dot */}
        <Tooltip title={isRead ? "열람" : "미열람"}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              bgcolor: isRead ? "#cbd5e1" : "#2563eb"
            }}
          />
        </Tooltip>

        {/* 3점 메뉴 */}
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
          <MenuItem disabled={isBusy} onClick={() => { setIsCategoryDialogOpen(true); closeMenu(); }} sx={{ fontSize: 13 }}>
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
