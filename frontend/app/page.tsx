"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import SearchIcon from "@mui/icons-material/Search";
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
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: { xs: 3, sm: 6 },
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 10 },
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

        <Stack spacing={2} alignItems="center" id="hero-cta">
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
      </Box>

      {/* Features */}
      <Box
        sx={{
          bgcolor: "#f8fafc",
          borderTop: "1px solid #f1f5f9",
          px: { xs: 3, sm: 6, md: 10 },
          py: { xs: 8, md: 10 },
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
