"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import GridViewIcon from "@mui/icons-material/GridView";
import MenuIcon from "@mui/icons-material/Menu";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import TuneIcon from "@mui/icons-material/Tune";
import ViewListIcon from "@mui/icons-material/ViewList";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import { HOME_THEME } from "@/constants/theme";
import { DRAWER_WIDTH, SYNC_BANNER_HEIGHT, TOP_BAR_HEIGHT } from "@/constants/layout";
import { ArticleCardItem } from "@/components/article/ArticleCardItem";
import { ArticleListItem } from "@/components/article/ArticleListItem";
import { SidebarFilters, FILTER_ITEMS } from "@/components/layout/SidebarFilters";
import { SyncBanner } from "@/components/layout/SyncBanner";
import { useArticleFilter } from "@/hooks/useArticleFilter";
import { useArticles } from "@/hooks/useArticles";
import { useCategories } from "@/hooks/useCategories";
import { useSession } from "@/hooks/useSession";
import { useViewMode } from "@/hooks/useViewMode";

const ArticleDetailModal = dynamic(
  () => import("@/components/dialogs/ArticleDetailModal").then((m) => ({ default: m.ArticleDetailModal })),
  { ssr: false }
);
const LoginModal = dynamic(
  () => import("@/components/dialogs/LoginModal").then((m) => ({ default: m.LoginModal })),
  { ssr: false }
);
const SaveLinkModal = dynamic(
  () => import("@/components/dialogs/SaveLinkModal").then((m) => ({ default: m.SaveLinkModal })),
  { ssr: false }
);
const GuestMigrationDialog = dynamic(
  () => import("@/components/dialogs/GuestMigrationDialog").then((m) => ({ default: m.GuestMigrationDialog })),
  { ssr: false }
);
const OnboardingDialog = dynamic(
  () => import("@/components/dialogs/OnboardingDialog").then((m) => ({ default: m.OnboardingDialog })),
  { ssr: false }
);
const BulkCategoryDialog = dynamic(
  () => import("@/components/dialogs/BulkCategoryDialog").then((m) => ({ default: m.BulkCategoryDialog })),
  { ssr: false }
);

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
  const [viewMenuAnchor, setViewMenuAnchor] = useState<HTMLElement | null>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<HTMLElement | null>(null);
  const [searchFieldMenuAnchor, setSearchFieldMenuAnchor] = useState<HTMLElement | null>(null);
  // 벌크 모드
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAllMode, setSelectAllMode] = useState(false); // 전체(DB) 선택 모드
  const [isTitleIconHovered, setIsTitleIconHovered] = useState(false);
  const [isBulkCategoryOpen, setIsBulkCategoryOpen] = useState(false);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<HTMLElement | null>(null);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [viewMode, setViewMode] = useViewMode();
  const filterState = useArticleFilter();
  const articleState = useArticles({ ...filterState });
  const sessionState = useSession();
  const categoryState = useCategories(Boolean(sessionState.session));

  const { showSyncBanner } = sessionState;

  const exitBulkMode = useCallback(() => {
    setIsBulkMode(false);
    setSelectedIds(new Set());
    setSelectAllMode(false);
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setIsBulkMode(true);
    setSelectAllMode(false); // 개별 선택 시 전체 모드 해제
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // selectAllMode 중 무한 스크롤로 새 아티클이 로드되면 자동 선택
  useEffect(() => {
    if (!selectAllMode) return;
    setSelectedIds(new Set(articleState.articles.map((a) => a.id)));
  }, [selectAllMode, articleState.articles]);

  const isAllSelected =
    selectAllMode ||
    (articleState.articles.length > 0 &&
      selectedIds.size === articleState.articles.length);

  const handleSelectAll = useCallback(() => {
    if (selectAllMode || isAllSelected) {
      // 전체 해제
      setSelectAllMode(false);
      setSelectedIds(new Set());
    } else {
      // 타이틀바 체크박스 → selectAllMode 진입 (DB 전체 선택)
      setSelectAllMode(true);
      setSelectedIds(new Set(articleState.articles.map((a) => a.id)));
    }
  }, [selectAllMode, isAllSelected, articleState.articles]);


  async function handleBulkDeleteClick() {
    const count = selectAllMode ? articleState.totalItems : selectedIds.size;
    if (!window.confirm(`선택된 ${count}개의 아티클을 삭제할까요?`)) return;
    await articleState.handleBulkDelete(Array.from(selectedIds), selectAllMode);
    exitBulkMode();
  }

  const sidebarTopOffset = useMemo(
    () => showSyncBanner ? SYNC_BANNER_HEIGHT : 0,
    [showSyncBanner]
  );


  // 사이드바 반응형 미디어쿼리
  useEffect(() => {
    const mq = window.matchMedia("(min-width:1200px)");
    const sync = () => setIsSidebarOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(articleState.loadMore);
  loadMoreRef.current = articleState.loadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current(); },
      { rootMargin: "300px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [articleState.isLoading]);

  const afterAuthChange = useCallback(async () => {
    await articleState.refresh();
  }, [articleState]);

  const selectedCardBusy =
    articleState.selectedCard != null &&
    articleState.mutatingArticleId === articleState.selectedCard.id;

  const hasActiveSearchOrFacet =
    filterState.searchQuery.length > 0 ||
    filterState.selectedCategory.length > 0;

  const showCenteredAddCta = useMemo(() => {
    if (
      articleState.isLoading ||
      articleState.articles.length > 0 ||
      hasActiveSearchOrFacet ||
      filterState.filter !== "unread"
    ) {
      return false;
    }
    return articleState.allArticleCount === 0 || articleState.unreadArticleCount === 0;
  }, [
    articleState.isLoading,
    articleState.articles.length,
    hasActiveSearchOrFacet,
    filterState.filter,
    articleState.allArticleCount,
    articleState.unreadArticleCount,
  ]);

  const emptyStateMessage = useMemo(() => {
    if (articleState.allArticleCount === 0) return "읽고 싶은 아티클을 추가해보세요!";
    if (articleState.unreadArticleCount === 0) return "모든 아티클을 읽으셨어요! 새로운 아티클을 추가해보는게 어떠신가요?";
    return "현재 조건에 맞는 아티클이 없습니다.";
  }, [articleState.allArticleCount, articleState.unreadArticleCount]);

  const combinedError = articleState.listError ?? sessionState.authError;

  return (
    <ThemeProvider theme={HOME_THEME}>
      <CssBaseline />
      <Box sx={{ height: "100dvh", overflow: "clip", display: "flex", flexDirection: "column", bgcolor: "background.default", color: "#1e293b" }}>
        {showSyncBanner ? (
          <SyncBanner
            onLoginClick={() => setIsLoginModalOpen(true)}
            onDismiss={sessionState.dismissSyncBanner}
          />
        ) : null}

        <Box sx={{ flexShrink: 0, height: `${sidebarTopOffset}px` }} />

        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* 사이드바 공간 확보 */}
          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              width: isSidebarOpen ? DRAWER_WIDTH : 0,
              transition: "width 180ms ease",
              flexShrink: 0,
            }}
          />

          <SidebarFilters
            open={isSidebarOpen}
            filter={filterState.filter}
            category={filterState.selectedCategory}
            categories={categoryState.categories}
            topOffset={sidebarTopOffset}
            onClose={() => setIsSidebarOpen(false)}
            onFilterChange={filterState.setFilter}
            onCategoryChange={filterState.setSelectedCategory}
            onAddCategory={categoryState.addCategory}
            onRenameCategory={categoryState.renameCategory}
            onDeleteCategory={async (id) => {
              await categoryState.removeCategory(id);
              await articleState.refresh();
            }}
            isLoggedIn={Boolean(sessionState.session)}
            userName={sessionState.session?.name ?? sessionState.session?.email}
            userEmail={sessionState.session?.email}
            userAvatarUrl={sessionState.session?.pictureUrl}
            onAvatarClickWhenLoggedOut={() => setIsLoginModalOpen(true)}
            onLogout={() => sessionState.handleLogout(afterAuthChange)}
          />

          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              bgcolor: "#ffffff",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "clip",
              contain: "strict",
            }}
          >
            {/* 상단 고정 영역: 검색바 + 타이틀바 */}
            <Box
              sx={{
                flexShrink: 0,
                zIndex: 10,
                bgcolor: "#ffffff",
              }}
            >
            {/* 상단 바: 햄버거 + 로고 + 검색 + 추가 */}
            <Box
              sx={{
                px: { xs: 1.5, sm: 3, lg: 4 },
                height: `${TOP_BAR_HEIGHT}px`,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <IconButton
                size="small"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                sx={{ color: "#64748b", flexShrink: 0, ml: "-5px" }}
              >
                <MenuIcon fontSize="small" />
              </IconButton>

              {/* 로고 */}
              <Box
                onClick={() => window.location.reload()}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexShrink: 0,
                  userSelect: "none",
                  mr: 0.5,
                  cursor: "pointer",
                }}
              >
                <Box
                  component="img"
                  src="/icon.svg"
                  alt="ArKeep"
                  sx={{ width: 24, height: 24, display: "block" }}
                />
                <Box
                  component="span"
                  sx={{
                    display: { xs: "none", sm: "inline" },
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "#1e293b",
                    letterSpacing: "-0.3px",
                  }}
                >
                  ArKeep
                </Box>
              </Box>

              <TextField
                size="small"
                placeholder="검색"
                value={filterState.searchInput}
                onChange={(e) => filterState.setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") filterState.setSearchInput("");
                }}
                sx={{
                  flex: { xs: 1, sm: "0 1 400px" },
                  "& .MuiInputBase-root": { height: "30px", bgcolor: "#f8fafc" },
                  "& .MuiInputBase-input": { py: "4px" },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end" sx={{ gap: 0.25, mr: "-4px" }}>
                        {filterState.isSearchPending ? (
                          <CircularProgress size={12} thickness={5} sx={{ color: "#94a3b8" }} />
                        ) : filterState.searchInput ? (
                          <IconButton
                            size="small"
                            onClick={() => filterState.setSearchInput("")}
                            sx={{ p: "2px", color: "#94a3b8", "&:hover": { color: "#475569" } }}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        ) : null}
                        <IconButton
                          size="small"
                          onClick={(e) => setSearchFieldMenuAnchor(e.currentTarget)}
                          sx={{
                            p: "2px",
                            color: filterState.searchField === "url" ? "primary.main" : "#94a3b8",
                            "&:hover": { color: filterState.searchField === "url" ? "primary.dark" : "#475569" },
                          }}
                        >
                          <TuneIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Menu
                anchorEl={searchFieldMenuAnchor}
                open={Boolean(searchFieldMenuAnchor)}
                onClose={() => setSearchFieldMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { mt: 0.5, minWidth: 160 } } }}
              >
                <Typography sx={{ px: 2, py: 0.75, fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  검색 범위
                </Typography>
                <MenuItem
                  selected={filterState.searchField === "title"}
                  onClick={() => { filterState.setSearchField("title"); setSearchFieldMenuAnchor(null); }}
                  sx={{ fontSize: "0.85rem", gap: 1 }}
                >
                  제목
                </MenuItem>
                <MenuItem
                  selected={filterState.searchField === "url"}
                  onClick={() => { filterState.setSearchField("url"); setSearchFieldMenuAnchor(null); }}
                  sx={{ fontSize: "0.85rem", gap: 1 }}
                >
                  URL
                </MenuItem>
              </Menu>

              <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />

              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setIsSaveModalOpen(true)}
                sx={{ flexShrink: 0, fontWeight: 600, whiteSpace: "nowrap", mr: "-5px", boxShadow: "none" }}
              >
                추가
              </Button>
            </Box>

              {/* 타이틀 바 */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1} sx={{ px: { xs: 1.5, sm: 3, lg: 4 }, mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {(() => {
                    const current = FILTER_ITEMS.find((f) => f.value === filterState.filter);
                    const showCheck = isTitleIconHovered || isBulkMode;
                    return (
                      <>
                        <Box
                          onMouseEnter={() => !isMobile && setIsTitleIconHovered(true)}
                          onMouseLeave={() => !isMobile && setIsTitleIconHovered(false)}
                          onClick={isMobile ? () => { if (!isBulkMode) setIsBulkMode(true); handleSelectAll(); } : undefined}
                          sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, color: "#64748b", cursor: "pointer", flexShrink: 0 }}
                        >
                          {showCheck ? (
                            <Checkbox
                              size="small"
                              checked={isAllSelected}
                              indeterminate={selectedIds.size > 0 && !isAllSelected}
                              onChange={() => {
                                if (!isBulkMode) setIsBulkMode(true);
                                handleSelectAll();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ p: 0, width: 20, height: 20 }}
                            />
                          ) : (
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, color: "#64748b" }}>{current?.icon}</Box>
                          )}
                        </Box>
                        {!isBulkMode && (
                          <Typography sx={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}>
                            {filterState.selectedCategory || "모든 카테고리"}
                          </Typography>
                        )}
                      </>
                    );
                  })()}
                  <Typography sx={{ fontSize: 14, fontWeight: 400, color: "#64748b", whiteSpace: "nowrap" }}>
                    {isBulkMode
                      ? selectAllMode
                        ? `전체 ${articleState.totalItems}개 선택`
                        : `${selectedIds.size}개 선택`
                      : `${articleState.totalItems}개`}
                  </Typography>
                </Stack>

                {isBulkMode ? (
                  isMobile ? (
                    /* 모바일 벌크 버튼: ··· 메뉴 + × 취소 */
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mr: "-5px" }}>
                      <IconButton
                        size="small"
                        disabled={selectedIds.size === 0 && !selectAllMode}
                        onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                        sx={{ color: "#475569" }}
                      >
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                      <Menu
                        anchorEl={bulkMenuAnchor}
                        open={Boolean(bulkMenuAnchor)}
                        onClose={() => setBulkMenuAnchor(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        PaperProps={{ elevation: 0, sx: { boxShadow: "0 4px 16px rgba(0,0,0,0.12)", border: "1px solid #e2e8f0", borderRadius: 1.5, minWidth: 160 } }}
                        MenuListProps={{ dense: true }}
                      >
                        <MenuItem
                          onClick={async () => {
                            setBulkMenuAnchor(null);
                            await articleState.handleBulkToggleRead(Array.from(selectedIds), true, selectAllMode);
                            exitBulkMode();
                          }}
                          sx={{ fontSize: 14 }}
                        >
                          <ListItemIcon><CheckCircleOutlineIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                          열람 처리
                        </MenuItem>
                        <MenuItem
                          onClick={async () => {
                            setBulkMenuAnchor(null);
                            await articleState.handleBulkToggleRead(Array.from(selectedIds), false, selectAllMode);
                            exitBulkMode();
                          }}
                          sx={{ fontSize: 14 }}
                        >
                          <ListItemIcon><RadioButtonUncheckedIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                          미열람 처리
                        </MenuItem>
                        <MenuItem
                          onClick={() => { setBulkMenuAnchor(null); setIsBulkCategoryOpen(true); }}
                          sx={{ fontSize: 14 }}
                        >
                          <ListItemIcon><DriveFileRenameOutlineIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                          카테고리 수정
                        </MenuItem>
                        <Divider />
                        <MenuItem
                          onClick={() => { setBulkMenuAnchor(null); void handleBulkDeleteClick(); }}
                          sx={{ fontSize: 14, color: "error.main" }}
                        >
                          <ListItemIcon><DeleteOutlineIcon sx={{ fontSize: 16 }} color="error" /></ListItemIcon>
                          삭제
                        </MenuItem>
                      </Menu>
                      <IconButton size="small" onClick={exitBulkMode} sx={{ color: "#64748b" }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ) : (
                  /* 데스크탑 벌크 버튼: 전체 노출 */
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={selectedIds.size === 0 && !selectAllMode}
                      onClick={async () => {
                        await articleState.handleBulkToggleRead(Array.from(selectedIds), true, selectAllMode);
                        exitBulkMode();
                      }}
                      startIcon={<CheckCircleOutlineIcon fontSize="small" />}
                      sx={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", minWidth: 0, px: 1.5, borderColor: "#cbd5e1", color: "#475569", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" } }}
                    >
                      열람 처리
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={selectedIds.size === 0 && !selectAllMode}
                      onClick={async () => {
                        await articleState.handleBulkToggleRead(Array.from(selectedIds), false, selectAllMode);
                        exitBulkMode();
                      }}
                      startIcon={<RadioButtonUncheckedIcon fontSize="small" />}
                      sx={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", minWidth: 0, px: 1.5, borderColor: "#cbd5e1", color: "#475569", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" } }}
                    >
                      미열람 처리
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={selectedIds.size === 0 && !selectAllMode}
                      onClick={() => setIsBulkCategoryOpen(true)}
                      startIcon={<DriveFileRenameOutlineIcon fontSize="small" />}
                      sx={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", minWidth: 0, px: 1.5, borderColor: "#cbd5e1", color: "#475569", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" } }}
                    >
                      카테고리 수정
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={selectedIds.size === 0 && !selectAllMode}
                      onClick={() => void handleBulkDeleteClick()}
                      startIcon={<DeleteOutlineIcon fontSize="small" />}
                      sx={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", minWidth: 0, px: 1.5, borderColor: "#fca5a5", color: "error.main", "&:hover": { borderColor: "error.main", bgcolor: "#fff5f5" } }}
                    >
                      삭제
                    </Button>
                    <Divider orientation="vertical" flexItem sx={{ mx: 0.25, my: 0.5 }} />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={exitBulkMode}
                      startIcon={<CloseIcon fontSize="small" />}
                      sx={{ fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", minWidth: 0, px: 1.5, borderColor: "#cbd5e1", color: "#64748b", "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" } }}
                    >
                      취소
                    </Button>
                  </Stack>
                  )
                ) : (
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mr: "-5px" }}>
                    <IconButton size="small" onClick={(e) => setSortMenuAnchor(e.currentTarget)} sx={{ color: "#64748b" }}>
                      <SortIcon fontSize="small" />
                    </IconButton>
                    <Menu anchorEl={sortMenuAnchor} open={Boolean(sortMenuAnchor)} onClose={() => setSortMenuAnchor(null)} PaperProps={{ elevation: 0, sx: { boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", borderRadius: 1.5 } }}>
                      <MenuItem selected={filterState.sort === "latest"} onClick={() => { filterState.setSort("latest"); setSortMenuAnchor(null); }} sx={{ fontSize: 13 }}>
                        최신순
                      </MenuItem>
                      <MenuItem selected={filterState.sort === "oldest"} onClick={() => { filterState.setSort("oldest"); setSortMenuAnchor(null); }} sx={{ fontSize: 13 }}>
                        오래된순
                      </MenuItem>
                    </Menu>
                    <IconButton size="small" onClick={(e) => setViewMenuAnchor(e.currentTarget)}>
                      {viewMode === "card" ? <GridViewIcon fontSize="small" /> : <ViewListIcon fontSize="small" />}
                    </IconButton>
                    <Menu anchorEl={viewMenuAnchor} open={Boolean(viewMenuAnchor)} onClose={() => setViewMenuAnchor(null)} PaperProps={{ elevation: 0, sx: { boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0", borderRadius: 1.5 } }}>
                      <MenuItem selected={viewMode === "card"} onClick={() => { setViewMode("card"); setViewMenuAnchor(null); }} sx={{ fontSize: 13 }}>
                        <ListItemIcon><GridViewIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                        카드형
                      </MenuItem>
                      <MenuItem selected={viewMode === "list"} onClick={() => { setViewMode("list"); setViewMenuAnchor(null); }} sx={{ fontSize: 13 }}>
                        <ListItemIcon><ViewListIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                        리스트형
                      </MenuItem>
                    </Menu>
                  </Stack>
                )}
              </Stack>

              <Divider />
            </Box>

            {/* 콘텐츠 영역 */}
            <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 1.5, sm: 3, lg: 4 }, pt: 2, pb: 3 }}>
              {combinedError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {combinedError}
                </Alert>
              ) : null}

              {articleState.isLoading ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 12 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : articleState.articles.length === 0 ? (
                <Box sx={{ display: "grid", placeItems: "center", py: 12, gap: 2 }}>
                  <Typography
                    sx={{ color: "#64748b", fontSize: { xs: 18, sm: 20 }, fontWeight: 600, textAlign: "center" }}
                  >
                    {showCenteredAddCta ? emptyStateMessage : "현재 조건에 맞는 아티클이 없습니다."}
                  </Typography>
                  {showCenteredAddCta ? (
                    <Button variant="contained" onClick={() => setIsSaveModalOpen(true)} startIcon={<AddIcon />}>
                      추가
                    </Button>
                  ) : null}
                </Box>
              ) : (
                <Stack spacing={3}>
                  {viewMode === "card" ? (
                    <Box
                      sx={{
                        display: "grid",
                        gap: 3,
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                          lg: "repeat(4, minmax(0, 1fr))",
                        },
                      }}
                    >
                      {articleState.articles.map((card) => (
                        <ArticleCardItem
                          key={card.id}
                          card={card}
                          categories={categoryState.categories}
                          isLoggedIn={Boolean(sessionState.session)}
                          isBusy={articleState.mutatingArticleId === card.id}
                          isBulkMode={isBulkMode}
                          isSelected={selectedIds.has(card.id)}
                          onSelect={toggleSelect}
                          onDelete={articleState.handleDelete}
                          onToggleRead={articleState.handleToggleRead}
                          onUpdateCategory={articleState.handleUpdateCategory}
                          onAddCategory={categoryState.addCategory}
                          onClick={() => articleState.setSelectedCard(card)}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                      {articleState.articles.map((card) => (
                        <ArticleListItem
                          key={card.id}
                          card={card}
                          categories={categoryState.categories}
                          isLoggedIn={Boolean(sessionState.session)}
                          isBusy={articleState.mutatingArticleId === card.id}
                          isBulkMode={isBulkMode}
                          isSelected={selectedIds.has(card.id)}
                          onSelect={toggleSelect}
                          onDelete={articleState.handleDelete}
                          onToggleRead={articleState.handleToggleRead}
                          onUpdateCategory={articleState.handleUpdateCategory}
                          onAddCategory={categoryState.addCategory}
                          onClick={() => articleState.setSelectedCard(card)}
                        />
                      ))}
                    </Box>
                  )}

                  <Box ref={sentinelRef} sx={{ height: 1 }} />
                  {articleState.isLoadingMore && (
                    <Stack direction="row" justifyContent="center" sx={{ py: 2 }}>
                      <CircularProgress size={20} thickness={4} sx={{ color: "#94a3b8" }} />
                    </Stack>
                  )}
                </Stack>
              )}
            </Box>
          </Box>
        </Box>

        <SaveLinkModal
          open={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          categories={categoryState.categories}
          isLoggedIn={Boolean(sessionState.session)}
          onSave={articleState.handleCreate}
          onAddCategory={categoryState.addCategory}
        />
        <LoginModal
          open={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onGoogleCredential={(idToken) => sessionState.handleGoogleCredential(idToken, afterAuthChange)}
        />
        <OnboardingDialog
          open={sessionState.isHydrated && !sessionState.session && !isOnboardingDismissed}
          onGuestContinue={() => setIsOnboardingDismissed(true)}
          onGoogleCredential={(idToken) => sessionState.handleGoogleCredential(idToken, afterAuthChange).then(() => setIsOnboardingDismissed(true))}
        />
        <GuestMigrationDialog
          open={sessionState.isMigrationDialogOpen}
          count={sessionState.guestMigrationCount}
          isMigrating={sessionState.isMigratingGuestData}
          onConfirm={() => sessionState.handleConfirmGuestMigration(afterAuthChange)}
          onCancel={sessionState.handleSkipGuestMigration}
        />
        <ArticleDetailModal
          card={articleState.selectedCard}
          onClose={() => articleState.setSelectedCard(null)}
          onToggleRead={articleState.handleToggleRead}
          onSaveMemo={articleState.handleSaveMemo}
          isBusy={selectedCardBusy}
        />
        <BulkCategoryDialog
          open={isBulkCategoryOpen}
          categories={categoryState.categories}
          selectedCount={selectedIds.size}
          onClose={() => setIsBulkCategoryOpen(false)}
          onAddCategory={categoryState.addCategory}
          onSave={async (category) => {
            await articleState.handleBulkUpdateCategory(Array.from(selectedIds), category, selectAllMode);
            setIsBulkCategoryOpen(false);
            exitBulkMode();
          }}
        />
      </Box>
    </ThemeProvider>
  );
}
