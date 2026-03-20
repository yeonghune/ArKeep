const CATEGORY_PALETTE = [
  "#2563eb",
  "#059669",
  "#ea580c",
  "#7c3aed",
  "#0f766e",
  "#dc2626",
  "#d97706",
  "#0891b2"
];

export const CATEGORY_OPTIONS = [
  "개발",
  "디자인",
  "비즈니스",
  "마케팅",
  "생산성",
  "뉴스",
  "기타"
];

export function getCategoryLabel(category: string | null): string {
  const normalized = category?.trim();
  return normalized && normalized.length > 0 ? normalized : "미분류";
}

export function getCategoryColor(category: string | null): string {
  const seed = (category ?? "uncategorized").toLowerCase();
  let hash = 0;
  for (let idx = 0; idx < seed.length; idx += 1) {
    hash = (hash * 31 + seed.charCodeAt(idx)) >>> 0;
  }
  return CATEGORY_PALETTE[hash % CATEGORY_PALETTE.length];
}

export function formatRelativeTime(dateInput: string): string {
  const date = new Date(dateInput);
  const createdAt = date.getTime();
  if (Number.isNaN(createdAt)) {
    return "";
  }

  const diffMs = Date.now() - createdAt;
  const diffMin = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMin < 60) {
    return `${diffMin}분 전`;
  }
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}시간 전`;
  }

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  // 캘린더 기준 날짜 차이 계산
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDay = Math.round((todayMidnight - dateMidnight) / 86400000);

  if (diffDay < 7) {
    return `${diffDay}일 전 (${dateStr})`;
  }
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) {
    return `${diffWeek}주 전 (${dateStr})`;
  }
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) {
    return `${diffMonth}개월 전 (${dateStr})`;
  }
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear}년 전 (${dateStr})`;
}
