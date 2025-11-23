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
  Button,
  Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ApartmentIcon from "@mui/icons-material/Apartment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Building } from "../components/types";

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

    const maxSize = Math.max(size.x, size.y, size.z) || 1;
    const fitOffset = 1.2;

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
    if (!isFinite(newPos.length())) {
      newPos.set(0, 0, distance);
    }

    camera.position.copy(newPos);
    camera.lookAt(0, 0, 0);

    camera.near = Math.max(0.01, distance / 1000);
    camera.far = Math.max(camera.far, distance * 1000);
    camera.updateProjectionMatrix();
  }, [scene, camera, url]);

  return <primitive object={scene} />;
}

function ModelView({ url, visible }: { url: string | null; visible: boolean }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      } catch {}
    }
  }, [visible]);

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
        <GLBModelFit url={url} />
      </Suspense>
      <OrbitControls ref={controlsRef} enableZoom autoRotate={false} />
    </Canvas>
  );
}

export default function BuildingCard({
  building,
  onEdit,
  onDelete,
  forceVisible = false,
  selectable = false,
  selected = false,
  onSelect,
}: {
  building: Building;
  onEdit: (b: Building) => void;
  onDelete: (id: number) => void;
  forceVisible?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(!!forceVisible);

  useEffect(() => {
    if (forceVisible) setVisible(true);
  }, [forceVisible]);

  useEffect(() => {
    if (visible) return;
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
      { threshold: 0.01, rootMargin: "400px 0px 400px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  const hasModel = !!building.imageUrl && /\.(glb|gltf|obj)$/i.test(building.imageUrl ?? "");
  const hasImage = !!building.imageUrl && /\.(jpe?g|png|webp|gif)$/i.test(building.imageUrl ?? "");

  return (
    <Card
  variant="elevation"
  elevation={selected ? 8 : 2}
  sx={{
    height: "100%",
    display: "flex",
    flexDirection: "column",
    transition: "transform 200ms, box-shadow 200ms, border-color 200ms",
    border: selected ? "2px solid" : "2px solid transparent",
    borderColor: selected ? "primary.main" : "transparent",
    cursor: selectable ? "pointer" : "default",

    "&:hover": {
      transform: "translateY(-6px)",
      borderColor: "primary.main",   
    },
  }}
  onClick={() => selectable && onSelect && onSelect(building.buildingId)}
>
      <Box ref={ref} sx={{ position: "relative", overflow: "hidden", height: 220 }}>
        {hasModel ? (
          <ModelView url={building.imageUrl ?? null} visible={visible} />
        ) : hasImage ? (
          <Box component="img" src={building.imageUrl ?? undefined} alt={building.name} sx={{ width: "100%", height: 220, objectFit: "cover" }} />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height={220} bgcolor="grey.100">
            <ApartmentIcon sx={{ fontSize: 56, color: "text.secondary" }} />
          </Box>
        )}

        {/* overlay header */}
        <Box sx={{ position: "absolute", left: 12, top: 12, zIndex: 3, display: "flex", gap: 1, alignItems: "center" }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <ApartmentIcon />
          </Avatar>
         
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box sx={{ pr: 1 }}>
            <Typography variant="subtitle2" color="text.secondary">
              {building.buildingCode ?? ""}
            </Typography>
            <Typography variant="h6" noWrap>
              {building.name}
            </Typography>
          </Box>

          <Stack direction="column" spacing={1} alignItems="flex-end">
            {typeof building.isActive === "boolean" && (
              <Chip size="small" label={building.isActive ? "Active" : "Inactive"} color={building.isActive ? "success" : "default"} />
            )}
            {building.status && <Chip size="small" label={building.status} />}
          </Stack>
        </Box>

        {building.address && (
          <Typography variant="body2" color="text.secondary" gutterBottom noWrap>
            {building.address}
          </Typography>
        )}

        {building.area && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Area: {building.area}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ px: 1 }}>
        <IconButton size="small" aria-label="edit" onClick={(e) => { e.stopPropagation(); onEdit(building); }}>
          <EditIcon />
        </IconButton>

        <IconButton size="small" aria-label="delete" onClick={(e) => { e.stopPropagation(); onDelete(building.buildingId); }}>
          <DeleteIcon />
        </IconButton>

        <Box sx={{ flex: "1 0 auto", display: "flex", justifyContent: "flex-end", pr: 1 }}>
          <Button size="small" startIcon={<VisibilityIcon />} onClick={(e) => { e.stopPropagation(); /* optional: open viewer */ }}>
            View
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
}
