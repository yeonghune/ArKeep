"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import Fab from "@mui/material/Fab";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { HOME_THEME } from "@/constants/theme";
import { CONTENT_GAP, DRAWER_WIDTH, HEADER_HEIGHT, SYNC_BANNER_HEIGHT } from "@/constants/layout";
import { ArticleCardItem } from "@/components/article/ArticleCardItem";
import { ArticleListItem } from "@/components/article/ArticleListItem";
import { SidebarFilters } from "@/components/layout/SidebarFilters";
import { SyncBanner } from "@/components/layout/SyncBanner";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { useArticleFilter } from "@/hooks/useArticleFilter";
import { useArticles } from "@/hooks/useArticles";
import { useSession } from "@/hooks/useSession";
import { useViewMode } from "@/hooks/useViewMode";
import type { ArticleFilter } from "@/types";

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

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [viewMode, setViewMode] = useViewMode();
  const filterState = useArticleFilter();
  const articleState = useArticles({ ...filterState });
  const sessionState = useSession();

  const { showSyncBanner } = sessionState;

  const sidebarTopOffset = useMemo(
    () => HEADER_HEIGHT + (showSyncBanner ? SYNC_BANNER_HEIGHT : 0),
    [showSyncBanner]
  );
  const contentTopOffset = useMemo(() => sidebarTopOffset + CONTENT_GAP, [sidebarTopOffset]);

  // 사이드바 반응형 미디어쿼리
  useEffect(() => {
    const mq = window.matchMedia("(min-width:1200px)");
    const sync = () => setIsSidebarOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 인증 후 아티클 목록 갱신 콜백 (hook 간 브릿지)
  const afterAuthChange = useCallback(async () => {
    filterState.setPage(1);
    await articleState.refresh();
  }, [filterState, articleState]);

  const selectedCardBusy =
    articleState.selectedCard != null &&
    articleState.mutatingArticleId === articleState.selectedCard.id;

  const hasActiveSearchOrFacet =
    filterState.searchQuery.length > 0 ||
    filterState.selectedCategory.length > 0 ||
    filterState.selectedDomain.length > 0;

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
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "#1e293b" }}>
        {showSyncBanner ? (
          <SyncBanner
            onLoginClick={() => setIsLoginModalOpen(true)}
            onDismiss={sessionState.dismissSyncBanner}
          />
        ) : null}

        <TopNavigation
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
          searchQuery={filterState.searchInput}
          onSearchQueryChange={filterState.setSearchInput}
          isLoggedIn={Boolean(sessionState.session)}
          userName={sessionState.session?.name ?? sessionState.session?.email}
          userAvatarUrl={sessionState.session?.pictureUrl}
          onAvatarClickWhenLoggedOut={() => setIsLoginModalOpen(true)}
          onLogout={() => sessionState.handleLogout(afterAuthChange)}
          hasSyncBanner={showSyncBanner}
        />

        <Box sx={{ height: `${contentTopOffset}px` }} />

        <Box sx={{ display: "flex" }}>
          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              width: isSidebarOpen ? DRAWER_WIDTH : 0,
              transition: "width 180ms ease",
            }}
          />
          <SidebarFilters
            open={isSidebarOpen}
            filter={filterState.filter}
            sort={filterState.sort}
            category={filterState.selectedCategory}
            domain={filterState.selectedDomain}
            categories={articleState.facets.categories}
            domains={articleState.facets.domains}
            topOffset={sidebarTopOffset}
            onClose={() => setIsSidebarOpen(false)}
            onFilterChange={filterState.setFilter}
            onSortChange={filterState.setSort}
            onCategoryChange={filterState.setSelectedCategory}
            onDomainChange={filterState.setSelectedDomain}
          />

          <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 4 }, pt: 1, pb: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1} sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography sx={{ fontSize: 18, fontWeight: 700, whiteSpace: "nowrap" }}>저장한 아티클</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 400, color: "#64748b", whiteSpace: "nowrap" }}>
                  {articleState.totalItems}개 항목
                </Typography>
                {articleState.isRefreshing ? (
                  <Typography sx={{ fontSize: 12, color: "#64748b" }}>불러오는 중...</Typography>
                ) : null}
              </Stack>

              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  size="small"
                  onClick={() => setViewMode("card")}
                  color={viewMode === "card" ? "primary" : "default"}
                  aria-label="카드 보기"
                >
                  <GridViewIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setViewMode("list")}
                  color={viewMode === "list" ? "primary" : "default"}
                  aria-label="목록 보기"
                >
                  <ViewListIcon fontSize="small" />
                </IconButton>
                <TextField
                  select
                  size="small"
                  value={filterState.filter}
                  onChange={(event) => filterState.setFilter(event.target.value as ArticleFilter)}
                  sx={{ display: { lg: "none" }, minWidth: 120 }}
                >
                  <MenuItem value="all">모두</MenuItem>
                  <MenuItem value="read">읽음</MenuItem>
                  <MenuItem value="unread">읽지 않음</MenuItem>
                </TextField>
              </Stack>
            </Stack>

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
                        categories={articleState.facets.categories}
                        isBusy={articleState.mutatingArticleId === card.id}
                        onDelete={articleState.handleDelete}
                        onUpdateCategory={articleState.handleUpdateCategory}
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
                        categories={articleState.facets.categories}
                        isBusy={articleState.mutatingArticleId === card.id}
                        onDelete={articleState.handleDelete}
                        onUpdateCategory={articleState.handleUpdateCategory}
                        onClick={() => articleState.setSelectedCard(card)}
                      />
                    ))}
                  </Box>
                )}

                {articleState.totalPages > 1 ? (
                  <Stack direction="row" justifyContent="center">
                    <Pagination
                      color="primary"
                      shape="rounded"
                      page={filterState.page}
                      count={articleState.totalPages}
                      onChange={(_, nextPage) => filterState.setPage(nextPage)}
                    />
                  </Stack>
                ) : null}
              </Stack>
            )}
          </Box>
        </Box>

        {!showCenteredAddCta ? (
          <Fab
            color="primary"
            sx={{ position: "fixed", right: 32, bottom: 32 }}
            onClick={() => setIsSaveModalOpen(true)}
          >
            <AddIcon />
          </Fab>
        ) : null}

        <SaveLinkModal
          open={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          categories={articleState.facets.categories}
          onSave={articleState.handleCreate}
        />
        <LoginModal
          open={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onGoogleCredential={(idToken) => sessionState.handleGoogleCredential(idToken, afterAuthChange)}
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
      </Box>
    </ThemeProvider>
  );
}
