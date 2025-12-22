import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  Chip,
  Avatar,
  Button,
  Card,
  CardContent,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ImageIcon from "@mui/icons-material/Image";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import * as trackingApi from "@/api/trackingHistoryApi";
import * as orderStatusApi from "@/api/orderStatusApi";
import { useTranslation } from "react-i18next";
import {
  translateStatus,
  translateActionType,
  translatePaymentStatus,
  translateServiceName,
  translateProductType,
} from "@/utils/translationHelpers";
import { differenceInCalendarDays, parseISO } from "date-fns";

type Props = {
  trackingId: number | null;
  open: boolean;
  onClose: () => void;
  item?: trackingApi.TrackingHistoryItem & Record<string, any>;
  onActionComplete?: () => void;
};

function ConfirmDialog({
  open,
  title,
  message,
  loading,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title?: string;
  message?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation("trackingHistoryPage");
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title ?? t("confirm")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message ?? t("deleteConfirmMsg")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={loading}>
          {t("cancelBtn") ?? "Cancel"}
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={16} /> : t("confirmBtn") ?? "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function TrackingHistoryDetailDrawer({
  trackingId,
  open,
  onClose,
  item,
  onActionComplete,
}: Props) {
  const { t } = useTranslation("trackingHistoryPage");

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [data, setData] = useState<trackingApi.TrackingHistoryItem & Record<string, any> | null>(item ?? null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; severity?: "success" | "error" | "info"; message: string }>({
    open: false,
    severity: "info",
    message: "",
  });

  const [extendDate, setExtendDate] = useState<Date | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  // image upload dialog states
  const [imgDialogOpen, setImgDialogOpen] = useState(false);
  const [imgUrlsText, setImgUrlsText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[] | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // simple image viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (item) {
      setData(item);
      return;
    }
    if (!open || !trackingId) {
      setData(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await trackingApi.getTrackingHistories?.({ page: 1, pageSize: 1000 });
        if (!mounted) return;
        const found = (resp?.data ?? []).find((x: any) => x.trackingHistoryId === trackingId) ?? null;
        setData(found);
      } catch (err) {
        console.error("Failed to fetch tracking item:", err);
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, trackingId, item]);

  useEffect(() => {
    if (item) setData(item);
  }, [item]);

  const has = (v: any) => v !== null && v !== undefined && v !== "";

  const isChild = useMemo(() => Boolean((data as any)?._isChild), [data]);

  const withTooltip = (original?: string | null, translated?: string | null) => {
    const orig = original ?? "";
    const trans = translated ?? orig ?? "-";
    if (!orig) return <span>{trans}</span>;
    return (
      <Tooltip title={orig}>
        <span style={{ display: "inline-block", maxWidth: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {trans}
        </span>
      </Tooltip>
    );
  };

  const headerTitle = useMemo(() => {
    if (!data) return t("trackingFor", { id: trackingId ?? "" });
    const translatedAction = translateActionType(t, data.actionType ?? "");
    if (translatedAction && translatedAction !== (data.actionType ?? "")) {
      return `${translatedAction} (${data.trackingHistoryId})`;
    }
    return data.actionType ? `${data.actionType} (${data.trackingHistoryId})` : t("trackingFor", { id: data.trackingHistoryId });
  }, [data, trackingId, t]);

  const openSnackbar = (message: string, severity: "success" | "error" | "info" = "info") => setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const statusRaw = (data?.newStatus ?? data?.oldStatus ?? "") as string;
  const statusNorm = String(statusRaw).toLowerCase().trim();
  const isCompleted = statusNorm === "completed";
  const isCancelled = statusNorm === "cancelled";
  const overdueAliases = ["overdue"];
  const isOverdue = overdueAliases.some((a) => statusNorm === a || statusNorm.includes(a));
  const isRefunded = statusNorm === "refunded";
  const isExpired = statusNorm === "expired" || statusNorm.includes("expired");

  const toDateISO = (d: Date | null) => {
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const refreshOrderStatus = async (orderCode: string) => {
    try {
      const resp = await orderStatusApi.getOrderStatus(orderCode);
      const info = resp?.data;
      if (info) {
        setData((d) =>
          d
            ? {
              ...d,
              newStatus: info.status ?? d.newStatus,
              paymentStatus: info.paymentStatus ?? (d as any).paymentStatus,
              returnDate: info.returnDate ?? (d as any).returnDate,
            }
            : d
        );
      }
    } catch (err) {
      console.warn("refreshOrderStatus failed", err);
    }
  };

  const openConfirm = (title: string, message: string, actionFn: () => Promise<void>) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => actionFn);
    setConfirmOpen(true);
  };

  const handleConfirmCancel = () => {
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const handleConfirmOk = async () => {
    if (!confirmAction) {
      setConfirmOpen(false);
      return;
    }
    setActionLoading(true);
    try {
      await confirmAction();
      onActionComplete?.();
      onClose();
      openSnackbar(t("confirmActionSuccess"), "success");
    } catch (err) {
      console.error("confirm action failed", err);
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }
    const orderCode = data.orderCode!;
    openConfirm(t("updateStatusConfirmTitle"), t("updateStatusConfirmMsg", { code: orderCode }), async () => {
      const prev = data;
      setData((d) => (d ? { ...d, newStatus } : d));
      try {
        await orderStatusApi.updateStatus(orderCode);
        await refreshOrderStatus(orderCode);
      } catch (err) {
        console.error("Failed to update status:", err);
        openSnackbar(t("saveFailed") ?? "Failed", "error");
        setData(prev);
        throw err;
      }
    });
  };

  const handleExtendOrder = () => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }
    if (!extendDate) {
      openSnackbar(t("selectExtendDate"), "error");
      return;
    }
    const isoDate = toDateISO(extendDate);
    if (!isoDate) {
      openSnackbar(t("invalidDate"), "error");
      return;
    }
    const orderCode = data.orderCode!;

    const fetchOrderInfoIfNeeded = async (): Promise<any | null> => {
      try {
        const hasDeposit = Boolean((data as any)?.depositDate);
        const hasPrice = (data as any)?.totalPrice !== undefined && (data as any).totalPrice !== null;
        if (hasDeposit && hasPrice) {
          return { depositDate: (data as any).depositDate, totalPrice: (data as any).totalPrice, returnDate: (data as any).returnDate };
        }

        const resp = await orderStatusApi.getOrderStatus(orderCode);
        const info = resp && ((resp as any).data !== undefined ? (resp as any).data : resp);
        console.log("GET ORDER STATUS RESPONSE", info);

        if (info) {
          setData((d) => {
            if (d) {
              return {
                ...d,
                depositDate: d.depositDate ?? info.depositDate,
                totalPrice: d.totalPrice ?? info.totalPrice,
                returnDate: d.returnDate ?? info.returnDate,
              } as typeof d;
            }

            const minimal: any = {
              trackingHistoryId: trackingId ?? -1,
              orderCode: info?.orderCode ?? orderCode,
              depositDate: info.depositDate ?? null,
              totalPrice: info.totalPrice ?? null,
              returnDate: info.returnDate ?? null,
              oldStatus: (info as any).oldStatus ?? null,
              newStatus: (info as any).newStatus ?? null,
              actionType: (info as any).actionType ?? null,
              createAt: (info as any).createAt ?? null,
            };
            return minimal as trackingApi.TrackingHistoryItem & Record<string, any>;
          });

          return info;
        }

        return null;
      } catch (err) {
        console.warn("[EXTEND] fetchOrderInfoIfNeeded failed:", err);
        return null;
      }
    };

    openConfirm(
      t("extendConfirmTitle"),
      t("extendConfirmMsg", { code: orderCode, date: isoDate }),
      async () => {
        const prev = data;

        const infoFromFetch = await fetchOrderInfoIfNeeded();

        const source = infoFromFetch ?? data ?? prev;

        const depositStr = source?.depositDate;
        const origReturnStr = source?.returnDate;
        const totalPriceRaw = source?.totalPrice ?? 0;

        let unpaidAmount = 0;

        if (depositStr && origReturnStr && extendDate) {
          const deposit = parseISO(String(depositStr));
          const origReturn = parseISO(String(origReturnStr));
          const newReturn = extendDate;

          const originalDays = differenceInCalendarDays(origReturn, deposit);
          const extendDays = differenceInCalendarDays(newReturn, origReturn);
          const totalPrice = Number(totalPriceRaw);

          if (originalDays > 0 && extendDays > 0 && totalPrice > 0) {
            unpaidAmount = Math.round((totalPrice / originalDays) * extendDays);
          }
        }
        console.log("EXTEND CALC DEBUG", {
          depositDate: source?.depositDate,
          returnDate: source?.returnDate,
          extendDate,
          totalPrice: source?.totalPrice,
          unpaidAmount,
        });
        setData((d) =>
          d ? { ...d, returnDate: isoDate, unpaidAmount } : d
        );

        await orderStatusApi.extendOrder(orderCode, isoDate, unpaidAmount);
        await refreshOrderStatus(orderCode);
      }
    );

  };

  const handleMoveToExpiredStorage = () => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }
    const orderCode = data.orderCode!;
    openConfirm(t("moveExpiredConfirmTitle"), t("moveExpiredConfirmMsg", { code: orderCode }), async () => {
      const prev = data;
      setData((d) => (d ? { ...d, newStatus: "Expired" } : d));
      try {
        await orderStatusApi.moveToExpiredStorage(orderCode);
        await refreshOrderStatus(orderCode);
      } catch (err) {
        console.error("Failed to move to expired storage:", err);
        openSnackbar(t("saveFailed"), "error");
        setData(prev);
        throw err;
      }
    });
  };
  const handleCancelOrder = () => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }

    const orderCode = data.orderCode;

    openConfirm(
      t("cancelOrderConfirmTitle") ?? "Cancel order",
      t("cancelOrderConfirmMsg", { code: orderCode }) ??
      `Are you sure you want to cancel order ${orderCode}?`,
      async () => {
        const prev = data;

        setData((d) =>
          d ? { ...d, newStatus: "Cancelled" } : d
        );

        try {
          await orderStatusApi.cancelOrder({
            orderCode,
            cancelReason: "Refunded / Stored in expired",
          });

          await refreshOrderStatus(orderCode);
        } catch (err) {
          console.error("Cancel order failed:", err);
          setData(prev);
          openSnackbar(t("saveFailed"), "error");
          throw err;
        }
      }
    );
  };

  // Cloudinary (Vite)
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? "";
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? "";
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`;

  const openImageDialog = () => {
    setImgUrlsText("");
    setSelectedFiles(null);
    setPreviewImages([]);
    setImgDialogOpen(true);
  };

  const handleFilesSelected = (filesList: FileList | null) => {
    if (!filesList) {
      setSelectedFiles(null);
      setPreviewImages([]);
      return;
    }
    const files = Array.from(filesList);
    setSelectedFiles(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setPreviewImages(previews);
  };

  const uploadFileToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) throw new Error("Cloudinary config missing");
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);
    const resp = await fetch(CLOUDINARY_URL, { method: "POST", body: form });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Cloudinary upload failed: ${resp.status} ${text}`);
    }
    const json = await resp.json();
    return json.secure_url ?? json.url;
  };

  const uploadFilesToCloudinary = async (files: File[]) => Promise.all(files.map((f) => uploadFileToCloudinary(f)));

  const handleUploadImages = async () => {
    if (!data?.orderCode) {
      openSnackbar(t("orderCodeMissing"), "error");
      return;
    }
    const orderCode = data.orderCode!;
    let newImages: string[] = [];

    const urlLines = imgUrlsText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (urlLines.length) newImages.push(...urlLines);

    try {
      setImgUploading(true);

      if (selectedFiles && selectedFiles.length) {
        const uploaded = await uploadFilesToCloudinary(selectedFiles);
        newImages.push(...uploaded);
      }

      if (newImages.length === 0) {
        openSnackbar(t("noImageProvided") ?? "Please provide at least one image", "error");
        return;
      }

      const existingRaw = (data as any)?.images ?? (data as any)?.image ?? null;
      const existing = Array.isArray(existingRaw) ? existingRaw.filter(Boolean) : typeof existingRaw === "string" && existingRaw ? [existingRaw] : [];

      const merged = existing.concat(newImages);
      const seen = new Set<string>();
      const deduped: string[] = [];
      for (const u of merged) {
        if (!u) continue;
        if (!seen.has(u)) {
          seen.add(u);
          deduped.push(u);
        }
      }

      const respItem = await trackingApi.updateTrackingImage(orderCode, deduped);

      setData((d) => {
        if (!d) return d;
        const respImages = respItem && (respItem.images ?? respItem.image ?? null);
        if (Array.isArray(respImages)) {
          return { ...d, images: respImages, image: respImages[0] ?? d.image ?? null } as typeof d;
        }
        if (typeof respImages === "string" && respImages) {
          return { ...d, images: [respImages], image: respImages } as typeof d;
        }
        return { ...d, images: deduped, image: deduped[0] ?? d.image ?? null } as typeof d;
      });

      openSnackbar(t("updateImageSuccess") ?? "Images updated", "success");
      setImgDialogOpen(false);
      previewImages.forEach((u) => URL.revokeObjectURL(u));
    } catch (err) {
      console.error("update image failed", err);
      openSnackbar(t("saveFailed") ?? "Save failed", "error");
    } finally {
      setImgUploading(false);
    }
  };

  const getImagesForDisplay = (): string[] => {
    if (!data) return [];
    const arr = (data as any).images ?? (data as any).image ?? null;
    if (!arr) return [];
    if (Array.isArray(arr)) return arr.filter(Boolean);
    if (typeof arr === "string" && arr) return [arr];
    return [];
  };

  const imagesForDisplay = getImagesForDisplay();

  const handleOpenViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 640, md: 700 } } }}>
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 2 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <IconButton onClick={onClose} size="small" sx={{ color: "text.secondary" }}>
                <ArrowBackIosNewRoundedIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography fontWeight={700} sx={{ fontSize: 18 }}>
                    {headerTitle}
                  </Typography>
                  {loading && <CircularProgress size={16} />}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                  {t("subtitle")}
                </Typography>
              </Box>
            </Box>

            <Box>
              <IconButton onClick={onClose} size="small">
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          <Divider />

          <Box sx={{ overflow: "auto", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
            <Box sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
              <Avatar sx={{ bgcolor: "#eef2ff", color: "primary.main" }}>
                <VisibilityRoundedIcon />
              </Avatar>
              <Box>
                <Typography fontWeight={700}>{withTooltip(data?.actionType ?? "", translateActionType(t, data?.actionType ?? ""))}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("created")}: {data?.createAt ?? "-"}
                </Typography>
              </Box>
              <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
                {has(data?.currentAssign) && <Chip label={`${t("currentAssign") ?? "From"}: ${data?.currentAssign}`} size="small" />}
                {has(data?.nextAssign) && <Chip label={`${t("nextAssign") ?? "To"}: ${data?.nextAssign}`} size="small" />}
              </Box>
            </Box>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack spacing={1}>
                  {has(data?.trackingHistoryId) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("id")}</Box>
                      <Box sx={{ flex: 1 }}>{data?.trackingHistoryId}</Box>
                    </Box>
                  )}

                  {has(data?.orderCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("order")}</Box>
                      <Box sx={{ flex: 1 }}>{data?.orderCode}</Box>
                    </Box>
                  )}

                  {has(data?.orderDetailCode) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("orderDetail")}</Box>
                      <Box sx={{ flex: 1 }}>{data?.orderDetailCode}</Box>
                    </Box>
                  )}

                  {has(data?.oldStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("oldStatus")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.oldStatus ?? "", translateStatus(t, data?.oldStatus ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.newStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("newStatus")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.newStatus ?? "", translateStatus(t, data?.newStatus ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.paymentStatus) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("paymentStatus")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.paymentStatus ?? "", translatePaymentStatus(t, data?.paymentStatus ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.serviceName) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("service")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.serviceName ?? "", translateServiceName(t, data?.serviceName ?? ""))}</Box>
                    </Box>
                  )}

                  {has(data?.productType) && (
                    <Box sx={{ display: "flex", gap: 2 }}>
                      <Box sx={{ width: 160, color: "text.secondary" }}>{t("productType")}</Box>
                      <Box sx={{ flex: 1 }}>{withTooltip(data?.productType ?? "", translateProductType(t, data?.productType ?? ""))}</Box>
                    </Box>
                  )}

                  {/* images gallery */}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box sx={{ width: 160, color: "text.secondary", alignSelf: "flex-start" }}>{t("images") ?? "Images"}</Box>
                    <Box sx={{ flex: 1 }}>
                      {imagesForDisplay.length > 0 ? (
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {imagesForDisplay.map((src, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                width: 96,
                                height: 96,
                                borderRadius: 1,
                                overflow: "hidden",
                                border: "1px solid #eee",
                                position: "relative",
                                cursor: "pointer",
                              }}
                              onClick={() => handleOpenViewer(idx)}
                            >
                              <img src={src} alt={`img-${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                              <IconButton
                                size="small"
                                sx={{
                                  position: "absolute",
                                  right: 4,
                                  top: 4,
                                  bgcolor: "rgba(0,0,0,0.4)",
                                  color: "white",
                                  "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenViewer(idx);
                                }}
                                aria-label="open"
                              >
                                <OpenInFullIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <ImageIcon fontSize="small" />
                          <Typography color="text.secondary">{t("noImage")}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {data &&
                    Object.keys(data)
                      .filter(
                        (k) =>
                          ![
                            "trackingHistoryId",
                            "orderCode",
                            "orderDetailCode",
                            "oldStatus",
                            "newStatus",
                            "actionType",
                            "createAt",
                            "currentAssign",
                            "nextAssign",
                            "image",
                            "images",
                            "_isChild",
                          ].includes(k)
                      )
                      .map((k) => {
                        const v = (data as any)[k];
                        if (!has(v)) return null;
                        return (
                          <Box key={k} sx={{ display: "flex", gap: 2 }}>
                            <Box sx={{ width: 160, color: "text.secondary" }}>{k}</Box>
                            <Box sx={{ flex: 1 }}>{String(v)}</Box>
                          </Box>
                        );
                      })}
                </Stack>
              </CardContent>
            </Card>

            <Box sx={{ mb: 2 }}>
              {!isChild && (
                <Stack direction="row" spacing={1} alignItems="center">
                  {/* OVERDUE */}
                  {isOverdue && (
                    <>
                      <DatePicker
                        label={t("newReturnDateLabel")}
                        value={extendDate}
                        onChange={(d: Date | null) => setExtendDate(d)}
                        slotProps={{ textField: { size: "small" } as any }}
                      />

                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleExtendOrder}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <CircularProgress size={16} /> : t("extendOrder")}
                      </Button>

                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleMoveToExpiredStorage}
                        disabled={actionLoading}
                      >
                        {t("moveToExpired")}
                      </Button>
                    </>
                  )}

                  {/* UPDATE STATUS */}
                  {!isOverdue &&
                    !isCancelled &&
                    !isCompleted &&
                    (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleUpdateStatus("SomeNewStatus")}
                        disabled={actionLoading}
                      >
                        {t("updateStatus")}
                      </Button>
                    )}

                  {/* CANCEL ORDER */}
                  {(isRefunded || isExpired) && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={handleCancelOrder}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <CircularProgress size={16} /> : t("cancelOrder")}
                    </Button>
                  )}

                  {/* UPDATE IMAGE luôn có */}
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={openImageDialog}
                    disabled={actionLoading || imgUploading}
                  >
                    <ImageIcon sx={{ mr: 1 }} />
                    {t("updateImage")}
                  </Button>
                </Stack>
              )}


            </Box>
          </Box>

          <Box sx={{ p: 2, borderTop: "1px solid #f0f0f0", display: "flex", gap: 1, justifyContent: "space-between", alignItems: "center" }}>
            <Box />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" onClick={onClose}>
                {t("close")}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Image upload dialog */}
        <Dialog
          open={imgDialogOpen}
          onClose={() => {
            setImgDialogOpen(false);
            previewImages.forEach((u) => URL.revokeObjectURL(u));
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{t("updateImageDialogTitle") ?? "Update Tracking Image"}</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 1 }}>
              {t("updateImageDialogDesc") ?? "Paste image URLs (one per line) or upload files. Files are uploaded to Cloudinary then sent to backend."}
            </DialogContentText>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2">{t("pasteImageUrls") ?? "Paste image URLs (one per line)"}</Typography>
              <Box component="textarea" rows={4} value={imgUrlsText} onChange={(e) => setImgUrlsText(e.target.value)} sx={{ width: "100%", p: 1, borderRadius: 1, border: "1px solid #ddd" }} />
            </Box>

            <Box sx={{ mb: 1 }}>
              <Typography variant="subtitle2">{t("orUploadFiles") ?? "Or upload files"}</Typography>
              <input type="file" accept="image/*" multiple onChange={(e) => handleFilesSelected(e.target.files)} />
            </Box>

            {previewImages.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                {previewImages.map((u, i) => (
                  <Box key={i} sx={{ width: 80, height: 80, borderRadius: 1, overflow: "hidden", border: "1px solid #eee" }}>
                    <img src={u} alt={`preview-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </Box>
                ))}
              </Box>
            )}
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => {
                setImgDialogOpen(false);
                previewImages.forEach((u) => URL.revokeObjectURL(u));
              }}
              disabled={imgUploading}
            >
              {t("cancelBtn") ?? "Cancel"}
            </Button>
            <Button onClick={handleUploadImages} variant="contained" disabled={imgUploading}>
              {imgUploading ? <CircularProgress size={16} /> : t("confirmBtn") ?? "Confirm"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Image viewer */}
        <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} maxWidth="lg" fullWidth>
          <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 2 }}>
            {imagesForDisplay[viewerIndex] ? (
              <Box sx={{ width: "100%", textAlign: "center" }}>
                <img src={imagesForDisplay[viewerIndex]} alt={`full-${viewerIndex}`} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />
                <Box sx={{ mt: 1, display: "flex", justifyContent: "center", gap: 1 }}>
                  <Button size="small" disabled={viewerIndex <= 0} onClick={() => setViewerIndex((i) => Math.max(0, i - 1))}>
                    Prev
                  </Button>
                  <Button size="small" disabled={viewerIndex >= imagesForDisplay.length - 1} onClick={() => setViewerIndex((i) => Math.min(imagesForDisplay.length - 1, i + 1))}>
                    Next
                  </Button>
                  <Button size="small" onClick={() => setViewerOpen(false)}>
                    Close
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography>{t("noImage")}</Typography>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMessage} loading={actionLoading} onCancel={handleConfirmCancel} onConfirm={handleConfirmOk} />

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Drawer>
    </LocalizationProvider>
  );
}
