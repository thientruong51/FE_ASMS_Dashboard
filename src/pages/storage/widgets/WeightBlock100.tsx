import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Popover,
  MenuItem,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { ShelfItem } from "@/api/shelfApi";
import { addShelf, deleteShelf } from "@/api/shelfApi";

type Props = {
  shelves: ShelfItem[];
  storageCode?: string;
  onOpenShelf?: (shelfCode: string) => void;
  onAdded?: (newShelf: ShelfItem) => void;
  onDeleted?: (shelfCode: string) => void;
  onNotify?: (message: string, severity?: "success" | "error") => void; // NEW
};

export default function MapShelves({
  shelves,
  storageCode,
  onOpenShelf,
  onAdded,
  onDeleted,
  onNotify,
}: Props) {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));

  const items = shelves ?? [];

  // pair hai items / row (giữ nguyên UI pair left/right)
  const pairObjects: { left?: ShelfItem; right?: ShelfItem }[] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairObjects.push({ left: items[i], right: items[i + 1] });
  }

  // GIỮ NGUYÊN: 3 cột bất kể breakpoint (như bạn yêu cầu)
  const responsiveCols = 3;

  // distribute pairs across columns evenly (giữ logic cũ)
  const columns: typeof pairObjects[] = Array.from({ length: responsiveCols }, () => []);
  pairObjects.forEach((p, i) => {
    columns[i % responsiveCols].push(p);
  });

  const labelFor = (s?: ShelfItem, fallbackIndex?: number) => {
    if (!s) return "";
    const code = s.shelfCode ?? `#${fallbackIndex ?? "?"}`;
    return code.replace(/^.*-/, "");
  };

  const globalPairIndex = (colIndex: number, rowIndex: number) => colIndex + rowIndex * responsiveCols;

  // Add dialog (giữ nguyên)
  const [openAdd, setOpenAdd] = useState(false);
  const [form, setForm] = useState({
    shelfCode: "",
    storageCode: storageCode ?? "",
    status: "",
    length: 0,
    width: 0,
    height: 0,
  });
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    if (!openAdd) {
      setForm((f) => ({ ...f, storageCode: storageCode ?? "" }));
    }
  }, [storageCode, openAdd]);

  const openAddDialog = () => {
    setForm({
      shelfCode: "",
      storageCode: storageCode ?? "",
      status: "",
      length: 0,
      width: 0,
      height: 0,
    });
    setOpenAdd(true);
  };
  const closeAddDialog = () => setOpenAdd(false);

  const handleAddSubmit = async () => {
    if (!form.shelfCode?.trim()) {
      setSnack({ open: true, message: "shelfCode là bắt buộc", severity: "error" });
      onNotify?.("shelfCode là bắt buộc", "error");
      return;
    }
    if (!form.storageCode?.trim()) {
      setSnack({ open: true, message: "storageCode là bắt buộc", severity: "error" });
      onNotify?.("storageCode là bắt buộc", "error");
      return;
    }

    try {
      setLoadingAdd(true);
      const payload: ShelfItem = {
        shelfCode: form.shelfCode.trim(),
        storageCode: form.storageCode.trim(),
        status: form.status?.trim() || undefined,
        length: Number(form.length) || 0,
        width: Number(form.width) || 0,
        height: Number(form.height) || 0,
      };
      const resp = await addShelf(payload);
      const created = (resp as any)?.data ? (resp as any).data : (resp as any);
      setSnack({ open: true, message: "Thêm kệ thành công", severity: "success" });
      onNotify?.("Thêm kệ thành công", "success");
      setOpenAdd(false);
      onAdded?.(created as ShelfItem);
    } catch (err: any) {
      const msg = err?.message ?? "Thêm thất bại";
      setSnack({ open: true, message: msg, severity: "error" });
      onNotify?.(msg, "error");
    } finally {
      setLoadingAdd(false);
    }
  };

  // Long-press for popover (giữ nguyên behavior)
  const longPressTimer = useRef<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedShelfCode, setSelectedShelfCode] = useState<string | null>(null);
  const [loadingDeleteMap, setLoadingDeleteMap] = useState<Record<string, boolean>>({});

  const startLongPress = (ev: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>, shelfCode: string) => {
    const target = (ev as any).currentTarget as HTMLElement;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      setSelectedShelfCode(shelfCode);
      setAnchorEl(target);
    }, 600);
  };
  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const closePopover = () => {
    setAnchorEl(null);
    setSelectedShelfCode(null);
    clearLongPress();
  };

  const handleDelete = async (shelfCode?: string) => {
    if (!shelfCode) return;
    try {
      setLoadingDeleteMap((p) => ({ ...p, [shelfCode]: true }));
      await deleteShelf(shelfCode);
      const successMsg = `Xóa ${shelfCode} thành công`;
      setSnack({ open: true, message: successMsg, severity: "success" });
      onNotify?.(successMsg, "success");
      onDeleted?.(shelfCode);
      closePopover();
    } catch (err: any) {
      const msg = err?.message ?? "Xóa thất bại";
      setSnack({ open: true, message: msg, severity: "error" });
      onNotify?.(msg, "error");
    } finally {
      setLoadingDeleteMap((p) => ({ ...p, [shelfCode]: false }));
    }
  };

  // Snackbar (giữ nguyên)
  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>( {
    open: false,
    message: "",
    severity: "success",
  });

  // --- Tweak responsive without changing visual ---
  // keep original visual sizes on desktop; slightly reduce font/padding on very small screens
  const pairGap = 12; // keep original-looking gap (px)
  const rowPaddingY = 8;
  const fontSize = isSm ? 12 : 11; // giữ gần tương tự ban đầu; giảm 1px trên xs để vừa khít

  return (
    <Box>
      <Typography fontWeight={700} fontSize={13} mb={0.6}>
        SHELFS ({items.length})
      </Typography>

      <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAddDialog} disabled={loadingAdd}>
          Add Shelf
        </Button>
      </Box>

      {/* main grid: giữ 3 cột, nhưng sử dụng % widths bên trong để tránh overflow.
          Giao diện (màu, shadow, hover) vẫn giữ nguyên như trước. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1.2,
          alignItems: "start",
          overflowX: "hidden", // tuyệt đối không cho scroll ngang
          minWidth: 0,
        }}
      >
        {columns.map((col, colIndex) => (
          <Box key={colIndex} sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {col.map((pair, rowIndex) => {
              const gPairIndex = globalPairIndex(colIndex, rowIndex);
              const leftLabel = labelFor(pair.left, gPairIndex * 2 + 1);
              const rightLabel = labelFor(pair.right, gPairIndex * 2 + 2);

              return (
                <Box
                  key={`${colIndex}-${rowIndex}`}
                  sx={{
                    display: "flex",
                    gap: `${pairGap}px`,
                    alignItems: "center",
                    px: 1,
                    py: `${rowPaddingY}px`,
                    borderRadius: 1,
                    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
                    bgcolor:
                      theme.palette.mode === "light"
                        ? "hsl(210,90%,98%)"
                        : "rgba(255,255,255,0.02)",
                    cursor: "default",
                    userSelect: "none",
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
                  {/* left (dùng % width => không tràn, vẫn giữ giao diện) */}
                  <Box
                    onClick={() => pair.left && onOpenShelf?.(pair.left.shelfCode!)}
                    title={pair.left?.shelfCode}
                    onMouseDown={(e) => pair.left && startLongPress(e, pair.left.shelfCode!)}
                    onMouseUp={clearLongPress}
                    onMouseLeave={clearLongPress}
                    onTouchStart={(e) => pair.left && startLongPress(e, pair.left.shelfCode!)}
                    onTouchEnd={clearLongPress}
                    sx={{
                      width: "48%",
                      height: { xs: 34, sm: 40 },
                      borderRadius: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize,
                      fontWeight: 600,
                      cursor: pair.left ? "pointer" : "default",
                      bgcolor: () =>
                        pair.left
                          ? `hsl(${200 + (colIndex % 6) * 10}, 85%, ${95 - (rowIndex % 5) * 4}%)`
                          : "transparent",
                      transition: "transform 120ms, box-shadow 120ms",
                      "&:hover": pair.left ? { transform: "scale(1.06)", boxShadow: "0 3px 8px rgba(0,0,0,0.08)" } : {},
                      position: "relative",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {leftLabel}
                  </Box>

                  {/* right */}
                  <Box
                    onClick={() => pair.right && onOpenShelf?.(pair.right.shelfCode!)}
                    title={pair.right?.shelfCode}
                    onMouseDown={(e) => pair.right && startLongPress(e, pair.right.shelfCode!)}
                    onMouseUp={clearLongPress}
                    onMouseLeave={clearLongPress}
                    onTouchStart={(e) => pair.right && startLongPress(e, pair.right.shelfCode!)}
                    onTouchEnd={clearLongPress}
                    sx={{
                      width: "48%",
                      height: { xs: 34, sm: 40 },
                      borderRadius: 0.5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize,
                      fontWeight: 600,
                      cursor: pair.right ? "pointer" : "default",
                      bgcolor: () =>
                        pair.right
                          ? `hsl(${230 + (colIndex % 6) * 8}, 80%, ${95 - (rowIndex % 5) * 4}%)`
                          : "transparent",
                      transition: "transform 120ms, box-shadow 120ms",
                      "&:hover": pair.right ? { transform: "scale(1.06)", boxShadow: "0 3px 8px rgba(0,0,0,0.08)" } : {},
                      position: "relative",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {rightLabel}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Popover (giữ nguyên) */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 1, minWidth: 160 }}>
          <MenuItem
            onClick={() => handleDelete(selectedShelfCode ?? undefined)}
            disabled={selectedShelfCode ? !!loadingDeleteMap[selectedShelfCode] : false}
            sx={{ gap: 1 }}
          >
            <DeleteOutlineIcon fontSize="small" />
            Xóa kệ {selectedShelfCode ? `(${selectedShelfCode})` : ""}
          </MenuItem>
          <MenuItem onClick={closePopover}>Huỷ</MenuItem>
        </Box>
      </Popover>

      {/* Add Dialog (giữ nguyên) */}
      <Dialog open={openAdd} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>Thêm Shelf</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 1, width: "100%", mt: 1 }}>
            <TextField
              label="shelfCode"
              value={form.shelfCode}
              onChange={(e) => setForm((f) => ({ ...f, shelfCode: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="storageCode"
              value={form.storageCode}
              onChange={(e) => setForm((f) => ({ ...f, storageCode: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="status"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              fullWidth
              size="small"
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField
                label="length"
                type="number"
                value={form.length}
                onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))}
                sx={{ flex: "1 1 30%" }}
                size="small"
              />
              <TextField
                label="width"
                type="number"
                value={form.width}
                onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
                sx={{ flex: "1 1 30%" }}
                size="small"
              />
              <TextField
                label="height"
                type="number"
                value={form.height}
                onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))}
                sx={{ flex: "1 1 30%" }}
                size="small"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained" disabled={loadingAdd}>
            ADD
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
