// src/pages/storage/widgets/BoxModel.tsx
import React, { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  type?: "A" | "B" | "C" | "D";
  url?: string | null;
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  onClick?: () => void;
};

export default function BoxModel({
  type = "A",
  url,
  position,
  scale = 1,
  rotation = [0, 0, 0],
  onClick,
}: Props) {
  // Nếu có url sử dụng nó, còn không dùng file local theo type
  const path = useMemo(() => (url && url.length > 0 ? url : `/models/THUNG_${type}.glb`), [url, type]);

  // Ghi chú: useGLTF sẽ ném lỗi nếu url không tồn tại / CORS blocked.
  // Giả sử url của bạn hợp lệ (Cloudinary) thì useGLTF sẽ load bình thường.
  const { scene } = useGLTF(path, true) as any;

  // Clone scene để tránh chia sẻ state giữa nhiều instance
  const cloned = scene.clone(true) as THREE.Object3D;

  return (
    <primitive
      object={cloned}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onClick?.();
      }}
    />
  );
}
