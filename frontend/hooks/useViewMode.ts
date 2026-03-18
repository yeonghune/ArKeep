import { useCallback, useLayoutEffect, useState } from "react";

export type ViewMode = "card" | "list";

const VIEW_MODE_KEY = "arkeep_view_mode";

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>("card");

  useLayoutEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if (saved === "list" || saved === "card") {
      setViewModeState(saved);
    }
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  return [viewMode, setViewMode];
}
