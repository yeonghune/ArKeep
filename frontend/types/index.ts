export type ArticleSort = "latest" | "oldest";
export type ArticleFilter = "all" | "read" | "unread";

export type ArticleCard = {
  id: number;
  publicId: string;
  url: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  domain: string;
  category: string | null;
  isRead: boolean;
  createdAt: string;
};

export type ArticlePage = {
  items: ArticleCard[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type ArticleFacets = {
  categories: string[];
  domains: string[];
};
