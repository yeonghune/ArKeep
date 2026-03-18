import { useCallback, useState } from "react";

export type ViewMode = "card" | "list";

const VIEW_MODE_KEY = "arkeep_view_mode";

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "card";
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return saved === "list" || saved === "card" ? saved : "card";
  });

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  return [viewMode, setViewMode];
}
