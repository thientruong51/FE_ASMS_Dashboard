import React, { useEffect, useRef, useState, Suspense } from "react";
import { Card, CardContent, CardActions, Typography, IconButton, Box, Chip, Stack, Paper, CircularProgress } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WidgetsIcon from "@mui/icons-material/Widgets";
import StraightenIcon from "@mui/icons-material/Straighten";
import HeightIcon from "@mui/icons-material/Height";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { StorageType } from "./types";

function GLBModelFit({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const { scene } = gltf;
  const { camera } = useThree();

  React.useEffect(() => {
    if (!scene) return;
    scene.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    scene.position.x += -center.x;
    scene.position.y += -center.y;
    scene.position.z += -center.z;

    const maxSize = Math.max(size.x || 1, size.y || 1, size.z || 1);
    const fitOffset = 1.6;
    let distance = maxSize * fitOffset * 1.5;

    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCam = camera as THREE.PerspectiveCamera;
      const fovRad = (pCam.fov * Math.PI) / 180;
      distance = (maxSize / 2) / Math.tan(fovRad / 2) * fitOffset;
    } else if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      distance = maxSize * fitOffset * 1.2;
    }

    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir).normalize();
    const newPos = dir.multiplyScalar(-distance);
    if (!isFinite(newPos.length())) newPos.set(0, 0, distance);

    camera.position.copy(newPos);
    camera.lookAt(0, 0, 0);

    camera.near = Math.max(0.01, distance / 1000);
    camera.far = Math.max(camera.far, distance * 1000);
    camera.updateProjectionMatrix();
  }, [scene, camera, url]);

  return <primitive object={scene} />;
}

export default function StorageTypeCard({
  item,
  onEdit,
  onDelete,
  selectable,
  selected,
  onSelect,
}: {
  item: StorageType;
  onEdit?: (s: StorageType) => void;
  onDelete?: (id: number) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.01, rootMargin: "300px 0px 300px 0px" }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const hasModel = !!item.imageUrl && /\.(glb|gltf|obj)$/i.test(item.imageUrl ?? "");
  const hasImage = !!item.imageUrl && /\.(jpe?g|png|webp|gif)$/i.test(item.imageUrl ?? "");

  return (
    <Card
      ref={ref}
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: selected ? "0 12px 40px rgba(60,189,150,0.14)" : "0 8px 24px rgba(16,24,40,0.04)",
        transition: "transform 0.28s ease, box-shadow 0.28s ease",
        transform: selected ? "translateY(-8px)" : "none",
        cursor: selectable ? "pointer" : "default",
        "&:hover": { transform: "translateY(-8px)", boxShadow: "0 12px 40px rgba(16,24,40,0.08)", borderColor: "primary.main", },
      }}
      onClick={() => selectable && onSelect && onSelect(item.storageTypeId)}
    >
      <Paper square sx={{ height: 260, position: "relative", overflow: "hidden" }}>
        {!visible && (
          <Box sx={{ width: "100%", height: 260, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        )}

        {visible && hasModel ? (
          <Canvas camera={{ position: [0, 0.8, 2.2], fov: 45 }} style={{ width: "100%", height: 260, background: "linear-gradient(180deg,#f6f9fb,#f3f7fb)" }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[5, 5, 5]} intensity={0.6} />
            <Suspense
              fallback={
                <Html center>
                  <Box sx={{ width: 240, height: 220, display: "grid", placeItems: "center" }}>
                    <CircularProgress />
                  </Box>
                </Html>
              }
            >
              <GLBModelFit url={item.imageUrl!} />
            </Suspense>
            <OrbitControls enableZoom={true} autoRotate={false} />
            <Environment preset="warehouse" />
          </Canvas>
        ) : visible && hasImage ? (
          <Box component="img" src={item.imageUrl ?? undefined} alt={item.name} style={{ width: "100%", height: 260, objectFit: "cover" }} />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height={260} bgcolor="#f4f6f8">
            <WidgetsIcon sx={{ fontSize: 44, color: "text.secondary" }} />
          </Box>
        )}

        {/* gradient overlay + price badge */}
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.0), rgba(2,6,23,0.08))", pointerEvents: "none" }} />
        <Chip
          label={typeof item.price === "number" ? `${Number(item.price).toLocaleString()} đ` : "N/A"}
          size="small"
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            bgcolor: typeof item.price === "number" ? "rgba(59,130,246,0.95)" : "rgba(158,158,158,0.9)",
            color: "#fff",
            fontWeight: 700,
            px: 1.5,
            boxShadow: "0 6px 18px rgba(59,130,246,0.12)",
          }}
        />
      </Paper>

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {`ID: ${item.storageTypeId}`}
            </Typography>
            <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
              {item.name}
            </Typography>
          </Box>

          <Stack direction="column" spacing={1} alignItems="flex-end">
            <Chip size="small" label={`${(item.length ?? 0).toFixed(2)}×${(item.width ?? 0).toFixed(2)}×${(item.height ?? 0).toFixed(2)} m`} />
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center" mb={1}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <StraightenIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">{item.area ?? "-" } m²</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <HeightIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">{item.totalVolume ?? "-"} m³</Typography>
          </Stack>
        </Stack>

        
      </CardContent>

      <CardActions sx={{ px: 1 }}>
        {onEdit && (
          <IconButton size="small" aria-label="edit" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {onDelete && (
          <IconButton size="small" aria-label="delete" onClick={(e) => { e.stopPropagation(); onDelete(item.storageTypeId); }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: "1 0 auto" }} />
      </CardActions>
    </Card>
  );
}
