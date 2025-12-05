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

import { useTranslation } from "react-i18next";

import type { ContainerItem } from "@/api/containerApi";
import type { ContainerLocationLogItem } from "@/api/containerLocationLogApi";
import containerLocationLogApi from "@/api/containerLocationLogApi";

import { translateStatus } from "@/utils/statusHelper";
import { translatePaymentStatus } from "@/utils/paymentStatusHelper";
import { translateFieldLabel, formatBoolean } from "@/utils/fieldLabels";

type Props = {
  open: boolean;
  container: ContainerItem | null;
  onClose: () => void;
  onSaveLocal?: (updated: ContainerItem) => void;
  onNotify?: (message: string, severity?: "success" | "info" | "warning" | "error") => void;
};

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png";

const normalizeKey = (k: string) =>
  k
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

export default function ContainerDetailDialog({ open, container, onClose, onSaveLocal, onNotify }: Props) {
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

  const initialSerial = React.useMemo(() => {
    return c && typeof c.serialNumber === "number" ? c.serialNumber : "";
  }, [c]);

  const initialLayer = React.useMemo(() => {
    return c && typeof c.layer === "number" ? c.layer : "";
  }, [c]);

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

  const imageSrc = c && c.imageUrl && typeof c.imageUrl === "string" ? c.imageUrl : FALLBACK_IMAGE;

  const statusLabel = translateStatus(t, c?._orderStatus ?? c?.status ?? c?.state ?? null);

  const formatValue = (v: any) => {
    if (v === null || v === undefined || v === "") return "-";
    if (typeof v === "boolean") return formatBoolean(t, v);
    if (typeof v === "number") return v.toString();
    return String(v);
  };

  const mainFields = {
    containerCode: c?.containerCode ?? "-",
    status: statusLabel ?? (c?.status ?? "-"),
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
    const toCopy = text ?? "";
    try {
      if (!navigator.clipboard?.writeText) {
        onNotify?.(t("clipboardUnavailable"), "warning");
        return;
      }
      await navigator.clipboard.writeText(String(toCopy));
      onNotify?.(t("copiedToClipboard"), "success");
    } catch (err) {
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
        const resp = await containerLocationLogApi.getByContainerCode(code, page, logPageSize);
        const data: any = resp && (resp as any).data ? (resp as any).data : resp;
        setLogs(Array.isArray(data.items) ? data.items : []);
        setLogPage(data.currentPage ?? page);
        setLogTotalRecords(typeof data.totalRecords === "number" ? data.totalRecords : data.items ? data.items.length : 0);
      } catch (err: any) {
        setLogError(err?.message ?? t("copyFailed"));
        setLogs([]);
        setLogTotalRecords(0);
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

  const handlePrevPage = async () => {
    if (logPage <= 1) return;
    const next = logPage - 1;
    setLogPage(next);
    await fetchLogs(next);
  };
  const handleNextPage = async () => {
    const maxPage = Math.max(1, Math.ceil(logTotalRecords / logPageSize));
    if (logPage >= maxPage) return;
    const next = logPage + 1;
    setLogPage(next);
    await fetchLogs(next);
  };

  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    try {
      const date = new Date(d);
      return date.toLocaleString();
    } catch {
      return d;
    }
  };

  const displayAuxValue = (k: string, v: any) => {
    const nk = normalizeKey(k);

    if (nk === "is_active" || nk === "isactive") {
      return formatBoolean(t, v);
    }

    if (nk === "product_type_id" || nk === "producttypeid" || nk === "product_type_ids" || nk === "producttypeids") {
      if (Array.isArray(v)) return v.join(", ");
      return v ?? "-";
    }

    if (nk === "order_detail_id" || nk === "orderdetailid" || nk === "orderdetail") {
      return v ?? "-";
    }

    if (nk === "status" || nk === "_order_status" || nk === "order_status" || nk === "_orderstatus" || nk === "orderstatus") {
      return translateStatus(t, String(v)) ?? (v ?? "-");
    }

    if (nk.includes("payment") || nk === "_order_payment_status" || nk === "paymentstatus") {
      return translatePaymentStatus(t, String(v)) ?? (v ?? "-");
    }

    if (Array.isArray(v)) return v.join(", ");

    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) {
      try {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d.toLocaleString();
      } catch {
      }
    }

    return formatValue(v);
  };

  return (
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
          boxSizing: "border-box",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.25, sm: 1.5 },
        }}
      >
        <Typography variant="h6">{t("containerDetails")}</Typography>
        <IconButton onClick={onClose} size="small" aria-label={t("containerDetails")}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
        {!c ? (
          <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>{t("noContainerSelected")}</Box>
        ) : (
          <Stack spacing={2}>
            {/* Image + main info */}
            <Stack direction={isSmUp ? "row" : "column"} spacing={2} alignItems="flex-start">
              <Box
                sx={{
                  width: { xs: "100%", sm: 140 },
                  maxWidth: { xs: 320, sm: 140 },
                  height: { xs: 160, sm: 140 },
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "grey.100",
                  border: "1px solid",
                  borderColor: "divider",
                  flexShrink: 0,
                  mx: { xs: "auto", sm: 0 },
                }}
              >
                <img
                  src={imageSrc}
                  alt={String(c?.containerCode ?? "")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Box>

              {/* Info */}
              <Stack flex={1} spacing={0.75} sx={{ minWidth: 0 }}>
                <Typography
                  fontWeight={700}
                  fontSize={isSmUp ? 18 : 16}
                  sx={{
                    display: "-webkit-box",
                    WebkitLineClamp: isSmUp ? 1 : 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {mainFields.containerCode}
                </Typography>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`${t("status")}: ${mainFields.status}`} size="small" />
                  <Chip label={`${t("type")}: ${mainFields.type}`} size="small" />
                  <Chip label={`${t("snLabel")}: ${mainFields.serialNumber}`} size="small" />
                </Stack>

                <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5 }}>
                  {t("floor")}: {mainFields.floorCode}
                </Typography>

                <Typography fontSize={13} color="text.secondary">
                  {t("weight")}: {mainFields.weight}
                </Typography>

                <Stack
                  direction={isSmUp ? "row" : "column"}
                  spacing={1}
                  alignItems={isSmUp ? "center" : "stretch"}
                  sx={{ mt: 1 }}
                >
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={() => handleCopy(c?.containerCode)}
                    sx={{
                      whiteSpace: "nowrap",
                      width: isSmUp ? "auto" : "100%",
                      flexShrink: 0,
                    }}
                  >
                    {t("copyCode")}
                  </Button>

                  <TextField
                    size="small"
                    label={t("serialNumber")}
                    type="number"
                    value={serialNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSerialNumber(val === "" ? "" : Number(val));
                    }}
                    sx={{ width: isSmUp ? 140 : "100%" }}
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                  />
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            {/* Aux fields */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {auxEntries.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                  {t("noAdditionalData")}
                </Typography>
              ) : (
                auxEntries.map(([k, v]) => (
                  <Box
                    key={k}
                    sx={{
                      width: { xs: "48%", sm: "48%" },
                      p: 1,
                      borderRadius: 1,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                      boxSizing: "border-box",
                    }}
                  >
                    <Typography fontSize={11} color="text.secondary">
                      {translateFieldLabel(t, k)}
                    </Typography>
                    <Typography fontSize={13} fontWeight={600}>
                      {displayAuxValue(k, v)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>

            <Divider />

            {/* Location logs and pagination */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle1">{t("locationHistory")}</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {logTotalRecords > 0 ? t("recordsCount", { count: logTotalRecords }) : ""}
                  </Typography>
                  <Tooltip title={t("refresh")}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setLogPage(1);
                        fetchLogs(1);
                      }}
                    >
                      ↻
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>

              {logLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : logError ? (
                <Typography color="error">{logError}</Typography>
              ) : logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t("noLocationHistory")}
                </Typography>
              ) : (
                <>
                  <List dense sx={{ maxHeight: 220, overflow: "auto", bgcolor: "background.paper" }}>
                    {logs.map((l) => (
                      <ListItem
                        key={l.containerLocationLogId}
                        secondaryAction={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Tooltip title={t("copyCode")}>
                              <IconButton size="small" onClick={() => handleCopy(l.currentFloor)}>
                                <ContentCopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight={700} fontSize={13}>
                                {l.currentFloor ?? "-"}
                              </Typography>

                              <Typography fontSize={12} color="text.secondary" sx={{ ml: 0.5 }}>
                                {l.performedBy ? t("performedBy", { name: l.performedBy }) : null}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={0.25}>
                              <Typography fontSize={12} color="text.secondary">
                                {l.orderCode ? `${t("orderPrefix", { orderCode: l.orderCode })} • ` : ""}
                                {t("updated", { date: formatDate(l.updatedDate) })}
                              </Typography>
                              {l.oldFloor ? (
                                <Typography fontSize={12} color="text.secondary">
                                  {t("fromFloor", { oldFloor: l.oldFloor })}
                                </Typography>
                              ) : null}
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      startIcon={<ArrowBackIosNewIcon fontSize="small" />}
                      onClick={handlePrevPage}
                      disabled={logPage <= 1}
                    >
                      {t("prev")}
                    </Button>
                    <Typography variant="body2" sx={{ minWidth: 88, textAlign: "center" }}>
                      {t("pageOf", { page: logPage, total: Math.max(1, Math.ceil(logTotalRecords / logPageSize)) })}
                    </Typography>
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIosIcon fontSize="small" />}
                      onClick={handleNextPage}
                      disabled={logPage >= Math.max(1, Math.ceil(logTotalRecords / logPageSize))}
                    >
                      {t("next")}
                    </Button>
                  </Stack>
                </>
              )}
            </Box>

            <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveLocal}
                disabled={!hasChanges}
                fullWidth={!isSmUp}
              >
                {t("saveLocally")}
              </Button>
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
