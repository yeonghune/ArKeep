import LinkIcon from "@mui/icons-material/Link";
import Box from "@mui/material/Box";
import type { ArticleCard } from "../../home-types";

export function ArticleMedia({ card }: { card: ArticleCard }) {
  if (card.thumbnailUrl) {
    return <Box component="img" src={card.thumbnailUrl} alt={card.title} loading="lazy" sx={{ width: "100%", height: 160, objectFit: "cover" }} />;
  }

  return (
    <Box
      sx={{
        height: 160,
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(45deg, #e2e8f0 0%, #f1f5f9 100%)",
        color: "#94a3b8"
      }}
    >
      <LinkIcon sx={{ fontSize: 48 }} />
    </Box>
  );
}
