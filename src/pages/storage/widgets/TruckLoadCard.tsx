import { useEffect, useState } from "react";
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

type Props = { storage: StorageRespItem | null };

export default function TruckLoadCard({ storage }: Props) {
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openShelfCode, setOpenShelfCode] = useState<string | null>(null);

  const [storageType, setStorageType] = useState<any | null>(null);
  const [stLoading, setStLoading] = useState(false);
  const [stError, setStError] = useState<string | null>(null);

  // global snackbar for notifications forwarded from children
  const [globalSnack, setGlobalSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showNotify = (message: string, severity: "success" | "error" = "success") => {
    setGlobalSnack({ open: true, message, severity });
  };

  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm")); // >=600
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // >=900
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg")); // >=1200

  const isWarehouse = !!storage && (storage.storageTypeName ?? "").toLowerCase().includes("warehouse");

  // --- EXTRACTED: fetchShelves so we can reuse it after add/delete ---
  const fetchShelves = async () => {
    if (!storage || !isWarehouse) {
      setShelves([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const resp = await getShelves({ storageCode: storage.storageCode, pageNumber: 1, pageSize: 100 });
      const arr = (resp as any).data ?? [];
      setShelves(Array.isArray(arr) ? arr : []);
    } catch (err: any) {
      setError(err.message ?? "Failed to load shelves");
    } finally {
      setLoading(false);
    }
  };

  // initial fetch + when storage changes
  useEffect(() => {
    fetchShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        setStError(err?.message ?? "Failed to load storage type");
        setStorageType(null);
      } finally {
        if (mounted) setStLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [storage?.storageTypeId]);

  const mediaUrl: string | undefined =
    (storageType &&
      (storageType.modelUrl ??
        storageType.fileUrl ??
        storageType.imageUrl ??
        storageType.url ??
        storageType.mediaUrl)) ??
    (storage && ((storage as any).modelUrl ?? (storage as any).imageUrl ?? (storage as any).fileUrl)) ??
    undefined;

  const isGLB = !!mediaUrl && /\.glb$|\.gltf$/i.test(mediaUrl);
  // keep original "forceShow3D" logic available (but Large viewer rendering below uses original storageCode check)
  const forceShow3D = !!storage && ["BLD002", "BLD003"].includes(storage.storageCode ?? "");
  const isReady = !!storage && (storage.status ?? "").toLowerCase() === "ready";

  // Effective URLs: if model (glb/gltf) OR forceShow3D, allow model to be used as preview
  const effectiveModelUrl = (isGLB || forceShow3D) ? mediaUrl ?? null : null;
  const effectiveImageUrl = !effectiveModelUrl ? mediaUrl ?? null : null;

  // responsive sizing for the preview box:
  const previewHeight = isLgUp ? 160 : isMdUp ? 140 : isSmUp ? 120 : 100;
  const previewWidth = isSmUp ? 160 : "100%";

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
            <Typography>Select a storage</Typography>
          ) : (
            <>
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
                  <Typography fontSize={13} color="text.secondary" noWrap>
                    {storage.storageTypeName}
                  </Typography>
                  <Box mt={1}>
                    <Typography fontWeight={600} variant="body2">
                      Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Dimensions: {storage.width ?? "-"} × {storage.length ?? "-"} × {storage.height ?? "-"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {storage.status ?? "-"}
                    </Typography>
                    {stError && (
                      <Typography color="error" sx={{ mt: 0.5 }}>
                        {stError}
                      </Typography>
                    )}
                  </Box>
                </Box>

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
                    backgroundColor: (t) => (t.palette.mode === "light" ? "grey.50" : "rgba(255,255,255,0.02)"),
                  }}
                >
                  {stLoading ? (
                    <CircularProgress size={24} />
                  ) : effectiveModelUrl ? (
                    // small embedded 3D preview
                    <Box sx={{ width: "100%", height: "100%" }}>
                      <Storage3DView modelUrl={effectiveModelUrl} width="100%" height="100%" />
                    </Box>
                  ) : effectiveImageUrl ? (
                    <Box
                      component="img"
                      src={effectiveImageUrl}
                      alt={storage.storageCode}
                      sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                    />
                  ) : (
                    // placeholder when no media
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
                        No preview available
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </Box>

              {/* === KEEP ORIGINAL LOGIC: Only show LARGE 3D viewer for BLD002 & BLD003 === */}
              {storage?.storageCode &&
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

              {/* Shelves area (if warehouse) */}
              {isWarehouse && (
                <Box mt={2} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography fontWeight={700}>Shelves</Typography>
                  {loading ? (
                    <Box display="flex" gap={1} alignItems="center">
                      <CircularProgress size={18} />
                      <Typography>Loading shelves...</Typography>
                    </Box>
                  ) : (
                    <WeightBlock100
                      shelves={shelves}
                      onOpenShelf={(s) => setOpenShelfCode(s)}
                      // pass fetchShelves so child can request parent to reload after add/delete
                      onAdded={fetchShelves}
                      onDeleted={fetchShelves}
                      onNotify={showNotify}
                    />
                  )}
                  {error && <Typography color="error">{error}</Typography>}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openShelfCode} onClose={() => setOpenShelfCode(null)} maxWidth="xl" fullWidth>
        {openShelfCode && <ShelfDialog shelfCode={openShelfCode} onClose={() => setOpenShelfCode(null)} />}
      </Dialog>

      {/* global snackbar forwarded from children */}
      <Snackbar
        open={globalSnack.open}
        autoHideDuration={3000}
        onClose={() => setGlobalSnack((s) => ({ ...s, open: false }))}
      >
        <Alert onClose={() => setGlobalSnack((s) => ({ ...s, open: false }))} severity={globalSnack.severity}>
          {globalSnack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
