import { useCallback, useRef, useState } from "react";
import { useEffect } from "react";
import {
  createArticle,
  deleteArticle,
  listArticleFacets,
  listArticles,
  patchArticle,
} from "@/lib/articles";
import type { ArticleCard, ArticleFacets, ArticleSort, ArticlePage } from "@/types";

const PAGE_SIZE = 8;

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export type UseArticlesInput = {
  isReadParam: boolean | undefined;
  sort: ArticleSort;
  searchQuery: string;
  selectedCategory: string;
  page: number;
  setPage: (page: number) => void;
};

export type UseArticlesReturn = {
  articles: ArticleCard[];
  facets: ArticleFacets;
  totalPages: number;
  totalItems: number;
  allArticleCount: number;
  unreadArticleCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  listError: string | null;
  mutatingArticleId: number | null;
  selectedCard: ArticleCard | null;
  setSelectedCard: (card: ArticleCard | null) => void;
  handleCreate: (url: string, category?: string | null, description?: string | null) => Promise<void>;
  handleToggleRead: (card: ArticleCard) => Promise<void>;
  handleUpdateCategory: (card: ArticleCard, category: string | null) => Promise<void>;
  handleSaveMemo: (card: ArticleCard, memo: string) => Promise<void>;
  handleDelete: (card: ArticleCard) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useArticles({
  isReadParam,
  sort,
  searchQuery,
  selectedCategory,
  page,
  setPage,
}: UseArticlesInput): UseArticlesReturn {
  const [articles, setArticles] = useState<ArticleCard[]>([]);
  const [facets, setFacets] = useState<ArticleFacets>({ categories: [] });
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [allArticleCount, setAllArticleCount] = useState(0);
  const [unreadArticleCount, setUnreadArticleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [mutatingArticleId, setMutatingArticleId] = useState<number | null>(null);
  const [selectedCard, setSelectedCard] = useState<ArticleCard | null>(null);
  const hasFetchedRef = useRef(false);

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
            page: targetPage,
            size: PAGE_SIZE,
          }),
          listArticles({ page: 1, size: 1 }),
          listArticles({ isRead: false, page: 1, size: 1 }),
        ]);
        setArticles(response.items);
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
    [isReadParam, sort, searchQuery, selectedCategory]
  );

  useEffect(() => {
    void fetchFacets();
  }, [fetchFacets]);

  useEffect(() => {
    const showInitialLoader = !hasFetchedRef.current;
    hasFetchedRef.current = true;
    void fetchArticles(showInitialLoader, page);
  }, [fetchArticles, page]);

  const refresh = useCallback(async () => {
    await Promise.all([fetchFacets(), fetchArticles(false, page)]);
  }, [fetchFacets, fetchArticles, page]);

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

  return {
    articles,
    facets,
    totalPages,
    totalItems,
    allArticleCount,
    unreadArticleCount,
    isLoading,
    isRefreshing,
    listError,
    mutatingArticleId,
    selectedCard,
    setSelectedCard,
    handleCreate,
    handleToggleRead,
    handleUpdateCategory,
    handleSaveMemo,
    handleDelete,
    refresh,
  };
}
