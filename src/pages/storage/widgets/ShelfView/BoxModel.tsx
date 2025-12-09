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
  const defaultUrls: Record<NonNullable<Props["type"]>, string> = {
    A: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103944/THUNG_A_s6rirx.glb",
    B: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103945/THUNG_B_r3eikp.glb",
    C: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103946/THUNG_C_cbsgav.glb",
    D: "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103946/THUNG_D_ognjqr.glb",
  };

  const path = useMemo(() => {
    if (url && url.length > 0) return url;
    return defaultUrls[type ?? "A"];
  }, [url, type]);

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

useGLTF.preload(
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103944/THUNG_A_s6rirx.glb"
);
useGLTF.preload(
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103945/THUNG_B_r3eikp.glb"
);
useGLTF.preload(
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103946/THUNG_C_cbsgav.glb"
);
useGLTF.preload(
  "https://res.cloudinary.com/dkfykdjlm/image/upload/v1763103946/THUNG_D_ognjqr.glb"
);
