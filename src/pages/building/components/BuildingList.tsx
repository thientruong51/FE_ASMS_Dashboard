import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import BuildingCard from "./BuildingCard";
import type { Building } from "./types";
import { useGLTF } from "@react-three/drei";

export default function BuildingList({
  list,
  onEdit,
  onDelete,
  loading,
}: {
  list: Building[];
  onEdit: (b: Building) => void;
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
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, justifyContent: list.length <= 2 ? "center" : "flex-start" }}>
      {list.map((b) => (
        <Box
          key={b.buildingId}
          sx={{
            flex: { xs: "1 1 100%", sm: "1 1 calc(50% - 16px)", md: "1 1 calc(33.333% - 16px)" },
            minWidth: 280,
            maxWidth: 420,
          }}
        >
          <BuildingCard
            building={b}
            onEdit={onEdit}
            onDelete={onDelete}
            forceVisible={!!(typeof b.imageUrl === "string" && preloadedUrls.has(b.imageUrl))}
          />
        </Box>
      ))}
    </Box>
  );
}
