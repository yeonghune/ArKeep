import { useCallback, useEffect, useRef, useState } from "react";
import {
  bulkDeleteArticles,
  bulkUpdateArticles,
  createArticle,
  deleteArticle,
  listArticles,
  patchArticle,
} from "@/lib/articles";
import type { BulkFilter } from "@/lib/articles";
import type { ArticleCard, ArticleSearchField, ArticleSort } from "@/types";

const PAGE_SIZE = 20;

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export type UseArticlesInput = {
  isReadParam: boolean | undefined;
  sort: ArticleSort;
  searchQuery: string;
  searchField: ArticleSearchField;
  selectedCategory: string;
};

export type UseArticlesReturn = {
  articles: ArticleCard[];
  totalItems: number;
  allArticleCount: number;
  unreadArticleCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  listError: string | null;
  mutatingArticleId: number | null;
  selectedCard: ArticleCard | null;
  setSelectedCard: (card: ArticleCard | null) => void;
  loadMore: () => void;
  handleCreate: (url: string, category?: string | null, description?: string | null) => Promise<void>;
  handleToggleRead: (card: ArticleCard) => Promise<void>;
  handleUpdateCategory: (card: ArticleCard, category: string | null) => Promise<void>;
  handleSaveMemo: (card: ArticleCard, memo: string) => Promise<void>;
  handleDelete: (card: ArticleCard) => Promise<void>;
  handleBulkToggleRead: (ids: number[], markAsRead: boolean, selectAll?: boolean) => Promise<void>;
  handleBulkUpdateCategory: (ids: number[], category: string | null, selectAll?: boolean) => Promise<void>;
  handleBulkDelete: (ids: number[], selectAll?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useArticles({
  isReadParam,
  sort,
  searchQuery,
  searchField,
  selectedCategory,
}: UseArticlesInput): UseArticlesReturn {
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [allArticleCount, setAllArticleCount] = useState(0);
  const [unreadArticleCount, setUnreadArticleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [mutatingArticleId, setMutatingArticleId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<ArticleCard | null>(null);

  const isLoadingMoreRef = useRef(false);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);

  const fetchInitial = useCallback(async () => {
    setIsLoading(true);
    setArticles([]);
    setNextCursor(null);
    setHasMore(false);
    nextCursorRef.current = null;
    hasMoreRef.current = false;
    setListError(null);

    try {
      const [response, allCount, unreadCount] = await Promise.all([
        listArticles({ isRead: isReadParam, sort, q: searchQuery, searchField, category: selectedCategory, size: PAGE_SIZE }),
        listArticles({ size: 1 }),
        listArticles({ isRead: false, size: 1 }),
      ]);
      setArticles(response.items);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasNext);
      nextCursorRef.current = response.nextCursor;
      hasMoreRef.current = response.hasNext;
      setTotalItems(response.totalItems);
      setAllArticleCount(allCount.totalItems);
      setUnreadArticleCount(unreadCount.totalItems);
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [isReadParam, sort, searchQuery, searchField, selectedCategory]);

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || isLoadingMoreRef.current || !nextCursorRef.current) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    listArticles({
      isRead: isReadParam,
      sort,
      q: searchQuery,
      searchField,
      category: selectedCategory,
      cursor: nextCursorRef.current,
      size: PAGE_SIZE,
    })
      .then((response) => {
        setArticles((prev) => [...prev, ...response.items]);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasNext);
        nextCursorRef.current = response.nextCursor;
        hasMoreRef.current = response.hasNext;
        setTotalItems(response.totalItems);
      })
      .catch((error) => {
        setListError(parseErrorMessage(error));
      })
      .finally(() => {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      });
  }, [isReadParam, sort, searchQuery, searchField, selectedCategory]);

  const refresh = useCallback(async () => {
    await fetchInitial();
  }, [fetchInitial]);

  async function handleCreate(url: string, category?: string | null, description?: string | null) {
    setListError(null);
    const created = await createArticle({ url, category, description });
    setAllArticleCount((prev) => prev + 1);
    setUnreadArticleCount((prev) => prev + 1);
    setTotalItems((prev) => prev + 1);

    const matchesFilter =
      (isReadParam === undefined || isReadParam === false) &&
      (!selectedCategory || created.category === selectedCategory);

    if (matchesFilter && sort !== "oldest") {
      setArticles((prev) => [created, ...prev]);
    }
  }

  async function handleToggleRead(card: ArticleCard) {
    const nextRead = !card.isRead;
    setMutatingArticleId(card.id);
    setListError(null);
    try {
      await patchArticle(card.id, { isRead: nextRead });
      if (isReadParam !== undefined) {
        setArticles((prev) => prev.filter((a) => a.id !== card.id));
        setTotalItems((prev) => Math.max(0, prev - 1));
      } else {
        setArticles((prev) => prev.map((a) => a.id === card.id ? { ...a, isRead: nextRead } : a));
      }
      setSelectedCard((cur) => cur?.id === card.id ? { ...cur, isRead: nextRead } : cur);
      if (nextRead) {
        setUnreadArticleCount((prev) => Math.max(0, prev - 1));
      } else {
        setUnreadArticleCount((prev) => prev + 1);
      }
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
      const updated = await patchArticle(card.id, { category });
      if (selectedCategory && updated.category !== selectedCategory) {
        setArticles((prev) => prev.filter((a) => a.id !== card.id));
        setTotalItems((prev) => Math.max(0, prev - 1));
      } else {
        setArticles((prev) => prev.map((a) => a.id === card.id ? updated : a));
      }
      setSelectedCard((cur) => cur?.id === card.id ? updated : cur);
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setMutatingArticleId(null);
    }
  }

  async function handleSaveMemo(card: ArticleCard, memo: string) {
    setListError(null);
    try {
      const updated = await patchArticle(card.id, { description: memo });
      setArticles((prev) => prev.map((a) => a.id === card.id ? updated : a));
      setSelectedCard((cur) => cur?.id === card.id ? updated : cur);
    } catch (error) {
      setListError(parseErrorMessage(error));
    }
  }

  async function handleDelete(card: ArticleCard) {
    if (!window.confirm("아티클을 삭제할까요?")) return;
    setMutatingArticleId(card.id);
    setListError(null);
    try {
      await deleteArticle(card.id);
      setArticles((prev) => prev.filter((a) => a.id !== card.id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      setAllArticleCount((prev) => Math.max(0, prev - 1));
      if (!card.isRead) setUnreadArticleCount((prev) => Math.max(0, prev - 1));
      setSelectedCard((cur) => cur?.id === card.id ? null : cur);
    } catch (error) {
      setListError(parseErrorMessage(error));
    } finally {
      setMutatingArticleId(null);
    }
  }

  function currentFilters(): BulkFilter {
    return {
      isRead: isReadParam,
      category: selectedCategory || undefined,
      q: searchQuery || undefined,
      searchField: searchField || undefined,
    };
  }

  async function handleBulkToggleRead(ids: number[], markAsRead: boolean, selectAll = false) {
    setListError(null);
    try {
      await bulkUpdateArticles(
        selectAll
          ? { selectAll: true, filters: currentFilters(), isRead: markAsRead }
          : { ids, isRead: markAsRead }
      );
      if (selectAll) {
        // selectAll 후에는 전체 리프레시
        await fetchInitial();
        return;
      }
      if (isReadParam !== undefined) {
        setArticles((prev) => prev.filter((a) => !ids.includes(a.id)));
        setTotalItems((prev) => Math.max(0, prev - ids.length));
      } else {
        setArticles((prev) =>
          prev.map((a) => ids.includes(a.id) ? { ...a, isRead: markAsRead } : a)
        );
      }
      const readDelta = markAsRead ? -ids.length : ids.length;
      setUnreadArticleCount((prev) => Math.max(0, prev + readDelta));
    } catch (error) {
      setListError(parseErrorMessage(error));
    }
  }

  async function handleBulkUpdateCategory(ids: number[], category: string | null, selectAll = false) {
    setListError(null);
    try {
      await bulkUpdateArticles(
        selectAll
          ? { selectAll: true, filters: currentFilters(), category: category ?? "" }
          : { ids, category: category ?? "" }
      );
      if (selectAll) {
        await fetchInitial();
        return;
      }
      if (selectedCategory) {
        setArticles((prev) => prev.filter((a) => !ids.includes(a.id)));
        setTotalItems((prev) => Math.max(0, prev - ids.length));
      } else {
        setArticles((prev) =>
          prev.map((a) => ids.includes(a.id) ? { ...a, category } : a)
        );
      }
    } catch (error) {
      setListError(parseErrorMessage(error));
    }
  }

  async function handleBulkDelete(ids: number[], selectAll = false) {
    setListError(null);
    try {
      await bulkDeleteArticles(
        selectAll
          ? { selectAll: true, filters: currentFilters() }
          : { ids }
      );
      if (selectAll) {
        await fetchInitial();
        return;
      }
      const removedCards = articles.filter((a) => ids.includes(a.id));
      const removedUnread = removedCards.filter((a) => !a.isRead).length;
      setArticles((prev) => prev.filter((a) => !ids.includes(a.id)));
      setTotalItems((prev) => Math.max(0, prev - ids.length));
      setAllArticleCount((prev) => Math.max(0, prev - ids.length));
      setUnreadArticleCount((prev) => Math.max(0, prev - removedUnread));
      setSelectedCard((cur) => (cur && ids.includes(cur.id) ? null : cur));
    } catch (error) {
      setListError(parseErrorMessage(error));
    }
  }

  return {
    articles,
    totalItems,
    allArticleCount,
    unreadArticleCount,
    isLoading,
    isLoadingMore,
    hasMore,
    listError,
    mutatingArticleId,
    selectedCard,
    setSelectedCard,
    loadMore,
    handleCreate,
    handleToggleRead,
    handleUpdateCategory,
    handleSaveMemo,
    handleDelete,
    handleBulkToggleRead,
    handleBulkUpdateCategory,
    handleBulkDelete,
    refresh,
  };
}
