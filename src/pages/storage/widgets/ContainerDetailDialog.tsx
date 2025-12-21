import React from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  useMediaQuery,
  Stack,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Tooltip,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContainerLocationQrDialog from "@/pages/order/components/ContainerLocationQrDialog";
import orderDetailApi from "@/api/orderDetailApi";

import { useTranslation } from "react-i18next";

import type { ContainerItem } from "@/api/containerApi";
import type { ContainerLocationLogItem } from "@/api/containerLocationLogApi";
import containerLocationLogApi from "@/api/containerLocationLogApi";
import { removeContainer } from "@/api/containerApi";

import { translateStatus } from "@/utils/statusHelper";
import { translateFieldLabel, formatBoolean } from "@/utils/fieldLabels";
import contactApi from "@/api/contactApi";

type Props = {
  open: boolean;
  container: ContainerItem | null;
  onClose: () => void;
  onSaveLocal?: (updated: ContainerItem) => void;
  onNotify?: (message: string, severity?: "success" | "info" | "warning" | "error") => void;
  orderCode?: string;
  onRemoved?: (containerCode: string) => void;
};

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png";

const normalizeKey = (k: string) =>
  k.toString().trim().toLowerCase().replace(/\s+/g, "_");

export default function ContainerDetailDialog({
  open,
  container,
  onClose,
  onSaveLocal,
  onNotify,
  orderCode,
  onRemoved,
}: Props) {
  const { t } = useTranslation(["storagePage", "statusNames", "paymentStatus", "common"]);
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  const c = container as any;

  const [serialNumber, setSerialNumber] = React.useState<number | "">("");
  const [layer, setLayer] = React.useState<number | "">("");

  const [logs, setLogs] = React.useState<ContainerLocationLogItem[]>([]);
  const [logPage, setLogPage] = React.useState<number>(1);
  const [logPageSize] = React.useState<number>(10);
  const [logTotalRecords, setLogTotalRecords] = React.useState<number>(0);
  const [logLoading, setLogLoading] = React.useState<boolean>(false);
  const [logError, setLogError] = React.useState<string | null>(null);

  const [isRemoving, setIsRemoving] = React.useState<boolean>(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = React.useState(false);
  const [isDamagedChecked, setIsDamagedChecked] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [qrOrderDetail, setQrOrderDetail] = React.useState<any>(null);

  const initialSerial = React.useMemo(
    () => (c && typeof c.serialNumber === "number" ? c.serialNumber : ""),
    [c]
  );

  const initialLayer = React.useMemo(
    () => (c && typeof c.layer === "number" ? c.layer : ""),
    [c]
  );

  React.useEffect(() => {
    if (c) {
      setSerialNumber(typeof c.serialNumber === "number" ? c.serialNumber : "");
      setLayer(typeof c.layer === "number" ? c.layer : "");
    } else {
      setSerialNumber("");
      setLayer("");
    }
    setLogPage(1);
    setLogs([]);
    setLogTotalRecords(0);
    setLogError(null);
  }, [c]);

  const hasChanges = React.useMemo(() => {
    if (!c) return false;
    return serialNumber !== initialSerial || layer !== initialLayer;
  }, [serialNumber, layer, initialSerial, initialLayer, c]);

  const imageSrc =
    c && c.imageUrl && typeof c.imageUrl === "string"
      ? c.imageUrl
      : FALLBACK_IMAGE;

  const statusLabel = translateStatus(
    t,
    c?._orderStatus ?? c?.status ?? c?.state ?? null
  );

  const formatValue = (v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "boolean") return formatBoolean(t, v);
    if (typeof v === "number") return v.toString();
    return String(v);
  };

  const mainFields = {
    containerCode: c?.containerCode ?? "-",
    status: statusLabel ?? c?.status ?? "-",
    type: c?.type ?? "-",
    serialNumber: c?.serialNumber ?? "-",
    floorCode: c?.floorCode ?? "-",
    weight:
      typeof c?.currentWeight === "number"
        ? `${c.currentWeight} / ${c.maxWeight ?? "-"} kg`
        : `${formatValue(c?.currentWeight)} / ${formatValue(c?.maxWeight)}`,
  };

  const AUX_BLACKLIST_KEYS = React.useMemo(() => {
    return [
      "price",
      "position_x",
      "position_y",
      "position_z",
      "positionx",
      "positiony",
      "positionz",
      "lastoptimizeddate",
      "last_optimized_date",
      "last_optimized",
      "optimization_score",
      "optimizationscore",
      "notes",
      "container_above_code",
      "containerabovecode",
      "container_above",
      "lastoptimized",
      "last_optimized_date_time",
      "opt_score",
      "optimization-score",
    ].reduce<Record<string, boolean>>((acc, k) => {
      acc[k] = true;
      return acc;
    }, {});
  }, []);

  const auxEntries = React.useMemo(() => {
    if (!c) return [];
    const primary = [
      "imageUrl",
      "imageurl",
      "containerCode",
      "containercode",
      "status",
      "type",
      "serialNumber",
      "serialnumber",
      "layer",
      "floorCode",
      "floorcode",
      "currentWeight",
      "currentweight",
      "maxWeight",
      "maxweight",
    ].map(normalizeKey);

    return Object.entries(c).filter(([k]) => {
      const nk = normalizeKey(k);
      if (primary.includes(nk)) return false;
      if (AUX_BLACKLIST_KEYS[nk]) return false;
      return true;
    });
  }, [c, AUX_BLACKLIST_KEYS]);

  const handleCopy = async (text?: string | null) => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
      onNotify?.(t("copiedToClipboard"), "success");
    } catch {
      onNotify?.(t("copyFailed"), "error");
    }
  };

  const handleSaveLocal = () => {
    if (!c) return;
    if (!hasChanges) {
      onNotify?.(t("noChangesToSave"), "info");
      return;
    }

    const updated: ContainerItem = {
      ...c,
      serialNumber: serialNumber === "" ? undefined : Number(serialNumber),
      layer: layer === "" ? undefined : Number(layer),
    } as any;

    onSaveLocal?.(updated);
    onNotify?.(t("savedLocallyInfo"), "info");
    onClose();
  };

  const fetchLogs = React.useCallback(
    async (page: number) => {
      const code = c?.containerCode ?? "";
      if (!code) {
        setLogs([]);
        setLogTotalRecords(0);
        return;
      }
      setLogLoading(true);
      setLogError(null);
      try {
        const resp = await containerLocationLogApi.getByContainerCode(
          code,
          page,
          logPageSize
        );
        const data = (resp as any).data ?? resp;
        setLogs(Array.isArray(data.items) ? data.items : []);
        setLogPage(data.currentPage ?? page);
        setLogTotalRecords(
          typeof data.totalRecords === "number"
            ? data.totalRecords
            : data.items?.length ?? 0
        );
      } catch (err: any) {
        setLogError(err?.message ?? t("copyFailed"));
        setLogs([]);
      } finally {
        setLogLoading(false);
      }
    },
    [c?.containerCode, logPageSize, t]
  );

  React.useEffect(() => {
    if (!open) return;
    fetchLogs(1);
  }, [open, c?.containerCode]);

  const handlePrevPage = () => logPage > 1 && fetchLogs(logPage - 1);
  const handleNextPage = () =>
    logPage < Math.ceil(logTotalRecords / logPageSize) &&
    fetchLogs(logPage + 1);

  const getEmployeeCodeFromAccessToken = React.useCallback(() => {
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      if (!token) return null;
      const [_, payload] = token.split(".");
      const data = JSON.parse(atob(payload));
      return (
        data.EmployeeCode ??
        data.employeeCode ??
        data.employee_id ??
        data.employeeId ??
        data.sub ??
        null
      );
    } catch {
      return null;
    }
  }, []);
  const executeRemoveContainer = React.useCallback(async () => {
    if (!c?.containerCode) return;

    const performedBy = getEmployeeCodeFromAccessToken() ?? "UNKNOWN";
    const orderCodeToSend =
      orderCode ??
      c?.orderCode ??
      (c?.orderDetailId ? String(c.orderDetailId) : undefined);

    setIsRemoving(true);
    try {
      if (isDamagedChecked && c?.orderDetailId) {
        await contactApi.markOrderDetailDamaged(
          Number(c.orderDetailId)
        );
      }

      await removeContainer({
        containerCode: c.containerCode,
        performedBy,
        orderCode: orderCodeToSend,
      });

      onNotify?.(t("removeContainerSuccess"), "success");
      onRemoved?.(c.containerCode);
      setConfirmRemoveOpen(false);
      setIsDamagedChecked(false);
      onClose();
    } catch (err: any) {
      onNotify?.(
        err?.response?.data?.message ??
        err?.message ??
        t("removeContainerFailed"),
        "error"
      );
    } finally {
      setIsRemoving(false);
    }
  }, [
    c,
    orderCode,
    onRemoved,
    onClose,
    onNotify,
    getEmployeeCodeFromAccessToken,
    isDamagedChecked,
    t,
  ]);

  const handleRemoveContainer = React.useCallback(() => {
    if (!c?.containerCode) {
      onNotify?.(t("noContainerSelected"), "warning");
      return;
    }

    setConfirmRemoveOpen(true);
  }, [c, onNotify, t]);


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth={isSmUp}
        PaperProps={{
          sx: {
            m: { xs: 2, sm: 2 },
            width: { xs: 360, sm: "600px" },
            maxWidth: "100%",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2, sm: 3 },
          }}
        >
          <Typography variant="h6">{t("containerDetails")}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {!c ? (
            <Box textAlign="center" py={5} color="text.secondary">
              {t("noContainerSelected")}
            </Box>
          ) : (
            <Stack spacing={2}>
              {/* ========== IMAGE + INFO ========== */}
              <Stack
                direction={isSmUp ? "row" : "column"}
                spacing={2}
                alignItems="flex-start"
              >
                <Box
                  sx={{
                    width: { xs: "100%", sm: 140 },
                    height: { xs: 160, sm: 140 },
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "grey.100",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <img
                    src={imageSrc}
                    alt={c?.containerCode ?? ""}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>

                <Stack flex={1} spacing={1}>
                  <Typography fontWeight={700} fontSize={18}>
                    {mainFields.containerCode}
                  </Typography>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`${t("status")}: ${mainFields.status}`} size="small" />
                    <Chip label={`${t("type")}: ${mainFields.type}`} size="small" />
                    <Chip label={`${t("snLabel")}: ${mainFields.serialNumber}`} size="small" />
                  </Stack>

                  <Typography fontSize={13} color="text.secondary">
                    {t("floor")}: {mainFields.floorCode}
                  </Typography>

                  <Typography fontSize={13} color="text.secondary">
                    {t("weight")}: {mainFields.weight}
                  </Typography>

                  {/* ==== BUTTONS: COPY + QR + EDIT ==== */}
                  <Stack
                    direction={isSmUp ? "row" : "column"}
                    spacing={1}
                    sx={{ mt: 1 }}
                  >
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopy(c?.containerCode)}
                    >
                      {t("copyCode")}
                    </Button>

                    {/* ==== QR BUTTON ==== */}
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<QrCode2Icon />}
                      onClick={async () => {
                        if (!c?.orderDetailId) {
                          onNotify?.("Không có OrderDetailId", "warning");
                          return;
                        }
                        try {
                          const resp = await orderDetailApi.getOrderDetail(
                            Number(c.orderDetailId)
                          );
                          setQrOrderDetail(resp?.data ?? resp);
                          setQrOpen(true);
                        } catch {
                          onNotify?.("Không tải được OrderDetail", "error");
                        }
                      }}
                    >
                      QR
                    </Button>

                    <TextField
                      size="small"
                      label={t("serialNumber")}
                      type="number"
                      value={serialNumber}
                      onChange={(e) =>
                        setSerialNumber(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      sx={{ width: isSmUp ? 140 : "100%" }}
                    />
                  </Stack>
                </Stack>
              </Stack>

              <Divider />

              {/* ========== AUX FIELDS ========== */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {auxEntries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("noAdditionalData")}
                  </Typography>
                ) : (
                  auxEntries.map(([k, v]) => (
                    <Box
                      key={k}
                      sx={{
                        width: "48%",
                        p: 1,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Typography fontSize={11} color="text.secondary">
                        {translateFieldLabel(t, k)}
                      </Typography>
                      <Typography fontSize={13} fontWeight={600}>
                        {formatValue(v)}
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>

              <Divider />

              {/* ========== LOCATION LOGS ========== */}
              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle1">
                    {t("locationHistory")}
                  </Typography>

                  <Tooltip title={t("refresh")}>
                    <IconButton
                      size="small"
                      onClick={() => fetchLogs(1)}
                    >
                      ↻
                    </IconButton>
                  </Tooltip>
                </Stack>

                {logLoading ? (
                  <Box textAlign="center" py={2}>
                    <CircularProgress size={20} />
                  </Box>
                ) : logError ? (
                  <Typography color="error">{logError}</Typography>
                ) : logs.length === 0 ? (
                  <Typography color="text.secondary">
                    {t("noLocationHistory")}
                  </Typography>
                ) : (
                  <>
                    <List dense sx={{ maxHeight: 220, overflow: "auto" }}>
                      {logs.map((l) => (
                        <ListItem
                          key={l.containerLocationLogId}
                          secondaryAction={
                            <Tooltip title={t("copyCode")}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopy(l.currentFloor)}
                              >
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1}>
                                <Typography fontWeight={700} fontSize={13}>
                                  {l.currentFloor}
                                </Typography>
                                <Typography fontSize={12} color="text.secondary">
                                  {l.performedBy ? t("performedBy", { name: l.performedBy }) : ""}
                                </Typography>
                              </Stack>
                            }
                            secondary={
                              <>
                                <Typography fontSize={12} color="text.secondary">
                                  {l.orderCode && `${t("orderPrefix", { orderCode: l.orderCode })} • `}
                                  {
                                    t("updated", {
                                      date: l.updatedDate
                                        ? new Date(l.updatedDate).toLocaleString()
                                        : "-"
                                    })
                                  }
                                </Typography>

                                {l.oldFloor ? (
                                  <Typography fontSize={12} color="text.secondary">
                                    {t("fromFloor", { oldFloor: l.oldFloor })}
                                  </Typography>
                                ) : null}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Stack
                      direction="row"
                      justifyContent="flex-end"
                      alignItems="center"
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      <Button
                        size="small"
                        startIcon={<ArrowBackIosNewIcon fontSize="small" />}
                        disabled={logPage <= 1}
                        onClick={() => handlePrevPage()}
                      >
                        {t("prev")}
                      </Button>

                      <Typography>
                        {t("pageOf", {
                          page: logPage,
                          total: Math.ceil(logTotalRecords / logPageSize),
                        })}
                      </Typography>

                      <Button
                        size="small"
                        endIcon={<ArrowForwardIosIcon fontSize="small" />}
                        disabled={logPage >= Math.ceil(logTotalRecords / logPageSize)}
                        onClick={() => handleNextPage()}
                      >
                        {t("next")}
                      </Button>
                    </Stack>
                  </>
                )}
              </Box>

              {/* ========== FOOTER BUTTONS ========== */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  disabled={isRemoving}
                  onClick={handleRemoveContainer}
                >
                  {isRemoving ? (
                    <CircularProgress size={18} />
                  ) : (
                    t("takeOut")
                  )}
                </Button>

                <Button
                  variant="contained"
                  disabled={!hasChanges}
                  onClick={handleSaveLocal}
                >
                  {t("saveLocally")}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* ==== QR DIALOG ==== */}
      <ContainerLocationQrDialog
        open={qrOpen}
        orderDetail={qrOrderDetail}
        orderCode={c?.orderCode ?? null}
        onClose={() => setQrOpen(false)}
      />
      <Dialog
        open={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
      >
        <DialogTitle>
          {t("confirmTakeOut") ?? "Confirm take out"}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography>
              {t("confirmTakeOutMessage") ??
                "Are you sure you want to take out this container?"}
            </Typography>

            <label>
              <input
                type="checkbox"
                checked={isDamagedChecked}
                onChange={(e) => setIsDamagedChecked(e.target.checked)}
              />
              &nbsp;
              {t("containerIsDamaged") ?? "Container is damaged"}
            </label>
          </Stack>
        </DialogContent>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ p: 2 }}>
          <Button onClick={() => setConfirmRemoveOpen(false)}>
            {t("cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={executeRemoveContainer}
            disabled={isRemoving}
          >
            {isRemoving ? <CircularProgress size={18} /> : t("confirm")}
          </Button>
        </Stack>
      </Dialog>

    </>
  );
}
