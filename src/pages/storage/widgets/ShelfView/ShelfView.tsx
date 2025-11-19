// src/pages/storage/widgets/ShelfView.tsx
import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from "@mui/material";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { EffectComposer, Outline } from "@react-three/postprocessing";

import ShelfModel from "./ShelfModel";
import BoxModel from "./BoxModel";
import ShelfFloorOrders from "../ShelfFloorOrders";
import type { ShelfItem } from "@/api/shelfApi";
import type { FloorItem } from "@/api/floorApi";
import type { ContainerItem } from "@/api/containerApi";

export type ShelfViewProps = {
  shelfCode: string;
  shelf?: ShelfItem | null;
  floors?: FloorItem[];
  containersByFloor?: Record<string, ContainerItem[]>;
  onClose?: () => void;
};

// ---------- Config / helpers for placement & collision ----------
/**
 * BOX_SIZES: footprint [widthX, depthZ, heightY] (meters).
 * Chỉnh các giá trị này theo kích thước thực tế của GLB nếu cần.
 */
const BOX_SIZES: Record<"A" | "B" | "C" | "D", [number, number, number]> = {
  A: [0.5, 0.5, 0.45],
  B: [0.75, 0.75, 0.45],
  C: [1.0, 0.5, 0.45],
  D: [1.0, 1.0, 0.8],
};

// Default floor dimensions (meters) — chỉnh nếu bạn có số chuẩn cho từng floor
const DEFAULT_FLOOR_DIM = { width: 1.7, length: 1.02 };

/** Lấy kích thước floor từ object floor (nếu API có trường width/length) */
function getFloorDimensions(floorObj: any) {
  if (!floorObj) return DEFAULT_FLOOR_DIM;
  const width = typeof floorObj.width === "number" ? floorObj.width : DEFAULT_FLOOR_DIM.width;
  const length = typeof floorObj.length === "number" ? floorObj.length : DEFAULT_FLOOR_DIM.length;
  return { width, length };
}

/** Clamp X/Z để footprint box không lòi ra khỏi floor bounds (floor center assumed at x=0,z=0) */
function clampPositionToFloor(x: number, z: number, boxW: number, boxD: number, floorW: number, floorL: number) {
  const halfW = floorW / 2 - boxW / 2;
  const halfL = floorL / 2 - boxD / 2;
  const nx = Math.max(Math.min(x, halfW), -halfW);
  const nz = Math.max(Math.min(z, halfL), -halfL);
  return [nx, nz];
}

/** Simple fallback position generator for containers without explicit coords */
const computeFallbackPosition = (idx: number, total: number): [number, number, number] => {
  const spacing = 0.1; // khoảng cách mặc định giữa các container khi fallback
  const itemsPerRow = Math.max(1, Math.ceil(Math.sqrt(total)));
  const row = Math.floor(idx / itemsPerRow);
  const col = idx % itemsPerRow;
  const startX = -((itemsPerRow - 1) * spacing) / 2;
  const x = startX + col * spacing;
  const y = 0.28; // height above shelf base — tweak để phù hợp model
  const z = -0.08 + row * (spacing * 0.9);
  return [x, y, z];
};

// ----------------------------------------------------------------

export default function ShelfView({
  shelfCode,
  shelf,
  floors = [],
  containersByFloor = {},
  onClose,
}: ShelfViewProps) {
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  const [modelCenter, setModelCenter] = useState<THREE.Vector3 | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);
  const orbitRef = useRef<any>(null);

  React.useEffect(() => {
    console.log("[ShelfView] floors:", floors);
    console.log("[ShelfView] containersByFloor keys:", Object.keys(containersByFloor));
  }, [floors, containersByFloor]);

  // derive floor numbers from floors prop (filter out 0)
  const floorNumbers = Array.from(
    new Set(floors.map((f) => Number(f.floorNumber)).filter((n) => !Number.isNaN(n) && n !== 0))
  ).sort((a, b) => a - b);

  const onSelectFloor = (floorNum: number) => {
    setSelectedFloor(floorNum);
    // ShelfModel sẽ set target/center khi cần
  };

  // find containers for the currently selected floor
  const activeContainers: ContainerItem[] = (() => {
    if (!selectedFloor) return [];

    const floorObj = floors.find((f) => Number(f.floorNumber) === Number(selectedFloor));

    if (floorObj && (floorObj as any).floorCode) {
      const code = (floorObj as any).floorCode as string;
      if (containersByFloor && containersByFloor[code] && containersByFloor[code].length > 0) {
        return containersByFloor[code];
      }
    }

    // fallback keys
    const tryKeys = [`F${selectedFloor}`, String(selectedFloor), "unknown"];
    for (const k of tryKeys) {
      if (containersByFloor && containersByFloor[k] && containersByFloor[k].length > 0) {
        return containersByFloor[k];
      }
    }

    return [];
  })();

  // whether at least one container has real positions
  const hasRenderablePositions = activeContainers.some(
    (c) =>
      c &&
      c.positionX !== null &&
      c.positionY !== null &&
      c.positionZ !== null &&
      !Number.isNaN(Number(c.positionX)) &&
      !Number.isNaN(Number(c.positionY)) &&
      !Number.isNaN(Number(c.positionZ))
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 3, mt: 2 }}>
      {/* Left: 3D model / viewer */}
      <Box sx={{ textAlign: "center" }}>
        <Typography fontWeight={600} mb={1}>
          Shelf: {shelfCode}
        </Typography>

        <Box sx={{ width: 520, height: 500, bgcolor: "#f5f7fa", borderRadius: 2, overflow: "hidden" }}>
          <Canvas camera={{ fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />

            <Suspense
              fallback={
                <group>
                  {/* a simple centered spinner in 3D space is tricky, so fallback to invisible; keep a UI spinner below */}
                </group>
              }
            >
              <ShelfModel
                selectedFloor={selectedFloor}
                onSelectFloor={onSelectFloor}
                setSelectedMesh={setSelectedMesh}
                onModelCenter={setModelCenter}
                orbitRef={orbitRef}
              />

              {/* ---------------------------
                  Render containers with rules:
                  - D must be on floor 4 (skipped & warned otherwise)
                  - A/B/C can be on 1/2/3
                  - max 2 layers (0 + 1)
                  - collision avoidance using spiral offsets
                  - clamp to floor bounds
                  --------------------------- */}
              {selectedFloor &&
                (() => {
                  const floorObj = floors.find((f) => Number(f.floorNumber) === Number(selectedFloor));
                  const { width: floorWidth, length: floorLength } = getFloorDimensions(floorObj);

                  // collision helper (AABB in X/Z plane)
                  const boxesOverlap = (
                    ax: number, az: number, aw: number, ad: number,
                    bx: number, bz: number, bw: number, bd: number
                  ) => {
                    const aMinX = ax - aw / 2, aMaxX = ax + aw / 2;
                    const aMinZ = az - ad / 2, aMaxZ = az + ad / 2;
                    const bMinX = bx - bw / 2, bMaxX = bx + bw / 2;
                    const bMinZ = bz - bd / 2, bMaxZ = bz + bd / 2;
                    const overlapX = aMinX < bMaxX && aMaxX > bMinX;
                    const overlapZ = aMinZ < bMaxZ && aMaxZ > bMinZ;
                    return overlapX && overlapZ;
                  };

                  // spiral offsets — small step grid search outward from base
                  const makeSpiralOffsets = (step = 0.06, maxRadius = Math.max(floorWidth, floorLength)) => {
                    const offsets: [number, number][] = [[0, 0]];
                    const maxRings = Math.ceil(maxRadius / step) + 2;
                    for (let r = 1; r <= maxRings; r++) {
                      for (let i = -r; i <= r; i++) offsets.push([i * step, -r * step]);
                      for (let i = -r + 1; i <= r; i++) offsets.push([r * step, i * step]);
                      for (let i = r - 1; i >= -r; i--) offsets.push([i * step, r * step]);
                      for (let i = r - 1; i >= -r + 1; i--) offsets.push([-r * step, i * step]);
                      if (offsets.length > 2000) break;
                    }
                    return offsets;
                  };

                  const spiralOffsets = makeSpiralOffsets(0.06);

                  // placed[layer] contains placed boxes for collision checking
                  const placed: Array<Array<{ x: number; z: number; w: number; d: number; code?: string }>> = [[], []];

                  // gather invalid D boxes on wrong floor for warning
                  const invalidDOnOtherFloor = activeContainers.filter(
                    (c) => (c.type === "D" || c.type === "d") && Number(selectedFloor) !== 4
                  );

                  return (
                    <>
                      {invalidDOnOtherFloor.length > 0 && (
                        <group key="warning-d">
                          {/* TODO: you can show a UI overlay instead; keeping in 3D group for simplicity */}
                        </group>
                      )}

                      {activeContainers
                        .filter((c) => !((c.type === "D" || c.type === "d") && Number(selectedFloor) !== 4))
                        .map((c, idx) => {
                          const typeKey = ((c.type as "A" | "B" | "C" | "D") ?? "A") as "A" | "B" | "C" | "D";
                          const [boxW, boxD, boxH] = BOX_SIZES[typeKey];

                          // initial candidate base pos (real coords or fallback)
                          let candidateX = 0;
                          let candidateY = 0;
                          let candidateZ = 0;
                          if (
                            c.positionX !== null &&
                            c.positionY !== null &&
                            c.positionZ !== null &&
                            !Number.isNaN(Number(c.positionX)) &&
                            !Number.isNaN(Number(c.positionY)) &&
                            !Number.isNaN(Number(c.positionZ))
                          ) {
                            candidateX = Number(c.positionX);
                            candidateY = Number(c.positionY);
                            candidateZ = Number(c.positionZ);
                          } else {
                            const [fx, fy, fz] = computeFallbackPosition(idx, activeContainers.length);
                            candidateX = fx;
                            candidateY = fy;
                            candidateZ = fz;
                          }

                          // clamp to floor bounds
                          const [clampedBaseX, clampedBaseZ] = clampPositionToFloor(
                            candidateX,
                            candidateZ,
                            boxW,
                            boxD,
                            floorWidth,
                            floorLength
                          );

                          // try place on layer 0 then 1 using spiral offsets to avoid overlap
                          let placedPos: { layer: number; x: number; z: number } | null = null;
                          for (let layer = 0; layer <= 1; layer++) {
                            for (const [dx, dz] of spiralOffsets) {
                              const tryX = clampedBaseX + dx;
                              const tryZ = clampedBaseZ + dz;
                              const [nx, nz] = clampPositionToFloor(tryX, tryZ, boxW, boxD, floorWidth, floorLength);

                              let overlap = false;
                              for (const p of placed[layer]) {
                                if (boxesOverlap(nx, nz, boxW, boxD, p.x, p.z, p.w, p.d)) {
                                  overlap = true;
                                  break;
                                }
                              }

                              if (!overlap) {
                                placedPos = { layer, x: nx, z: nz };
                                break;
                              }
                            }
                            if (placedPos) break;
                          }

                          // if not placed -> overflow marker
                          if (!placedPos) {
                            const key = c.containerCode ?? `container-${selectedFloor}-${idx}`;
                            return (
                              <group key={key}>
                                {/* red marker to indicate cannot place */}
                                <mesh position={[clampedBaseX, candidateY + boxH * 0.5, clampedBaseZ]}>
                                  <sphereGeometry args={[0.04, 8, 8]} />
                                  <meshBasicMaterial opacity={0.9} />
                                </mesh>
                              </group>
                            );
                          }

                          // commit placement
                          placed[placedPos.layer].push({
                            x: placedPos.x,
                            z: placedPos.z,
                            w: boxW,
                            d: boxD,
                            code: c.containerCode,
                          });

                          const finalY = candidateY + boxH * placedPos.layer;
                          const key = c.containerCode ?? `container-${selectedFloor}-${idx}`;

                          return (
                            <BoxModel
                              key={key}
                              type={typeKey}
                              url={c.imageUrl ?? null}
                              position={[placedPos.x, finalY, placedPos.z]}
                              scale={1}
                              onClick={() => setSelectedContainer(c)}
                            />
                          );
                        })}
                    </>
                  );
                })()}
            </Suspense>

            <EffectComposer multisampling={8}>
              <Outline
                selection={selectedMesh ? [selectedMesh] : []}
                edgeStrength={3}
                pulseSpeed={0}
                visibleEdgeColor={0x42a5f5}
                hiddenEdgeColor={0x42a5f5}
              />
            </EffectComposer>

            <OrbitControls
              ref={orbitRef}
              enableZoom
              enableRotate
              enablePan
              makeDefault
              target={modelCenter ? [modelCenter.x, modelCenter.y, modelCenter.z] : [0, 3, 0]}
            />
          </Canvas>
        </Box>

        {/* UI spinner / hint if Suspense loading GLBs */}
        <Box mt={1} display="flex" alignItems="center" justifyContent="center" gap={1}>
          <CircularProgress size={16} />
          <Typography fontSize={13} fontWeight={600}>
            {selectedFloor ? `Selected: Floor ${selectedFloor}` : "Click a floor on the model"}
          </Typography>
        </Box>

        {/* Quick floor selector below model (if floors known) */}
        <Box mt={1} display="flex" gap={1} justifyContent="center" flexWrap="wrap">
          {floorNumbers.map((fn) => (
            <Box
              key={fn}
              onClick={() => onSelectFloor(fn)}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 1,
                bgcolor: selectedFloor === fn ? "primary.main" : "background.paper",
                color: selectedFloor === fn ? "white" : "text.primary",
                cursor: "pointer",
                fontSize: 13,
                boxShadow: selectedFloor === fn ? 2 : "none",
              }}
            >
              Floor {fn}
            </Box>
          ))}
        </Box>
      </Box>

      <Divider orientation="vertical" flexItem />

      {/* Right: orders + containers list */}
      <Box flex={1} minWidth={380}>
        {selectedFloor ? (
          <ShelfFloorOrders shelfCode={shelfCode} floor={selectedFloor} containers={activeContainers} />
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
              fontSize: 14,
            }}
          >
            Click a floor to view containers & orders
          </Box>
        )}
      </Box>

      {/* Container detail dialog */}
      <Dialog open={!!selectedContainer} onClose={() => setSelectedContainer(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Container detail</DialogTitle>
        <DialogContent>
          {selectedContainer && (
            <>
              <Typography fontWeight={700}>{selectedContainer.containerCode}</Typography>
              <Typography>Type: {selectedContainer.type ?? "-"}</Typography>
              <Typography>
                Weight: {selectedContainer.currentWeight ?? "-"} / {selectedContainer.maxWeight ?? "-"}
              </Typography>
              <Typography>
                Position: {selectedContainer.positionX ?? "-"}, {selectedContainer.positionY ?? "-"},{" "}
                {selectedContainer.positionZ ?? "-"}
              </Typography>
              <Typography>Status: {selectedContainer.status ?? "-"}</Typography>
              <Box mt={1}>
                {selectedContainer.imageUrl ? (
                  // show small preview from imageUrl (if you want)
                  <img
                    src={selectedContainer.imageUrl}
                    alt={selectedContainer.containerCode}
                    style={{ width: "100%", maxHeight: 240, objectFit: "contain" }}
                  />
                ) : null}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
