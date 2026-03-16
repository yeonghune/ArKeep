"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import Fab from "@mui/material/Fab";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { ThemeProvider } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { createArticle, deleteArticle, getGuestArticleCount, listArticleFacets, listArticles, migrateGuestArticlesToServer, patchArticle } from "../lib/articles";
import { loginWithGoogle, logout } from "../lib/auth";
import { getMyProfile } from "../lib/profile";
import { clearSession, getStoredSession, saveSession, sessionChangedEventName, type Session } from "../lib/session";
import { ArticleCardItem } from "./components/home/ArticleCardItem";
import { ArticleListItem } from "./components/home/ArticleListItem";
import { ArticleDetailModal } from "./components/home/ArticleDetailModal";
import { GuestMigrationDialog } from "./components/home/GuestMigrationDialog";
import { LoginModal } from "./components/home/LoginModal";
import { SaveLinkModal } from "./components/home/SaveLinkModal";
import { SidebarFilters } from "./components/home/SidebarFilters";
import { SyncBanner } from "./components/home/SyncBanner";
import { TopNavigation } from "./components/home/TopNavigation";
import { CONTENT_GAP, DRAWER_WIDTH, HEADER_HEIGHT, SYNC_BANNER_HEIGHT } from "./home-constants";
import { HOME_THEME } from "./home-theme";
import type { ArticleCard, ArticleFacets, ArticleFilter, ArticlePage, ArticleSort } from "./home-types";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

function toIsReadParam(filter: ArticleFilter): boolean | undefined {
  if (filter === "all") return undefined;
  return filter === "read";
}

export default function HomePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ArticleCard | null>(null);
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [facets, setFacets] = useState<ArticleFacets>({ categories: [], domains: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ArticleFilter>("unread");
  const [sort, setSort] = useState<ArticleSort>("latest");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [allArticleCount, setAllArticleCount] = useState(0);
  const [unreadArticleCount, setUnreadArticleCount] = useState(0);
  const [mutatingArticleId, setMutatingArticleId] = useState<number | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isSyncBannerDismissed, setIsSyncBannerDismissed] = useState(false);
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false);
  const [guestMigrationCount, setGuestMigrationCount] = useState(0);
  const [isMigratingGuestData, setIsMigratingGuestData] = useState(false);
  const hasFetchedRef = useRef(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  useEffect(() => {
    const saved = localStorage.getItem("arkeep_view_mode") as "card" | "list" | null;
    if (saved === "list" || saved === "card") setViewMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("arkeep_view_mode", viewMode);
  }, [viewMode]);

  const selectedCardBusy = selectedCard != null && mutatingArticleId === selectedCard.id;
  const isReadParam = useMemo(() => toIsReadParam(filter), [filter]);
  const showSyncBanner = useMemo(() => !session && !isSyncBannerDismissed, [session, isSyncBannerDismissed]);
  const sidebarTopOffset = useMemo(() => HEADER_HEIGHT + (showSyncBanner ? SYNC_BANNER_HEIGHT : 0), [showSyncBanner]);
  const contentTopOffset = useMemo(
    () => HEADER_HEIGHT + (showSyncBanner ? SYNC_BANNER_HEIGHT : 0) + CONTENT_GAP,
    [showSyncBanner]
  );

  const fetchFacets = useCallback(async () => {
    try {
      const nextFacets = await listArticleFacets();
      setFacets(nextFacets);
    } catch {
      // Keep existing sidebar options when facets refresh fails.
    }
  }, []);

  const fetchArticles = useCallback(
    async (showInitialLoader: boolean, targetPage: number): Promise<ArticlePage | null> => {
      if (showInitialLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setListError(null);

      try {
        const [response, allCountResponse, unreadCountResponse] = await Promise.all([
          listArticles({
            isRead: isReadParam,
            sort,
            q: searchQuery,
            category: selectedCategory,
            domain: selectedDomain,
            page: targetPage,
            size: PAGE_SIZE
          }),
          listArticles({ page: 1, size: 1 }),
          listArticles({ isRead: false, page: 1, size: 1 })
        ]);
        setArticles(response.items);
        setPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.totalItems);
        setAllArticleCount(allCountResponse.totalItems);
        setUnreadArticleCount(unreadCountResponse.totalItems);
        setSelectedCard((current) => {
          if (!current) return null;
          const updated = response.items.find((item) => item.id === current.id);
          return updated ?? null;
        });
        return response;
      } catch (error) {
        setListError(parseErrorMessage(error));
        return null;
      } finally {
        if (showInitialLoader) {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    [isReadParam, sort, searchQuery, selectedCategory, selectedDomain]
  );

  const hasActiveSearchOrFacet = useMemo(
    () => searchQuery.length > 0 || selectedCategory.length > 0 || selectedDomain.length > 0,
    [searchQuery, selectedCategory, selectedDomain]
  );
  const showCenteredAddCta = useMemo(() => {
    if (isLoading || articles.length > 0 || hasActiveSearchOrFacet || filter !== "unread") {
      return false;
    }
    return allArticleCount === 0 || unreadArticleCount === 0;
  }, [allArticleCount, articles.length, filter, hasActiveSearchOrFacet, isLoading, unreadArticleCount]);
  const emptyStateMessage = useMemo(() => {
    if (allArticleCount === 0) {
      return "읽고 싶은 아티클을 추가해보세요!";
    }
    if (unreadArticleCount === 0) {
      return "모든 아티클을 읽으셨어요! 새로운 아티클을 추가해보는게 어떠신가요?";
    }
    return "현재 조건에 맞는 아티클이 없습니다.";
  }, [allArticleCount, unreadArticleCount]);
  const syncSessionProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      const current = getStoredSession();
      if (!current?.token) {
        return;
      }
      saveSession({
        token: current.token,
        email: profile.userId,
        name: profile.displayName,
        pictureUrl: profile.avatarUrl ?? undefined
      });
      setSession(getStoredSession());
    } catch {
      // Guest mode or expired session. Ignore profile sync failures.
    }
  }, []);

  useEffect(() => {
    setSession(getStoredSession());
    void syncSessionProfile();
  }, [syncSessionProfile]);

  useEffect(() => {
    const handler = () => setSession(getStoredSession());
    window.addEventListener(sessionChangedEventName(), handler);
    return () => {
      window.removeEventListener(sessionChangedEventName(), handler);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width:1200px)");
    const syncSidebarState = () => setIsSidebarOpen(mediaQuery.matches);
    syncSidebarState();
    mediaQuery.addEventListener("change", syncSidebarState);
    return () => mediaQuery.removeEventListener("change", syncSidebarState);
  }, []);

  useEffect(() => {
    void fetchFacets();
  }, [fetchFacets]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [isReadParam, sort, searchQuery, selectedCategory, selectedDomain]);

  useEffect(() => {
    const showInitialLoader = !hasFetchedRef.current;
    hasFetchedRef.current = true;
    void fetchArticles(showInitialLoader, page);
  }, [fetchArticles, page]);

  async function handleCreate(url: string, category?: string | null, description?: string | null) {
    await createArticle({ url, category, description });
    setListError(null);
    await fetchFacets();
    if (page !== 1) {
      setPage(1);
      return;
    }
    await fetchArticles(false, 1);
  }

  async function handleToggleRead(card: ArticleCard) {
    const nextRead = !card.isRead;
    setMutatingArticleId(card.id);
    setListError(null);

    try {
      await patchArticle(card.id, { isRead: nextRead });
      await fetchArticles(false, page);
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setMutatingArticleId(null);
    }
  }

  async function handleUpdateCategory(card: ArticleCard, category: string | null) {
    setMutatingArticleId(card.id);
    setListError(null);

    try {
      await patchArticle(card.id, { category });
      await fetchFacets();
      const response = await fetchArticles(false, page);
      if (response && response.items.length === 0 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setMutatingArticleId(null);
    }
  }

  async function handleSaveMemo(card: ArticleCard, memo: string) {
    setMutatingArticleId(card.id);
    setListError(null);

    try {
      await patchArticle(card.id, { description: memo });
      await fetchArticles(false, page);
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setMutatingArticleId(null);
    }
  }

  async function handleDelete(card: ArticleCard) {
    if (!window.confirm("아티클을 삭제할까요?")) {
      return;
    }

    setMutatingArticleId(card.id);
    setListError(null);

    try {
      await deleteArticle(card.id);
      await fetchFacets();
      const response = await fetchArticles(false, page);
      if (response && response.items.length === 0 && page > 1) {
        setPage(page - 1);
      }
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setMutatingArticleId(null);
    }
  }

  async function handleGoogleCredential(idToken: string) {
    const auth = await loginWithGoogle(idToken);
    saveSession({ token: auth.token, email: auth.email });
    await syncSessionProfile();
    setSession(getStoredSession());
    setListError(null);
    const guestCount = getGuestArticleCount();
    if (guestCount > 0) {
      setGuestMigrationCount(guestCount);
      setIsMigrationDialogOpen(true);
    }
    await fetchFacets();
    if (page !== 1) {
      setPage(1);
      return;
    }
    await fetchArticles(false, 1);
  }

  async function handleConfirmGuestMigration() {
    setIsMigratingGuestData(true);
    setListError(null);
    try {
      await migrateGuestArticlesToServer();
      setIsMigrationDialogOpen(false);
      setGuestMigrationCount(0);
      await fetchFacets();
      if (page !== 1) {
        setPage(1);
        return;
      }
      await fetchArticles(false, 1);
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setIsMigratingGuestData(false);
    }
  }

  function handleSkipGuestMigration() {
    setIsMigrationDialogOpen(false);
    setGuestMigrationCount(0);
  }

  async function handleLogout() {
    try {
      await logout();
      clearSession();
      setSession(null);
      setIsSyncBannerDismissed(false);
    } catch (error) {
      setListError(parseErrorMessage(error));
      return;
    }

    setListError(null);
    await fetchFacets();
    if (page !== 1) {
      setPage(1);
      return;
    }
    await fetchArticles(false, 1);
  }

  return (
    <ThemeProvider theme={HOME_THEME}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "#1e293b" }}>
        {showSyncBanner && <SyncBanner onLoginClick={() => setIsLoginModalOpen(true)} onDismiss={() => setIsSyncBannerDismissed(true)} />}
        <TopNavigation
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
          searchQuery={searchInput}
          onSearchQueryChange={setSearchInput}
          isLoggedIn={Boolean(session)}
          userName={session?.name ?? session?.email}
          userAvatarUrl={session?.pictureUrl}
          onAvatarClickWhenLoggedOut={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          hasSyncBanner={showSyncBanner}
        />

        <Box sx={{ height: `${contentTopOffset}px` }} />

        <Box sx={{ display: "flex" }}>
          <Box sx={{ display: { xs: "none", lg: "block" }, width: isSidebarOpen ? DRAWER_WIDTH : 0, transition: "width 180ms ease" }} />
          <SidebarFilters
            open={isSidebarOpen}
            filter={filter}
            sort={sort}
            category={selectedCategory}
            domain={selectedDomain}
            categories={facets.categories}
            domains={facets.domains}
            topOffset={sidebarTopOffset}
            onClose={() => setIsSidebarOpen(false)}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onCategoryChange={setSelectedCategory}
            onDomainChange={setSelectedDomain}
          />

          <Box component="main" sx={{ flex: 1, px: { xs: 2, sm: 3, lg: 4 }, py: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography sx={{ fontSize: 18, fontWeight: 700 }}>저장한 아티클</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 400, color: "#64748b" }}>{totalItems}개 항목</Typography>
                {isRefreshing && <Typography sx={{ fontSize: 12, color: "#64748b" }}>불러오는 중...</Typography>}
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
                  value={sort}
                  onChange={(event) => setSort(event.target.value as ArticleSort)}
                  sx={{ display: { lg: "none" }, minWidth: 120 }}
                >
                  <MenuItem value="latest">최신순</MenuItem>
                  <MenuItem value="oldest">오래된순</MenuItem>
                </TextField>
              </Stack>
            </Stack>

            {listError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {listError}
              </Alert>
            )}

            {isLoading ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 12 }}>
                <CircularProgress size={28} />
              </Box>
            ) : articles.length === 0 ? (
              <Box sx={{ display: "grid", placeItems: "center", py: 12, gap: 2 }}>
                <Typography sx={{ color: "#64748b", fontSize: { xs: 18, sm: 20 }, fontWeight: 600, textAlign: "center" }}>
                  {showCenteredAddCta ? emptyStateMessage : "현재 조건에 맞는 아티클이 없습니다."}
                </Typography>
                {showCenteredAddCta && (
                  <Button variant="contained" onClick={() => setIsSaveModalOpen(true)} startIcon={<AddIcon />}>
                    추가
                  </Button>
                )}
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
                        lg: "repeat(4, minmax(0, 1fr))"
                      }
                    }}
                  >
                    {articles.map((card) => (
                      <ArticleCardItem
                        key={card.id}
                        card={card}
                        categories={facets.categories}
                        isBusy={mutatingArticleId === card.id}
                        onDelete={handleDelete}
                        onUpdateCategory={handleUpdateCategory}
                        onClick={() => setSelectedCard(card)}
                      />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                    {articles.map((card) => (
                      <ArticleListItem
                        key={card.id}
                        card={card}
                        categories={facets.categories}
                        isBusy={mutatingArticleId === card.id}
                        onDelete={handleDelete}
                        onUpdateCategory={handleUpdateCategory}
                        onClick={() => setSelectedCard(card)}
                      />
                    ))}
                  </Box>
                )}

                {totalPages > 1 && (
                  <Stack direction="row" justifyContent="center">
                    <Pagination
                      color="primary"
                      shape="rounded"
                      page={page}
                      count={totalPages}
                      onChange={(_, nextPage) => setPage(nextPage)}
                    />
                  </Stack>
                )}
              </Stack>
            )}
          </Box>
        </Box>

        {!showCenteredAddCta && (
          <Fab color="primary" sx={{ position: "fixed", right: 32, bottom: 32 }} onClick={() => setIsSaveModalOpen(true)}>
            <AddIcon />
          </Fab>
        )}
        <SaveLinkModal open={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} categories={facets.categories} onSave={handleCreate} />
        <LoginModal open={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onGoogleCredential={handleGoogleCredential} />
        <GuestMigrationDialog
          open={isMigrationDialogOpen}
          count={guestMigrationCount}
          isMigrating={isMigratingGuestData}
          onConfirm={handleConfirmGuestMigration}
          onCancel={handleSkipGuestMigration}
        />
        <ArticleDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onToggleRead={handleToggleRead}
          onSaveMemo={handleSaveMemo}
          isBusy={selectedCardBusy}
        />
      </Box>
    </ThemeProvider>
  );
}

