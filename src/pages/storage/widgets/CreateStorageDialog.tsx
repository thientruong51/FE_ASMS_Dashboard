import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { getStorageTypes } from "@/api/storageTypeApi";
import { createStorage } from "@/api/storageApi";
import type { StorageType } from "@/pages/storage-type/components/types";
import { useTranslation } from "react-i18next";

import { translateStorageTypeName } from "@/utils/storageTypeNames";

type Props = {
  open: boolean;
  onClose: () => void;
  buildingId: number;
  buildingCode: string;
  onCreated: () => void;
};

export default function CreateStorageDialog({
  open,
  onClose,
  buildingId,
  buildingCode,
  onCreated,
}: Props) {
  const { t } = useTranslation(["storagePage", "common"]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [storageTypes, setStorageTypes] = useState<StorageType[]>([]);
  const [selectedType, setSelectedType] = useState<StorageType | null>(null);

  const [code, setCode] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [height, setHeight] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingTypes(true);
        const resp = await getStorageTypes({ page: 1, pageSize: 200 });
        setStorageTypes(resp.data ?? []);
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, [open]);

  async function handleCreate() {
    if (!selectedType) {
      alert(t("storageList.error.noType"));
      return;
    }

    try {
      setSaving(true);
      await createStorage({
        storageCode: code,
        buildingId,
        buildingCode,
        storageTypeId: selectedType.storageTypeId,
        storageTypeName: selectedType.name, // backend bắt buộc
        width: Number(width) || undefined,
        length: Number(length) || undefined,
        height: Number(height) || undefined,
      });

      onClose();
      onCreated();

      // reset form
      setCode("");
      setSelectedType(null);
      setWidth("");
      setLength("");
      setHeight("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t("storageList.createStorageTitle")}</DialogTitle>

      <DialogContent>
        <Box mt={1} display="flex" flexDirection="column" gap={1.5}>
          {/* STORAGE CODE */}
          <TextField
            label={t("storageList.storageCode")}
            size="small"
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          {/* STORAGE TYPE SELECT */}
          <Autocomplete
            options={storageTypes}
            loading={loadingTypes}
            getOptionLabel={(opt) =>
              translateStorageTypeName(t, opt.name) ?? ""
            }
            value={selectedType}
            onChange={(_, v) => setSelectedType(v)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t("storageList.storageType")}
                size="small"
              />
            )}
          />

          {/* DIMENSIONS */}
          <Typography fontSize={13} fontWeight={600}>
            {t("storageList.dimensions")}
          </Typography>

          <TextField
            label={t("width")}
            size="small"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />

          <TextField
            label={t("length")}
            size="small"
            value={length}
            onChange={(e) => setLength(e.target.value)}
          />

          <TextField
            label={t("height")}
            size="small"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>

        <Button variant="contained" onClick={handleCreate} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : t("common.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
