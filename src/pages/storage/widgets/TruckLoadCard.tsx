import  { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Dialog,
  useTheme,
  useMediaQuery,
  Paper,
  Icon,
  Snackbar,
  Alert,
} from "@mui/material";

import type { StorageRespItem } from "@/api/storageApi";
import { getShelves, type ShelfItem } from "@/api/shelfApi";
import WeightBlock100 from "./WeightBlock100";
import ShelfDialog from "./ShelfDialog";

import { getStorageType } from "@/api/storageTypeApi";
import Storage3DView from "./Storage3DView";
import { useTranslation } from "react-i18next";

import { getOrders, getOrderDetails } from "@/api/orderApi";
import OrderDetailFullDialog from "../OrderDetailFullDialog";

import { translateStorageTypeName } from "@/utils/storageTypeNames";
import { translateStatus } from "@/utils/statusHelper";

type Props = { storage: StorageRespItem | null };

export default function TruckLoadCard({ storage }: Props) {
  const { t } = useTranslation("storagePage");
  const theme = useTheme();

  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openShelfCode, setOpenShelfCode] = useState<string | null>(null);

  const [storageType, setStorageType] = useState<any | null>(null);
  const [stLoading, setStLoading] = useState(false);
  const [stError, setStError] = useState<string | null>(null);

  const [globalSnack, setGlobalSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const showNotify = (message: string, severity: "success" | "error" = "success") => {
    setGlobalSnack({ open: true, message, severity });
  };

  const isWarehouse =
    !!storage &&
    (storage.storageTypeName ?? "").toLowerCase().includes("warehouse");

  const INLINE_STORAGES = ["BLD005-STR001", "BLD006-STR001"];

  const [inlineDetails, setInlineDetails] = useState<any[]>([]);
  const [loadingInline, setLoadingInline] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  const fetchShelves = async () => {
    if (!storage || !isWarehouse) {
      setShelves([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const resp = await getShelves({
        storageCode: storage.storageCode,
        pageNumber: 1,
        pageSize: 100,
      });

      const arr = (resp as any).data ?? [];
      setShelves(Array.isArray(arr) ? arr : []);
    } catch (err: any) {
      setError(err?.message ?? t("truckLoad.failedLoadShelves"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelves();
  }, [storage?.storageCode, isWarehouse]);

  useEffect(() => {
    if (!storage?.storageTypeId) {
      setStorageType(null);
      setStError(null);
      setStLoading(false);
      return;
    }

    let mounted = true;

    setStLoading(true);
    setStError(null);
    setStorageType(null);

    (async () => {
      try {
        const resp = await getStorageType(storage.storageTypeId);
        if (!mounted) return;
        setStorageType(resp ?? null);
      } catch (err: any) {
        if (!mounted) return;
        setStError(err?.message ?? t("truckLoad.failedLoadStorageType"));
        setStorageType(null);
      } finally {
        if (mounted) setStLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [storage?.storageTypeId, t]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!storage?.storageCode || !INLINE_STORAGES.includes(storage.storageCode)) {
        if (mounted) {
          setInlineDetails([]);
          setInlineError(null);
          setLoadingInline(false);
        }
        return;
      }

      try {
        setLoadingInline(true);
        setInlineError(null);

        const ordersResp = await getOrders({
          pageNumber: 1,
          pageSize: 200,
          style: "full",
          status: "processing",
        });

        const orders = ordersResp?.data ?? [];

        const allLists = await Promise.all(
          orders.map(async (o: any) => {
            try {
              const resp = await getOrderDetails(o.orderCode);
              const items = resp?.data ?? [];

              return (Array.isArray(items) ? items : []).map((it) => ({
                ...it,
                _orderCode: o.orderCode,
                _orderStatus: o.status,
                _orderPaymentStatus: o.paymentStatus,
                _orderTotalPrice: o.totalPrice,
              }));
            } catch (e) {
              return [];
            }
          })
        );

        const allDetails = allLists.flat();
        const filtered = allDetails.filter(
          (d: any) => String(d.storageCode ?? "") === String(storage.storageCode)
        );

        if (!mounted) return;
        setInlineDetails(filtered);
      } catch (err: any) {
        if (mounted) setInlineError(err?.message ?? "Failed to load order details");
      } finally {
        if (mounted) setLoadingInline(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [storage?.storageCode]);

  const mediaUrl: string | undefined =
    (storageType &&
      (storageType.modelUrl ??
        storageType.fileUrl ??
        storageType.imageUrl ??
        storageType.url ??
        storageType.mediaUrl)) ??
    (storage &&
      ((storage as any).modelUrl ??
        (storage as any).imageUrl ??
        (storage as any).fileUrl)) ??
    undefined;

  const isGLB = !!mediaUrl && /\.glb$|\.gltf$/i.test(mediaUrl);
  const forceShow3D =
    !!storage && ["BLD002", "BLD003"].includes(storage.storageCode ?? "");
  const isReady = !!storage && (storage.status ?? "").toLowerCase() === "ready";

  const effectiveModelUrl = isGLB || forceShow3D ? mediaUrl ?? null : null;
  const effectiveImageUrl = !effectiveModelUrl ? mediaUrl ?? null : null;

  const previewHeight = isLgUp ? 160 : isMdUp ? 140 : isSmUp ? 120 : 100;
  const previewWidth = isSmUp ? 160 : "100%";

  const isInlineStorage =
    !!storage?.storageCode && INLINE_STORAGES.includes(storage.storageCode);

  const renderOrderCard = (d: any, idx: number) => {
    const bg = idx % 2 === 0 ? "#e3f2fd" : "#ede7f6";

    return (
      <Box key={`${d.orderDetailId ?? idx}-${idx}`} sx={{ width: "100%" }}>
        <Card
          sx={{
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            backgroundColor: bg,
            p: 1.3,
            cursor: "pointer",
            transition: "0.2s",
            "&:hover": {
              borderColor: theme.palette.primary.light,
              bgcolor: "#f9fbff",
            },
          }}
          role="button"
          onClick={() => setSelectedDetail(d)}
        >
          <Box display="flex" justifyContent="flex-end" mb={0.3}>
            <Box sx={{ fontSize: 14, color: "text.secondary", opacity: 0.6 }}>⋮</Box>
          </Box>

          <Typography
            fontWeight={600}
            fontSize={13}
            mb={0.4}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Icon sx={{ fontSize: 16, color: "text.secondary" }}>lock</Icon>
            {d.containerCode
              ? t("orderPanel.containerLabel", { code: d.containerCode })
              : t("orderPanel.detailLabel", { id: d.orderDetailId ?? idx })}
          </Typography>

          <Box display="flex" gap={1} alignItems="center" mb={0.5}>
            <Box>
              <Typography fontSize={12} color="text.secondary">
                {t("orderPanel.orderPrefix")}:{" "}
                <strong>{d._orderCode ?? d.orderCode ?? "-"}</strong>
              </Typography>

              {/* APPLY TRANSLATED STATUS HERE */}
              <Typography fontSize={12} color="text.secondary">
                {t("orderPanel.statusLabel")}:{" "}
                {translateStatus(t, d._orderStatus ?? d.orderStatus)}
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    );
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: 3,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: { xs: 2, sm: 3 },
            overflowY: "auto",
            minHeight: { xs: 420, md: 600 },
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {!storage ? (
            <Typography>{t("truckLoad.selectStorage")}</Typography>
          ) : (
            <>
              {/* HEADER BLOCK */}
              <Box
                display="flex"
                flexDirection={isSmUp ? "row" : "column"}
                justifyContent="space-between"
                alignItems={isSmUp ? "center" : "stretch"}
                gap={2}
                mb={1}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={700} noWrap>
                    {storage.storageCode}
                  </Typography>

                  {/* TRANSLATED STORAGE TYPE */}
                  <Typography fontSize={13} color="text.secondary" noWrap>
                    {translateStorageTypeName(
                      t,
                      storage.storageTypeName,
                      storageType?.name
                    )}
                  </Typography>

                  <Box mt={1}>
                    <Typography fontWeight={600} variant="body2">
                      {t("truckLoad.detailsTitle")}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t("truckLoad.dimensions")}:{" "}
                      {storage.width ?? "-"} × {storage.length ?? "-"} ×{" "}
                      {storage.height ?? "-"}
                    </Typography>

                    {/* TRANSLATED STORAGE STATUS */}
                    <Typography variant="body2" color="text.secondary">
                      {t("truckLoad.status")}:{" "}
                      {translateStatus(t, storage.status)}
                    </Typography>

                    {stError && (
                      <Typography color="error" sx={{ mt: 0.5 }}>
                        {t("truckLoad.storageTypeFailedWithMsg", { msg: stError })}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* PREVIEW AREA */}
                <Box
                  sx={{
                    width: previewWidth,
                    height: previewHeight,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: (t) =>
                      t.palette.mode === "light"
                        ? "grey.50"
                        : "rgba(255,255,255,0.02)",
                  }}
                >
                  {stLoading ? (
                    <CircularProgress size={24} />
                  ) : effectiveModelUrl ? (
                    <Storage3DView
                      modelUrl={effectiveModelUrl}
                      width="100%"
                      height="100%"
                    />
                  ) : effectiveImageUrl ? (
                    <Box
                      component="img"
                      src={effectiveImageUrl}
                      alt={storage.storageCode}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  ) : (
                    <Paper
                      elevation={0}
                      sx={{
                        width: "90%",
                        height: "75%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 1,
                        bgcolor: "transparent",
                        borderRadius: 1,
                      }}
                    >
                      <Icon fontSize="large">warehouse</Icon>
                      <Typography variant="caption" color="text.secondary">
                        {t("truckLoad.noPreview")}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Box>

              {/* Auto-show 3D */}
              {storage.storageCode &&
                (storage.storageCode.includes("BLD002") ||
                  storage.storageCode.includes("BLD003")) && (
                  <Box sx={{ mt: 2 }}>
                    <Storage3DView
                      modelUrl={effectiveModelUrl ?? undefined}
                      imageUrl={effectiveImageUrl ?? undefined}
                      blocked={!isReady}
                      height={isMdUp ? 420 : isSmUp ? 360 : 260}
                    />
                  </Box>
                )}

              {/* ------------------ SHELVES / INLINE DETAILS ------------------ */}
              {isWarehouse && (
                <Box mt={2} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography fontWeight={700}>
                    {t("truckLoad.shelvesTitle")}
                  </Typography>

                  {isInlineStorage ? (
                    <>
                      {loadingInline ? (
                        <Box display="flex" gap={1} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography>{t("orderPanel.loading")}</Typography>
                        </Box>
                      ) : inlineError ? (
                        <Typography color="error">{inlineError}</Typography>
                      ) : inlineDetails.length === 0 ? (
                        <Typography color="text.secondary">
                          {t("orderPanel.noDetails")}
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            gap: 1.2,
                          }}
                        >
                          {inlineDetails.map((d, i) => (
                            <Box key={i}>{renderOrderCard(d, i)}</Box>
                          ))}
                        </Box>
                      )}
                    </>
                  ) : (
                    <>
                      {loading ? (
                        <Box display="flex" gap={1} alignItems="center">
                          <CircularProgress size={18} />
                          <Typography>{t("truckLoad.loadingShelves")}</Typography>
                        </Box>
                      ) : (
                        <WeightBlock100
                          shelves={shelves}
                          onOpenShelf={(s) => setOpenShelfCode(s)}
                          onAdded={fetchShelves}
                          onDeleted={fetchShelves}
                          onNotify={showNotify}
                        />
                      )}

                      {error && (
                        <Typography color="error">
                          {t("truckLoad.failedLoadShelvesWithMsg", { msg: error })}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Shelf dialog */}
      <Dialog
        open={!!openShelfCode}
        onClose={() => setOpenShelfCode(null)}
        maxWidth="xl"
        fullWidth
      >
        {openShelfCode && (
          <ShelfDialog
            shelfCode={openShelfCode}
            onClose={() => setOpenShelfCode(null)}
          />
        )}
      </Dialog>

      {/* Order detail full dialog */}
      <OrderDetailFullDialog
        open={!!selectedDetail}
        data={selectedDetail}
        onClose={() => setSelectedDetail(null)}
      />

      {/* Snackbar */}
      <Snackbar
        open={globalSnack.open}
        autoHideDuration={3000}
        onClose={() => setGlobalSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setGlobalSnack((s) => ({ ...s, open: false }))}
          severity={globalSnack.severity}
        >
          {globalSnack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
