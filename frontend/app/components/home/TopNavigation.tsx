import BookmarkIcon from "@mui/icons-material/Bookmark";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { HEADER_HEIGHT, SYNC_BANNER_HEIGHT } from "../../home-constants";

type Props = {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  isLoggedIn: boolean;
  userName?: string;
  userAvatarUrl?: string;
  onAvatarClickWhenLoggedOut: () => void;
  onLogout: () => Promise<void>;
  hasSyncBanner: boolean;
};

export function TopNavigation({
  onMenuClick,
  searchQuery,
  onSearchQueryChange,
  isLoggedIn,
  userName,
  userAvatarUrl,
  onAvatarClickWhenLoggedOut,
  onLogout,
  hasSyncBanner
}: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const effectiveAvatarUrl = useMemo(() => {
    if (!isLoggedIn || avatarLoadFailed) return undefined;
    return userAvatarUrl || undefined;
  }, [isLoggedIn, avatarLoadFailed, userAvatarUrl]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [userAvatarUrl, isLoggedIn]);

  function handleAvatarClick(event: MouseEvent<HTMLElement>) {
    if (!isLoggedIn) {
      onAvatarClickWhenLoggedOut();
      return;
    }
    setAnchorEl(event.currentTarget);
  }

  async function handleLogoutClick() {
    setIsLoggingOut(true);
    try {
      await onLogout();
      setAnchorEl(null);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        top: `${hasSyncBanner ? SYNC_BANNER_HEIGHT : 0}px`,
        bgcolor: "rgba(255,255,255,0.95)",
        color: "#0f172a",
        borderBottom: "1px solid #e2e8f0"
      }}
    >
      <Toolbar sx={{ minHeight: `${HEADER_HEIGHT}px !important`, px: { xs: 2, sm: 3, lg: 4 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 200 }}>
          <IconButton aria-label="사이드바 열기/닫기" onClick={onMenuClick}>
            <MenuIcon />
          </IconButton>
          <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
            <BookmarkIcon fontSize="small" />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ArKeep
          </Typography>
        </Stack>

        <Box sx={{ flex: 1, mx: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="저장된 링크 검색..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              )
            }}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Tooltip title={isLoggedIn ? "계정 메뉴" : "로그인"}>
            <IconButton onClick={handleAvatarClick}>
              <Avatar
                src={effectiveAvatarUrl}
                imgProps={{ referrerPolicy: "no-referrer" }}
                onError={() => setAvatarLoadFailed(true)}
                sx={{ width: 34, height: 34, bgcolor: isLoggedIn ? "#e2e8f0" : "#f1f5f9", color: "#94a3b8" }}
              >
                <PersonIcon fontSize="small" />
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu anchorEl={anchorEl} open={menuOpen} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <ListItemText primary={userName || "Signed in"} secondary={isLoggedIn ? "Google account" : ""} />
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => void handleLogoutClick()} disabled={isLoggingOut}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={isLoggingOut ? "로그아웃 중..." : "로그아웃"} />
            </MenuItem>
          </Menu>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
