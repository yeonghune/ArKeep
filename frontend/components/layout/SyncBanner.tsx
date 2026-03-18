import CloseIcon from "@mui/icons-material/Close";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SYNC_BANNER_HEIGHT } from "@/constants/layout";

type Props = {
  onLoginClick: () => void;
  onDismiss: () => void;
};

export function SyncBanner({ onLoginClick, onDismiss }: Props) {
  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: (muiTheme) => muiTheme.zIndex.appBar + 2,
        height: `${SYNC_BANNER_HEIGHT}px`,
        bgcolor: "#eff6ff",
        borderBottom: "1px solid #dbeafe"
      }}
    >
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: `${SYNC_BANNER_HEIGHT}px`, gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <CloudOffIcon color="primary" fontSize="small" />
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 500,
                color: "#334155",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: { xs: 13, sm: 14 }
              }}
            >
              모든 기기에서 목록을 동기화하려면 로그인하세요.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
            <Button color="primary" size="small" sx={{ fontWeight: 700, minWidth: 0, px: { xs: 0.5, sm: 1 } }} onClick={onLoginClick}>
              로그인
            </Button>
            <IconButton size="small" sx={{ color: "#64748b", p: 0.5 }} aria-label="알림 닫기" onClick={onDismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
