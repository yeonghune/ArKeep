import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

type Props = {
  open: boolean;
  count: number;
  isMigrating: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
};

export function GuestMigrationDialog({ open, count, isMigrating, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onClose={isMigrating ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>이 기기의 아티클을 계정에 동기화할까요?</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: "#475569" }}>
          저장된 아티클 {count}개를 계정으로 가져옵니다.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} color="inherit" disabled={isMigrating}>
          나중에
        </Button>
        <Button variant="contained" onClick={() => void onConfirm()} disabled={isMigrating}>
          {isMigrating ? "가져오는 중..." : "가져오기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
