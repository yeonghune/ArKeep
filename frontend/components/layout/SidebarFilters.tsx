import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { DRAWER_WIDTH } from "@/constants/layout";
import type { ArticleFilter, ArticleSort } from "@/types";

type Props = {
  open: boolean;
  filter: ArticleFilter;
  sort: ArticleSort;
  category: string;
  categories: string[];
  topOffset: number;
  onClose: () => void;
  onFilterChange: (value: ArticleFilter) => void;
  onSortChange: (value: ArticleSort) => void;
  onCategoryChange: (value: string) => void;
};

export function SidebarFilters({
  open,
  filter,
  sort,
  category,
  categories,
  topOffset,
  onClose: _onClose,
  onFilterChange,
  onSortChange,
  onCategoryChange,
}: Props) {
  const [expandedSection, setExpandedSection] = useState<"filter" | "category" | null>("filter");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  useEffect(() => {
    if (!(isMobile && open)) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, open]);

  const toggleSection = (section: "filter" | "category") => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const panelBody = (
    <>
      {/* 필터 및 정렬 아코디언 */}
      <Box
        onClick={() => toggleSection("filter")}
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", mb: 1 }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>필터 및 정렬</Typography>
        {expandedSection === "filter" ? <ExpandLessIcon sx={{ fontSize: 16, color: "#94a3b8" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "#94a3b8" }} />}
      </Box>
      <Collapse in={expandedSection === "filter"} sx={{ mb: 3 }}>
        <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 1, p: 1.5 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", mb: 0.5 }}>상태</Typography>
          <RadioGroup value={filter} onChange={(_, value) => onFilterChange(value as ArticleFilter)} sx={{ mb: 2 }}>
            <FormControlLabel value="all" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>모두</Typography>} />
            <FormControlLabel value="read" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>열람</Typography>} />
            <FormControlLabel value="unread" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>미열람</Typography>} />
          </RadioGroup>
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", mb: 0.5 }}>정렬</Typography>
          <RadioGroup value={sort} onChange={(_, value) => onSortChange(value as ArticleSort)}>
            <FormControlLabel value="latest" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>최신순</Typography>} />
            <FormControlLabel value="oldest" control={<Radio size="small" />} label={<Typography sx={{ fontSize: 13 }}>오래된순</Typography>} />
          </RadioGroup>
        </Box>
      </Collapse>

      {/* 카테고리 아코디언 */}
      <Box
        onClick={() => toggleSection("category")}
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", mb: 1 }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>카테고리</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {category && (
            <Typography sx={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>{category}</Typography>
          )}
          {expandedSection === "category" ? <ExpandLessIcon sx={{ fontSize: 16, color: "#94a3b8" }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: "#94a3b8" }} />}
        </Box>
      </Box>
      <Collapse in={expandedSection === "category"} sx={{ mb: 3 }}>
        <Box sx={{ border: "1px solid #e2e8f0", borderRadius: 1, overflow: "hidden" }}>
          {["", ...categories].map((cat) => (
            <Box
              key={cat || "__all__"}
              onClick={() => { onCategoryChange(cat); setExpandedSection(null); }}
              sx={{
                px: 1.5, py: 1, cursor: "pointer", fontSize: 13,
                bgcolor: category === cat ? "#eff6ff" : "transparent",
                color: category === cat ? "#3b82f6" : "#1e293b",
                fontWeight: category === cat ? 600 : 400,
                "&:hover": { bgcolor: category === cat ? "#eff6ff" : "#f8fafc" },
                borderBottom: "1px solid #f1f5f9",
                "&:last-child": { borderBottom: "none" }
              }}
            >
              {cat || "모두"}
            </Box>
          ))}
        </Box>
      </Collapse>

    </>
  );

  return (
    <>
      {open ? (
        <Box
          component="aside"
          sx={{
            display: { xs: "block", lg: "none" },
            position: "fixed",
            left: 0,
            right: 0,
            top: `${topOffset}px`,
            bottom: 0,
            bgcolor: "#fff",
            zIndex: (muiTheme) => muiTheme.zIndex.appBar - 1,
            overflowY: "auto",
            p: 3
          }}
        >
          {panelBody}
        </Box>
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
          pointerEvents: open ? "auto" : "none"
        }}
      >
        <Box sx={{ height: "100%", overflowY: "auto", p: 3 }}>
          {panelBody}
        </Box>
      </Box>
    </>
  );
}
