import React, { useEffect, useState, useCallback } from "react";
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

import containerLocationLogApi, {
  type ContainerLocationLogItem,
} from "@/api/containerLocationLogApi";
import { removeContainer } from "@/api/containerApi";

type Props = {
  open: boolean;
  orderDetailId: number | null;
  orderCode?: string | null;
  onClose: () => void;
  pageSize?: number;
};

export default function ContainerLocationDialog({
  open,
  orderDetailId,
  orderCode,
  onClose,
  pageSize = 10,
}: Props) {
  const { t } = useTranslation(["order", "common"]);

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<ContainerLocationLogItem[]>([]);
  const [meta, setMeta] = useState<{
    currentPage?: number;
    totalRecords?: number;
  }>({});

  const [removing, setRemoving] = useState(false);

  /* ================= EMPLOYEE ================= */
  const getEmployeeCodeFromAccessToken = useCallback(() => {
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      if (!token) return "UNKNOWN";
      const [, payload] = token.split(".");
      const data = JSON.parse(atob(payload));
      return (
        data.EmployeeCode ??
        data.employeeCode ??
        data.employee_id ??
        data.employeeId ??
        data.sub ??
        "UNKNOWN"
      );
    } catch {
      return "UNKNOWN";
    }
  }, []);

  /* ================= FETCH LOGS ================= */
  const fetchLogs = useCallback(async () => {
    if (orderDetailId == null) {
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

      setLogs(items);
      setMeta({
        currentPage: data?.currentPage ?? 1,
        totalRecords: data?.totalRecords ?? items.length,
      });
    } catch (err) {
      console.error("Failed to load container location logs", err);
      setLogs([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  }, [orderDetailId, pageSize]);

  useEffect(() => {
    if (open) fetchLogs();
  }, [open, fetchLogs]);

  /* ================= CURRENT CONTAINER ================= */
  const latestLog = logs[0];
  const canRemove = Boolean(latestLog?.currentFloor);
  const containerCode = latestLog?.containerCode ?? null;

  /* ================= REMOVE ================= */
  const handleRemove = async () => {
    if (!containerCode) return;

    const performedBy = getEmployeeCodeFromAccessToken();
    setRemoving(true);

    try {
      await removeContainer({
        containerCode,
        performedBy,
        orderCode:
          orderCode ??
          (orderDetailId != null ? String(orderDetailId) : undefined),
      });

      await fetchLogs();
    } catch (err: any) {
      console.error("Remove container failed", err);
      alert(
        err?.response?.data?.message ??
          err?.message ??
          t("common:actionFailed")
      );
    } finally {
      setRemoving(false);
    }
  };

  const formatDate = (s?: string | null) => {
    if (!s) return "-";
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      {/* ================= TITLE ================= */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pr: 1,
        }}
      >
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

        <Stack direction="row" spacing={1} alignItems="center">
          {canRemove && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              disabled={removing}
              onClick={handleRemove}
            >
              {removing ? (
                <CircularProgress size={16} />
              ) : (
                t("actions.remove")
              )}
            </Button>
          )}

          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* ================= CONTENT ================= */}
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box py={3} textAlign="center">
            <Typography color="text.secondary">
              {t("order:noLocationLogs")}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {logs.map((l) => (
              <React.Fragment key={l.containerLocationLogId}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography fontWeight={700}>
                            {l.containerCode ?? "-"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {l.performedBy ?? ""}
                            {l.updatedDate
                              ? ` • ${formatDate(l.updatedDate)}`
                              : ""}
                          </Typography>
                        </Box>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {l.reason
                            ? t(`order:reason.${l.reason}`, {
                                defaultValue: l.reason,
                              })
                            : ""}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Box mt={1}>
                        <Typography variant="body2">
                          <strong>{t("order:oldFloor")}:</strong>{" "}
                          {l.oldFloor ?? "-"}
                        </Typography>
                        <Typography variant="body2">
                          <strong>{t("order:currentFloor")}:</strong>{" "}
                          {l.currentFloor ?? "-"}
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

      {/* ================= FOOTER ================= */}
      <DialogActions>
        <Box sx={{ flex: "1 1 auto", pl: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {meta.totalRecords != null
              ? `${meta.totalRecords} ${t("order:records")}`
              : ""}
          </Typography>
        </Box>
        <Button onClick={onClose}>{t("actions.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
