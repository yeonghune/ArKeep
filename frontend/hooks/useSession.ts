import { useCallback, useEffect, useState } from "react";
import { loginWithGoogle, logout } from "@/lib/auth";
import { getMyProfile } from "@/lib/profile";
import {
  clearSession,
  getStoredSession,
  saveSession,
  sessionChangedEventName,
  type Session,
} from "@/lib/session";
import { getGuestArticleCount, migrateGuestArticlesToServer } from "@/lib/articles";

function parseErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

export type UseSessionReturn = {
  session: Session | null;
  showSyncBanner: boolean;
  isMigrationDialogOpen: boolean;
  guestMigrationCount: number;
  isMigratingGuestData: boolean;
  authError: string | null;
  dismissSyncBanner: () => void;
  handleGoogleCredential: (idToken: string, onSuccess: () => Promise<void>) => Promise<void>;
  handleConfirmGuestMigration: (onSuccess: () => Promise<void>) => Promise<void>;
  handleSkipGuestMigration: () => void;
  handleLogout: (onSuccess: () => Promise<void>) => Promise<void>;
  clearAuthError: () => void;
};

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isSyncBannerDismissed, setIsSyncBannerDismissed] = useState(false);
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = useState(false);
  const [guestMigrationCount, setGuestMigrationCount] = useState(0);
  const [isMigratingGuestData, setIsMigratingGuestData] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncSessionProfile = useCallback(async () => {
    try {
      const profile = await getMyProfile();
      const current = getStoredSession();
      if (!current?.token) return;
      saveSession({
        token: current.token,
        email: current.email,
        name: profile.displayName,
        pictureUrl: profile.avatarUrl ?? undefined,
      });
      setSession(getStoredSession());
    } catch {
      // Guest mode or expired session — ignore profile sync failures.
    }
  }, []);

  // 초기 세션 로드
  useEffect(() => {
    setSession(getStoredSession());
    void syncSessionProfile();
  }, [syncSessionProfile]);

  // 세션 변경 이벤트 리스너
  useEffect(() => {
    const handler = () => setSession(getStoredSession());
    window.addEventListener(sessionChangedEventName(), handler);
    return () => window.removeEventListener(sessionChangedEventName(), handler);
  }, []);

  const showSyncBanner = !session && !isSyncBannerDismissed;

  const dismissSyncBanner = useCallback(() => setIsSyncBannerDismissed(true), []);

  const handleGoogleCredential = useCallback(
    async (idToken: string, onSuccess: () => Promise<void>) => {
      const auth = await loginWithGoogle(idToken);
      saveSession({ token: auth.token, email: auth.email });
      await syncSessionProfile();
      setSession(getStoredSession());
      setAuthError(null);
      const guestCount = getGuestArticleCount();
      if (guestCount > 0) {
        setGuestMigrationCount(guestCount);
        setIsMigrationDialogOpen(true);
      }
      await onSuccess();
    },
    [syncSessionProfile]
  );

  const handleConfirmGuestMigration = useCallback(
    async (onSuccess: () => Promise<void>) => {
      setIsMigratingGuestData(true);
      setAuthError(null);
      try {
        await migrateGuestArticlesToServer();
        setIsMigrationDialogOpen(false);
        setGuestMigrationCount(0);
        await onSuccess();
      } catch (error) {
        setAuthError(parseErrorMessage(error));
      } finally {
        setIsMigratingGuestData(false);
      }
    },
    []
  );

  const handleSkipGuestMigration = useCallback(() => {
    setIsMigrationDialogOpen(false);
    setGuestMigrationCount(0);
  }, []);

  const handleLogout = useCallback(
    async (onSuccess: () => Promise<void>) => {
      try {
        await logout();
        clearSession();
        setSession(null);
        setIsSyncBannerDismissed(false);
        setAuthError(null);
        await onSuccess();
      } catch (error) {
        setAuthError(parseErrorMessage(error));
      }
    },
    []
  );

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return {
    session,
    showSyncBanner,
    isMigrationDialogOpen,
    guestMigrationCount,
    isMigratingGuestData,
    authError,
    dismissSyncBanner,
    handleGoogleCredential,
    handleConfirmGuestMigration,
    handleSkipGuestMigration,
    handleLogout,
    clearAuthError,
  };
}
