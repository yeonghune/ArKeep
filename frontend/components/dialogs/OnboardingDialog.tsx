import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DevicesIcon from "@mui/icons-material/Devices";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  onGuestContinue: () => void;
  onGoogleCredential: (idToken: string) => Promise<void>;
};

type GoogleCredentialResponse = {
  credential?: string;
};

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
  { icon: <BookmarkAddedIcon sx={{ fontSize: 18, color: "#3b82f6" }} />, text: "링크 저장 즉시 제목·썸네일 자동 추출" },
  { icon: <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "#3b82f6" }} />, text: "열람·미열람으로 읽기 진행 관리" },
  { icon: <LabelOutlinedIcon sx={{ fontSize: 18, color: "#3b82f6" }} />, text: "카테고리로 아티클 분류" },
  { icon: <DevicesIcon sx={{ fontSize: 18, color: "#3b82f6" }} />, text: "로그인하면 모든 기기에서 동기화" },
];

export function OnboardingDialog({ open, onGuestContinue, onGoogleCredential }: Props) {
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [googleButtonWidth, setGoogleButtonWidth] = useState(280);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const onGoogleCredentialRef = useRef(onGoogleCredential);
  useEffect(() => { onGoogleCredentialRef.current = onGoogleCredential; }, [onGoogleCredential]);

  useEffect(() => {
    if (!open) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setErrorMessage("Google Client ID가 설정되지 않았습니다.");
      return;
    }

    let cancelled = false;
    setErrorMessage(null);

    void (async () => {
      try {
        await ensureGoogleScript();
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            const credential = response.credential;
            if (!credential) {
              setErrorMessage("Google 인증 토큰을 받지 못했습니다.");
              return;
            }
            setIsBusy(true);
            void onGoogleCredentialRef.current(credential)
              .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Google 로그인에 실패했습니다.";
                setErrorMessage(message);
              })
              .finally(() => setIsBusy(false));
          },
          auto_select: false,
          ux_mode: "popup",
        });

        if (buttonContainerRef.current) {
          const containerWidth = Math.floor(buttonContainerRef.current.clientWidth);
          const nextWidth = Math.max(200, Math.min(320, containerWidth || 280));
          setGoogleButtonWidth(nextWidth);
          buttonContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: "standard",
            theme: "filled_blue",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: nextWidth,
          });
        }
      } catch {
        setErrorMessage("Google 로그인 스크립트를 불러오지 못했습니다.");
      }
    })();

    return () => {
      cancelled = true;
      window.google?.accounts?.id.cancel();
    };
  }, [open]);

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          m: { xs: 2, sm: 4 },
          borderRadius: 4,
          overflow: "hidden",
        },
      }}
    >
      <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: "center" }}>
        {/* 로고 */}
        <Box sx={{ mx: "auto", mb: 2, width: 64, height: 64 }}>
          <Image src="/icon.svg" alt="ArKeep" width={64} height={64} />
        </Box>

        <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827", mb: 0.5 }}>
          ArKeep
        </Typography>
        <Typography sx={{ fontSize: 14, color: "#6b7280", mb: 3 }}>
          읽고 싶은 링크를 저장하고, 할 일처럼 관리하세요.
        </Typography>

        {/* 기능 리스트 */}
        <Stack spacing={1.5} sx={{ mb: 3, textAlign: "left" }}>
          {FEATURES.map((f, i) => (
            <Stack key={i} direction="row" spacing={1.5} alignItems="center">
              {f.icon}
              <Typography sx={{ fontSize: 13, color: "#374151" }}>{f.text}</Typography>
            </Stack>
          ))}
        </Stack>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
            {errorMessage}
          </Alert>
        )}

        {/* Google 로그인 버튼 */}
        <Box
          ref={buttonContainerRef}
          sx={{
            display: "grid",
            justifyContent: "center",
            width: "100%",
            maxWidth: `${googleButtonWidth}px`,
            mx: "auto",
            mb: 2,
            opacity: isBusy ? 0.5 : 1,
            pointerEvents: isBusy ? "none" : "auto",
          }}
        />

        <Divider sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>또는</Typography>
        </Divider>

        {/* 게스트 체험 버튼 */}
        <Button
          fullWidth
          variant="text"
          onClick={onGuestContinue}
          disabled={isBusy}
          sx={{ color: "#6b7280", fontSize: 13, textTransform: "none" }}
        >
          게스트로 체험하기 →
        </Button>
      </Box>
    </Dialog>
  );
}
