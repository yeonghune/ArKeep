import { api, getBootstrapPromise } from "./api";
import { getStoredSession } from "./session";
import type { ArticleCard, ArticleCursorPage, ArticleSearchField, ArticleSort } from "@/types";

const LOCAL_ARTICLES_KEY = "arkeep_guest_articles_v1";
const DEFAULT_PAGE_SIZE = 8;

export type ListArticlesParams = {
  isRead?: boolean;
  sort?: ArticleSort;
  q?: string;
  searchField?: ArticleSearchField;
  category?: string;
  domain?: string;
  cursor?: string;
  size?: number;
};

export type CreateArticleInput = {
  url: string;
  category?: string | null;
  description?: string | null;
};

export type UpdateArticleInput = {
  isRead?: boolean;
  category?: string | null;
  description?: string | null;
};

export type BulkFilter = {
  isRead?: boolean;
  category?: string;
  q?: string;
  searchField?: string;
};

export type BulkUpdateInput = {
  ids?: number[];
  selectAll?: boolean;
  filters?: BulkFilter;
  isRead?: boolean;
  category?: string;
};

export type BulkDeleteInput = {
  ids?: number[];
  selectAll?: boolean;
  filters?: BulkFilter;
};

export type BulkActionResult = {
  affected: number;
};

type ArticleMigrationRequest = {
  items: Array<{
    url: string;
    title?: string | null;
    description?: string | null;
    thumbnailUrl?: string | null;
    domain?: string | null;
    category?: string | null;
    isRead?: boolean;
  }>;
};

type ArticleMigrationResponse = {
  total: number;
  created: number;
  duplicates: number;
  failed: number;
};

type MetadataPreviewResponse = {
  url: string;
  title: string;
  description: string;
  imageUrl: string | null;
  domain: string;
};

function hasAccessToken(): boolean {
  return Boolean(getStoredSession()?.token);
}

async function withServerFallback<T>(serverCall: () => Promise<T>, localCall: () => Promise<T> | T): Promise<T> {
  await getBootstrapPromise();

  if (hasAccessToken()) {
    return serverCall();
  }

  // Bootstrap completed with no token → confirmed guest → use localStorage directly
  return localCall();
}

function toQuery(params: ListArticlesParams): string {
  const query = new URLSearchParams();

  if (typeof params.isRead === "boolean") {
    query.set("isRead", String(params.isRead));
  }
  if (params.sort) {
    query.set("sort", params.sort);
  }
  if (params.q && params.q.trim().length > 0) {
    query.set("q", params.q.trim());
  }
  if (params.searchField) {
    query.set("searchField", params.searchField);
  }
  if (params.category && params.category.trim().length > 0) {
    query.set("category", params.category.trim());
  }
  if (params.domain && params.domain.trim().length > 0) {
    query.set("domain", params.domain.trim());
  }
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }
  if (params.size) {
    query.set("size", String(params.size));
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function readLocalArticles(): ArticleCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_ARTICLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArticleCard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalArticles(articles: ArticleCard[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_ARTICLES_KEY, JSON.stringify(articles));
}

function normalizeCategory(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname.trim().toLowerCase();
    return host.length > 0 ? host : "unknown";
  } catch {
    return "unknown";
  }
}

async function fetchMetadataPreview(url: string): Promise<MetadataPreviewResponse | null> {
  try {
    return await api<MetadataPreviewResponse>("/metadata/preview", {
      method: "POST",
      body: JSON.stringify({ url })
    });
  } catch {
    return null;
  }
}

async function createLocalArticle(input: CreateArticleInput): Promise<ArticleCard> {
  const now = new Date();
  const id = Number(`${now.getTime()}${Math.floor(Math.random() * 1000)}`);
  const normalizedUrl = input.url.trim();
  const preview = await fetchMetadataPreview(normalizedUrl);
  const domain = preview?.domain || extractDomain(normalizedUrl);
  const title = preview?.title?.trim() ? preview.title.trim() : normalizedUrl;
  const customDescription = input.description?.trim();
  const description = customDescription
    ? customDescription
    : preview?.description?.trim()
      ? preview.description.trim()
      : "";
  const thumbnailUrl = preview?.imageUrl ?? null;

  return {
    id,
    publicId: crypto.randomUUID(),
    url: normalizedUrl,
    title,
    description,
    thumbnailUrl,
    domain,
    category: normalizeCategory(input.category),
    isRead: false,
    createdAt: now.toISOString()
  };
}

function filterLocalArticles(items: ArticleCard[], params: ListArticlesParams): ArticleCard[] {
  const q = params.q?.trim().toLowerCase();
  const category = params.category?.trim();
  const domain = params.domain?.trim().toLowerCase();

  return items.filter((item) => {
    if (typeof params.isRead === "boolean" && item.isRead !== params.isRead) {
      return false;
    }
    if (q) {
      const searchTarget = params.searchField === "url"
        ? item.url.toLowerCase()
        : item.title.toLowerCase();
      if (!searchTarget.includes(q)) return false;
    }
    if (category && item.category !== category) {
      return false;
    }
    if (domain && item.domain.toLowerCase() !== domain) {
      return false;
    }
    return true;
  });
}

function sortLocalArticles(items: ArticleCard[], sort: ArticleSort = "latest"): ArticleCard[] {
  return [...items].sort((a, b) => {
    const aTs = Date.parse(a.createdAt);
    const bTs = Date.parse(b.createdAt);
    return sort === "oldest" ? aTs - bTs : bTs - aTs;
  });
}

function cursorLocalArticles(items: ArticleCard[], params: ListArticlesParams): ArticleCursorPage {
  const size = params.size ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? "latest";
  const totalItems = items.length;

  let sliced = items;
  if (params.cursor) {
    const cursorId = parseInt(params.cursor, 10);
    sliced = sort === "oldest"
      ? items.filter((item) => item.id > cursorId)
      : items.filter((item) => item.id < cursorId);
  }

  const fetched = sliced.slice(0, size + 1);
  const hasNext = fetched.length > size;
  const pageItems = fetched.slice(0, size);
  const nextCursor = hasNext && pageItems.length > 0 ? String(pageItems[pageItems.length - 1].id) : null;

  return { items: pageItems, nextCursor, hasNext, totalItems };
}

export async function listArticles(params: ListArticlesParams = {}): Promise<ArticleCursorPage> {
  return withServerFallback(
    () => api<ArticleCursorPage>(`/articles${toQuery(params)}`),
    () => {
      const local = readLocalArticles();
      const filtered = filterLocalArticles(local, params);
      const sorted = sortLocalArticles(filtered, params.sort ?? "latest");
      return cursorLocalArticles(sorted, params);
    }
  );
}


export async function createArticle(input: CreateArticleInput): Promise<ArticleCard> {
  return withServerFallback(
    () =>
      api<ArticleCard>("/articles", {
        method: "POST",
        body: JSON.stringify(input)
      }),
    async () => {
      const local = readLocalArticles();
      const normalizedUrl = input.url.trim();
      const duplicate = local.some((item) => item.url === normalizedUrl);
      if (duplicate) {
        throw new Error("Article already saved");
      }

      const created = await createLocalArticle(input);
      writeLocalArticles([created, ...local]);
      return created;
    }
  );
}

export async function patchArticle(id: number, input: UpdateArticleInput): Promise<ArticleCard> {
  return withServerFallback(
    () =>
      api<ArticleCard>(`/articles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input)
      }),
    () => {
      const local = readLocalArticles();
      const index = local.findIndex((item) => item.id === id);
      if (index < 0) {
        throw new Error("Article not found");
      }

      const current = local[index];
      const next: ArticleCard = {
        ...current,
        isRead: typeof input.isRead === "boolean" ? input.isRead : current.isRead,
        category: input.category === undefined ? current.category : normalizeCategory(input.category),
        description: input.description === undefined ? current.description : (input.description?.trim() ?? "")
      };

      const updated = [...local];
      updated[index] = next;
      writeLocalArticles(updated);
      return next;
    }
  );
}

export async function deleteArticle(id: number): Promise<void> {
  await withServerFallback(
    () => api<void>(`/articles/${id}`, { method: "DELETE" }),
    () => {
      const local = readLocalArticles();
      const exists = local.some((item) => item.id === id);
      if (!exists) {
        throw new Error("Article not found");
      }
      writeLocalArticles(local.filter((item) => item.id !== id));
      return undefined;
    }
  );
}

function matchesBulkFilter(item: ArticleCard, filters?: BulkFilter): boolean {
  if (!filters) return true;
  if (filters.isRead !== undefined && item.isRead !== filters.isRead) return false;
  if (filters.category && item.category !== filters.category) return false;
  if (filters.q) {
    const q = filters.q.toLowerCase();
    const target = filters.searchField === "url" ? item.url.toLowerCase() : item.title.toLowerCase();
    if (!target.includes(q)) return false;
  }
  return true;
}

export async function bulkUpdateArticles(input: BulkUpdateInput): Promise<BulkActionResult> {
  return withServerFallback(
    () =>
      api<BulkActionResult>("/articles/bulk", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    () => {
      const local = readLocalArticles();
      const idSet = input.selectAll ? null : new Set(input.ids ?? []);
      let affected = 0;
      const updated = local.map((item) => {
        const targeted = idSet ? idSet.has(item.id) : matchesBulkFilter(item, input.filters);
        if (!targeted) return item;
        affected++;
        return {
          ...item,
          isRead: input.isRead !== undefined ? input.isRead : item.isRead,
          category: input.category !== undefined ? normalizeCategory(input.category) : item.category,
        };
      });
      writeLocalArticles(updated);
      return { affected };
    }
  );
}

export async function bulkDeleteArticles(input: BulkDeleteInput): Promise<BulkActionResult> {
  return withServerFallback(
    () =>
      api<BulkActionResult>("/articles/bulk", {
        method: "DELETE",
        body: JSON.stringify(input),
      }),
    () => {
      const local = readLocalArticles();
      const idSet = input.selectAll ? null : new Set(input.ids ?? []);
      const remaining = local.filter((item) =>
        idSet ? !idSet.has(item.id) : !matchesBulkFilter(item, input.filters)
      );
      const affected = local.length - remaining.length;
      writeLocalArticles(remaining);
      return { affected };
    }
  );
}

export async function migrateGuestArticlesToServer(): Promise<ArticleMigrationResponse | null> {
  if (!hasAccessToken()) {
    return null;
  }

  const local = readLocalArticles();
  if (local.length === 0) {
    return null;
  }

  const payload: ArticleMigrationRequest = {
    items: local.map((item) => ({
      url: item.url,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      domain: item.domain,
      category: item.category,
      isRead: item.isRead
    }))
  };

  const result = await api<ArticleMigrationResponse>("/articles/migrate", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  writeLocalArticles([]);
  return result;
}

export function getGuestArticleCount(): number {
  return readLocalArticles().length;
}
