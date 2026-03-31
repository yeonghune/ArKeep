import { useEffect, useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import LaunchIcon from "@mui/icons-material/Launch";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { formatRelativeTime, getCategoryLabel } from "@/lib/utils";
import type { ArticleCard } from "@/types";
import { CardSource } from "@/components/article/CardSource";

type Props = {
  card: ArticleCard;
  isMobile: boolean;
  onClose: () => void;
  onToggleRead: (card: ArticleCard) => Promise<void>;
  onSaveMemo: (card: ArticleCard, memo: string) => Promise<void>;
  isBusy: boolean;
};

export function ArticleDetailContent({ card, isMobile, onClose, onToggleRead, onSaveMemo, isBusy }: Props) {
  const [memo, setMemo] = useState(card.description ?? "");
  const [savedMemo, setSavedMemo] = useState(card.description ?? "");
  const [isMemoSaving, setIsMemoSaving] = useState(false);
  const isMemoChanged = memo !== savedMemo;

  useEffect(() => {
    const initial = card.description ?? "";
    setMemo(initial);
    setSavedMemo(initial);
  }, [card.id]);

  const statusLabel = card.isRead ? "열람" : "미열람";
  const categoryLabel = getCategoryLabel(card.category);
  const tags = card.tags ?? [];

  const thumbnail = card.thumbnailUrl ? (
    <Box
      component="img"
      src={card.thumbnailUrl}
      alt={card.title}
      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  ) : (
    <Box sx={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #2563eb 0%, #0f766e 100%)" }} />
  );

  const metaChips = (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: card.isRead ? "#94a3b8" : "white",
          bgcolor: card.isRead ? "transparent" : "#2563eb",
          border: "1.5px solid",
          borderColor: card.isRead ? "#cbd5e1" : "#2563eb",
          borderRadius: "4px",
          px: 0.75,
          py: 0.25,
          lineHeight: 1.4,
        }}
      >
        {statusLabel}
      </Typography>
      <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>·</Typography>
      <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{categoryLabel}</Typography>
      <Typography sx={{ fontSize: 12, color: "#cbd5e1" }}>·</Typography>
      <Typography sx={{ fontSize: 12, color: "#94a3b8" }}>{formatRelativeTime(card.createdAt)}</Typography>
    </Stack>
  );

  const memoSection = (
    <>
      <Typography sx={{ fontSize: 13, color: "#64748b", mb: 0.75 }}>메모</Typography>
      <TextField
        fullWidth
        multiline
        minRows={isMobile ? 3 : 4}
        maxRows={8}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="이 아티클에 대한 메모를 남겨보세요."
        sx={{
          mb: 2,
          "& .MuiInputBase-root": { bgcolor: "#f8fafc" },
          "& .MuiInputBase-inputMultiline": { resize: "none" },
        }}
      />
    </>
  );

  const actionButtons = (
    <Stack spacing={1}>
      <Button
        variant="contained"
        fullWidth
        startIcon={<CheckCircleOutlineIcon />}
        sx={{ textTransform: "none", fontWeight: 700 }}
        disabled={isBusy}
        onClick={() => void onToggleRead(card)}
      >
        {card.isRead ? "미열람으로 표시" : "열람으로 표시"}
      </Button>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          sx={{ flex: 1, textTransform: "none", fontWeight: 700 }}
          disabled={isMemoSaving || !isMemoChanged}
          onClick={() => {
            setIsMemoSaving(true);
            void onSaveMemo(card, memo).then(() => setSavedMemo(memo)).finally(() => setIsMemoSaving(false));
          }}
        >
          메모 저장
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<LaunchIcon />}
          sx={{ flex: 1, textTransform: "none", fontWeight: 700 }}
          onClick={() => window.open(card.url, "_blank", "noopener,noreferrer")}
        >
          브라우저에서 열기
        </Button>
      </Stack>
    </Stack>
  );

  const tagChips = tags.length > 0 ? (
    <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, mb: 1.25, flexWrap: "wrap", rowGap: 0.75 }}>
      {tags.slice(0, 5).map((t) => (
        <Chip
          key={t}
          size="small"
          variant="outlined"
          label={`#${t}`}
          sx={{
            height: 22,
            fontSize: 12,
            borderRadius: 999,
            bgcolor: "rgba(37,99,235,0.04)",
            borderColor: "rgba(37,99,235,0.18)",
            color: "#1e293b",
            "& .MuiChip-label": { px: 0.9 },
          }}
        />
      ))}
    </Stack>
  ) : null;

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* 썸네일 16:9 + 닫기 버튼 오버레이 */}
        <Box sx={{ position: "relative", width: "100%", aspectRatio: "16/9", flexShrink: 0, overflow: "hidden", bgcolor: "#f1f5f9" }}>
          {thumbnail}
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
              color: "white",
              bgcolor: "rgba(15,23,42,0.35)",
              "&:hover": { bgcolor: "rgba(15,23,42,0.55)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 콘텐츠 */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {metaChips}
          <Typography sx={{ fontWeight: 800, fontSize: 20, lineHeight: 1.35, mb: 0.75, wordBreak: "break-word" }}>
            {card.title}
          </Typography>
          {tagChips}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 2.5 }}>
            <CardSource card={card} />
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>{card.domain}</Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />
          {memoSection}
          <Divider sx={{ mb: 2 }} />
          {actionButtons}
        </Box>
      </Box>
    );
  }

  // PC 2열 레이아웃
  return (
    <Stack direction="row" sx={{ minHeight: 480, maxHeight: "82vh", overflow: "hidden" }}>
      {/* 좌측 썸네일 */}
      <Box sx={{ width: "45%", flexShrink: 0, overflow: "hidden", bgcolor: "#f1f5f9" }}>
        {thumbnail}
      </Box>

      {/* 우측 콘텐츠 */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {/* 닫기 버튼 */}
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            bgcolor: "white",
            display: "flex",
            justifyContent: "flex-end",
            px: 1.5,
            py: 1,
          }}
        >
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, pb: 3, flex: 1 }}>
          {metaChips}
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { sm: 20, md: 24 },
              lineHeight: 1.3,
              mb: 1,
              wordBreak: "break-word",
            }}
          >
            {card.title}
          </Typography>
          {tagChips}
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 2.5 }}>
            <CardSource card={card} />
            <Typography sx={{ fontSize: 12, color: "#64748b" }}>{card.domain}</Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />
          {memoSection}
          <Divider sx={{ mb: 2 }} />
          {actionButtons}
        </Box>
      </Box>
    </Stack>
  );
}
