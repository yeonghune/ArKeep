import CloseIcon from "@mui/icons-material/Close";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SYNC_BANNER_HEIGHT } from "../../home-constants";

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
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ height: `${SYNC_BANNER_HEIGHT}px` }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CloudOffIcon color="primary" fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 500, color: "#334155" }}>
              모든 기기에서 목록을 동기화하려면 로그인하세요.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Button color="primary" sx={{ fontWeight: 700, px: 1 }} onClick={onLoginClick}>
              로그인
            </Button>
            <IconButton size="small" sx={{ color: "#64748b" }} aria-label="알림 닫기" onClick={onDismiss}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
