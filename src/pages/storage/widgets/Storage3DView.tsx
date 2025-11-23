import { Suspense, useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function Storage3DView({
  modelUrl,
  blocked,
  width = "100%",
  height = 420,
}: {
  modelUrl?: string | null;
  imageUrl?: string | null;
  blocked?: boolean;
  width?: number | string;
  height?: number | string;
}) {

  const showModel = !!modelUrl && /\.(glb|gltf)$/i.test(modelUrl);

  return (
    <Box sx={{ width, height, position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid #ddd" }}>
      {showModel ? (
        <Canvas camera={{ fov: 20 }}>
          <ambientLight intensity={0.8} />
          <directionalLight intensity={1.1} position={[5, 10, 5]} />

          <Suspense fallback={null}>
            <CenteredGLB url={modelUrl!} />
          </Suspense>

          <OrbitControls enablePan enableZoom enableRotate />
        </Canvas>
      ) : (
        <Box
          component="img"
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}

      {blocked && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.45)",
            color: "#fff",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BlockIcon sx={{ fontSize: 64 }} />
          <Typography sx={{ fontWeight: "bold" }}>ĐÃ THUÊ</Typography>
        </Box>
      )}
    </Box>
  );
}

function CenteredGLB({ url }: { url: string }) {
  const gltf = useGLTF(url) as any;
  const original = gltf.scene;
  const groupRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

  useEffect(() => {
    if (!groupRef.current || !original) return;

    while (groupRef.current.children.length) groupRef.current.remove(groupRef.current.children[0]);
    const clone = original.clone(true);

    const box = new THREE.Box3().setFromObject(clone);
    const sizeBox = box.getSize(new THREE.Vector3());

    const scale = 2.5 / Math.max(sizeBox.x, sizeBox.y, sizeBox.z);
    clone.scale.setScalar(scale);

    const newBox = new THREE.Box3().setFromObject(clone);
    const newCenter = newBox.getCenter(new THREE.Vector3());

    clone.position.set(-newCenter.x, -newCenter.y, -newCenter.z);
    groupRef.current.add(clone);

    const maxDim = Math.max(sizeBox.x, sizeBox.y, sizeBox.z) * scale;
    const dist = maxDim * 2.2;

    camera.position.set(dist, dist * 0.5, dist);
    camera.lookAt(0, 0, 0);

  }, [original, size]);

  return <group ref={groupRef} />;
}
