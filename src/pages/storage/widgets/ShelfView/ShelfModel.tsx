import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ShelfModel({
  onSelectFloor,
  setSelectedMesh,
  onModelCenter, 
  orbitRef,
}: any) {
 const modelUrl = "https://res.cloudinary.com/dkfykdjlm/image/upload/v1761847452/KE_1700X1070X6200_s2s3ey.glb";

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

    while (pivotRef.current.children.length) {
      pivotRef.current.remove(pivotRef.current.children[0]);
    }

    const sceneClone = originalScene.clone(true) as THREE.Object3D;

    const boxBefore = new THREE.Box3().setFromObject(sceneClone);
    const sizeBefore = boxBefore.getSize(new THREE.Vector3());
    const scaleFactor = Math.max(sizeBefore.x, sizeBefore.y, sizeBefore.z) > 20 ? 0.001 : 1;
    sceneClone.scale.setScalar(scaleFactor);

    const scaledBox = new THREE.Box3().setFromObject(sceneClone);
    const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
    const scaledSize = scaledBox.getSize(new THREE.Vector3());

    pivotRef.current.position.copy(scaledCenter);          
    sceneClone.position.copy(new THREE.Vector3().sub(scaledCenter)); 

    pivotRef.current.add(sceneClone);

    const distance = Math.max(scaledSize.x, scaledSize.y, scaledSize.z) * 1.2 || 2;
    const cameraY = scaledCenter.y + scaledSize.y * 0.3;
    camera.position.set(scaledCenter.x + distance * 0.4, cameraY, scaledCenter.z + distance);
    camera.lookAt(scaledCenter);

    if (orbitRef?.current) {
      orbitRef.current.target.copy(scaledCenter);
      orbitRef.current.update();
    }

    const bounds = {
      minX: scaledBox.min.x - scaledCenter.x + pivotRef.current.position.x,
      maxX: scaledBox.max.x - scaledCenter.x + pivotRef.current.position.x,
      minY: scaledBox.min.y - scaledCenter.y + pivotRef.current.position.y,
      maxY: scaledBox.max.y - scaledCenter.y + pivotRef.current.position.y,
      minZ: scaledBox.min.z - scaledCenter.z + pivotRef.current.position.z,
      maxZ: scaledBox.max.z - scaledCenter.z + pivotRef.current.position.z,
    };

    const baseY = bounds.minY;

    if (typeof onModelCenter === "function") {
      onModelCenter({
        center: { x: scaledCenter.x, y: scaledCenter.y, z: scaledCenter.z },
        bounds,
        baseY,
        size: { x: scaledSize.x, y: scaledSize.y, z: scaledSize.z },
      });
    }

    return () => {
      if (pivotRef.current) {
        while (pivotRef.current.children.length) pivotRef.current.remove(pivotRef.current.children[0]);
      }
    };
  }, [originalScene]);

  return <group ref={pivotRef} onClick={handleClick} />;
}
