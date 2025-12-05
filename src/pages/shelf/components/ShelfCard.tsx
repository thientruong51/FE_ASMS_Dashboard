import React, { useEffect, useRef, useState, Suspense } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Box,
  Chip,
  Stack,
  CircularProgress,
  Avatar,
  Button
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ShelvesIcon from "@mui/icons-material/Shelves";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import type { ShelfType } from "../components/types";
import { useTranslation } from "react-i18next";
import { translateShelfTypeName } from "@/utils/shelfTypeNames"; 

function GLBModelFit({ url }: { url: string }) {
  const gltf = useGLTF(url, true);
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

    const maxSize = Math.max(size.x, size.y, size.z) || 1;
    const fitOffset = 1.4;

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

function ShelfModelView({ url, visible }: { url?: string | null; visible: boolean }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      } catch {}
    }
  }, [visible]);

  useEffect(() => {
    if (!url) return;
    try {
      useGLTF.preload?.(url);
    } catch {}
  }, [url]);

  if (!visible || !url) return null;

  return (
    <Canvas style={{ width: "100%", height: 220, background: "linear-gradient(180deg,#f6f9fb,#f3f7fb)" }} gl={{ antialias: true }} dpr={[1, 1.5]}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <Suspense
        fallback={
          <Html center>
            <Box sx={{ width: 220, height: 220, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          </Html>
        }
      >
        <GLBModelFit url={url!} />
      </Suspense>
      <OrbitControls ref={controlsRef} enableZoom autoRotate={false} />
    </Canvas>
  );
}

export default function ShelfCard({
  shelf,
  onEdit,
  onDelete
}: {
  shelf: ShelfType;
  onEdit: (s: ShelfType) => void;
  onDelete: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation(["shelfPage", "shelfTypeNames"]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
      { threshold: 0.05, rootMargin: "300px 0px 300px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const hasModel = !!shelf.imageUrl && /\.(glb|gltf|obj)$/i.test(shelf.imageUrl ?? "");
  const hasImage = !!shelf.imageUrl && /\.(jpe?g|png|webp|gif)$/i.test(shelf.imageUrl ?? "");

  const displayName = translateShelfTypeName(t, shelf.name, (shelf as any).nameEn);

  return (
    <Card
      ref={ref}
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        boxShadow: 3,
        overflow: "hidden",
        transition: "all 0.35s ease",
        cursor: "pointer",
        "&:hover": {
          boxShadow: "0 10px 36px rgba(0,0,0,0.18)",
          transform: "translateY(-4px)",
          borderColor: "primary.main"
        },
        "&:hover .card-image-overlay": {
          opacity: 0.14
        }
      }}
    >
      <Box sx={{ position: "relative", height: 220, overflow: "hidden" }}>
        {hasModel ? (
          <ShelfModelView url={shelf.imageUrl!} visible={visible} />
        ) : hasImage ? (
          <Box component="img" src={shelf.imageUrl!} alt={displayName} sx={{ width: "100%", height: 220, objectFit: "cover" }} />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height={220} bgcolor="grey.100">
            <ShelvesIcon sx={{ fontSize: 56, color: "text.secondary" }} />
          </Box>
        )}

        <Box sx={{ position: "absolute", left: 12, top: 12, zIndex: 3, display: "flex", gap: 1, alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
            <ShelvesIcon />
          </Avatar>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" noWrap>
              {displayName}
            </Typography>
          </Box>

          <Stack direction="column" spacing={1} alignItems="flex-end">
            <Chip size="small" label={`${shelf.length ?? 0}×${shelf.width ?? 0}×${shelf.height ?? 0} m`} />
            {typeof shelf.price === "number" && <Chip size="small" label={`₫ ${shelf.price.toLocaleString()}`} />}
          </Stack>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 1 }}>
        <IconButton size="small" aria-label={t("edit", { ns: "shelfPage" })} onClick={(e) => { e.stopPropagation(); onEdit(shelf); }}>
          <EditIcon />
        </IconButton>

        <IconButton size="small" aria-label={t("delete", { ns: "shelfPage" })} onClick={(e) => { e.stopPropagation(); onDelete(shelf.shelfTypeId); }}>
          <DeleteIcon />
        </IconButton>

        <Box sx={{ flex: "1 0 auto", display: "flex", justifyContent: "flex-end", pr: 1 }}>
          <Button size="small" startIcon={<VisibilityIcon />} onClick={(e) => { e.stopPropagation(); /* optional full preview */ }}>
            {t("preview", { ns: "shelfPage" })}
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
