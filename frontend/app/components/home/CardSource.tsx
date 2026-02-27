import LinkIcon from "@mui/icons-material/Link";
import Box from "@mui/material/Box";
import type { ArticleCard } from "../../home-types";

export function CardSource({ card }: { card: ArticleCard }) {
  if (!card.domain || card.domain === "unknown") {
    return <LinkIcon sx={{ fontSize: 16, color: "#94a3b8" }} />;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(card.domain)}`;
  return <Box component="img" src={faviconUrl} alt={card.domain} loading="lazy" sx={{ width: 16, height: 16, borderRadius: 0.5 }} />;
}
