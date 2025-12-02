import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  DialogTitle,
  DialogContent,
  CircularProgress,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
  const theme = useTheme();
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm")); // >=600
  const isMdUp = useMediaQuery(theme.breakpoints.up("md")); // >=900

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
        if (mounted) setError(err?.message ?? "Request failed");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [shelfCode]);

  const containersByFloor = groupContainersByFloor(containers, floors);

  return (
    <Box
      // outer wrapper — giữ Box vì component này được dùng bên trong <Dialog />
      sx={{
        // Nếu muốn làm cho dialog parent hiển thị full-screen trên mobile,
        // hãy set các style con để không bị overflow; parent Dialog vẫn quyết định kích thước "paper".
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography fontWeight={700}>Shelf: {shelfCode}</Typography>
          <Typography fontSize={12} color="text.secondary">{shelf?.status ?? "Active"}</Typography>
        </Box>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        dividers
        sx={{
          // padding tùy biến: trên xs giảm để hiển thị được nhiều không gian hơn
          p: { xs: 1, sm: 2.5 },
          width: "100%",
          boxSizing: "border-box",

          // Giữ dialog content trong viewport cao của mobile bằng maxHeight và scroll nội bộ
          maxHeight: { xs: "84vh", sm: "76vh", md: "none" },

          // Trên mobile, nội dung nên chiếm 100% chiều ngang của Dialog (Dialog parent sẽ thường có borderRadius & margins)
          // Tránh ép nội dung bên trong phải có minWidth quá lớn:
          // trước đây bạn đặt minWidth xs:1000px khiến mobile phải scroll ngang -> đổi ngược lại
          "& .shelf-inner-wrap": {
            minWidth: { xs: "auto", md: "1000px" }, // trên md giữ minWidth cho layout 3-pane
            width: { xs: "100%", md: "auto" },
            boxSizing: "border-box",
            overflowY: "hidden", // inner sẽ quản lý vertical scroll nếu cần
            // thêm padding nhỏ để scrollbar không chạm vào mép Dialog
            px: { xs: 0.5, md: 0 },
          },

          // Nếu bạn muốn loại bỏ gap/margins trên mobile để dialog giống full-bleed, uncomment:
          // "@media (max-width:600px)": { padding: 0, paddingTop: 8, paddingBottom: 8 },
        }}
      >
        {loading ? (
          <Box display="flex" gap={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography>Loading shelf data...</Typography>
          </Box>
        ) : error ? (
          <Typography color="error">Request failed: {error}</Typography>
        ) : (
          <Box
            // wrapper cho nội dung chính — gán class để style ở trên tác động
            className="shelf-inner-wrap"
            sx={{
              // Trên mobile, cho phép nội dung cuộn dọc nếu quá dài.
              overflowY: { xs: "auto", md: "hidden" },
              // Trên mobile không ép minWidth; trên md đoạn này sẽ cho phép ShelfView rộng hơn
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
