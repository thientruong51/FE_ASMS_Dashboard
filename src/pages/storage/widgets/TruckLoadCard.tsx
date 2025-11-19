// src/pages/storage/widgets/TruckLoadCard.tsx
import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, CircularProgress, Button, Dialog } from "@mui/material";
import type { StorageRespItem } from "@/api/storageApi";
import { getShelves, type ShelfItem } from "@/api/shelfApi";
import WeightBlock100 from "./WeightBlock100";
import ShelfDialog from "./ShelfDialog";

type Props = { storage: StorageRespItem | null; };

export default function TruckLoadCard({ storage }: Props) {
  const [shelves, setShelves] = useState<ShelfItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openShelfCode, setOpenShelfCode] = useState<string | null>(null);

  const isWarehouse = !!storage && (storage.storageTypeName ?? "").toLowerCase().includes("warehouse");
  const mediaUrl = (storage && ((storage as any).modelUrl || (storage as any).imageUrl || (storage as any).fileUrl)) ?? undefined;
  const isGLB = !!mediaUrl && /\.glb$|\.gltf$/i.test(mediaUrl);

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

  return (
    <>
      <Card sx={{ borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <CardContent sx={{ p: 3, overflowY: "auto" }}>
          {!storage ? <Typography>Select a storage</Typography> : (
            <>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography fontWeight={700}>{storage.storageCode}</Typography>
                  <Typography fontSize={13} color="text.secondary">{storage.storageTypeName}</Typography>
                </Box>
                <Box sx={{ width: 240, height: 160, borderRadius: 2, border: "1px solid #ddd", overflow: "hidden" }}>
                  {isGLB ? (
                    // @ts-ignore
                    <model-viewer src={mediaUrl} auto-rotate camera-controls style={{ width: "100%", height: "100%" }} />
                  ) : mediaUrl ? (
                    <Box component="img" src={mediaUrl} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : null}
                </Box>
              </Box>

              {!isWarehouse ? (
                <>
                  <Typography fontWeight={600}>Details</Typography>
                  <Typography>Dimensions: {storage.width ?? "-"} × {storage.length ?? "-"} × {storage.height ?? "-"}</Typography>
                  {mediaUrl && <Button size="small" onClick={() => window.open(mediaUrl, "_blank")}>Open Media</Button>}
                </>
              ) : (
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
