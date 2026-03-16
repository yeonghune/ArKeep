import Box from "@mui/material/Box";
import type { ArticleCard } from "../../home-types";

const PLACEHOLDER_SRC = "/thumbnail-placeholder.svg";

export function ArticleMedia({ card }: { card: ArticleCard }) {
  const src = card.thumbnailUrl ?? PLACEHOLDER_SRC;

  return (
    <Box
      component="img"
      src={src}
      alt={card.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (img.src !== window.location.origin + PLACEHOLDER_SRC) {
          img.src = PLACEHOLDER_SRC;
        }
      }}
      sx={{ display: "block", width: "100%", height: 160, objectFit: "cover" }}
    />
  );
}
