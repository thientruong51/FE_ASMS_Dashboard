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
  Tooltip,
  Divider,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useTranslation } from "react-i18next";

import orderApi from "@/api/orderApi";
import { getTrackingHistories } from "@/api/trackingHistoryApi";
import shortLinkApi from "@/api/shortLinkApi";


function utf8ToBase64(str: string) {
  try {
    return window.btoa(unescape(encodeURIComponent(str)));
  } catch {
    return "";
  }
}

function sanitizeOrderForQr(o: any) {
  if (!o) return o;
  const clone = JSON.parse(JSON.stringify(o));
  delete clone.image;
  delete clone.images;
  delete clone.imageUrl;
  delete clone.photo;
  delete clone.photoUrl;
  return clone;
}


type Props = {
  open: boolean;
  onClose: () => void;
  orderCode?: string | null;
  size?: number;
};


export default function OrderQrDialog({
  open,
  onClose,
  orderCode,
  size = 300,
}: Props) {
  const { t } = useTranslation(["order", "common"]);

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [payloadB64, setPayloadB64] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (!open) {
      setPayloadB64("");
      setShortUrl("");
      setQrDataUrl("");
      setError(null);
      setLoading(false);
      setGenerating(false);
    }
  }, [open]);


  useEffect(() => {
    if (!open || !orderCode) return;

    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [oResp, odResp, thResp] = await Promise.allSettled([
          orderApi.getOrder(orderCode),
          orderApi.getOrderDetails(orderCode),
          getTrackingHistories({ orderCode }),
        ]);

        if (!mounted) return;

        const order = oResp.status === "fulfilled" ? oResp.value : null;
        const details =
          odResp.status === "fulfilled"
            ? odResp.value?.data ?? odResp.value ?? []
            : [];
        const tracking =
          thResp.status === "fulfilled"
            ? thResp.value?.data ?? []
            : [];

        const payloadObj = {
          order: sanitizeOrderForQr(order),
          orderDetails: details,
          tracking,
          generatedAt: new Date().toISOString(),
        };

        setPayloadB64(utf8ToBase64(JSON.stringify(payloadObj)));
      } catch (err: any) {
        setError(err?.message ?? String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, orderCode]);


  useEffect(() => {
    if (!payloadB64 || !orderCode) return;

    let mounted = true;

    (async () => {
      try {
        const base = window.location.origin;
        const originalUrl = `${base}/orders/scan/${orderCode}?payload=${encodeURIComponent(
          payloadB64
        )}`;

        await shortLinkApi.createShortLink({
          originalUrl,
          orderCode,
        });

        const short = await shortLinkApi.getShortLinkByOrderCode(orderCode);
        setShortUrl(short.shortUrl);
      } catch (err) {
        console.error("ShortLink error", err);
        if (mounted) setShortUrl("");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [payloadB64, orderCode]);


  const qrValue = useMemo(() => shortUrl, [shortUrl]);

  useEffect(() => {
    if (!qrValue) return;

    let mounted = true;
    setGenerating(true);

    (async () => {
      try {
        const QR = await import("qrcode");
        const url = await QR.toDataURL(qrValue, {
          width: size,
          margin: 1,
        });
        if (mounted) setQrDataUrl(url);
      } catch (err) {
        console.error("QR generate error", err);
      } finally {
        if (mounted) setGenerating(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [qrValue, size]);


  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  };

  const downloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr_order_${orderCode}.png`;
    a.click();
  };

  /* ================= render ================= */

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box>
          <Typography fontWeight={700}>
            {t("order:qr.title") ?? "Order QR"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {orderCode}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Open short link">
            <IconButton
              size="small"
              color="primary"
              disabled={!shortUrl}
              onClick={() => window.open(shortUrl, "_blank")}
            >
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>

          <IconButton onClick={onClose} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box py={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Stack spacing={2}>
            <Box display="flex" justifyContent="center">
              {generating ? (
                <CircularProgress />
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR"
                  style={{ width: size, height: size, background: "#fff" }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  QR not available
                </Typography>
              )}
            </Box>

            <Divider />

         
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button
            startIcon={<ContentCopyOutlinedIcon />}
            disabled={!shortUrl}
            onClick={() => copyText(shortUrl)}
          >
            Copy link
          </Button>

          <Button
            startIcon={<FileDownloadOutlinedIcon />}
            disabled={!qrDataUrl}
            onClick={downloadPng}
          >
            Download PNG
          </Button>

          <Box sx={{ flex: 1 }} />

          <Button onClick={onClose}>
            {t("actions.close") ?? "Close"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
