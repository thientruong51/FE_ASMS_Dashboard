import { Box } from "@mui/material";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useEffect } from "react";
import * as THREE from "three";

type Props = {
  shelfCount: number;
};

export default function Warehouse3DViewer({ shelfCount }: Props) {
  return (
    <Box
      sx={{
        width: "100%",
        height: 350,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#f9fafc",
      }}
    >
      <Canvas camera={{ position: [25, 18, 25], fov: 45 }}>
        <ambientLight intensity={1.3} />
        <directionalLight position={[30, 40, 20]} intensity={1.5} />
        <Suspense fallback={null}>
          <WarehouseScene shelfCount={shelfCount} />
        </Suspense>
        <OrbitControls
          makeDefault
          enableRotate
          enableZoom
          enablePan
          target={[0, 3, 0]}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </Box>
  );
}

function WarehouseScene({ shelfCount }: { shelfCount: number }) {
  const warehouse = useGLTF(
    "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847446/NHA_KHO_may_lanh_qzst03.glb"
  );
  const shelfSingle = useGLTF(
    "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847452/KE_1700X1070X6200_s2s3ey.glb"
  );
  const shelfDouble = useGLTF(
    "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847450/KE_1700X2140X6200_iwcmzt.glb"
  );

  const { camera, controls } = useThree();

  const warehouseBox = useMemo(() => {
    const box = new THREE.Box3().setFromObject(warehouse.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    return { size, center };
  }, [warehouse.scene]);

  useEffect(() => {
    const { size, center } = warehouseBox;
    const maxDim = Math.max(size.x, size.y, size.z);
    const fitDistance =
      maxDim / (2 * Math.tan((camera as THREE.PerspectiveCamera).fov * Math.PI / 360));
    const dir = new THREE.Vector3(1, 0.6, 1).normalize();
    camera.position.copy(center.clone().add(dir.multiplyScalar(fitDistance)));
    camera.lookAt(center);
    if (controls) { (controls as any).target.copy(center); (controls as any).update(); }
  }, [warehouseBox, camera, controls]);

  const warehouseLength = 23; 
  const warehouseWidth  = 12;  
  const shelfLength = 1.7;     
  const shelfDepth  = 1.07;    
  const doubleDepth = shelfDepth * 2;
  const aisle   = 2;           
  const wallGap = 1;           
  const rows = 3;              

  const rowCentersX: number[] = [];
  let x = -warehouseWidth / 2 + wallGap + doubleDepth / 2 - 1.2;
  for (let r = 0; r < rows; r++) {
    rowCentersX.push(x);
    x += doubleDepth + aisle;
  }

  const base = Math.floor(shelfCount / rows);
  const rem  = shelfCount % rows;
  const countsPerRow = rowCentersX.map((_, idx) => base + (idx < rem ? 1 : 0));

  const startZ = -warehouseLength / 2 + 3; 
  const nodes:any[] = [];

  rowCentersX.forEach((xCenter, rowIdx) => {
    let remaining = countsPerRow[rowIdx];
    let slot = 0; 

    while (remaining > 0) {
      const z = startZ + slot * shelfLength;

      if (remaining >= 2) {
        nodes.push(
          <primitive
            key={`double-r${rowIdx}-s${slot}`}
            object={shelfDouble.scene.clone()}
            position={[xCenter + warehouseBox.center.x, 0, z + warehouseBox.center.z]}
            rotation={[0, 0, 0]}
            scale={1}
          />
        );
        remaining -= 2;
      } else {

        const leftX = xCenter - (doubleDepth / 2 - shelfDepth / 2 - 0.5);
        nodes.push(
          <primitive
            key={`single-r${rowIdx}-s${slot}`}
            object={shelfSingle.scene.clone()}
            position={[leftX + warehouseBox.center.x, 0, z + warehouseBox.center.z]}
            rotation={[0, 0, 0]}
            scale={1}
          />
        );
        remaining -= 1;
      }

      slot += 1; 
    }
  });

  return (
    <group>
      <primitive object={warehouse.scene} position={[0, 0, 0]} />
      {nodes}
    </group>
  );
}

useGLTF.preload("https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847446/NHA_KHO_may_lanh_qzst03.glb");
useGLTF.preload("https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847452/KE_1700X1070X6200_s2s3ey.glb");
useGLTF.preload("https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847450/KE_1700X2140X6200_iwcmzt.glb");
