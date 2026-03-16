import LinkIcon from "@mui/icons-material/Link";
import Box from "@mui/material/Box";
import { useState } from "react";
import type { ArticleCard } from "../../home-types";

export function CardSource({ card }: { card: ArticleCard }) {
  const [src, setSrc] = useState(() =>
    card.domain && card.domain !== "unknown"
      ? `https://${card.domain}/favicon.ico`
      : null
  );

  if (!src) {
    return <LinkIcon sx={{ fontSize: 16, color: "#94a3b8" }} />;
  }

  const googleFaviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(card.domain)}`;

  return (
    <Box
      component="img"
      src={src}
      alt={card.domain}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== googleFaviconUrl) {
          setSrc(googleFaviconUrl);
        } else {
          setSrc(null);
        }
      }}
      sx={{ width: 16, height: 16, borderRadius: 0.5 }}
    />
  );
}
