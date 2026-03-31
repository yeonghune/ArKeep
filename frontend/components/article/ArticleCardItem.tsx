import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
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
import { EditTagsDialog } from "@/components/dialogs/EditTagsDialog";

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
  onUpdateTags: (card: ArticleCard, tags: string[]) => Promise<void>;
  onAddCategory: (name: string) => Promise<Category>;
  onClick: () => void;
};

export const ArticleCardItem = memo(function ArticleCardItem({ card, categories, isLoggedIn, isBusy = false, isBulkMode = false, isSelected = false, onSelect, onDelete, onToggleRead, onUpdateCategory, onUpdateTags, onAddCategory, onClick }: Props) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const tagContainerRef = useRef<HTMLDivElement | null>(null);
  const tagMeasureRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const moreMeasureRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isRead = card.isRead;
  const statusLabel = isRead ? "열람" : "미열람";
  const categoryLabel = getCategoryLabel(card.category);
  const categoryColor = getCategoryColor(card.category);
  const timeAgo = formatRelativeTime(card.createdAt);
  const isMenuOpen = Boolean(menuAnchorEl);
  const availableCategories = categories;

  const closeMenu = () => setMenuAnchorEl(null);
  const tags = card.tags ?? [];
  const hiddenTagCount = Math.max(0, tags.length - visibleTagCount);

  useLayoutEffect(() => {
    if (tags.length === 0) {
      setVisibleTagCount(0);
      return;
    }

    const gapPx = 6; // spacing={0.75}
    const calculate = () => {
      const containerWidth = tagContainerRef.current?.clientWidth ?? 0;
      if (containerWidth <= 0) return;

      const tagWidths = tags.map((_, index) => tagMeasureRefs.current[index]?.offsetWidth ?? 0);
      if (tagWidths.some((w) => w <= 0)) return;

      const prefixSums: number[] = [0];
      for (let i = 0; i < tagWidths.length; i += 1) {
        prefixSums[i + 1] = prefixSums[i] + tagWidths[i];
      }

      let best = 0;
      for (let count = tags.length; count >= 0; count -= 1) {
        const remaining = tags.length - count;
        let used = prefixSums[count];
        if (count > 0) used += gapPx * (count - 1);
        if (remaining > 0) {
          const moreWidth = moreMeasureRefs.current[remaining]?.offsetWidth ?? 0;
          if (moreWidth <= 0) continue;
          used += (count > 0 ? gapPx : 0) + moreWidth;
        }
        if (used <= containerWidth) {
          best = count;
          break;
        }
      }
      setVisibleTagCount(best);
    };

    calculate();
    const observer = new ResizeObserver(calculate);
    if (tagContainerRef.current) observer.observe(tagContainerRef.current);
    return () => observer.disconnect();
  }, [tags]);

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
              opacity: { xs: 1, sm: showCheckbox ? 1 : 0 },
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
              mb: 1,
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
          {card.tags?.length > 0 && (
            <Stack
              ref={tagContainerRef}
              direction="row"
              spacing={0.75}
              sx={{
                flexWrap: "nowrap",
                overflow: "hidden",
                alignItems: "center",
                minWidth: 0,
                mb: 0.5,
              }}
            >
              {tags.slice(0, visibleTagCount).map((t) => (
                <Chip
                  key={t}
                  size="small"
                  variant="outlined"
                  label={`#${t}`}
                  sx={{
                    height: 20,
                    fontSize: 11,
                    borderRadius: 999,
                    bgcolor: "rgba(37,99,235,0.04)",
                    borderColor: "rgba(37,99,235,0.18)",
                    color: "#1e293b",
                    flexShrink: 0,
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              ))}
              {hiddenTagCount > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`+${hiddenTagCount}개`}
                  sx={{
                    height: 20,
                    fontSize: 11,
                    borderRadius: 999,
                    bgcolor: "rgba(148,163,184,0.10)",
                    borderColor: "rgba(148,163,184,0.35)",
                    color: "#475569",
                    flexShrink: 0,
                    "& .MuiChip-label": { px: 0.75 },
                  }}
                />
              )}
            </Stack>
          )}
          {tags.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                visibility: "hidden",
                pointerEvents: "none",
                height: 0,
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {tags.map((t, index) => (
                <Box
                  key={`measure-tag-${index}`}
                  ref={(el: HTMLDivElement | null) => {
                    tagMeasureRefs.current[index] = el;
                  }}
                  sx={{ display: "inline-block", mr: 0.75 }}
                >
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`#${t}`}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      borderRadius: 999,
                      bgcolor: "rgba(37,99,235,0.04)",
                      borderColor: "rgba(37,99,235,0.18)",
                      color: "#1e293b",
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                </Box>
              ))}
              {Array.from({ length: tags.length }, (_, idx) => idx + 1).map((remaining) => (
                <Box
                  key={`measure-more-${remaining}`}
                  ref={(el: HTMLDivElement | null) => {
                    moreMeasureRefs.current[remaining] = el;
                  }}
                  sx={{ display: "inline-block", mr: 0.75 }}
                >
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`+${remaining}개`}
                    sx={{
                      height: 20,
                      fontSize: 11,
                      borderRadius: 999,
                      bgcolor: "rgba(148,163,184,0.10)",
                      borderColor: "rgba(148,163,184,0.35)",
                      color: "#475569",
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              pt: 1.25,
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
            <Stack direction="row" alignItems="center">
              <IconButton
                size="small"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  window.open(card.url, "_blank", "noopener,noreferrer");
                }}
              >
                <OpenInNewIcon sx={{ fontSize: 16 }} />
              </IconButton>
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
          disabled={isBusy}
          onClick={() => {
            setIsTagsDialogOpen(true);
            closeMenu();
          }}
          sx={{ fontSize: 13 }}
        >
          <ListItemIcon>
            <SellOutlinedIcon sx={{ fontSize: 16 }} />
          </ListItemIcon>
          태그 수정
        </MenuItem>
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
        <Divider />
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

      <EditTagsDialog
        open={isTagsDialogOpen}
        title="태그 수정"
        initialTags={card.tags ?? []}
        onClose={() => setIsTagsDialogOpen(false)}
        onSave={async (nextTags) => {
          try {
            await onUpdateTags(card, nextTags);
            setIsTagsDialogOpen(false);
          } catch {
            // Errors are surfaced by parent list error UI.
          }
        }}
      />
    </>
  );
});
