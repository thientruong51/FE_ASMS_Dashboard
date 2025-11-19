import  { useEffect, useRef, useState, Suspense } from "react";
import { Box, Button, Paper, Typography, CircularProgress } from "@mui/material";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import type { ShelfType } from "./types";


function GLBModelFit({ url }: { url: string }) {
  const gltf = useGLTF(url, true);
  const groupRef = useRef<THREE.Group | null>(null);
  const { camera } = useThree(); 

  useEffect(() => {
    if (!gltf || !gltf.scene) return;
    const scene = gltf.scene;

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
    camera.getWorldDirection(dir);
    dir.normalize();

    const newPos = new THREE.Vector3().copy(dir).multiplyScalar(-distance);
    if (!isFinite(newPos.length())) {
      newPos.set(0, 0, distance);
    }

    camera.position.copy(newPos);
    camera.lookAt(0, 0, 0);

    camera.near = Math.max(0.1, distance / 1000);
    camera.far = Math.max(camera.far, distance * 1000);
    camera.updateProjectionMatrix();
  }, [gltf, camera, url]);

  return <primitive ref={groupRef as any} object={gltf.scene} />;
}


function ShelfModelView({ url, visible }: { url: string; visible: boolean }) {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      } catch {
      }
    }
  }, [visible]);

  useEffect(() => {
    try {
      useGLTF.preload?.(url);
    } catch {
    }
  }, [url]);

  if (!visible) return null;

  return (
    <Canvas
      style={{ width: "100%", height: 240, background: "#f6f7f9" }}
      gl={{ antialias: false }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />

      <Suspense
        fallback={
          <Html center>
            <Box sx={{ width: 240, height: 240, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          </Html>
        }
      >
        <GLBModelFit url={url} />
      </Suspense>

      <OrbitControls ref={controlsRef} enableZoom={true} autoRotate={false} />
    </Canvas>
  );
}


export default function ShelfCard({
  shelf,
  onEdit,
  onDelete,
}: {
  shelf: ShelfType;
  onEdit: (s: ShelfType) => void;
  onDelete: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Paper ref={ref} elevation={3} sx={{ p: 1, display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ height: 240, mb: 1 }}>
        <ShelfModelView url={shelf.imageUrl} visible={visible} />
      </Box>

      <Box sx={{ flex: "1 1 auto", px: 1 }}>
        <Typography variant="h6">{shelf.name}</Typography>
        <Typography variant="body2">ID: {shelf.shelfTypeId}</Typography>
        <Typography variant="body2">
          Dimension: {shelf.length} x {shelf.width} x {shelf.height} m
        </Typography>
        <Typography variant="body2">Price: {shelf.price ? shelf.price.toLocaleString() : "N/A"}</Typography>
      </Box>

      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
        <Button variant="contained" size="small" onClick={() => onEdit(shelf)}>
          Edit
        </Button>
        <Button variant="outlined" size="small" onClick={() => onDelete(shelf.shelfTypeId)}>
          Delete
        </Button>
      </Box>
    </Paper>
  );
}
