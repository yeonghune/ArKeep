import React from "react";
import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import LogoutIcon from "@mui/icons-material/Logout";
import MarkAsUnreadIcon from "@mui/icons-material/MarkAsUnread";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { DRAWER_WIDTH, TOP_BAR_HEIGHT } from "@/constants/layout";
import type { Category } from "@/lib/categories";
import type { ArticleFilter } from "@/types";

const CAT_MAX_LENGTH = 10;
const CAT_RESERVED = "모든 카테고리";
const CAT_ALLOWED = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9 ]*$/;
const CAT_INVALID_MSG = "한글, 영어, 숫자, 띄어쓰기만 허용됩니다.";

function validateCatName(name: string): string {
  const normalized = name.replace(/ {2,}/g, " ").trim();
  if (!normalized) return "";
  if (normalized === CAT_RESERVED) return `"${CAT_RESERVED}"는 사용할 수 없습니다.`;
  if (normalized.length > CAT_MAX_LENGTH) return `${CAT_MAX_LENGTH}자를 초과할 수 없습니다.`;
  if (!CAT_ALLOWED.test(normalized)) return CAT_INVALID_MSG;
  return "";
}

type Props = {
  open: boolean;
  filter: ArticleFilter;
  category: string;
  categories: Category[];
  topOffset: number;
  onClose: () => void;
  onFilterChange: (value: ArticleFilter) => void;
  onCategoryChange: (value: string) => void;
  onAddCategory: (name: string) => Promise<Category>;
  onRenameCategory: (id: number, name: string) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  isLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  onAvatarClickWhenLoggedOut: () => void;
  onLogout: () => Promise<void>;
};

const SELECTED_BG = "#eef2f6";
const SELECTED_COLOR = "#137fec";

export const FILTER_ITEMS: { value: ArticleFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "모든 아티클", icon: <LibraryBooksIcon sx={{ fontSize: 16 }} /> },
  { value: "read", label: "열람 아티클", icon: <VisibilityIcon sx={{ fontSize: 16 }} /> },
  { value: "unread", label: "미열람 아티클", icon: <MarkAsUnreadIcon sx={{ fontSize: 16 }} /> },
];

export function SidebarFilters({
  open,
  filter,
  category,
  categories,
  topOffset,
  onClose,
  onFilterChange,
  onCategoryChange,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  isLoggedIn,
  userName,
  userEmail,
  userAvatarUrl,
  onAvatarClickWhenLoggedOut,
  onLogout,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [catMenu, setCatMenu] = useState<{ catId: number; anchor: HTMLElement } | null>(null);
  const [isAddingInline, setIsAddingInline] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [renamingCatId, setRenamingCatId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [addError, setAddError] = useState("");
  const isSubmittingAdd = useRef(false);
  const [renameError, setRenameError] = useState("");
  const isSubmittingRename = useRef(false);
  const addInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const catListRef = useRef<HTMLDivElement>(null);
  const [isSearchingInline, setIsSearchingInline] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchingInline || !category || !catListRef.current) return;
    const el = catListRef.current.querySelector(`[data-cat-name="${CSS.escape(category)}"]`) as HTMLElement | null;
    if (el) {
      catListRef.current.scrollTop = el.offsetTop - catListRef.current.offsetTop;
    }
  }, [category, isSearchingInline]);

  useEffect(() => {
    if (!(isMobile && open)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobile, open]);

  function handleAvatarClick(event: MouseEvent<HTMLElement>) {
    if (!isLoggedIn) { onAvatarClickWhenLoggedOut(); return; }
    setMenuAnchor(event.currentTarget);
  }

  async function handleAddCategory() {
    if (isSubmittingAdd.current) return;
    const normalized = addValue.replace(/ {2,}/g, " ").trim();
    if (!normalized) { setIsAddingInline(false); setAddValue(""); setAddError(""); return; }
    const err = validateCatName(normalized);
    if (err) { setAddError(err); return; }
    isSubmittingAdd.current = true;
    setAddError("");
    try {
      await onAddCategory(normalized);
      setIsAddingInline(false);
      setAddValue("");
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "이미 존재하는 카테고리입니다.");
    } finally {
      isSubmittingAdd.current = false;
    }
  }

  async function handleRenameCategory(id: number) {
    const normalized = renameValue.replace(/ {2,}/g, " ").trim();
    if (!normalized) { setRenamingCatId(null); setRenameError(""); return; }
    const err = validateCatName(normalized);
    if (err) { setRenameError(err); return; }
    isSubmittingRename.current = true;
    setRenameError("");
    try {
      const updated = await onRenameCategory(id, normalized);
      if (category === categories.find((c) => c.id === id)?.name) {
        onCategoryChange(updated.name);
      }
      setRenamingCatId(null);
      setRenameValue("");
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : "이미 존재하는 카테고리입니다.");
    } finally {
      isSubmittingRename.current = false;
    }
  }

  const effectiveAvatarUrl = isLoggedIn && !avatarLoadFailed ? userAvatarUrl : undefined;

  const panelBody = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* 유저 정보 */}
      <Box sx={{ height: `${TOP_BAR_HEIGHT}px`, display: "flex", alignItems: "center" }}>
        <Box
          sx={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 1, py: 0.5, borderRadius: 1, cursor: "pointer",
            "&:hover": { bgcolor: SELECTED_BG },
            "&:hover .close-btn": { opacity: 1 },
            transition: "background-color 120ms ease",
          }}
          onClick={handleAvatarClick}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar
              src={effectiveAvatarUrl}
              imgProps={{ referrerPolicy: "no-referrer" }}
              onError={() => setAvatarLoadFailed(true)}
              sx={{ width: 22, height: 22, bgcolor: "#e2e8f0", color: "#94a3b8", flexShrink: 0 }}
            >
              <PersonIcon sx={{ fontSize: 13 }} />
            </Avatar>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: "#374151", minWidth: 0 }}>
              {isLoggedIn ? (userName ?? "사용자") : "게스트"}
            </Typography>
          </Stack>
          <IconButton
            className="close-btn"
            size="small"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            sx={{
              opacity: 0, transition: "opacity 120ms ease",
              display: { xs: "none", lg: "flex" }, p: 0.25,
              color: "#94a3b8", "&:hover": { bgcolor: "transparent", color: "#1e293b" },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      {/* 로그아웃 드롭다운 */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)} PaperProps={{ elevation: 0, sx: { boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", borderRadius: 1.5 } }}>
        <MenuItem disabled>
          <ListItemText primary={userEmail ?? userName ?? "사용자"} primaryTypographyProps={{ fontSize: 13 }} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { void onLogout(); setMenuAnchor(null); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="로그아웃" primaryTypographyProps={{ fontSize: 13 }} />
        </MenuItem>
      </Menu>

      {/* 필터 버튼 */}
      <Box sx={{ mt: 0.5 }}>
        {FILTER_ITEMS.map(({ value, label, icon }) => (
          <Box
            key={value}
            onClick={() => onFilterChange(value)}
            sx={{
              display: "flex", alignItems: "center", gap: 1.25,
              px: 1, py: 0.5, borderRadius: 1, cursor: "pointer",
              fontSize: 13, fontWeight: 400, bgcolor: "transparent", color: "#1e293b",
              "&:hover": { bgcolor: SELECTED_BG },
              transition: "background-color 120ms ease",
            }}
          >
            <Box sx={{ display: "flex", color: "#64748b" }}>{icon}</Box>
            {label}
          </Box>
        ))}
      </Box>

      {/* 카테고리 레이블 + 검색/추가 버튼 */}
      <Box sx={{ mt: 1.5 }} />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1, mb: 0.5 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
          카테고리
        </Typography>
        {isLoggedIn && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={() => { setIsAddingInline(false); setAddValue(""); setAddError(""); setIsSearchingInline(true); setCatSearchQuery(""); }}
              sx={{ p: 0.25, color: isSearchingInline ? SELECTED_COLOR : "#94a3b8", "&:hover": { bgcolor: SELECTED_BG, color: SELECTED_COLOR } }}
            >
              <SearchIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => { setIsSearchingInline(false); setCatSearchQuery(""); setIsAddingInline(true); }}
              sx={{ p: 0.25, color: "#94a3b8", "&:hover": { bgcolor: SELECTED_BG, color: SELECTED_COLOR } }}
            >
              <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* 카테고리 목록 */}
      <Box ref={catListRef} sx={{ flex: 1, overflowY: "auto" }}>
        {/* 인라인 검색 입력 */}
        {isSearchingInline && (
          <Box sx={{ borderRadius: 1, bgcolor: SELECTED_BG, mb: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25 }}>
              <SearchIcon sx={{ fontSize: 14, color: "#94a3b8", flexShrink: 0 }} />
              <Box
                component="input"
                autoFocus
                ref={searchInputRef}
                inputMode="search"
                placeholder="카테고리 검색"
                onChange={(e) => setCatSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setIsSearchingInline(false); setCatSearchQuery(""); }
                }}
                onBlur={() => { setTimeout(() => { setIsSearchingInline(false); setCatSearchQuery(""); }, 150); }}
                sx={{
                  flex: 1, border: "none", outline: "none", bgcolor: "transparent",
                  fontSize: 13, color: "#1e293b", fontFamily: "inherit",
                  "&::placeholder": { color: "#94a3b8" },
                }}
              />
            </Box>
          </Box>
        )}
        {/* 인라인 추가 입력 */}
        {isAddingInline && (
          <Box sx={{ borderRadius: 1, bgcolor: SELECTED_BG }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25 }}>
              <AddIcon sx={{ fontSize: 14, color: "#94a3b8", flexShrink: 0 }} />
              <Box
                component="input"
                autoFocus
                ref={addInputRef}
                value={addValue}
                inputMode="text"
                enterKeyHint="done"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const v = e.target.value;
                  setAddValue(v.length > CAT_MAX_LENGTH ? v.slice(0, CAT_MAX_LENGTH) : v);
                  setAddError("");
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === "Enter") void handleAddCategory();
                  if (e.key === "Escape") { setIsAddingInline(false); setAddValue(""); setAddError(""); }
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!isSubmittingAdd.current) { setIsAddingInline(false); setAddValue(""); setAddError(""); }
                  }, 150);
                }}
                placeholder="새 카테고리"
                sx={{
                  flex: 1, border: "none", outline: "none", bgcolor: "transparent",
                  fontSize: 13, color: "#1e293b", fontFamily: "inherit",
                  "&::placeholder": { color: "#94a3b8" },
                }}
              />
            </Box>
            {addError && (
              <Box sx={{ px: 1, pb: 0.5, fontSize: 11, color: "#ef4444" }}>{addError}</Box>
            )}
          </Box>
        )}
        {/* 모든 카테고리 */}
        {!isSearchingInline && !isAddingInline && <Box
          onClick={() => onCategoryChange("")}
          sx={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            px: 1, py: 0.5, borderRadius: 1, cursor: "pointer",
            fontSize: 13, fontWeight: category === "" ? 500 : 400,
            bgcolor: category === "" ? SELECTED_BG : "transparent",
            color: category === "" ? SELECTED_COLOR : "#1e293b",
            "&:hover": { bgcolor: SELECTED_BG },
            transition: "background-color 120ms ease",
          }}
        >
          <span>모든 카테고리</span>
        </Box>}

        {categories.filter((c) => !catSearchQuery || c.name.toLowerCase().includes(catSearchQuery.toLowerCase())).map((cat) => {
          const isSelected = !isSearchingInline && category === cat.name;
          if (renamingCatId === cat.id) {
            return (
              <Box key={cat.id} sx={{ borderRadius: 1, bgcolor: SELECTED_BG }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, px: 1, py: 0.25 }}>
                  <AddIcon sx={{ fontSize: 14, color: "#94a3b8", flexShrink: 0 }} />
                  <Box
                    component="input"
                    autoFocus
                    ref={renameInputRef}
                    value={renameValue}
                    inputMode="text"
                    enterKeyHint="done"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const v = e.target.value;
                      setRenameValue(v.length > CAT_MAX_LENGTH ? v.slice(0, CAT_MAX_LENGTH) : v);
                      setRenameError("");
                    }}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") void handleRenameCategory(cat.id);
                      if (e.key === "Escape") { setRenamingCatId(null); setRenameValue(""); setRenameError(""); }
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        if (!isSubmittingRename.current) { setRenamingCatId(null); setRenameValue(""); setRenameError(""); }
                      }, 150);
                    }}
                    sx={{
                      flex: 1, border: "none", outline: "none", bgcolor: "transparent",
                      fontSize: 13, color: "#1e293b", fontFamily: "inherit",
                    }}
                  />
                </Box>
                {renameError && (
                  <Box sx={{ px: 1, pb: 0.5, fontSize: 11, color: "#ef4444" }}>{renameError}</Box>
                )}
              </Box>
            );
          }
          return (
            <Box
              key={cat.id}
              data-cat-name={cat.name}
              onClick={() => onCategoryChange(cat.name)}
              sx={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                px: 1, py: 0.5, borderRadius: 1, cursor: "pointer",
                fontSize: 13, fontWeight: isSelected ? 500 : 400,
                bgcolor: isSelected ? SELECTED_BG : "transparent",
                color: isSelected ? SELECTED_COLOR : "#1e293b",
                "&:hover": { bgcolor: SELECTED_BG, "& .more-btn": { opacity: 1 } },
                transition: "background-color 120ms ease",
              }}
            >
              <span>{cat.name}</span>
              {!isSearchingInline && (
                <IconButton
                  size="small"
                  className="more-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCatMenu({ catId: cat.id, anchor: e.currentTarget });
                  }}
                  sx={{ opacity: isMobile ? 1 : 0, transition: "opacity 120ms ease", p: 0.25, color: "#64748b", "&:hover": { bgcolor: "transparent" } }}
                >
                  <MoreHorizIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
              <Menu
                anchorEl={catMenu?.anchor}
                open={catMenu?.catId === cat.id}
                onClose={() => setCatMenu(null)}
                onClick={(e) => e.stopPropagation()}
                PaperProps={{ elevation: 0, sx: { boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", borderRadius: 1.5 } }}
                MenuListProps={{ dense: true }}
              >
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingCatId(cat.id);
                    setRenameValue(cat.name);
                    setCatMenu(null);
                  }}
                  sx={{ fontSize: 13, py: 0.75 }}
                >
                  <ListItemIcon><DriveFileRenameOutlineIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                  <ListItemText primary="수정" primaryTypographyProps={{ fontSize: 13 }} />
                </MenuItem>
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    void onDeleteCategory(cat.id).then(() => {
                      if (category === cat.name) onCategoryChange("");
                    });
                    setCatMenu(null);
                  }}
                  sx={{ color: "#ef4444", fontSize: 13, py: 0.75 }}
                >
                  <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 16, color: "#ef4444" }} /></ListItemIcon>
                  <ListItemText primary="삭제" primaryTypographyProps={{ fontSize: 13 }} />
                </MenuItem>
              </Menu>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  const sidebarSx = { pt: 0, px: 1.5, pb: 2 };

  return (
    <>
      {open ? (
        <>
          <Box
            onClick={onClose}
            sx={{
              display: { xs: "block", lg: "none" }, position: "fixed",
              inset: 0, top: `${topOffset}px`, bgcolor: "rgba(0,0,0,0.3)",
              zIndex: (t) => t.zIndex.appBar - 2,
            }}
          />
          <Box
            component="aside"
            sx={{
              display: { xs: "block", lg: "none" }, position: "fixed",
              left: 0, top: `${topOffset}px`, bottom: 0, width: DRAWER_WIDTH,
              bgcolor: "#f8fafc", zIndex: (t) => t.zIndex.appBar - 1,
              boxShadow: "4px 0 16px rgba(0,0,0,0.12)", ...sidebarSx,
            }}
          >
            {panelBody}
          </Box>
        </>
      ) : null}

      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "block" }, position: "fixed",
          left: 0, top: `${topOffset}px`, width: DRAWER_WIDTH,
          height: `calc(100vh - ${topOffset}px)`, bgcolor: "#f8fafc",
          borderRight: "1px solid #e2e8f0",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 180ms ease",
          pointerEvents: open ? "auto" : "none", ...sidebarSx,
        }}
      >
        {panelBody}
      </Box>
    </>
  );
}
