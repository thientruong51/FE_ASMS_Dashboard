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
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useTranslation } from "react-i18next";

import containerLocationLogApi from "@/api/containerLocationLogApi";
import shortLinkApi from "@/api/shortLinkApi";

type Props = {
  open: boolean;
  orderDetail: any | null;
  orderCode?: string | null;
  onClose: () => void;
  size?: number;
};

export default function ContainerLocationQrDialog({
  open,
  orderDetail,
  orderCode,
  onClose,
  size = 260,
}: Props) {
  const { t } = useTranslation(["order", "common"]);

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [payloadB64, setPayloadB64] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  const orderDetailId =
    orderDetail?.orderDetailId ?? orderDetail?.id ?? orderDetail?._id ?? null;


  useEffect(() => {
    if (!open) {
      setLogs([]);
      setPayloadB64("");
      setShortUrl("");
      setQrDataUrl("");
    }
  }, [open]);


  useEffect(() => {
    if (!open || !orderDetailId) return;

    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const resp = await containerLocationLogApi.getLogs({
          orderDetailId,
          pageNumber: 1,
          pageSize: 100,
        });
        const data = (resp as any)?.data ?? resp;
        if (mounted) setLogs(data?.items ?? []);
      } catch (err) {
        console.error("Fetch container logs failed", err);
        if (mounted) setLogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, orderDetailId]);


  useEffect(() => {
    if (!orderDetailId) return;

    try {
      const payloadObj = {
        detail: orderDetail,
        logs,
        generatedAt: new Date().toISOString(),
      };
      const json = JSON.stringify(payloadObj);
      setPayloadB64(btoa(unescape(encodeURIComponent(json))));
    } catch (err) {
      console.error("Build payload failed", err);
      setPayloadB64("");
    }
  }, [orderDetailId, orderDetail, logs]);


  useEffect(() => {
    if (!payloadB64 || !orderDetailId) return;

    let mounted = true;

    (async () => {
      try {
        const base = window.location.origin;
        const originalUrl = `${base}/container-location?orderDetailId=${orderDetailId}${
          orderCode ? `&orderCode=${encodeURIComponent(orderCode)}` : ""
        }&payload=${encodeURIComponent(payloadB64)}`;

        await shortLinkApi.createShortLink({
          originalUrl,
          orderDetailId,
        });

        const short = await shortLinkApi.getShortLinkByOrderDetailId(
          orderDetailId
        );

        if (mounted) {
          setShortUrl(short.shortUrl);
        }
      } catch (err) {
        console.error("ShortLink error (detail)", err);
        if (mounted) setShortUrl("");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [payloadB64, orderDetailId, orderCode]);

  const qrValue = useMemo(() => shortUrl, [shortUrl]);


  useEffect(() => {
    if (!qrValue) return;

    let mounted = true;

    (async () => {
      setGenerating(true);
      try {
        const QR = await import("qrcode");
        const url = await QR.toDataURL(qrValue, {
          width: size,
          margin: 1,
        });
        if (mounted) setQrDataUrl(url);
      } catch (err) {
        console.error("QR generate failed", err);
        if (mounted) setQrDataUrl("");
      } finally {
        if (mounted) setGenerating(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [qrValue, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr_orderDetail_${orderDetailId}.png`;
    a.click();
  };

  const handleCopyLink = async () => {
    if (!shortUrl) return;
    await navigator.clipboard.writeText(shortUrl);
  };


  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}
>
  <Box>
    <Typography fontWeight={700}>
      {t("order:qr.title") ?? "QR Code"}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {orderDetailId
        ? `Order detail ID: ${orderDetailId}`
        : t("order:noOrderDetailSelected")}
    </Typography>
  </Box>

  <Stack direction="row" spacing={1} alignItems="center">
    {/* Open short link */}
    <IconButton
      size="small"
      color="primary"
      disabled={!shortUrl}
      onClick={() => {
        if (!shortUrl) return;
        window.open(shortUrl, "_blank");
      }}
    >
      <OpenInNewIcon />
    </IconButton>

    <IconButton onClick={onClose} size="small">
      <CloseRoundedIcon />
    </IconButton>
  </Stack>
</DialogTitle>


      <DialogContent dividers>
        <Box display="flex" justifyContent="center" py={2}>
          {loading || generating ? (
            <CircularProgress />
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR ${orderDetailId}`}
              style={{
                width: size,
                height: size,
                background: "#fff",
              }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              QR not available
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: "100%", px: 1 }}>
          <Button
            startIcon={<ContentCopyOutlinedIcon />}
            onClick={handleCopyLink}
            disabled={!shortUrl}
          >
            {t("order:qr.copyUrl") ?? "Copy link"}
          </Button>

          <Button
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleDownload}
            disabled={!qrDataUrl}
          >
            {t("order:qr.download") ?? "Download PNG"}
          </Button>

          <Box sx={{ flex: 1 }} />
          <Button onClick={onClose}>{t("common:close") ?? "Close"}</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
