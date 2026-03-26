import { useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import type { ArticleCard } from "@/types";
import { ArticleDetailContent } from "@/components/article/ArticleDetailContent";

type Props = {
  card: ArticleCard | null;
  onClose: () => void;
  onToggleRead: (card: ArticleCard) => Promise<void>;
  onSaveMemo: (card: ArticleCard, memo: string) => Promise<void>;
  isBusy: boolean;
};

export function ArticleDetailModal({ card, onClose, onToggleRead, onSaveMemo, isBusy }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const open = Boolean(card);

  useEffect(() => {
    if (!open) return;

    history.pushState({ modal: true }, "");

    const handlePopState = () => onClose();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [open]);

  const handleClose = () => {
    if (history.state?.modal) history.back();
    onClose();
  };

  if (!card) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2.5,
          overflow: "hidden",
          bgcolor: "white",
        },
      }}
    >
      <ArticleDetailContent
        card={card}
        isMobile={isMobile}
        onClose={handleClose}
        onToggleRead={onToggleRead}
        onSaveMemo={onSaveMemo}
        isBusy={isBusy}
      />
    </Dialog>
  );
}
