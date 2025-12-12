import React, { useEffect, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  IconButton,
  Stack,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useTranslation } from "react-i18next";
import containerLocationLogApi, { type ContainerLocationLogItem } from "@/api/containerLocationLogApi";

type Props = {
  open: boolean;
  orderDetailId: number | null;
  onClose: () => void;
  pageSize?: number;
};

export default function ContainerLocationDialog({ open, orderDetailId, onClose, pageSize = 10 }: Props) {
  const { t } = useTranslation(["order", "common"]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ContainerLocationLogItem[]>([]);
  const [meta, setMeta] = useState<{ currentPage?: number; totalRecords?: number }>({});

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const fetchLogs = async () => {
      if (!orderDetailId && orderDetailId !== 0) {
        setLogs([]);
        setMeta({});
        return;
      }
      setLoading(true);
      try {
        const resp = await containerLocationLogApi.getLogs({
          orderDetailId,
          pageNumber: 1,
          pageSize,
        });

        const data = (resp as any).data ?? resp;
        const items = (data?.items ?? []) as ContainerLocationLogItem[];
        if (!mounted) return;
        setLogs(items);
        setMeta({
          currentPage: data?.currentPage ?? 1,
          totalRecords: data?.totalRecords ?? items.length,
        });
      } catch (err) {
        console.error("Failed to load container location logs", err);
        if (!mounted) return;
        setLogs([]);
        setMeta({});
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLogs();

    return () => {
      mounted = false;
    };
  }, [open, orderDetailId, pageSize]);

  const formatDate = (s?: string | null) => {
    if (!s) return "-";
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        <Box>
          <Typography fontWeight={700}>
            {t("order:containerLocationLogTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {orderDetailId
              ? `${t("order:orderDetailId")}: ${orderDetailId}`
              : t("order:noOrderDetailSelected")}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="close">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box py={3} textAlign="center">
            <Typography color="text.secondary">{t("order:noLocationLogs")}</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {logs.map((l) => (
              <React.Fragment key={l.containerLocationLogId}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700} noWrap>
                            {l.containerCode ?? "-"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {l.performedBy ? `${l.performedBy}` : ""}
                            {l.updatedDate ? ` • ${formatDate(l.updatedDate)}` : ""}
                          </Typography>
                        </Box>

                        <Box textAlign="right" sx={{ ml: 1 }}>
                          {/* translate reason via i18n if mapping exists, else show raw value */}
                          <Typography variant="caption" color="text.secondary">
                            {l.reason ? t(`order:reason.${l.reason}`, { defaultValue: l.reason }) : ""}
                          </Typography>
                        </Box>
                      </Stack>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2">
                          <strong>{t("order:oldFloor")}:</strong> {l.oldFloor ?? "-"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t("order:currentFloor")}:</strong> {l.currentFloor ?? "-"}
                        </Typography>
                       
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Box sx={{ flex: "1 1 auto", pl: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {meta.totalRecords != null ? `${meta.totalRecords} ${t("order:records")}` : ""}
          </Typography>
        </Box>
        <Button onClick={onClose}>{t("actions.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
