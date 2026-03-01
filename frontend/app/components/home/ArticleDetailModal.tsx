import { useEffect, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { formatRelativeTime, getCategoryLabel } from "../../home-data";
import type { ArticleCard } from "../../home-types";
import { CardSource } from "./CardSource";

type Props = {
  card: ArticleCard | null;
  onClose: () => void;
  onToggleRead: (card: ArticleCard) => Promise<void>;
  onSaveMemo: (card: ArticleCard, memo: string) => Promise<void>;
  isBusy: boolean;
};

export function ArticleDetailModal({ card, onClose, onToggleRead, onSaveMemo, isBusy }: Props) {
  const [memo, setMemo] = useState("");
  const open = Boolean(card);

  useEffect(() => {
    setMemo(card?.description ?? "");
  }, [card?.id]);

  if (!card) return null;

  const statusLabel = card.isRead ? "읽음" : "읽지 않음";
  const categoryLabel = getCategoryLabel(card.category);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          overflow: "hidden",
          bgcolor: "white"
        }
      }}
    >
      <Box sx={{ position: "relative", minHeight: 220, lineHeight: 0 }}>
        {card.thumbnailUrl ? (
          <Box component="img" src={card.thumbnailUrl} alt={card.title} sx={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
        ) : (
          <Box sx={{ width: "100%", height: 220, background: "linear-gradient(135deg, #2563eb 0%, #0f766e 100%)" }} />
        )}

        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,23,42,0.65), rgba(15,23,42,0.15) 55%, transparent)" }} />
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ position: "absolute", right: 10, top: 10, color: "white", bgcolor: "rgba(15,23,42,0.35)", "&:hover": { bgcolor: "rgba(15,23,42,0.55)" } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ position: "absolute", left: 16, right: 16, bottom: 14 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip size="small" label={categoryLabel} sx={{ bgcolor: "#2563eb", color: "white", fontWeight: 700, height: 22 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: 11 }}>{formatRelativeTime(card.createdAt)}</Typography>
            <Chip size="small" label={statusLabel} sx={{ bgcolor: "rgba(15,23,42,0.5)", color: "white", height: 22 }} />
          </Stack>
          <Tooltip title={card.title} placement="bottom-start" arrow>
            <Typography
              sx={{
                color: "white",
                fontWeight: 800,
                fontSize: 33,
                lineHeight: 1.22,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {card.title}
            </Typography>
          </Tooltip>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.75 }}>
            <CardSource card={card} />
            <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: 12 }}>{card.domain}</Typography>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ p: 2.25 }}>
        <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>메모</Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={8}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          placeholder="이 아티클에 대한 메모를 남겨보세요."
          sx={{
            mb: 2.25,
            "& .MuiInputBase-root": { bgcolor: "#f8fafc" },
            "& .MuiInputBase-inputMultiline": {
              overflowY: "auto",
              resize: "none"
            }
          }}
        />

        <Divider sx={{ mb: 1.75 }} />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button
            variant="contained"
            startIcon={<LaunchIcon />}
            sx={{ flex: 1, textTransform: "none", fontWeight: 700 }}
            onClick={() => window.open(card.url, "_blank", "noopener,noreferrer")}
          >
            브라우저에서 열기
          </Button>
          <Button
            variant="outlined"
            sx={{ textTransform: "none", fontWeight: 700 }}
            disabled={isBusy}
            onClick={() => {
              void onSaveMemo(card, memo);
            }}
          >
            메모 저장
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CheckCircleOutlineIcon />}
            sx={{ textTransform: "none", fontWeight: 700 }}
            disabled={isBusy}
            onClick={() => {
              void onToggleRead(card);
            }}
          >
            {card.isRead ? "읽지 않음으로 표시" : "읽음으로 표시"}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}
