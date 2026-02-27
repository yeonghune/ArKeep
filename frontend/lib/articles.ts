import { api, ApiRequestError } from "./api";
import { getStoredSession } from "./session";
import type { ArticleCard, ArticleFacets, ArticlePage, ArticleSort } from "../app/home-types";

const LOCAL_ARTICLES_KEY = "arkeep_guest_articles_v1";
const DEFAULT_PAGE_SIZE = 8;

export type ListArticlesParams = {
  isRead?: boolean;
  sort?: ArticleSort;
  q?: string;
  category?: string;
  domain?: string;
  page?: number;
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

function shouldFallbackToLocal(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return error.status === 401 || error.code === "UNAUTHORIZED";
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("session expired") || message.includes("(401)") || message.includes("authentication required");
  }
  return false;
}

async function withServerFallback<T>(serverCall: () => Promise<T>, localCall: () => Promise<T> | T): Promise<T> {
  if (hasAccessToken()) {
    return serverCall();
  }

  try {
    // Try server first so api.ts can trigger bootstrap refresh from cookie.
    return await serverCall();
  } catch (error) {
    if (shouldFallbackToLocal(error)) {
      return await localCall();
    }
    throw error;
  }
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
  if (params.category && params.category.trim().length > 0) {
    query.set("category", params.category.trim());
  }
  if (params.domain && params.domain.trim().length > 0) {
    query.set("domain", params.domain.trim());
  }
  if (params.page) {
    query.set("page", String(params.page));
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
      : "Saved for later";
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
    if (q && !item.title.toLowerCase().includes(q)) {
      return false;
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

function paginateLocalArticles(items: ArticleCard[], page = 1, size = DEFAULT_PAGE_SIZE): ArticlePage {
  const safePage = page < 1 ? 1 : page;
  const safeSize = size < 1 ? DEFAULT_PAGE_SIZE : size;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeSize;
  const paged = items.slice(start, start + safeSize);

  return {
    items: paged,
    page: currentPage,
    size: safeSize,
    totalItems,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1
  };
}

export async function listArticles(params: ListArticlesParams = {}): Promise<ArticlePage> {
  return withServerFallback(
    () => api<ArticlePage>(`/articles${toQuery(params)}`),
    () => {
      const local = readLocalArticles();
      const filtered = filterLocalArticles(local, params);
      const sorted = sortLocalArticles(filtered, params.sort ?? "latest");
      return paginateLocalArticles(sorted, params.page ?? 1, params.size ?? DEFAULT_PAGE_SIZE);
    }
  );
}

export async function listArticleFacets(): Promise<ArticleFacets> {
  return withServerFallback(
    () => api<ArticleFacets>("/articles/facets"),
    () => {
      const local = readLocalArticles();
      const categories = Array.from(
        new Set(local.map((item) => item.category).filter((value): value is string => Boolean(value && value.trim().length > 0)))
      ).sort((a, b) => a.localeCompare(b));
      const domains = Array.from(new Set(local.map((item) => item.domain))).sort((a, b) => a.localeCompare(b));
      return { categories, domains };
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
        description: input.description === undefined ? current.description : input.description?.trim() || "Saved for later"
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
