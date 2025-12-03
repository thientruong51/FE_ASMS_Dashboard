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

import { useTranslation } from "react-i18next";

type Props = {
  shelves: ShelfItem[];
  storageCode?: string;
  onOpenShelf?: (shelfCode: string) => void;
  onAdded?: (newShelf: ShelfItem) => void;
  onDeleted?: (shelfCode: string) => void;
  onNotify?: (message: string, severity?: "success" | "error") => void;
};

export default function MapShelves({
  shelves,
  storageCode,
  onOpenShelf,
  onAdded,
  onDeleted,
  onNotify,
}: Props) {
  const { t } = useTranslation("storagePage");
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));

  const items = shelves ?? [];

  // pair two items per row
  const pairObjects: { left?: ShelfItem; right?: ShelfItem }[] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairObjects.push({ left: items[i], right: items[i + 1] });
  }

  // fixed 3 columns as requested
  const responsiveCols = 3;
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

  // Add dialog state
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

  const [snack, setSnack] = useState<{ open: boolean; message?: string; severity?: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const handleAddSubmit = async () => {
    if (!form.shelfCode?.trim()) {
      const msg = t("mapShelves.errRequiredShelfCode");
      setSnack({ open: true, message: msg, severity: "error" });
      onNotify?.(msg, "error");
      return;
    }
    if (!form.storageCode?.trim()) {
      const msg = t("mapShelves.errRequiredStorageCode");
      setSnack({ open: true, message: msg, severity: "error" });
      onNotify?.(msg, "error");
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
      const successMsg = t("mapShelves.addSuccess", { code: created?.shelfCode ?? payload.shelfCode });
      setSnack({ open: true, message: successMsg, severity: "success" });
      onNotify?.(successMsg, "success");
      setOpenAdd(false);
      onAdded?.(created as ShelfItem);
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : t("mapShelves.addFailed");
      setSnack({ open: true, message: msg, severity: "error" });
      onNotify?.(msg, "error");
    } finally {
      setLoadingAdd(false);
    }
  };

  // long-press popover
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
      const successMsg = t("mapShelves.deleteSuccess", { code: shelfCode });
      setSnack({ open: true, message: successMsg, severity: "success" });
      onNotify?.(successMsg, "success");
      onDeleted?.(shelfCode);
      closePopover();
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : t("mapShelves.deleteFailed");
      setSnack({ open: true, message: msg, severity: "error" });
      onNotify?.(msg, "error");
    } finally {
      setLoadingDeleteMap((p) => ({ ...p, [shelfCode]: false }));
    }
  };

  // layout tuning
  const pairGap = 12;
  const rowPaddingY = 8;
  const fontSize = isSm ? 12 : 11;

  return (
    <Box>
      <Typography fontWeight={700} fontSize={13} mb={0.6}>
        {t("mapShelves.title", { count: items.length })}
      </Typography>

      <Box display="flex" alignItems="center" gap={1} mb={1} flexWrap="wrap">
        <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAddDialog} disabled={loadingAdd}>
          {t("mapShelves.addButton")}
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1.2,
          alignItems: "start",
          overflowX: "hidden",
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
                    bgcolor: theme.palette.mode === "light" ? "hsl(210,90%,98%)" : "rgba(255,255,255,0.02)",
                    cursor: "default",
                    userSelect: "none",
                    width: "100%",
                    minWidth: 0,
                    boxSizing: "border-box",
                  }}
                >
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
            {t("mapShelves.popoverDelete", { code: selectedShelfCode ?? "" })}
          </MenuItem>
          <MenuItem onClick={closePopover}>{t("common.cancel")}</MenuItem>
        </Box>
      </Popover>

      <Dialog open={openAdd} onClose={closeAddDialog} fullWidth maxWidth="sm">
        <DialogTitle>{t("mapShelves.addDialogTitle")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gap: 1, width: "100%", mt: 1 }}>
            <TextField
              label={t("mapShelves.fieldShelfCode")}
              value={form.shelfCode}
              onChange={(e) => setForm((f) => ({ ...f, shelfCode: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label={t("mapShelves.fieldStorageCode")}
              value={form.storageCode}
              onChange={(e) => setForm((f) => ({ ...f, storageCode: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label={t("mapShelves.fieldStatus")}
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              fullWidth
              size="small"
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField
                label={t("mapShelves.fieldLength")}
                type="number"
                value={form.length}
                onChange={(e) => setForm((f) => ({ ...f, length: Number(e.target.value) }))}
                sx={{ flex: "1 1 30%" }}
                size="small"
              />
              <TextField
                label={t("mapShelves.fieldWidth")}
                type="number"
                value={form.width}
                onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
                sx={{ flex: "1 1 30%" }}
                size="small"
              />
              <TextField
                label={t("mapShelves.fieldHeight")}
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
          <Button onClick={closeAddDialog}>{t("common.cancel")}</Button>
          <Button onClick={handleAddSubmit} variant="contained" disabled={loadingAdd}>
            {t("mapShelves.addButton")}
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
