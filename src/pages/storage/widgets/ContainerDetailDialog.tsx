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

type Props = {
  open: boolean;
  container: ContainerItem | null;
  onClose: () => void;
  onSaveLocal?: (updated: ContainerItem) => void;
  onNotify?: (message: string, severity?: "success" | "info" | "warning" | "error") => void;
};

const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1762190192/LOGO-remove_1_1_wj05gw.png";

const formatValue = (v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toString();
  return String(v);
};

export default function ContainerDetailDialog({ open, container, onClose, onSaveLocal, onNotify }: Props) {
  const { t } = useTranslation("storagePage");
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  const [serialNumber, setSerialNumber] = React.useState<number | "">("");
  const [layer, setLayer] = React.useState<number | "">("");

  const [logs, setLogs] = React.useState<ContainerLocationLogItem[]>([]);
  const [logPage, setLogPage] = React.useState<number>(1);
  const [logPageSize] = React.useState<number>(10);
  const [logTotalRecords, setLogTotalRecords] = React.useState<number>(0);
  const [logLoading, setLogLoading] = React.useState<boolean>(false);
  const [logError, setLogError] = React.useState<string | null>(null);

  const initialSerial = React.useMemo(() => {
    return container && typeof (container as any).serialNumber === "number" ? (container as any).serialNumber : "";
  }, [container]);

  const initialLayer = React.useMemo(() => {
    return container && typeof (container as any).layer === "number" ? (container as any).layer : "";
  }, [container]);

  React.useEffect(() => {
    if (container) {
      setSerialNumber(typeof (container as any).serialNumber === "number" ? (container as any).serialNumber : "");
      setLayer(typeof (container as any).layer === "number" ? (container as any).layer : "");
    } else {
      setSerialNumber("");
      setLayer("");
    }
    setLogPage(1);
    setLogs([]);
    setLogTotalRecords(0);
    setLogError(null);
  }, [container]);

  const hasChanges = React.useMemo(() => {
    if (!container) return false;
    return serialNumber !== initialSerial || layer !== initialLayer;
  }, [serialNumber, layer, initialSerial, initialLayer, container]);

  const imageSrc =
    container && (container as any).imageUrl && typeof (container as any).imageUrl === "string"
      ? (container as any).imageUrl
      : FALLBACK_IMAGE;

  const mainFields = {
    containerCode: container?.containerCode ?? "-",
    status: container?.status ?? "-",
    type: container?.type ?? "-",
    serialNumber: (container as any)?.serialNumber ?? "-",
    floorCode: container?.floorCode ?? "-",
    weight:
      typeof container?.currentWeight === "number"
        ? `${container.currentWeight} / ${container.maxWeight ?? "-"} kg`
        : `${formatValue(container?.currentWeight)} / ${formatValue(container?.maxWeight)}`,
  };

  const auxEntries = container
    ? Object.entries(container).filter(
        ([k]) =>
          ![
            "imageUrl",
            "containerCode",
            "status",
            "type",
            "serialNumber",
            "layer",
            "floorCode",
            "currentWeight",
            "maxWeight",
          ].includes(k)
      )
    : [];

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
    if (!container) return;

    if (!hasChanges) {
      onNotify?.(t("noChangesToSave"), "info");
      return;
    }

    const updated: ContainerItem = {
      ...container,
      serialNumber: serialNumber === "" ? undefined : Number(serialNumber),
      layer: layer === "" ? undefined : Number(layer),
    } as any;

    onSaveLocal?.(updated);

    onNotify?.(t("savedLocallyInfo"), "info");

    onClose();
  };

  const fetchLogs = React.useCallback(
    async (page: number) => {
      const code = container?.containerCode ?? "";
      if (!code) {
        setLogs([]);
        setLogTotalRecords(0);
        return;
      }
      setLogLoading(true);
      setLogError(null);
      try {
        const resp = await containerLocationLogApi.getByContainerCode(code, page, logPageSize);
        const data: any = (resp && (resp as any).data) ? (resp as any).data : resp;
        setLogs(Array.isArray(data.items) ? data.items : []);
        setLogPage(data.currentPage ?? page);
        setLogTotalRecords(typeof data.totalRecords === "number" ? data.totalRecords : (data.items ? data.items.length : 0));
      } catch (err: any) {
        setLogError(err?.message ?? t("copyFailed"));
        setLogs([]);
        setLogTotalRecords(0);
      } finally {
        setLogLoading(false);
      }
    },
    [container?.containerCode, logPageSize, t]
  );

  React.useEffect(() => {
    if (!open) return;
    fetchLogs(1);
  }, [open, container?.containerCode]);

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
        {!container ? (
          <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>{t("noContainerSelected")}</Box>
        ) : (
          <Stack spacing={2}>
            {/* Image + main info (side-by-side on sm+, stacked on xs) */}
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
                  alt={String(container?.containerCode ?? "")}
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
                    onClick={() => handleCopy(container?.containerCode)}
                    sx={{
                      whiteSpace: "nowrap",
                      width: isSmUp ? "auto" : "100%",
                      flexShrink: 0,
                    }}
                  >
                    {t("copyCode")}
                  </Button>

                  {/* Editable inputs for serialNumber & layer */}
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

            {/* Aux fields (2-column) */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
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
                    <Typography fontSize={11} color="text.secondary" sx={{ textTransform: "capitalize" }}>
                      {k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ")}
                    </Typography>
                    <Typography fontSize={13} fontWeight={600}>
                      {formatValue(v)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>

            <Divider />

            {/* Location logs section */}
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
                              <Typography fontSize={12} color="text.secondary">
                                {l.assign ? `(${l.assign})` : null}
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

                  {/* simple pagination controls */}
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

            {/* Save locally */}
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
