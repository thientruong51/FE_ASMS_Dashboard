import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  DialogTitle,
  DialogContent,
  CircularProgress,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useTranslation } from "react-i18next";

import type { ShelfItem } from "@/api/shelfApi";
import { getShelf } from "@/api/shelfApi";
import { getFloors, type FloorItem } from "@/api/floorApi";
import { getContainers, type ContainerItem } from "@/api/containerApi";
import { groupContainersByFloor } from "./helpers";
import ShelfView from "./ShelfView/ShelfView";

type Props = {
  shelfCode: string;
  onClose: () => void;
};

export default function ShelfDialog({ shelfCode, onClose }: Props) {
  const { t } = useTranslation("storagePage");

  const [shelf, setShelf] = useState<ShelfItem | null>(null);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [containers, setContainers] = useState<ContainerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        try {
          const shelfResp = await getShelf(shelfCode);
          const s = (shelfResp as any).data ?? (shelfResp as any);
          if (mounted) setShelf(s);
        } catch (err) {
          console.warn("getShelf failed", err);
        }

        const floorsResp = await getFloors({ shelfCode, pageNumber: 1, pageSize: 100 });
        const fl = (floorsResp as any).data ?? [];
        const floorsArr: FloorItem[] = Array.isArray(fl) ? fl : [];
        if (!mounted) return;
        setFloors(floorsArr);

        const pageSize = 100;
        let allContainers: ContainerItem[] = [];

        const fetchAllByShelfCode = async () => {
          let page = 1;
          while (true) {
            const resp = await getContainers({ shelfCode, pageNumber: page, pageSize });
            const arr = (resp as any).data ?? (resp as any);
            if (!Array.isArray(arr)) break;
            allContainers.push(...arr);
            if (arr.length < pageSize) break;
            page += 1;
          }
        };

        const fetchAllByFloors = async (floorsList: FloorItem[]) => {
          for (const f of floorsList) {
            if (!f || !((f as any).floorCode)) continue;
            let page = 1;
            while (true) {
              const resp = await getContainers({ floorCode: (f as any).floorCode, pageNumber: page, pageSize });
              const arr = (resp as any).data ?? (resp as any);
              if (!Array.isArray(arr)) break;
              allContainers.push(...arr);
              if (arr.length < pageSize) break;
              page += 1;
            }
          }
        };

        try {
          await fetchAllByShelfCode();
        } catch (errShelfFetch) {
          console.warn("fetch by shelfCode failed, fallback to per-floor", errShelfFetch);
          await fetchAllByFloors(floorsArr);
        }

        if (!mounted) return;

        const uniq = new Map<string, ContainerItem>();
        for (const c of allContainers) {
          const key = String(c.containerCode ?? (c as any).id ?? JSON.stringify(c));
          uniq.set(key, c);
        }
        const uniqContainers = Array.from(uniq.values());
        setContainers(uniqContainers);
      } catch (err: any) {
        console.error("Failed to load shelf dialog data", err);
        if (mounted) setError(err?.message ?? t("shelfDialog.requestFailed"));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [shelfCode, t]);

  const containersByFloor = groupContainersByFloor(containers, floors);

  return (
    <Box
      sx={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography fontWeight={700}>
            {t("shelfDialog.title", { code: shelfCode })}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            {shelf?.status ?? t("shelfDialog.statusActive")}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label={t("shelfDialog.closeAria")}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        dividers
        sx={{
          p: { xs: 1, sm: 2.5 },
          width: "100%",
          boxSizing: "border-box",
          maxHeight: { xs: "84vh", sm: "76vh", md: "none" },
          "& .shelf-inner-wrap": {
            minWidth: { xs: "auto", md: "1000px" },
            width: { xs: "100%", md: "auto" },
            boxSizing: "border-box",
            overflowY: "hidden",
            px: { xs: 0.5, md: 0 },
          },
        }}
      >
        {loading ? (
          <Box display="flex" gap={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography>{t("shelfDialog.loading")}</Typography>
          </Box>
        ) : error ? (
          <Typography color="error">{t("shelfDialog.requestFailedWithMsg", { msg: error })}</Typography>
        ) : (
          <Box
            className="shelf-inner-wrap"
            sx={{
              overflowY: { xs: "auto", md: "hidden" },
              minWidth: { xs: "auto", md: "1000px" },
              width: { xs: "100%", md: "100%" },
            }}
          >
            <ShelfView
              shelfCode={shelfCode}
              shelf={shelf}
              floors={floors}
              containersByFloor={containersByFloor}
              onClose={onClose}
            />
          </Box>
        )}
      </DialogContent>
    </Box>
  );
}
