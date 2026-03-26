"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import { HOME_THEME } from "@/constants/theme";
import { TOP_BAR_HEIGHT } from "@/constants/layout";
import ArKeepLogo from "@/components/ArKeepLogo";
import { getBootstrapPromise } from "@/lib/api";
import { deleteAccount, logout } from "@/lib/auth";
import { getMyProfile, type MyProfile } from "@/lib/profile";
import { clearSession, getStoredSession } from "@/lib/session";

export default function SettingsPage() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      await getBootstrapPromise();
      const session = getStoredSession();
      if (!session?.token) {
        router.replace("/");
        return;
      }
      setIsLoggedIn(true);
      setIsHydrated(true);
      try {
        const p = await getMyProfile();
        setProfile(p);
      } catch {
        // 프로필 실패는 무시 — 세션 이메일로 fallback
      }
    })();
  }, [router]);

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      clearSession();
      router.replace("/");
    } catch {
      setError("계정 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [router]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch {
      // 로그아웃 실패해도 클라이언트 세션은 클리어
    }
    clearSession();
    router.replace("/");
  }, [router]);

  if (!isHydrated || !isLoggedIn) {
    return (
      <ThemeProvider theme={HOME_THEME}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <CircularProgress size={28} />
        </Box>
      </ThemeProvider>
    );
  }

  const session = getStoredSession();
  const displayName = profile?.displayName ?? session?.name ?? "사용자";
  const email = session?.email ?? "";
  const avatarUrl = profile?.avatarUrl ?? session?.pictureUrl;
  const initials = displayName.charAt(0);

  return (
    <ThemeProvider theme={HOME_THEME}>
      {/* 상단 바 */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: TOP_BAR_HEIGHT,
          display: "flex",
          alignItems: "center",
          px: 2,
          gap: 1.5,
          borderBottom: "1px solid #e2e8f0",
          bgcolor: "#fff",
          zIndex: 100,
        }}
      >
        <IconButton size="small" onClick={() => router.back()} sx={{ color: "#64748b" }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ArKeepLogo size={20} />
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>설정</Typography>
        </Box>
      </Box>

      {/* 본문 */}
      <Box sx={{ pt: `${TOP_BAR_HEIGHT}px`, minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>

          {/* 계정 정보 */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              mb: 2,
            }}
          >
            <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={avatarUrl ?? undefined}
                sx={{ width: 48, height: 48, bgcolor: "#1976d2", fontSize: 18 }}
              >
                {!avatarUrl && initials}
              </Avatar>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#1e293b" }}>{displayName}</Typography>
                <Typography sx={{ fontSize: 13, color: "#64748b" }}>{email}</Typography>
              </Box>
            </Box>
            <Divider />
            <Box sx={{ px: 2.5, py: 1.5 }}>
              <Button
                fullWidth
                variant="text"
                onClick={() => void handleLogout()}
                sx={{
                  justifyContent: "flex-start",
                  color: "#475569",
                  fontSize: 14,
                  textTransform: "none",
                  py: 0.75,
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                로그아웃
              </Button>
            </Box>
          </Box>

          {/* 위험 영역 */}
          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 2,
              border: "1px solid #fecaca",
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
              <PersonOutlineIcon sx={{ fontSize: 20, color: "#ef4444" }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#ef4444" }}>위험 구역</Typography>
            </Box>
            <Divider sx={{ borderColor: "#fecaca" }} />
            <Box sx={{ px: 2.5, py: 2 }}>
              <Typography sx={{ fontSize: 13, color: "#64748b", mb: 2 }}>
                계정을 삭제하면 저장된 모든 아티클과 카테고리가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2, fontSize: 13 }}>
                  {error}
                </Alert>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={() => setIsDeleteDialogOpen(true)}
                sx={{ textTransform: "none", fontSize: 14, borderRadius: 1.5 }}
              >
                계정 삭제
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 계정 삭제 확인 다이얼로그 */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => !isDeleting && setIsDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, maxWidth: 360 } }}
      >
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700, pb: 1 }}>정말 계정을 삭제하시겠어요?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            저장된 모든 아티클, 카테고리 데이터가 즉시 삭제되며 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isDeleting}
            sx={{ textTransform: "none", color: "#64748b", fontSize: 13 }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleDeleteAccount()}
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={14} color="inherit" /> : <DeleteForeverIcon />}
            sx={{ textTransform: "none", fontSize: 13, borderRadius: 1.5 }}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
