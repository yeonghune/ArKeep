import CloseIcon from "@mui/icons-material/Close";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { DRAWER_WIDTH } from "@/constants/layout";
import type { ArticleFilter, ArticleSort } from "@/types";

type Props = {
  open: boolean;
  filter: ArticleFilter;
  sort: ArticleSort;
  category: string;
  domain: string;
  categories: string[];
  domains: string[];
  topOffset: number;
  onClose: () => void;
  onFilterChange: (value: ArticleFilter) => void;
  onSortChange: (value: ArticleSort) => void;
  onCategoryChange: (value: string) => void;
  onDomainChange: (value: string) => void;
};

export function SidebarFilters({
  open,
  filter,
  sort,
  category,
  domain,
  categories,
  domains,
  topOffset,
  onClose,
  onFilterChange,
  onSortChange,
  onCategoryChange,
  onDomainChange
}: Props) {
  const [openSelect, setOpenSelect] = useState<"category" | "domain" | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));

  useEffect(() => {
    if (!(isMobile && open) && openSelect == null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, open, openSelect]);

  const panelBody = useMemo(
    () => (
      <>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b", mb: 1.5 }}>상태</Typography>
        <RadioGroup value={filter} onChange={(_, value) => onFilterChange(value as ArticleFilter)} sx={{ mb: 3 }}>
          <FormControlLabel value="all" control={<Radio />} label="모두" />
          <FormControlLabel value="read" control={<Radio />} label="열람" />
          <FormControlLabel value="unread" control={<Radio />} label="미열람" />
        </RadioGroup>

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b", mb: 1.5 }}>정렬</Typography>
        <RadioGroup value={sort} onChange={(_, value) => onSortChange(value as ArticleSort)} sx={{ mb: 3 }}>
          <FormControlLabel value="latest" control={<Radio />} label="최신순" />
          <FormControlLabel value="oldest" control={<Radio />} label="오래된순" />
        </RadioGroup>

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b", mb: 1 }}>카테고리</Typography>
        <Autocomplete
          freeSolo
          disablePortal
          options={categories}
          value={category}
          inputValue={category}
          open={openSelect === "category"}
          onOpen={() => setOpenSelect("category")}
          onClose={() => setOpenSelect(null)}
          onInputChange={(_, value) => onCategoryChange(value)}
          onChange={(_, value) => onCategoryChange(typeof value === "string" ? value : "")}
          ListboxProps={{
            sx: {
              maxHeight: 220,
              overflowY: "auto"
            }
          }}
          renderInput={(params) => <TextField {...params} fullWidth size="small" placeholder="카테고리를 선택하거나 직접 입력" />}
          sx={{ mb: 3 }}
        />

        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#64748b", mb: 1 }}>도메인</Typography>
        <Autocomplete
          freeSolo
          disablePortal
          options={domains}
          value={domain}
          inputValue={domain}
          open={openSelect === "domain"}
          onOpen={() => setOpenSelect("domain")}
          onClose={() => setOpenSelect(null)}
          onInputChange={(_, value) => onDomainChange(value)}
          onChange={(_, value) => onDomainChange(typeof value === "string" ? value : "")}
          ListboxProps={{
            sx: {
              maxHeight: 220,
              overflowY: "auto"
            }
          }}
          renderInput={(params) => <TextField {...params} fullWidth size="small" placeholder="도메인을 선택하거나 직접 입력" />}
          sx={{ mb: 3 }}
        />
      </>
    ),
    [category, categories, domain, domains, filter, onCategoryChange, onDomainChange, onFilterChange, onSortChange, openSelect, sort]
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
          <Toolbar sx={{ minHeight: "0 !important", p: 0, mb: 2, display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>필터 및 정렬</Typography>
            <IconButton aria-label="필터 닫기" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
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
          <Toolbar sx={{ minHeight: "0 !important", p: 0, mb: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>필터 및 정렬</Typography>
          </Toolbar>
          {panelBody}
        </Box>
      </Box>
    </>
  );
}
