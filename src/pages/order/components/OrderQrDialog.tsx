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

type Props = {
  open: boolean;
  onClose: () => void;
  orderCode?: string | null;
  size?: number;
};

function utf8ToBase64(str: string) {
  try {
    if (typeof window !== "undefined" && typeof window.btoa === "function") {
      return window.btoa(unescape(encodeURIComponent(str)));
    }
    const Buf = (globalThis as any).Buffer;
    if (Buf) return Buf.from(str, "utf8").toString("base64");
  } catch {}
  try {
    return (globalThis as any).btoa(str);
  } catch {
    return "";
  }
}

function sanitizeOrderForQr(o: any) {
  if (!o) return o;
  const clone = JSON.parse(JSON.stringify(o));
  delete clone.imageUrls;
  delete clone.image;
  delete clone.images;
  delete clone.photo;
  delete clone.photoUrl;

  if (Array.isArray(clone.orderDetails)) {
    clone.orderDetails = clone.orderDetails.map((d: any) => {
      const dd = { ...d };
      delete dd.image;
      delete dd.images;
      delete dd.imageUrl;
      delete dd.photo;
      delete dd.photoUrl;
      return {
        orderDetailId: dd.orderDetailId,
        containerCode: dd.containerCode,
        storageCode: dd.storageCode,
        productTypeNames: dd.productTypeNames,
        serviceNames: dd.serviceNames,
        price: dd.price,
        quantity: dd.quantity,
        subTotal: dd.subTotal,
        containerType: dd.containerType,
        shelfTypeId: dd.shelfTypeId,
        isPlaced: dd.isPlaced,
      };
    });
  }

  return clone;
}

async function sha256Base16(input: string): Promise<string> {
  try {
    if (typeof window !== "undefined" && (window.crypto as any)?.subtle) {
      const enc = new TextEncoder();
      const data = enc.encode(input);
      const hashBuffer = await (window.crypto as any).subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {}

  try {
    const Buf = (globalThis as any).Buffer;
    if (Buf && (globalThis as any).crypto && (globalThis as any).crypto.createHash) {
      return (globalThis as any).crypto
        .createHash("sha256")
        .update(Buf.from(input, "utf8"))
        .digest("hex");
    }
  } catch {}

  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export default function OrderQrDialog({ open, onClose, orderCode, size = 300 }: Props) {
  const { t } = useTranslation(["order", "common"]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[] | null>(null);
  const [tracking, setTracking] = useState<any[] | null>(null);

  const [payloadB64, setPayloadB64] = useState<string>("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isExternalQr, setIsExternalQr] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFallbackShortQr, setIsFallbackShortQr] = useState(false);
  const [fallbackToken, setFallbackToken] = useState<string>("");

  const FALLBACK_THRESHOLD = 2000;

  useEffect(() => {
    let mounted = true;
    if (!open || !orderCode) {
      setOrder(null);
      setOrderDetails(null);
      setTracking(null);
      setPayloadB64("");
      setQrDataUrl("");
      setIsExternalQr(false);
      setError(null);
      setIsFallbackShortQr(false);
      setFallbackToken("");
      return;
    }

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

        const ord = oResp.status === "fulfilled" ? oResp.value : null;
        setOrder(ord ?? null);

        let detailsArr: any[] = [];
        if (odResp.status === "fulfilled") {
          const raw = (odResp as PromiseFulfilledResult<any>).value;
          detailsArr = raw?.data ?? raw ?? [];
        } else if (ord && Array.isArray((ord as any).orderDetails)) {
          detailsArr = (ord as any).orderDetails;
        }
        setOrderDetails(detailsArr);

        let trackingFlow: any[] = [];
        if (thResp.status === "fulfilled") {
          const raw = (thResp as PromiseFulfilledResult<any>).value;
          if (!raw) trackingFlow = [];
          else if (Array.isArray(raw.data)) trackingFlow = raw.data;
          else trackingFlow = raw?.data ?? [];
        }
        setTracking(trackingFlow);

        const sanitizedOrder = sanitizeOrderForQr(ord ?? { orderCode });

        const sanitizedDetails = (detailsArr ?? []).map((d: any) => {
          const c = { ...d };
          delete c.image;
          delete c.images;
          delete c.imageUrl;
          delete c.photo;
          delete c.photoUrl;
          return {
            orderDetailId: c.orderDetailId,
            containerCode: c.containerCode,
            storageCode: c.storageCode,
            productTypeNames: c.productTypeNames,
            serviceNames: c.serviceNames,
            price: c.price,
            quantity: c.quantity,
            subTotal: c.subTotal,
            containerType: c.containerType,
            shelfTypeId: c.shelfTypeId,
            isPlaced: c.isPlaced,
          };
        });

        // ⭐ Giữ lại fix merge ảnh tracking ⭐
        const sanitizedTracking = (trackingFlow ?? []).map((it: any) => {
          const copy = { ...it };
          const imgs: string[] = [];

          if (Array.isArray(it.image)) imgs.push(...it.image);
          else if (typeof it.image === "string" && it.image.trim()) imgs.push(it.image.trim());

          if (Array.isArray(it.images)) {
            imgs.push(...it.images.filter((x: string) => typeof x === "string" && x.trim()));
          }

          copy.images = imgs;
          delete copy.image;
          return copy;
        });

        const payloadObj = {
          order: sanitizedOrder,
          orderDetails: sanitizedDetails,
          tracking: sanitizedTracking,
          generatedAt: new Date().toISOString(),
        };

        const json = JSON.stringify(payloadObj);
        const b64 = utf8ToBase64(json);
        setPayloadB64(b64);

        if (b64.length > FALLBACK_THRESHOLD) {
          const hash = await sha256Base16(b64);
          const token =
            orderCode ? `SHORT_ORDER:${encodeURIComponent(orderCode)}:${hash}` : `SHORT_ORDER:${hash}`;
          setFallbackToken(token);
          setIsFallbackShortQr(true);
        } else {
          setFallbackToken("");
          setIsFallbackShortQr(false);
        }
      } catch (err: any) {
        setError(err?.message ?? String(err));
        setOrder(null);
        setOrderDetails(null);
        setTracking(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, orderCode]);

  const qrValue = useMemo(() => {
    if (isFallbackShortQr && fallbackToken) return fallbackToken;
    if (payloadB64) return payloadB64;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/orders/scan/${orderCode}`;
  }, [payloadB64, isFallbackShortQr, fallbackToken]);

  useEffect(() => {
    let mounted = true;
    setQrDataUrl("");

    if (!qrValue) return;

    const gen = async () => {
      setGenerating(true);
      try {
        const QR = await import("qrcode");
        const opts = { margin: 1, width: size };

        try {
          const dataUrl = await QR.toDataURL(qrValue, opts);
          if (!mounted) return;
          if (dataUrl.startsWith("data:")) {
            setQrDataUrl(dataUrl);
            setIsExternalQr(false);
            return;
          }
        } catch {}

        await new Promise<void>((resolve) => {
          QR.toDataURL(qrValue, opts, (err: any, url?: string) => {
            if (!mounted) return resolve();
            if (!err && url && url.startsWith("data:")) {
              setQrDataUrl(url);
              setIsExternalQr(false);
            }
            resolve();
          });
        });

        if (!qrDataUrl) {
          const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
            qrValue
          )}`;
          setQrDataUrl(apiUrl);
          setIsExternalQr(true);
        }
      } finally {
        if (mounted) setGenerating(false);
      }
    };

    gen();

    return () => {
      mounted = false;
    };
  }, [qrValue, size]);

  const copyToClipboard = async (text: string) => {
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

  const downloadJson = () => {
    try {
      const payloadObj = {
        order: order ?? null,
        orderDetails: orderDetails ?? [],
        tracking: tracking ?? [],
      };
      const blob = new Blob([JSON.stringify(payloadObj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orderCode}-full.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const downloadPng = () => {
    if (!qrDataUrl) return;
    if (isExternalQr) {
      window.open(qrDataUrl, "_blank");
      return;
    }
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr_order_${orderCode}.png`;
    a.click();
  };

  const copyPayload = async () => {
    if (!payloadB64) return;
    await copyToClipboard(payloadB64);
  };

  const copyLinkWithPayload = async () => {
    if (!payloadB64) return;
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${base}/orders/scan/${orderCode}?payload=${encodeURIComponent(payloadB64)}`;
    await copyToClipboard(url);
  };

  const uploadPayloadToServer = async () => {
    if (!payloadB64) return;
    try {
      const hash = await sha256Base16(payloadB64);
      const resp = await fetch(`/api/qr-payload/${hash}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: payloadB64, orderCode }),
      });
      if (!resp.ok) throw new Error(resp.statusText);
      alert("Payload uploaded. Scanner can fetch payload by hash.");
    } catch {}
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography fontWeight={700}>
            {t("order:qr.title") ?? `Order QR: ${orderCode}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {orderCode}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Open preview in new tab">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                const base = typeof window !== "undefined" ? window.location.origin : "";
                const url = `${base}/orders/scan/${orderCode}?payload=${encodeURIComponent(
                  payloadB64
                )}`;
                window.open(url, "_blank");
              }}
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
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Stack spacing={2}>
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 1 }}>
              {generating ? (
                <CircularProgress />
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR ${orderCode}`}
                  style={{ width: size, height: size, background: "#fff", objectFit: "contain" }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Unable to render QR
                </Typography>
              )}
            </Box>

            <Divider />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Stack direction="row" spacing={1} sx={{ width: "100%", px: 1 }}>
          <Tooltip title="Copy payload (base64)">
            <span>
              <Button startIcon={<ContentCopyOutlinedIcon />} onClick={copyPayload} disabled={!payloadB64}>
                {t("order:qr.copy") ?? "Copy payload"}
              </Button>
            </span>
          </Tooltip>

          <Tooltip title="Copy link with payload">
            <span>
              <Button
                startIcon={<ContentCopyOutlinedIcon />}
                onClick={copyLinkWithPayload}
                disabled={!payloadB64}
              >
                {t("order:qr.copyUrl") ?? "Copy link"}
              </Button>
            </span>
          </Tooltip>

          <Button startIcon={<FileDownloadOutlinedIcon />} onClick={downloadJson}>
            {t("order:qr.downloadJson") ?? "Download JSON"}
          </Button>

          <Button startIcon={<FileDownloadOutlinedIcon />} onClick={downloadPng} disabled={!qrDataUrl}>
            {t("order:qr.download") ?? "Download PNG"}
          </Button>

          <Tooltip title="Upload payload to server so scanners can fetch by hash">
            <span>
              <Button
                startIcon={<FileDownloadOutlinedIcon />}
                onClick={uploadPayloadToServer}
                disabled={!payloadB64 || !isFallbackShortQr}
              >
                {t("order:qr.upload") ?? "Upload payload (server)"}
              </Button>
            </span>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          <Button onClick={onClose}>{t("actions.close") ?? "Close"}</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
