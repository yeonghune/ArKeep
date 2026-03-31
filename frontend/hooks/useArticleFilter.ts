import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import type { ArticleFilter, ArticleSearchField, ArticleSort } from "@/types";

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
  searchField: ArticleSearchField;
  isSearchPending: boolean;
  selectedCategory: string;
  isReadParam: boolean | undefined;
};

export type ArticleFilterActions = {
  setFilter: (value: ArticleFilter) => void;
  setSort: (value: ArticleSort) => void;
  setSearchInput: (value: string) => void;
  setSearchField: (value: ArticleSearchField) => void;
  setSelectedCategory: (value: string) => void;
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
  const [searchField, setSearchFieldRaw] = useState<ArticleSearchField>("title");
  const [selectedCategory, setSelectedCategoryRaw] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed.startsWith("#") && trimmed.length > 1) {
        setSearchFieldRaw("tag");
        setSearchQuery(trimmed.slice(1).trim());
        return;
      }
      if (/^tag:\s*/i.test(trimmed)) {
        setSearchFieldRaw("tag");
        setSearchQuery(trimmed.replace(/^tag:\s*/i, "").trim());
        return;
      }
      setSearchQuery(trimmed);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const setFilter = useCallback((value: ArticleFilter) => { setFilterRaw(value); }, []);
  const setSort = useCallback((value: ArticleSort) => {
    setSortRaw(value);
    localStorage.setItem(SORT_KEY, value);
  }, []);
  const setSelectedCategory = useCallback((value: string) => { setSelectedCategoryRaw(value); }, []);
  const setSearchField = useCallback((value: ArticleSearchField) => { setSearchFieldRaw(value); }, []);

  const isReadParam = useMemo(() => toIsReadParam(filter), [filter]);
  const isSearchPending = searchInput.trim() !== searchQuery;

  return {
    filter,
    sort,
    searchInput,
    searchQuery,
    searchField,
    isSearchPending,
    selectedCategory,
    isReadParam,
    setFilter,
    setSort,
    setSearchInput,
    setSearchField,
    setSelectedCategory,
  };
}
