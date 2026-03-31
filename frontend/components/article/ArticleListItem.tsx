import { memo, useLayoutEffect, useRef, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatRelativeTime, getCategoryLabel } from "@/lib/utils";
import type { Category } from "@/lib/categories";
import type { ArticleCard } from "@/types";
import { CardSource } from "./CardSource";
import { CategoryEditDialog } from "@/components/dialogs/CategoryEditDialog";
import { EditTagsDialog } from "@/components/dialogs/EditTagsDialog";

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
  onUpdateTags: (card: ArticleCard, tags: string[]) => Promise<void>;
  onAddCategory: (name: string) => Promise<Category>;
  onClick: () => void;
};

export const ArticleListItem = memo(function ArticleListItem({ card, categories, isLoggedIn, isBusy = false, isBulkMode = false, isSelected = false, onSelect, onDelete, onToggleRead, onUpdateCategory, onUpdateTags, onAddCategory, onClick }: Props) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState(card.thumbnailUrl ?? PLACEHOLDER_SRC);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const tagContainerRef = useRef<HTMLDivElement | null>(null);
  const tagMeasureRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const moreMeasureRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isRead = card.isRead;
  const categoryLabel = getCategoryLabel(card.category);
  const timeAgo = formatRelativeTime(card.createdAt);
  const isMenuOpen = Boolean(menuAnchorEl);
  const availableCategories = categories;
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
        spacing={1}
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
          p: 1.5,
          minHeight: 72,
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
            opacity: { xs: 1, sm: showCheckbox ? 1 : 0 },
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
            width: 64,
            height: 64,
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
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              wordBreak: "break-word",
            }}
          >
            {card.title}
          </Typography>
          {tags.length > 0 && (
            <Stack
              ref={tagContainerRef}
              direction="row"
              spacing={0.75}
              sx={{
                mt: 0.5,
                flexWrap: "nowrap",
                overflow: "hidden",
                alignItems: "center",
                minWidth: 0,
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
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: tags.length ? 0.15 : 0.25, overflow: "hidden" }}>
            <CardSource card={card} />
            <Typography noWrap sx={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis" }}>{card.domain}</Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: "#2563eb", fontWeight: 600, flexShrink: 0 }}>{categoryLabel}</Typography>
            <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{timeAgo}</Typography>
          </Stack>
        </Box>

        {/* URL 바로가기 */}
        <Tooltip title="원문 열기">
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
          <MoreVertIcon fontSize="small" />
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
          disabled={isBusy}
          sx={{ fontSize: 13 }}
          onClick={() => {
            setIsTagsDialogOpen(true);
            closeMenu();
          }}
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
