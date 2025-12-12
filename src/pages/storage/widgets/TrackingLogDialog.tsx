import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Divider,
} from "@mui/material";

import type { ContainerLocationLogItem } from "@/api/containerLocationLogApi";
import { useTranslation } from "react-i18next";

type TrackingLogDialogProps = {
  open: boolean;
  data: ContainerLocationLogItem[] | null;
  onClose: () => void;
};

export default function TrackingLogDialog({
  open,
  data,
  onClose,
}: TrackingLogDialogProps) {
  const { t } = useTranslation("storagePage");

  const sorted = (data ?? []).slice().sort((a, b) => {
    const da = new Date(a.updatedDate ?? "").getTime();
    const db = new Date(b.updatedDate ?? "").getTime();
    return db - da;
  });
const mapReason = (reason?: string | null) => {
  if (!reason) return "-";
  return t(`trackingDialog.reasonMap.${reason}`, reason);
};
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>
        {t("trackingDialog.title")}
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#fafafa" }}>
        {!sorted.length ? (
          <Typography textAlign="center" sx={{ py: 3 }}>
            {t("trackingDialog.noHistory")}
          </Typography>
        ) : (
          <Stack spacing={2}>
            {sorted.map((log, index) => (
              <Card
                key={index}
                elevation={1}
                sx={{
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                  bgcolor: "#ffffff",
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Typography
                    fontWeight={700}
                    sx={{ mb: 0.5, fontSize: 15, color: "primary.main" }}
                  >
                    #{log.containerLocationLogId} — {mapReason(log.reason)}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Stack spacing={0.6}>
                    <Row label={t("trackingDialog.card.container")} value={log.containerCode} bold />
                    <Row label={t("trackingDialog.card.orderCode")} value={log.orderCode} />
                    <Row label={t("trackingDialog.card.orderDetailId")} value={log.orderDetailId} />
                    <Row label={t("trackingDialog.card.performedBy")} value={log.performedBy} />
                    <Row label={t("trackingDialog.card.updatedDate")} value={log.updatedDate} />
                    <Row label={t("trackingDialog.card.oldFloor")} value={log.oldFloor ?? "-"} />
                    <Row label={t("trackingDialog.card.currentFloor")} value={log.currentFloor ?? "-"} />
                    <Row label={t("trackingDialog.card.algorithm")} value={log.algorithm ?? "-"} />

                    {log.notes && (
                      <Box mt={1}>
                        <Typography fontWeight={600} fontSize={13}>
                          {t("trackingDialog.card.notes")}:
                        </Typography>
                       
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="contained" onClick={onClose}>
          {t("trackingDialog.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: any;
  bold?: boolean;
}) {
  return (
    <Typography fontSize={13}>
      <strong>{label}:</strong>{" "}
      <span style={{ fontWeight: bold ? 600 : 400 }}>{value ?? "-"}</span>
    </Typography>
  );
}
