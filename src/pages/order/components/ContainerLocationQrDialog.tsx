import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Stack,
  CircularProgress,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { useTranslation } from "react-i18next";
import containerLocationLogApi from "@/api/containerLocationLogApi";

type Props = {
  open: boolean;
  orderDetail: any | null;
  orderCode?: string | null;
  onClose: () => void;
  size?: number; 
};

function utf8ToBase64(str: string) {
  try {
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      return window.btoa(unescape(encodeURIComponent(str)));
    }
    const Buf = (globalThis as any).Buffer;
    if (Buf) return Buf.from(str, "utf8").toString("base64");
  } catch {
  }
  try {

    return (globalThis as any).btoa(str);
  } catch {
    return "";
  }
}

export default function ContainerLocationQrDialog({ open, orderDetail, orderCode, onClose, size = 260 }: Props) {
  const { t } = useTranslation(["order", "common"]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [payloadB64, setPayloadB64] = useState<string>("");
  const [, setPayloadJsonPreview] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>(""); 
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!open || !orderDetail) {
      setLogs([]);
      setPayloadB64("");
      setPayloadJsonPreview("");
      setQrDataUrl("");
      return;
    }

    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const id = orderDetail.orderDetailId ?? orderDetail.id ?? orderDetail._id;
        if (id == null) {
          setLogs([]);
        } else {
          const resp = await containerLocationLogApi.getLogs({ orderDetailId: id, pageNumber: 1, pageSize: 100 });
          const data = (resp as any).data ?? resp;
          const items = data?.items ?? [];
          if (!mounted) return;
          setLogs(items);
        }
      } catch (err) {
        console.error("Failed to fetch logs for QR payload", err);
        if (!mounted) return;
        setLogs([]);
      } finally {
        if (mounted) setLoadingLogs(false);
      }
    };

    fetchLogs();

    return () => {
      mounted = false;
    };
  }, [open, orderDetail]);

  useEffect(() => {
    if (!orderDetail) {
      setPayloadB64("");
      setPayloadJsonPreview("");
      return;
    }
    try {
      const detailClone = JSON.parse(JSON.stringify(orderDetail));
      const payloadObj = {
        detail: detailClone,
        logs: Array.isArray(logs) ? logs : [],
        generatedAt: new Date().toISOString(),
      };
      const json = JSON.stringify(payloadObj);
      const b64 = utf8ToBase64(json);
      setPayloadB64(b64);

      const pretty = JSON.stringify(payloadObj, null, 2);
      setPayloadJsonPreview(pretty.length > 600 ? pretty.slice(0, 600) + "\n... (truncated)" : pretty);
    } catch (err) {
      console.error("Failed to build QR payload", err);
      setPayloadB64("");
      setPayloadJsonPreview("");
    }
  }, [orderDetail, logs]);

  const qrValue = useMemo(() => {
    if (payloadB64) return payloadB64;
    const id = orderDetail?.orderDetailId ?? orderDetail?.id ?? orderDetail?._id;
    const base = typeof window !== "undefined" ? window.location.origin : "https://your.app";
    const url = id ? `${base}/container-location?orderDetailId=${id}${orderCode ? `&orderCode=${encodeURIComponent(String(orderCode))}` : ""}` : base;
    return url;
  }, [payloadB64, orderDetail, orderCode]);

  useEffect(() => {
    let mounted = true;
    if (!qrValue) {
      setQrDataUrl("");
      return;
    }

    const gen = async () => {
      setGenerating(true);
      try {
        const QR = await import("qrcode");
        const opts: any = { margin: 1, width: size };

        if (typeof (QR as any).toDataURL === "function") {
          try {
            const possible = (QR as any).toDataURL(qrValue, opts);
            if (possible && typeof possible.then === "function") {
              const dataUrl: string = await possible;
              if (!mounted) return;
              setQrDataUrl(String(dataUrl ?? ""));
            } else {
              (QR as any).toDataURL(qrValue, opts, (err: any, url?: string) => {
                if (!mounted) return;
                if (err) {
                  console.error("qrcode.toDataURL callback error:", err);
                  setQrDataUrl("");
                } else {
                  setQrDataUrl(String(url ?? ""));
                }
              });
            }
          } catch (errPromise) {
            try {
              (QR as any).toDataURL(qrValue, opts, (err: any, url?: string) => {
                if (!mounted) return;
                if (err) {
                  console.error("qrcode.toDataURL callback error:", err);
                  setQrDataUrl("");
                } else {
                  setQrDataUrl(String(url ?? ""));
                }
              });
            } catch (e) {
              console.error("Failed to generate QR by both promise and callback:", e, errPromise);
              if (mounted) setQrDataUrl("");
            }
          }
        } else {
          if (mounted) setQrDataUrl("");
        }
      } catch (err) {
        console.error("Failed to generate QR (qrcode lib)", err);
        if (mounted) setQrDataUrl("");
      } finally {
        if (mounted) setGenerating(false);
      }
    };

    gen();
    return () => {
      mounted = false;
    };
  }, [qrValue, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr_orderDetail_${orderDetail?.orderDetailId ?? "unknown"}.png`;
    a.click();
  };

  const handleCopyPayload = async () => {
    if (!payloadB64) return;
    try {
      await navigator.clipboard.writeText(payloadB64);
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

  const handleCopyUrl = async () => {
    const id = orderDetail?.orderDetailId ?? orderDetail?.id ?? orderDetail?._id;
    const base = typeof window !== "undefined" ? window.location.origin : "https://your.app";
    const url = id ? `${base}/container-location?orderDetailId=${id}${orderCode ? `&orderCode=${encodeURIComponent(String(orderCode))}` : ""}&payload=${encodeURIComponent(payloadB64)}` : base;
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.warn("Copy URL failed", err);
    }
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        <Box>
          <Stack spacing={0.25}>
            <Typography fontWeight={700}>{t("order:qr.title") ?? "QR code"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {orderDetail ? `${t("order:orderDetailId") ?? "Order detail ID"}: ${orderDetail.orderDetailId ?? orderDetail.id ?? ""}` : t("order:noOrderDetailSelected")}
            </Typography>
          </Stack>
        </Box>

        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2} alignItems="center" py={1}>
          {loadingLogs ? (
            <Box py={4}>
              <CircularProgress />
            </Box>
          ) : !orderDetail ? (
            <Typography color="text.secondary">{t("order:noOrderDetailSelected")}</Typography>
          ) : (
            <>
              <Box sx={{ p: 1, border: "1px solid #eee", borderRadius: 2, bgcolor: "#fff" }}>
                {generating ? (
                  <Box sx={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CircularProgress />
                  </Box>
                ) : qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR ${orderDetail?.orderDetailId ?? ""}`}
                    style={{ width: size, height: size, display: "block", background: "#fff" }}
                  />
                ) : (
                  <Box sx={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="caption" color="text.secondary">Unable to render QR</Typography>
                  </Box>
                )}
              </Box>

              
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: "100%", px: 1 }}>
          <Button startIcon={<ContentCopyOutlinedIcon />} onClick={handleCopyPayload} disabled={!payloadB64}>
            {t("order:qr.copy") ?? "Copy payload"}
          </Button>

          <Button startIcon={<ContentCopyOutlinedIcon />} onClick={handleCopyUrl} disabled={!orderDetail}>
            {t("order:qr.copyUrl") ?? "Copy link"}
          </Button>

          <Button startIcon={<FileDownloadOutlinedIcon />} onClick={handleDownload} disabled={!qrDataUrl}>
            {t("order:qr.download") ?? "Download PNG"}
          </Button>

          <Box sx={{ flex: "1 1 auto" }} />

          <Button onClick={onClose}>{t("common:close") ?? "Close"}</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
