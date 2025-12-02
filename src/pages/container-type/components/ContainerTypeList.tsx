// src/components/ContainerTypeList.tsx
import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import ContainerTypeCard from "./ContainerTypeCard";
import type { ContainerType } from "./types";
import { useGLTF } from "@react-three/drei";

export default function ContainerTypeList({
  list,
  onEdit,
  onDelete,
  loading,
}: {
  list: ContainerType[];
  onEdit: (t: ContainerType) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}) {
  const [preloadedUrls, setPreloadedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!list || list.length === 0) {
      setPreloadedUrls(new Set());
      return;
    }

    const raw = list.map((b) => b.imageUrl);
    const stringUrls = raw.filter((u): u is string => typeof u === "string" && u.length > 0);
    const modelUrls = Array.from(new Set(stringUrls.filter((u) => /\.(glb|gltf|obj)$/i.test(u))));

    const newSet = new Set<string>();
    modelUrls.forEach((u) => {
      try {
        useGLTF.preload?.(u);
        newSet.add(u);
      } catch {
        // ignore preload errors
      }
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
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        justifyContent: list.length <= 2 ? "center" : "flex-start",
      }}
    >
      {list.map((t) => (
        <Box
          key={t.containerTypeId}
          sx={{
            flex: {
              xs: "1 1 100%",
              sm: "1 1 calc(50% - 16px)",
              md: "1 1 calc(50% - 16px)",
              lg: "1 1 calc(25% - 16px)",
            },
            minWidth: 220,
            maxWidth: 420,
          }}
        >
          <ContainerTypeCard item={t} onEdit={onEdit} onDelete={onDelete} forceVisible={!!(typeof t.imageUrl === "string" && preloadedUrls.has(t.imageUrl))} />
        </Box>
      ))}
    </Box>
  );
}
