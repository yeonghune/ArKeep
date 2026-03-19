import AddIcon from "@mui/icons-material/Add";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import MarkAsUnreadIcon from "@mui/icons-material/MarkAsUnread";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect } from "react";
import { DRAWER_WIDTH } from "@/constants/layout";
import type { ArticleFilter } from "@/types";

type Props = {
  open: boolean;
  filter: ArticleFilter;
  category: string;
  categories: string[];
  topOffset: number;
  onClose: () => void;
  onFilterChange: (value: ArticleFilter) => void;
  onCategoryChange: (value: string) => void;
};

const SELECTED_BG = "#F8FAFC";
const SELECTED_COLOR = "#137fec";

export const FILTER_ITEMS: { value: ArticleFilter; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "모든 아티클", icon: <LibraryBooksIcon sx={{ fontSize: 16 }} /> },
  { value: "read", label: "열람 아티클", icon: <VisibilityIcon sx={{ fontSize: 16 }} /> },
  { value: "unread", label: "미열람 아티클", icon: <MarkAsUnreadIcon sx={{ fontSize: 16 }} /> },
];

export function SidebarFilters({
  open,
  filter,
  category,
  categories,
  topOffset,
  onClose: _onClose,
  onFilterChange,
  onCategoryChange,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  useEffect(() => {
    if (!(isMobile && open)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobile, open]);

  const panelBody = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* 필터 버튼 */}
      {FILTER_ITEMS.map(({ value, label, icon }) => {
        const isSelected = filter === value;
        return (
          <Box
            key={value}
            onClick={() => onFilterChange(value)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: 1.5,
              py: 0.875,
              mb: 0.25,
              borderRadius: 1,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              bgcolor: "transparent",
              color: "#1e293b",
              "&:hover": { bgcolor: SELECTED_BG },
              transition: "background-color 120ms ease",
            }}
          >
            <Box sx={{ display: "flex", color: "#64748b" }}>{icon}</Box>
            {label}
          </Box>
        );
      })}

      <Divider sx={{ my: 1.5 }} />

      {/* 카테고리 레이블 + 추가 버튼 */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, mb: 1 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
          카테고리
        </Typography>
        <IconButton size="small" sx={{ p: 0.25, color: "#94a3b8", "&:hover": { bgcolor: SELECTED_BG, color: SELECTED_COLOR } }}>
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* 카테고리 목록 — 스크롤 가능 */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {["", ...categories].map((cat) => {
          const isSelected = category === cat;
          return (
            <Box
              key={cat || "__all__"}
              onClick={() => onCategoryChange(cat)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 1.5,
                py: 0.875,
                mb: 0.25,
                borderRadius: 1,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: isSelected ? 700 : 600,
                bgcolor: isSelected ? SELECTED_BG : "transparent",
                color: isSelected ? SELECTED_COLOR : "#1e293b",
                "&:hover": {
                  bgcolor: SELECTED_BG,
                  "& .more-btn": { opacity: 1 },
                },
                transition: "background-color 120ms ease",
              }}
            >
              <span>{cat || "모든 카테고리"}</span>
              <IconButton
                size="small"
                className="more-btn"
                onClick={(e) => e.stopPropagation()}
                sx={{
                  opacity: 0,
                  transition: "opacity 120ms ease",
                  p: 0.25,
                  color: "#64748b",
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                <MoreHorizIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <>
      {open ? (
        <>
          {/* 배경 오버레이 */}
          <Box
            onClick={_onClose}
            sx={{
              display: { xs: "block", lg: "none" },
              position: "fixed",
              inset: 0,
              top: `${topOffset}px`,
              bgcolor: "rgba(0,0,0,0.3)",
              zIndex: (muiTheme) => muiTheme.zIndex.appBar - 2,
            }}
          />
          {/* 드로어 */}
          <Box
            component="aside"
            sx={{
              display: { xs: "block", lg: "none" },
              position: "fixed",
              left: 0,
              top: `${topOffset}px`,
              bottom: 0,
              width: DRAWER_WIDTH,
              bgcolor: "#fff",
              zIndex: (muiTheme) => muiTheme.zIndex.appBar - 1,
              boxShadow: "4px 0 16px rgba(0,0,0,0.12)",
              p: 2,
            }}
          >
            {panelBody}
          </Box>
        </>
      ) : null}

      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "block" },
          position: "fixed",
          left: 0,
          top: `${topOffset}px`,
          width: DRAWER_WIDTH,
          height: `calc(100vh - ${topOffset}px)`,
          bgcolor: "#fff",
          borderRight: "1px solid #e2e8f0",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 180ms ease",
          pointerEvents: open ? "auto" : "none",
          p: 2,
        }}
      >
        {panelBody}
      </Box>
    </>
  );
}
