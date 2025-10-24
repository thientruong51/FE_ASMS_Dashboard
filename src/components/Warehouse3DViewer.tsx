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
  const warehouse = useGLTF("/models/NHA KHO (CO MAY LANH).glb");
  const shelfSingle = useGLTF("/models/KE 1700X1070X6200.glb");
  const shelfDouble = useGLTF("/models/KE 1700X2140X6200.glb");
  const { camera, controls } = useThree();

  // ===== Fit camera theo bounding box kho =====
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

  // ===== Thông số bố trí =====
  const warehouseLength = 23;  // Z
  const warehouseWidth  = 12;  // X
  const shelfLength = 1.7;     // BƯỚC THEO Z (giữ nguyên)
  const shelfDepth  = 1.07;    // độ sâu kệ đơn (X)
  const doubleDepth = shelfDepth * 2;
  const aisle   = 2;           // lối đi giữa các dãy (X)
  const wallGap = 1;           // khoảng hở tường (X)
  const rows = 3;              // số dãy kệ song song theo Z

  // Vị trí tâm từng dãy (tính cho kệ đôi – tức là bề dày doubleDepth)
  const rowCentersX: number[] = [];
  let x = -warehouseWidth / 2 + wallGap + doubleDepth / 2 - 1.2;
  for (let r = 0; r < rows; r++) {
    rowCentersX.push(x);
    x += doubleDepth + aisle;
  }

  // Phân bổ số kệ cho từng dãy (đều nhau, dãy đầu nhận phần dư nếu có)
  const base = Math.floor(shelfCount / rows);
  const rem  = shelfCount % rows;
  const countsPerRow = rowCentersX.map((_, idx) => base + (idx < rem ? 1 : 0));

  const startZ = -warehouseLength / 2 + 3; // mép đầu hàng
  const nodes:any[] = [];

  rowCentersX.forEach((xCenter, rowIdx) => {
    let remaining = countsPerRow[rowIdx];
    let slot = 0; // mỗi slot cách nhau đúng shelfLength theo Z

    while (remaining > 0) {
      const z = startZ + slot * shelfLength;

      if (remaining >= 2) {
        // GHÉP ĐÔI THEO TRỤC X: đặt 1 model kệ đôi đúng tâm dãy
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
        // CÒN LẺ 1 KỆ → giữ kệ đơn
        // Đặt kệ đơn tại bên "trái" của dãy để sát trục giữa (có thể đổi sang phải nếu bạn muốn)
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

      slot += 1; // 👉 bước Z luôn +1 slot = shelfLength (không bị giãn)
    }
  });

  return (
    <group>
      <primitive object={warehouse.scene} position={[0, 0, 0]} />
      {nodes}
    </group>
  );
}

useGLTF.preload("/models/NHA KHO (CO MAY LANH).glb");
useGLTF.preload("/models/KE 1700X1070X6200.glb");
useGLTF.preload("/models/KE 1700X2140X6200.glb");
