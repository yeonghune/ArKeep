"use client";

import ArKeepLogo from "@/components/ArKeepLogo";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddIcon from "@mui/icons-material/Add";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import GridViewIcon from "@mui/icons-material/GridView";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MarkAsUnreadIcon from "@mui/icons-material/MarkAsUnread";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import VisibilityIcon from "@mui/icons-material/Visibility";
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
  { title: "Next.js 15 App Router 완전 정복 — 실전 패턴 가이드", domain: "devlog.io", gradient: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", cat: "개발", time: "21분 전", hasThumb: true },
  { title: "개발자가 알아야 할 Docker 네트워크 핵심 개념", domain: "infrablog.dev", gradient: "linear-gradient(135deg, #d1fae5, #a7f3d0)", cat: "개발", time: "2시간 전", hasThumb: true },
  { title: "스타트업 초기 투자 유치, 무엇을 먼저 준비해야 하나", domain: "venturenote.kr", gradient: "linear-gradient(135deg, #fef3c7, #fde68a)", cat: "투자", time: "4시간 전", hasThumb: true },
  { title: "숏폼 콘텐츠 제작의 기술 — 조회수를 끌어올리는 편집 원칙", domain: "contentlab.kr", gradient: "linear-gradient(135deg, #fee2e2, #fecaca)", cat: "영상", time: "6시간 전", hasThumb: true },
  { title: "TypeScript 타입 시스템 깊게 파기 — 제네릭과 유틸리티 타입", domain: "devlog.io", gradient: null, cat: "개발", time: "8시간 전", hasThumb: false },
  { title: "2025 글로벌 VC 투자 심리 변화와 국내 시장 영향", domain: "venturenote.kr", gradient: null, cat: "투자", time: "10시간 전", hasThumb: false },
  { title: "IT 업계 채용 시장 변화 — 개발자 수요는 어디로 향하나", domain: "newswave.co.kr", gradient: null, cat: "뉴스", time: "12시간 전", hasThumb: false },
  { title: "영상 썸네일 A/B 테스트로 클릭률 2배 높인 방법", domain: "contentlab.kr", gradient: null, cat: "영상", time: "1일 전", hasThumb: false },
];

const FAKE_CATEGORIES = ["뉴스", "영상", "투자", "개발"];

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
        maxWidth: 960,
        borderRadius: { xs: 3, md: 4 },
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.10)",
        border: "1px solid #e2e8f0",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
      {/* Browser chrome */}
      <Box sx={{ bgcolor: "#f1f5f9", borderBottom: "1px solid #e2e8f0", px: 2, py: "7px", display: "flex", alignItems: "center", gap: 1.5 }}>
        <Stack direction="row" spacing={0.75}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <Box key={c} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: c }} />
          ))}
        </Stack>
        <Box sx={{ flex: 1, bgcolor: "#ffffff", borderRadius: 1, height: 22, display: "flex", alignItems: "center", px: 1.5, gap: 0.5, border: "1px solid #e2e8f0" }}>
          <Typography sx={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>https://www.arkeep.net</Typography>
        </Box>
      </Box>

      <Box sx={{ bgcolor: "#ffffff", display: "flex" }}>
        {/* Sidebar */}
        <Box sx={{ width: 148, flexShrink: 0, bgcolor: "#f8fafc", borderRight: "1px solid #f1f5f9", p: 1.5, display: "flex", flexDirection: "column", gap: 0.25 }}>
          {/* User avatar */}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.5 }}>
            <AccountCircleIcon sx={{ fontSize: 22, color: "#94a3b8", flexShrink: 0 }} />
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: "#334155" }}>사용자</Typography>
          </Stack>

            {/* Filter items */}
            {[
              { label: "모든 아티클", active: false, icon: <LibraryBooksIcon sx={{ fontSize: 11 }} /> },
              { label: "열람 아티클", active: false, icon: <VisibilityIcon sx={{ fontSize: 11 }} /> },
              { label: "미열람 아티클", active: true, icon: <MarkAsUnreadIcon sx={{ fontSize: 11 }} /> },
            ].map(({ label, active, icon }) => (
              <Box key={label} sx={{ px: 1, py: "3px", borderRadius: 1, bgcolor: active ? "#eff6ff" : "transparent", display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box sx={{ color: active ? "#137fec" : "#94a3b8", display: "flex", alignItems: "center", flexShrink: 0 }}>{icon}</Box>
                <Typography sx={{ fontSize: 9, color: active ? "#137fec" : "#64748b", fontWeight: active ? 600 : 400 }}>{label}</Typography>
              </Box>
            ))}

            <Divider sx={{ my: 1 }} />

            {/* Category header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, mb: 0.5 }}>
              <Typography sx={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>카테고리</Typography>
              <Stack direction="row" spacing={0.25}>
                <SearchIcon sx={{ fontSize: 9, color: "#94a3b8" }} />
                <AddIcon sx={{ fontSize: 9, color: "#94a3b8" }} />
              </Stack>
            </Stack>

            {/* Category items */}
            {FAKE_CATEGORIES.map((cat) => (
              <Box key={cat} sx={{ px: 1, py: "3px", borderRadius: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography sx={{ fontSize: 9, color: "#64748b" }}>{cat}</Typography>
              </Box>
            ))}
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Topbar */}
          <Box sx={{ bgcolor: "#ffffff", borderBottom: "1px solid #f1f5f9", px: 2, height: 46, display: "flex", alignItems: "center", gap: 1 }}>
            <MenuIcon sx={{ fontSize: 16, color: "#64748b", mr: 0.25 }} />
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mr: 0.5, flexShrink: 0 }}>
              <ArKeepLogo size={20} />
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.3px" }}>ArKeep</Typography>
            </Stack>
            <Box sx={{ flex: "0 1 260px", height: 24, bgcolor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 1, display: "flex", alignItems: "center", px: 1, gap: 0.5 }}>
              <SearchIcon sx={{ fontSize: 11, color: "#94a3b8" }} />
              <Typography sx={{ fontSize: 9, color: "#cbd5e1" }}>검색</Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Box sx={{ bgcolor: "#137fec", borderRadius: 1, px: 1.25, height: 24, display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
              <AddIcon sx={{ fontSize: 11, color: "#ffffff" }} />
              <Typography sx={{ fontSize: 9, color: "#ffffff", fontWeight: 700 }}>추가</Typography>
            </Box>
          </Box>

          {/* Title bar */}
          <Box sx={{ px: 2, height: 34, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9" }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <MarkAsUnreadIcon sx={{ fontSize: 13, color: "#137fec" }} />
                <Typography sx={{ fontSize: 10, fontWeight: 500, color: "#1e293b" }}>모든 카테고리</Typography>
                <Typography sx={{ fontSize: 10, color: "#94a3b8" }}>8개</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <SortIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
                <GridViewIcon sx={{ fontSize: 13, color: "#94a3b8" }} />
              </Stack>
            </Box>

          {/* Card grid */}
          <Box sx={{ flex: 1, p: 1.5, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5, alignContent: "start", bgcolor: "#ffffff" }}>
            {FAKE_ARTICLES.map((a) => (
              <Box key={a.title} sx={{ bgcolor: "#ffffff", borderRadius: 1.5, border: "1px solid #e2e8f0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <Box sx={{ height: 72, position: "relative", bgcolor: "#f1f5f9", overflow: "hidden" }}>
                  {a.hasThumb && a.gradient ? (
                    <Box sx={{ width: "100%", height: "100%", background: a.gradient }} />
                  ) : (
                    <Box sx={{ width: "100%", height: "100%", background: "repeating-linear-gradient(135deg, #e2e8f0 0px, #e2e8f0 2px, #f1f5f9 2px, #f1f5f9 12px)" }} />
                  )}
                  <Box sx={{ position: "absolute", top: 5, left: 5, bgcolor: "#137fec", borderRadius: 10, px: 0.75, py: "1px" }}>
                    <Typography sx={{ fontSize: 7, color: "#ffffff", fontWeight: 700 }}>미열람</Typography>
                  </Box>
                </Box>
                <Box sx={{ p: 1, flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <Box sx={{ display: "inline-flex", alignSelf: "flex-start", bgcolor: "#eff6ff", borderRadius: 10, px: 0.75, py: "1px" }}>
                    <Typography sx={{ fontSize: 7, color: "#137fec", fontWeight: 600 }}>{a.cat}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 8.5, fontWeight: 600, color: "#1e293b", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {a.title}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: "auto" }}>
                    <Typography sx={{ fontSize: 7.5, color: "#94a3b8" }}>{a.domain}</Typography>
                    <Typography sx={{ fontSize: 7.5, color: "#94a3b8" }}>{a.time}</Typography>
                  </Stack>
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
          <ArKeepLogo size={26} />
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
          <ArKeepLogo size={18} />
          <Typography sx={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>ArKeep</Typography>
        </Stack>
        <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>
          © {new Date().getFullYear()} ArKeep. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
