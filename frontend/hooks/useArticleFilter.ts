import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ArticleFilter, ArticleSort } from "@/types";

const SEARCH_DEBOUNCE_MS = 300;
const SORT_KEY = "arkeep_sort";

function toIsReadParam(filter: ArticleFilter): boolean | undefined {
  if (filter === "all") return undefined;
  return filter === "read";
}

export type ArticleFilterState = {
  filter: ArticleFilter;
  sort: ArticleSort;
  searchInput: string;
  searchQuery: string;
  isSearchPending: boolean;
  selectedCategory: string;
  page: number;
  isReadParam: boolean | undefined;
};

export type ArticleFilterActions = {
  setFilter: (value: ArticleFilter) => void;
  setSort: (value: ArticleSort) => void;
  setSearchInput: (value: string) => void;
  setSelectedCategory: (value: string) => void;
  setPage: (page: number) => void;
};

export function useArticleFilter(): ArticleFilterState & ArticleFilterActions {
  const [filter, setFilterRaw] = useState<ArticleFilter>("unread");
  const [sort, setSortRaw] = useState<ArticleSort>("latest");

  useLayoutEffect(() => {
    const saved = localStorage.getItem(SORT_KEY);
    if (saved === "latest" || saved === "oldest") setSortRaw(saved);
  }, []);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategoryRaw] = useState("");
  const [page, setPage] = useState(1);

  // search debounce + page 리셋을 하나의 effect로 통합
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  // filter/sort/category setter에서 직접 page 리셋 (React 18 batching으로 단일 렌더)
  const setFilter = useCallback((value: ArticleFilter) => {
    setFilterRaw(value);
    setPage(1);
  }, []);

  const setSort = useCallback((value: ArticleSort) => {
    setSortRaw(value);
    setPage(1);
    localStorage.setItem(SORT_KEY, value);
  }, []);

  const setSelectedCategory = useCallback((value: string) => {
    setSelectedCategoryRaw(value);
    setPage(1);
  }, []);

  const isReadParam = useMemo(() => toIsReadParam(filter), [filter]);
  const isSearchPending = searchInput.trim() !== searchQuery;

  return {
    filter,
    sort,
    searchInput,
    searchQuery,
    isSearchPending,
    selectedCategory,
    page,
    isReadParam,
    setFilter,
    setSort,
    setSearchInput,
    setSelectedCategory,
    setPage,
  };
}
