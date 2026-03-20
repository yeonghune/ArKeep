import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import LogoutIcon from "@mui/icons-material/Logout";
import MarkAsUnreadIcon from "@mui/icons-material/MarkAsUnread";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PersonIcon from "@mui/icons-material/Person";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState, type MouseEvent } from "react";
import { DRAWER_WIDTH, TOP_BAR_HEIGHT } from "@/constants/layout";
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
  isLoggedIn: boolean;
  userName?: string;
  userAvatarUrl?: string;
  onAvatarClickWhenLoggedOut: () => void;
  onLogout: () => Promise<void>;
};

const SELECTED_BG = "#eef2f6";
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
  onClose,
  onFilterChange,
  onCategoryChange,
  isLoggedIn,
  userName,
  userAvatarUrl,
  onAvatarClickWhenLoggedOut,
  onLogout,
}: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("lg"));
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    if (!(isMobile && open)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobile, open]);

  function handleAvatarClick(event: MouseEvent<HTMLElement>) {
    if (!isLoggedIn) {
      onAvatarClickWhenLoggedOut();
      return;
    }
    setMenuAnchor(event.currentTarget);
  }

  const effectiveAvatarUrl = isLoggedIn && !avatarLoadFailed ? userAvatarUrl : undefined;

  const panelBody = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* 유저 정보 — 상단 바와 동일 높이 */}
      <Box sx={{ height: `${TOP_BAR_HEIGHT}px`, display: "flex", alignItems: "center" }}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 0.5,
          borderRadius: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: SELECTED_BG },
          "&:hover .close-btn": { opacity: 1 },
          transition: "background-color 120ms ease",
        }}
        onClick={handleAvatarClick}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Avatar
            src={effectiveAvatarUrl}
            imgProps={{ referrerPolicy: "no-referrer" }}
            onError={() => setAvatarLoadFailed(true)}
            sx={{ width: 22, height: 22, bgcolor: "#e2e8f0", color: "#94a3b8", flexShrink: 0 }}
          >
            <PersonIcon sx={{ fontSize: 13 }} />
          </Avatar>
          <Typography noWrap sx={{ fontSize: 12, fontWeight: 700, color: "#374151", minWidth: 0 }}>
            {isLoggedIn ? (userName ?? "사용자") : "게스트"}
          </Typography>
        </Stack>

        {/* PC hover 시 ‹ 닫기 버튼 */}
        <IconButton
          className="close-btn"
          size="small"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          sx={{
            opacity: 0,
            transition: "opacity 120ms ease",
            display: { xs: "none", lg: "flex" },
            p: 0.25,
            color: "#94a3b8",
            "&:hover": { bgcolor: "transparent", color: "#1e293b" },
          }}
        >
          <ChevronLeftIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
      </Box>

      {/* 로그아웃 드롭다운 */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem disabled>
          <ListItemText primary={userName ?? "사용자"} primaryTypographyProps={{ fontSize: 13 }} />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { void onLogout(); setMenuAnchor(null); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText primary="로그아웃" primaryTypographyProps={{ fontSize: 13 }} />
        </MenuItem>
      </Menu>

      {/* 필터 버튼 */}
      <Box sx={{ mt: 1.5 }}>
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
                fontWeight: 400,
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
      </Box>

      {/* 카테고리 레이블 + 추가 버튼 */}
      <Box sx={{ mt: 2 }} />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, mb: 1 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
          카테고리
        </Typography>
        <IconButton size="small" sx={{ p: 0.25, color: "#94a3b8", "&:hover": { bgcolor: SELECTED_BG, color: SELECTED_COLOR } }}>
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {/* 카테고리 목록 */}
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
                fontWeight: isSelected ? 500 : 400,
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
          {/* 모바일 배경 오버레이 */}
          <Box
            onClick={onClose}
            sx={{
              display: { xs: "block", lg: "none" },
              position: "fixed",
              inset: 0,
              top: `${topOffset}px`,
              bgcolor: "rgba(0,0,0,0.3)",
              zIndex: (muiTheme) => muiTheme.zIndex.appBar - 2,
            }}
          />
          {/* 모바일 드로어 */}
          <Box
            component="aside"
            sx={{
              display: { xs: "block", lg: "none" },
              position: "fixed",
              left: 0,
              top: `${topOffset}px`,
              bottom: 0,
              width: DRAWER_WIDTH,
              bgcolor: "#f8fafc",
              zIndex: (muiTheme) => muiTheme.zIndex.appBar - 1,
              boxShadow: "4px 0 16px rgba(0,0,0,0.12)",
              pt: 0, px: 2, pb: 2,
            }}
          >
            {panelBody}
          </Box>
        </>
      ) : null}

      {/* PC 사이드바 */}
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "block" },
          position: "fixed",
          left: 0,
          top: `${topOffset}px`,
          width: DRAWER_WIDTH,
          height: `calc(100vh - ${topOffset}px)`,
          bgcolor: "#f8fafc",
          borderRight: "1px solid #e2e8f0",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 180ms ease",
          pointerEvents: open ? "auto" : "none",
          pt: 0, px: 2, pb: 2,
        }}
      >
        {panelBody}
      </Box>
    </>
  );
}
