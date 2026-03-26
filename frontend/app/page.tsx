"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GridViewIcon from "@mui/icons-material/GridView";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSession } from "@/hooks/useSession";

type GoogleCredentialResponse = { credential?: string };

const GOOGLE_SCRIPT_ID = "google-gsi-client";

function ensureGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google script load failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google script load failed"));
    document.head.appendChild(script);
  });
}

const FAKE_ARTICLES = [
  { title: "React Server Components 완벽 가이드", domain: "vercel.com", gradient: "linear-gradient(135deg, #3b82f6, #8b5cf6)", read: false },
  { title: "2024 디자인 트렌드 총정리", domain: "medium.com", gradient: "linear-gradient(135deg, #10b981, #3b82f6)", read: true },
  { title: "JavaScript 성능 최적화 팁 10가지", domain: "dev.to", gradient: "linear-gradient(135deg, #f59e0b, #ef4444)", read: false },
  { title: "CSS Grid 레이아웃 완전 정복", domain: "css-tricks.com", gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)", read: false },
];

const FAKE_CATEGORIES = ["개발", "디자인", "비즈니스"];

const FEATURES = [
  {
    icon: <BookmarkAddedIcon sx={{ fontSize: 28, color: "#137fec" }} />,
    title: "빠른 저장",
    desc: "URL 하나면 충분합니다. 제목과 썸네일은 자동으로 가져옵니다.",
  },
  {
    icon: <LabelOutlinedIcon sx={{ fontSize: 28, color: "#137fec" }} />,
    title: "카테고리 정리",
    desc: "원하는 대로 분류하고 필터링해서 원하는 아티클을 빠르게 찾으세요.",
  },
  {
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 28, color: "#137fec" }} />,
    title: "읽기 관리",
    desc: "열람·미열람으로 읽기 진행 상태를 관리하세요.",
  },
  {
    icon: <SearchIcon sx={{ fontSize: 28, color: "#137fec" }} />,
    title: "빠른 검색",
    desc: "제목과 URL로 저장한 아티클을 즉시 검색합니다.",
  },
];

function AppMockup() {
  return (
    <Box
      sx={{
        mx: "auto",
        maxWidth: 900,
        borderRadius: { xs: 3, md: 4 },
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.10)",
        border: "1px solid #e2e8f0",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {/* Browser chrome */}
      <Box
        sx={{
          bgcolor: "#f1f5f9",
          borderBottom: "1px solid #e2e8f0",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={0.75}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
          ))}
        </Stack>
        <Box
          sx={{
            flex: 1,
            bgcolor: "#ffffff",
            borderRadius: 1,
            height: 22,
            display: "flex",
            alignItems: "center",
            px: 1.5,
            gap: 0.5,
            border: "1px solid #e2e8f0",
          }}
        >
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#137fec" }} />
          <Typography sx={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>
            arkeep.net
          </Typography>
        </Box>
      </Box>

      {/* App UI */}
      <Box sx={{ bgcolor: "#f8fafc", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <Box
          sx={{
            bgcolor: "#ffffff",
            borderBottom: "1px solid #f1f5f9",
            px: 2,
            height: 44,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <MenuIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mr: 0.5 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: "#137fec", borderRadius: 0.5 }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>ArKeep</Typography>
          </Stack>
          <Box
            sx={{
              flex: 1,
              maxWidth: 240,
              height: 22,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 1,
              display: "flex",
              alignItems: "center",
              px: 1,
              gap: 0.5,
            }}
          >
            <SearchIcon sx={{ fontSize: 10, color: "#94a3b8" }} />
            <Typography sx={{ fontSize: 9, color: "#cbd5e1" }}>검색</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box
            sx={{
              bgcolor: "#137fec",
              borderRadius: 1,
              px: 1,
              height: 22,
              display: "flex",
              alignItems: "center",
              gap: 0.25,
            }}
          >
            <AddIcon sx={{ fontSize: 10, color: "#ffffff" }} />
            <Typography sx={{ fontSize: 9, color: "#ffffff", fontWeight: 600 }}>추가</Typography>
          </Box>
        </Box>

        {/* Title bar */}
        <Box
          sx={{
            bgcolor: "#ffffff",
            borderBottom: "1px solid #f1f5f9",
            px: 2,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Typography sx={{ fontSize: 9, fontWeight: 500, color: "#1e293b" }}>모든 카테고리</Typography>
            <Typography sx={{ fontSize: 9, color: "#94a3b8" }}>4개</Typography>
          </Stack>
          <Stack direction="row" spacing={0.5}>
            <SortIcon sx={{ fontSize: 12, color: "#94a3b8" }} />
            <GridViewIcon sx={{ fontSize: 12, color: "#94a3b8" }} />
          </Stack>
        </Box>

        {/* Body: sidebar + cards */}
        <Box sx={{ display: "flex", minHeight: 220 }}>
          {/* Sidebar */}
          <Box
            sx={{
              width: 130,
              flexShrink: 0,
              bgcolor: "#f8fafc",
              borderRight: "1px solid #f1f5f9",
              p: 1.5,
              display: { xs: "none", sm: "block" },
            }}
          >
            {/* Avatar area */}
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: "linear-gradient(135deg,#3b82f6,#8b5cf6)", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)" }} />
              <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#475569" }}>사용자</Typography>
            </Stack>

            {/* Filters */}
            {["미열람", "전체"].map((label, i) => (
              <Box
                key={label}
                sx={{
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  mb: 0.25,
                  bgcolor: i === 0 ? "#eff6ff" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: i === 0 ? "#137fec" : "#cbd5e1" }} />
                <Typography sx={{ fontSize: 9, color: i === 0 ? "#137fec" : "#64748b", fontWeight: i === 0 ? 600 : 400 }}>
                  {label}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 1 }} />

            <Typography sx={{ fontSize: 8, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, px: 1, mb: 0.5 }}>
              카테고리
            </Typography>
            {FAKE_CATEGORIES.map((cat) => (
              <Box key={cat} sx={{ px: 1, py: 0.5, borderRadius: 1, mb: 0.25, display: "flex", alignItems: "center", gap: 0.5 }}>
                <LabelOutlinedIcon sx={{ fontSize: 8, color: "#94a3b8" }} />
                <Typography sx={{ fontSize: 9, color: "#64748b" }}>{cat}</Typography>
              </Box>
            ))}
          </Box>

          {/* Card grid */}
          <Box
            sx={{
              flex: 1,
              p: 1.5,
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1.5,
              alignContent: "start",
            }}
          >
            {FAKE_ARTICLES.map((a) => (
              <Box
                key={a.title}
                sx={{
                  bgcolor: "#ffffff",
                  borderRadius: 1.5,
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                }}
              >
                {/* Thumbnail */}
                <Box sx={{ height: 60, background: a.gradient, position: "relative" }}>
                  {a.read && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "rgba(255,255,255,0.9)",
                        borderRadius: 10,
                        px: 0.75,
                        py: 0.25,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.25,
                      }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 7, color: "#22c55e" }} />
                      <Typography sx={{ fontSize: 7, color: "#22c55e", fontWeight: 600 }}>열람</Typography>
                    </Box>
                  )}
                </Box>
                {/* Content */}
                <Box sx={{ p: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#1e293b",
                      lineHeight: 1.4,
                      mb: 0.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {a.title}
                  </Typography>
                  <Typography sx={{ fontSize: 8, color: "#94a3b8" }}>{a.domain}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const sessionState = useSession();
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const onGoogleCredentialRef = useRef<((idToken: string) => Promise<void>) | null>(null);

  useEffect(() => {
    if (sessionState.isHydrated && sessionState.session) {
      router.replace("/home");
    }
  }, [sessionState.isHydrated, sessionState.session, router]);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !buttonContainerRef.current) return;

    onGoogleCredentialRef.current = async (idToken: string) => {
      setIsBusy(true);
      try {
        await sessionState.handleGoogleCredential(idToken, async () => {});
        router.push("/home");
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Google 로그인에 실패했습니다.");
      } finally {
        setIsBusy(false);
      }
    };

    let cancelled = false;
    void ensureGoogleScript().then(() => {
      if (cancelled || !window.google?.accounts?.id || !buttonContainerRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GoogleCredentialResponse) => {
          const credential = response.credential;
          if (!credential) { setErrorMessage("Google 인증 토큰을 받지 못했습니다."); return; }
          void onGoogleCredentialRef.current?.(credential);
        },
        auto_select: false,
        ux_mode: "popup",
      });
      const containerWidth = Math.floor(buttonContainerRef.current.clientWidth);
      const width = Math.max(200, Math.min(320, containerWidth || 260));
      buttonContainerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: "standard",
        theme: "filled_blue",
        size: "large",
        text: "continue_with",
        shape: "pill",
        width,
      });
    }).catch(() => setErrorMessage("Google 로그인 스크립트를 불러오지 못했습니다."));

    return () => { cancelled = true; window.google?.accounts?.id.cancel(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionState.isHydrated]);

  if (!sessionState.isHydrated) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", height: "100dvh" }}>
        <CircularProgress size={28} sx={{ color: "#137fec" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#ffffff", display: "flex", flexDirection: "column" }}>

      {/* Navbar */}
      <Box
        component="nav"
        sx={{
          position: "sticky", top: 0, zIndex: 100,
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #f1f5f9",
          px: { xs: 2, sm: 4, md: 8 },
          height: 56,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Image src="/icon.svg" alt="ArKeep" width={26} height={26} />
          <Typography sx={{ fontWeight: 700, fontSize: 16, color: "#1e293b", letterSpacing: "-0.3px" }}>
            ArKeep
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            const el = document.getElementById("hero-cta");
            el?.scrollIntoView({ behavior: "smooth" });
          }}
          sx={{ fontSize: 13, fontWeight: 600, textTransform: "none", borderColor: "#e2e8f0", color: "#475569", borderRadius: 2, "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" } }}
        >
          시작하기
        </Button>
      </Box>

      {/* Hero */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          px: { xs: 3, sm: 6 },
          pt: { xs: 8, md: 12 },
          pb: { xs: 6, md: 8 },
        }}
      >
        <Box
          sx={{
            display: "inline-block",
            bgcolor: "#eff6ff",
            color: "#137fec",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 10,
            mb: 3,
            textTransform: "uppercase",
          }}
        >
          아티클 매니저
        </Box>

        <Typography
          component="h1"
          sx={{
            fontSize: { xs: 36, sm: 52, md: 64 },
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.1,
            letterSpacing: "-1.5px",
            mb: 2.5,
            maxWidth: 720,
          }}
        >
          읽고 싶은 아티클,
          <br />
          <Box component="span" sx={{ color: "#137fec" }}>한 곳에서</Box> 관리하세요
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 15, sm: 18 },
            color: "#64748b",
            maxWidth: 480,
            lineHeight: 1.7,
            mb: 5,
          }}
        >
          URL 하나면 충분합니다. 제목과 썸네일은 자동으로, 카테고리로 정리하고 읽기 상태까지 관리하세요.
        </Typography>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 3, maxWidth: 340, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={2} alignItems="center" id="hero-cta" sx={{ mb: { xs: 8, md: 12 } }}>
          <Box
            ref={buttonContainerRef}
            sx={{
              opacity: isBusy ? 0.5 : 1,
              pointerEvents: isBusy ? "none" : "auto",
              display: "flex",
              justifyContent: "center",
            }}
          />

          <Divider sx={{ width: 280 }}>
            <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>또는</Typography>
          </Divider>

          <Button
            variant="text"
            onClick={() => router.push("/home")}
            disabled={isBusy}
            sx={{
              color: "#64748b",
              fontSize: 14,
              textTransform: "none",
              "&:hover": { bgcolor: "transparent", color: "#1e293b" },
            }}
          >
            게스트로 체험하기 →
          </Button>
        </Stack>

        {/* App Mockup */}
        <AppMockup />
      </Box>

      {/* Features */}
      <Box
        sx={{
          bgcolor: "#f8fafc",
          borderTop: "1px solid #f1f5f9",
          px: { xs: 3, sm: 6, md: 10 },
          py: { xs: 8, md: 10 },
          mt: { xs: 6, md: 10 },
        }}
      >
        <Typography
          sx={{ textAlign: "center", fontSize: { xs: 24, sm: 30 }, fontWeight: 700, color: "#0f172a", mb: 1, letterSpacing: "-0.5px" }}
        >
          필요한 것만, 군더더기 없이
        </Typography>
        <Typography sx={{ textAlign: "center", color: "#64748b", fontSize: 15, mb: 7 }}>
          복잡하지 않게. 링크를 저장하고 관리하는 데 집중합니다.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 3,
            maxWidth: 960,
            mx: "auto",
          }}
        >
          {FEATURES.map((f) => (
            <Box
              key={f.title}
              sx={{
                bgcolor: "#ffffff",
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                p: 3,
                transition: "box-shadow 150ms ease, transform 150ms ease",
                "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
              }}
            >
              <Box sx={{ mb: 2 }}>{f.icon}</Box>
              <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#1e293b", mb: 0.75 }}>
                {f.title}
              </Typography>
              <Typography sx={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                {f.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          borderTop: "1px solid #f1f5f9",
          px: { xs: 3, sm: 6 },
          py: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Image src="/icon.svg" alt="ArKeep" width={18} height={18} />
          <Typography sx={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>ArKeep</Typography>
        </Stack>
        <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>
          © {new Date().getFullYear()} ArKeep. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
