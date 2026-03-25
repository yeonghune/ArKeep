export type ArticleSort = "latest" | "oldest";
export type ArticleFilter = "all" | "read" | "unread";
export type ArticleSearchField = "title" | "url";

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

export type ArticleCursorPage = {
  items: ArticleCard[];
  nextCursor: string | null;
  hasNext: boolean;
  totalItems: number;
};

