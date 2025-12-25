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
  Paper,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WidgetsIcon from "@mui/icons-material/Widgets";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { ContainerType } from "./types";
import { useTranslation } from "react-i18next";
import { translateContainerTypeName } from "@/utils/containerTypeNames"; 

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

    scene.position.x -= center.x;
    scene.position.y -= center.y;
    scene.position.z -= center.z;

    const maxSize = Math.max(size.x || 1, size.y || 1, size.z || 1);
    const fitOffset = 1.9;
    let distance = maxSize * fitOffset * 1.4;

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

export default function ContainerTypeCard({
  item,
  onEdit,
  onDelete,
  forceVisible = false,
}: {
  item: ContainerType;
  onEdit: (t: ContainerType) => void;
  onDelete: (id: number) => void;
  forceVisible?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(!!forceVisible);
  const { t } = useTranslation(["containerType", "containerTypeNames"]);

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
      { threshold: 0.01, rootMargin: "360px 0px 360px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  const hasModel = !!item.imageUrl && /\.(glb|gltf|obj)$/i.test(item.imageUrl ?? "");
  const hasImage = !!item.imageUrl && /\.(jpe?g|png|webp|gif)$/i.test(item.imageUrl ?? "");

  const displayName = translateContainerTypeName(t, item.type);

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        overflow: "hidden",
        transition: "transform 220ms cubic-bezier(.2,.9,.2,1), box-shadow 220ms cubic-bezier(.2,.9,.2,1), border-color 220ms ease",
        boxShadow: "0 8px 30px rgba(16,24,40,0.06)",
        border: "1px solid rgba(16,24,40,0.04)",
        "&:hover": {
          transform: "translateY(-8px) scale(1.015)",
          boxShadow: "0 18px 48px rgba(16,24,40,0.16)",
          borderColor: "primary.main",
        },
        "&:hover .media": {
          transform: "scale(1.03)",
        },
        ".media": {
          transition: "transform 320ms cubic-bezier(.2,.9,.2,1)",
          transformOrigin: "center center",
        },
      }}
    >
      <Paper ref={ref} square sx={{ height: 220, overflow: "hidden", position: "relative" }}>
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#fbfdff,#f4f7fb)", zIndex: 0 }} />
        {!visible && (
          <Box sx={{ width: "100%", height: 220, display: "grid", placeItems: "center", zIndex: 1 }}>
            <CircularProgress />
          </Box>
        )}

        {visible && hasModel ? (
          <Box className="media" sx={{ width: "100%", height: 220, zIndex: 1 }}>
            <Canvas style={{ width: "100%", height: "100%", background: "linear-gradient(180deg,#f6f9fb,#f3f7fb)" }} gl={{ antialias: true }} dpr={[1, 1.5]}>
              <ambientLight intensity={0.45} />
              <directionalLight position={[5, 5, 5]} intensity={0.35} />
              <Suspense
                fallback={
                  <Html center>
                    <Box sx={{ width: 220, height: 180, display: "grid", placeItems: "center" }}>
                      <CircularProgress />
                    </Box>
                  </Html>
                }
              >
                <GLBModelFit url={item.imageUrl!} />
              </Suspense>
              <OrbitControls enableZoom autoRotate={false} />
              <Environment preset="warehouse" />
            </Canvas>
          </Box>
        ) : visible && hasImage ? (
          <Box
            component="img"
            src={item.imageUrl ?? undefined}
            alt={displayName}
            className="media"
            sx={{ width: "100%", height: 220, objectFit: "cover", zIndex: 1 }}
          />
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center" height={220} bgcolor="grey.100" zIndex={1}>
            <WidgetsIcon sx={{ fontSize: 46, color: "text.secondary" }} />
          </Box>
        )}

        <Chip
          label={`#${item.containerTypeId}`}
          size="small"
          sx={{ position: "absolute", left: 12, top: 12, zIndex: 2, bgcolor: "background.paper", boxShadow: "0 6px 18px rgba(16,24,40,0.04)" }}
        />
      </Paper>

      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
              {displayName}
            </Typography>
          </Box>

          <Stack direction="column" spacing={1} alignItems="flex-end">
            <Chip
              size="small"
              label={t("card.dimensions", {
                l: (item.length ?? 0).toFixed(2),
                w: (item.width ?? 0).toFixed(2),
                h: (item.height ?? 0).toFixed(2)
              })}
            />
            {typeof item.price !== "undefined" && (
              <Chip size="small" label={t("card.price", { price: Number(item.price).toLocaleString() })} />
            )}
          </Stack>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 1, pb: 1 }}>
        <Tooltip title={t("tooltips.edit")}>
          <IconButton size="small" aria-label="edit" onClick={() => onEdit(item)} sx={{ borderRadius: 2 }}>
            <EditIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={t("tooltips.delete")}>
          <IconButton size="small" aria-label="delete" onClick={() => onDelete(item.containerTypeId)} sx={{ borderRadius: 2 }}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: "1 0 auto" }} />

        
      </CardActions>
    </Card>
  );
}
