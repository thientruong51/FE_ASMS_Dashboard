import  { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, CircularProgress, Dialog } from "@mui/material";
import type { StorageRespItem } from "@/api/storageApi";
import { getShelves, type ShelfItem } from "@/api/shelfApi";
import WeightBlock100 from "./WeightBlock100";
import ShelfDialog from "./ShelfDialog";

import { getStorageType } from "@/api/storageTypeApi";

import Storage3DView from "./Storage3DView";

type Props = { storage: StorageRespItem | null; };

export default function TruckLoadCard({ storage }: Props) {
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openShelfCode, setOpenShelfCode] = useState<string | null>(null);

  const [storageType, setStorageType] = useState<any | null>(null);
  const [stLoading, setStLoading] = useState(false);
  const [stError, setStError] = useState<string | null>(null);

  const isWarehouse = !!storage && (storage.storageTypeName ?? "").toLowerCase().includes("warehouse");

  const FALLBACK_LOCAL = "/mnt/data/c20e9781-7155-4b67-bf98-f8b2bd1a0278.png";

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

    return () => { mounted = false; };
  }, [storage?.storageTypeId]);

  const mediaUrl: string | undefined =
    (storageType && (storageType.modelUrl ?? storageType.fileUrl ?? storageType.imageUrl ?? storageType.url ?? storageType.mediaUrl)) ??
    (storage && ((storage as any).modelUrl ?? (storage as any).imageUrl ?? (storage as any).fileUrl)) ??
    undefined;

  const isGLB = !!mediaUrl && /\.glb$|\.gltf$/i.test(mediaUrl);
  const forceShow3D = !!storage && ["BLD002", "BLD003"].includes(storage.storageCode ?? "");
  const isReady = !!storage && ((storage.status ?? "").toLowerCase() === "ready");

  useEffect(() => {
    if (!storage || !isWarehouse) { setShelves([]); return; }
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await getShelves({ storageCode: storage.storageCode, pageNumber: 1, pageSize: 100 });
        const arr = (resp as any).data ?? [];
        if (mounted) setShelves(Array.isArray(arr) ? arr : []);
      } catch (err: any) {
        if (mounted) setError(err.message ?? "Failed to load shelves");
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [storage]);

  const effectiveModelUrl = (isGLB || forceShow3D) ? mediaUrl ?? null : null;
  const effectiveImageUrl = !effectiveModelUrl ? (mediaUrl ?? FALLBACK_LOCAL) : null;

  return (
    <>
      <Card sx={{ borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <CardContent sx={{ p: 3, overflowY: "auto", minHeight: 600 }}>
          {!storage ? <Typography>Select a storage</Typography> : (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography fontWeight={700}>{storage.storageCode}</Typography>
                  <Typography fontSize={13} color="text.secondary">{storage.storageTypeName}</Typography>
                </Box>

                <Box sx={{ width: 160, height: 120, borderRadius: 2, border: "1px solid #ddd", overflow: "hidden" }}>
                  {stLoading ? (
                    <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    effectiveModelUrl ? (
                      <Box sx={{ width: "100%", height: "100%" }}>
                        <Storage3DView modelUrl={effectiveModelUrl} width="100%" height="100%" />
                      </Box>
                    ) : (
                      <Box component="img" src={effectiveImageUrl ?? FALLBACK_LOCAL} sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
                    )
                  )}
                </Box>
              </Box>

              <Box>
                <Typography fontWeight={600}>Details</Typography>
                <Typography>Dimensions: {storage.width ?? "-"} × {storage.length ?? "-"} × {storage.height ?? "-"}</Typography>
               
                {stError && <Typography color="error">{stError}</Typography>}
              </Box>

              {/* Only show 3D for BLD002 & BLD003 */}
              {storage?.storageCode &&
                (storage.storageCode.includes("BLD002") ||
                  storage.storageCode.includes("BLD003")) && (
                  <Box sx={{ mt: 2 }}>
                    <Storage3DView
                      modelUrl={effectiveModelUrl ?? undefined}
                      imageUrl={effectiveImageUrl ?? undefined}
                      blocked={!isReady}
                      height={420}
                    />
                  </Box>
                )}


              {/* Shelves area (if warehouse) */}
              {isWarehouse && (
                <Box mt={2}>
                  <Typography fontWeight={700}>Shelves</Typography>
                  {loading ? <Box display="flex" gap={1} alignItems="center"><CircularProgress size={18} /><Typography>Loading shelves...</Typography></Box> : <WeightBlock100 shelves={shelves} onOpenShelf={(s) => setOpenShelfCode(s)} />}
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
    </>
  );
}
