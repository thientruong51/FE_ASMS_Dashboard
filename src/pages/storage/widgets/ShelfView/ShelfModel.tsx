import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ShelfModel({
  selectedFloor,
  onSelectFloor,
  setSelectedMesh,
  onModelCenter,
  orbitRef,
}: any) {
  const { scene } = useGLTF("/models/KE 1700X1070X6200.glb");
  const ref = useRef<THREE.Group>(null);
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

    const intersects = raycaster.intersectObject(ref.current!, true);
    if (intersects.length > 0) {
      const y = intersects[0].point.y;
      const floor = floorHeights.find((f) => y >= f.min && y < f.max);
      if (floor) {
        onSelectFloor(floor.floor);
        setSelectedMesh(intersects[0].object);
      }
    }
  };

  // căn camera giữa mô hình
  useEffect(() => {
    if (ref.current) {
      const box = new THREE.Box3().setFromObject(ref.current);
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);

      const scaleFactor = Math.max(size.x, size.y, size.z) > 20 ? 0.001 : 1;
      ref.current.scale.setScalar(scaleFactor);

      const newBox = new THREE.Box3().setFromObject(ref.current);
      const newCenter = new THREE.Vector3();
      newBox.getCenter(newCenter);
      const distance = Math.max(size.x, size.y, size.z) * 1.2;
      const cameraY = newCenter.y + size.y * 0.3;
      const cameraZ = newCenter.z + distance;

      camera.position.set(newCenter.x + distance * 0.4, cameraY, cameraZ);
      camera.lookAt(newCenter);

      if (orbitRef.current) {
        orbitRef.current.target.copy(newCenter);
        orbitRef.current.update();
      }

      onModelCenter(newCenter);
    }
  }, []);

  return (
    <group ref={ref} onClick={handleClick}>
      <primitive object={scene} />
    </group>
  );
}
