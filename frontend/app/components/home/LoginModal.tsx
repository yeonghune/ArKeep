import { useEffect, useRef, useState } from "react";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  onClose: () => void;
  onGoogleCredential: (idToken: string) => Promise<void>;
};

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            ux_mode?: "popup" | "redirect";
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: number;
            }
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "google-gsi-client";

function ensureGoogleScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

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

export function LoginModal({ open, onClose, onGoogleCredential }: Props) {
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

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
        if (cancelled || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response.credential;
            if (!credential) {
              setErrorMessage("Google 인증 토큰을 받지 못했습니다.");
              return;
            }
            setIsBusy(true);
            void onGoogleCredential(credential)
              .then(() => {
                onClose();
              })
              .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : "Google 로그인에 실패했습니다.";
                setErrorMessage(message);
              })
              .finally(() => setIsBusy(false));
          },
          auto_select: false,
          ux_mode: "popup"
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(buttonContainerRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: 320
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
  }, [open, onClose, onGoogleCredential]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: "#f8fafc",
          overflow: "hidden"
        }
      }}
    >
      <Box sx={{ p: { xs: 3, sm: 5 } }}>
        <Box sx={{ borderRadius: 4, bgcolor: "white", p: { xs: 3, sm: 5 }, textAlign: "center", border: "1px solid #e2e8f0" }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: "auto",
              mb: 3,
              borderRadius: 3,
              bgcolor: "#e2e8f0",
              display: "grid",
              placeItems: "center"
            }}
          >
            <BookmarkIcon sx={{ color: "#1976d2", fontSize: 38 }} />
          </Box>

          <Typography sx={{ fontSize: 30, fontWeight: 700, color: "#111827", lineHeight: 1.15, mb: 1.5 }}>계정 연결</Typography>
          <Typography sx={{ fontSize: 16, color: "#6b7280", lineHeight: 1.55, mb: 3.5 }}>
            로그인을 통해 모바일과 PC를 하나로
            <br />
            ArKeep에서 이어서 관리하세요.
          </Typography>

          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box ref={buttonContainerRef} sx={{ display: "grid", justifyContent: "center" }} />
        </Box>
      </Box>
    </Dialog>
  );
}
