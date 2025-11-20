// src/pages/storage/widgets/ShelfModel.tsx
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ShelfModel({
  selectedFloor,
  onSelectFloor,
  setSelectedMesh,
  onModelCenter, // will receive { center, bounds, baseY, size }
  orbitRef,
}: any) {
  const modelUrl = "/models/KE 1700X1070X6200.glb";
  const gltf = useGLTF(modelUrl) as any;
  const originalScene = gltf.scene as THREE.Object3D;

  const pivotRef = useRef<THREE.Group | null>(null);
  const { camera, gl } = useThree();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const floorHeights = [
    { floor: 1, min: 0.0, max: 1.2 },
    { floor: 2, min: 1.2, max: 2.4 },
    { floor: 3, min: 2.4, max: 3.6 },
    { floor: 4, min: 3.6, max: 5.2 },
  ];

  const handleClick = (event: any) => {
    const { offsetX, offsetY } = event.nativeEvent;
    pointer.x = (offsetX / gl.domElement.clientWidth) * 2 - 1;
    pointer.y = -(offsetY / gl.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const root = pivotRef.current!;
    if (!root) return;

    const intersects = raycaster.intersectObject(root, true);
    if (intersects.length > 0) {
      const y = intersects[0].point.y;
      const floor = floorHeights.find((f) => y >= f.min && y < f.max);
      if (floor) {
        onSelectFloor(floor.floor);
        setSelectedMesh(intersects[0].object);
      }
    }
  };

  useEffect(() => {
    if (!pivotRef.current || !originalScene) return;

    // clear previous children
    while (pivotRef.current.children.length) {
      pivotRef.current.remove(pivotRef.current.children[0]);
    }

    // clone the model
    const sceneClone = originalScene.clone(true) as THREE.Object3D;

    // Optional: rotate clone here if the GLB is authored rotated (do BEFORE bbox)
    // sceneClone.rotateY(Math.PI / 2);

    // scale heuristic
    const boxBefore = new THREE.Box3().setFromObject(sceneClone);
    const sizeBefore = boxBefore.getSize(new THREE.Vector3());
    const scaleFactor = Math.max(sizeBefore.x, sizeBefore.y, sizeBefore.z) > 20 ? 0.001 : 1;
    sceneClone.scale.setScalar(scaleFactor);

    // compute bbox/center/size AFTER scale & rotate
    const scaledBox = new THREE.Box3().setFromObject(sceneClone);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    const scaledSize = scaledBox.getSize(new THREE.Vector3());

    // --- IMPORTANT: place pivot at scaledCenter (world coords), and move clone so its center aligns to pivot origin
    pivotRef.current.position.copy(scaledCenter);           // pivot world = model center (like original behavior)
    sceneClone.position.copy(new THREE.Vector3().sub(scaledCenter)); // move clone so center becomes pivot origin

    pivotRef.current.add(sceneClone);

    // DO NOT rotate pivot. If rotation needed, rotate sceneClone above (before computing bbox).
    // pivotRef.current.rotation.set(0, Math.PI / 2, 0); // <-- keep commented

    // set camera to view the model center nicely
    const distance = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 1.2 || 2;
    const cameraY = scaledCenter.y + scaledSize.y * 0.3;
    camera.position.set(scaledCenter.x + distance * 0.4, cameraY, scaledCenter.z + distance);
    camera.lookAt(scaledCenter);

    if (orbitRef?.current) {
      orbitRef.current.target.copy(scaledCenter);
      orbitRef.current.update();
    }

    // compute world bounds: scaledBox (local) shifted to world by scaledCenter
    const worldMin = scaledBox.min.clone().add(new THREE.Vector3().sub(scaledCenter)).add(scaledCenter).sub(scaledCenter); // essentially scaledBox.min - scaledCenter + pivot world = scaledBox.min (local) + pivot position (scaledCenter) - scaledCenter => scaledBox.min
    // simpler: because we put pivot at scaledCenter and moved clone by -scaledCenter, the world bounds are:
    const bounds = {
      minX: scaledBox.min.x - scaledCenter.x + pivotRef.current.position.x,
      maxX: scaledBox.max.x - scaledCenter.x + pivotRef.current.position.x,
      minY: scaledBox.min.y - scaledCenter.y + pivotRef.current.position.y,
      maxY: scaledBox.max.y - scaledCenter.y + pivotRef.current.position.y,
      minZ: scaledBox.min.z - scaledCenter.z + pivotRef.current.position.z,
      maxZ: scaledBox.max.z - scaledCenter.z + pivotRef.current.position.z,
    };

    const baseY = bounds.minY;

    // send model center IN WORLD COORDS (scaledCenter) — this fixes ShelfView's floorCenter logic
    if (typeof onModelCenter === "function") {
      onModelCenter({
        center: { x: scaledCenter.x, y: scaledCenter.y, z: scaledCenter.z },
        bounds,
        baseY,
        size: { x: scaledSize.x, y: scaledSize.y, z: scaledSize.z },
      });
    }

    // cleanup
    return () => {
      if (pivotRef.current) {
        while (pivotRef.current.children.length) pivotRef.current.remove(pivotRef.current.children[0]);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalScene]);

  return <group ref={pivotRef} onClick={handleClick} />;
}
