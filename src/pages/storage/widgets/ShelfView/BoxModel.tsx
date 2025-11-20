import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  type?: "A" | "B" | "C" | "D";
  url?: string | null;
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];

  onClick?: (e?: ThreeEvent<MouseEvent>) => void;
  onPointerDown?: (e?: ThreeEvent<PointerEvent>) => void;
};

export default function BoxModel({
  type = "A",
  url,
  position,
  scale = 1,
  rotation = [0, 0, 0],
  onClick,
  onPointerDown,
}: Props) {
  const path = useMemo(
    () => (url && url.length > 0 ? url : `/models/THUNG_${type}.glb`),
    [url, type]
  );

  const { scene } = useGLTF(path, true) as any;

  const cloned = scene.clone(true) as THREE.Object3D;

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
   
      onPointerDown={(e: any) => {
        e.stopPropagation();
        onPointerDown?.(e);
      }}
      onClick={(e: any) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <primitive object={cloned} />
    </group>
  );
}
