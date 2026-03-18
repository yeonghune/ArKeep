import { useCallback, useLayoutEffect, useState } from "react";

export type ViewMode = "card" | "list";

const VIEW_MODE_KEY = "arkeep_view_mode";

export function useViewMode(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>("card");

  // useLayoutEffect: DOM 업데이트 후 브라우저 페인트 전에 동기적으로 실행되어 깜빡임 없음
  // SSR에서는 실행되지 않으므로 서버/클라이언트 불일치 경고 없음
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
