import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";

type Props = {
  type: "A" | "B" | "C" | "D";
  position: [number, number, number];
  color?: string;
  onClick?: () => void;
};

export default function BoxModel({ type, position, onClick }: Props) {
  const path = useMemo(() => `/models/THUNG_${type}.glb`, [type]);
  const { scene } = useGLTF(path);

  return (
    <primitive
      object={scene.clone()}
      position={position}
      scale={1}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick?.();
      }}
    />
  );
}
