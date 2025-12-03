import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import StorageTypeCard from "./StorageTypeCard";
import type { StorageType } from "./types";
import { useGLTF } from "@react-three/drei";

export default function StorageTypeList({
  list,
  onEdit,
  onDelete,
  selectable = false,
  selectedId,
  onSelect,
  loading
}: {
  list: StorageType[];
  onEdit?: (s: StorageType) => void;
  onDelete?: (id: number) => void;
  selectable?: boolean;
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  loading?: boolean;
}) {
  const [_preloadedUrls, setPreloadedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!list || list.length === 0) {
      setPreloadedUrls(new Set());
      return;
    }

    const stringUrls = list.map((b) => b.imageUrl).filter(Boolean) as string[];
    const modelUrls = Array.from(new Set(stringUrls.filter((u) => /\.(glb|gltf|obj)$/i.test(u))));

    const newSet = new Set<string>();
    modelUrls.forEach((u) => {
      try {
        useGLTF.preload?.(u);
        newSet.add(u);
      } catch {}
    });
    setPreloadedUrls(newSet);
  }, [list]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={160}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
        gap: 3,
        alignItems: "stretch"
      }}
    >
      {list.map((t) => (
        <StorageTypeCard
          key={t.storageTypeId}
          item={t}
          onEdit={onEdit}
          onDelete={onDelete}
          selectable={selectable}
          selected={!!selectedId && t.storageTypeId === selectedId}
          onSelect={(id) => onSelect && onSelect(id)}
        />
      ))}
    </Box>
  );
}
