import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import type { ArticleCard } from "@/types";

const PLACEHOLDER_SRC = "/thumbnail-placeholder.svg";

export function ArticleMedia({ card }: { card: ArticleCard }) {
  const [src, setSrc] = useState(card.thumbnailUrl || PLACEHOLDER_SRC);

  useEffect(() => {
    setSrc(card.thumbnailUrl || PLACEHOLDER_SRC);
  }, [card.thumbnailUrl]);

  return (
    <Box
      component="img"
      src={src}
      alt={card.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== PLACEHOLDER_SRC) setSrc(PLACEHOLDER_SRC);
      }}
      sx={{ display: "block", width: "100%", height: 160, objectFit: "cover" }}
    />
  );
}
