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

/**
 * NOTES:
 * - BOX_SIZES = [depthX, lateralZ, heightY]
 * - placement-space uses: px = forward/depth, pz = lateral/horizontal
 * - incoming container data: positionX = lateral, positionZ = depth
 */

const BOX_SIZES: Record<"A" | "B" | "C" | "D", [number, number, number]> = {
  A: [0.5, 0.5, 0.45],
  B: [0.75, 0.75, 0.45],
  C: [1.0, 0.5, 0.45],
  D: [1.0, 1.0, 0.8],
};

const DEFAULT_FLOOR_DIM = { width: 1.07, length: 1.7 };

function getFloorDimensions(floorObj: any) {
  if (!floorObj) return DEFAULT_FLOOR_DIM;
  const width = typeof floorObj.width === "number" ? floorObj.width : DEFAULT_FLOOR_DIM.width;
  const length = typeof floorObj.length === "number" ? floorObj.length : DEFAULT_FLOOR_DIM.length;
  return { width, length };
}

const FLOOR_BASE_Y_BY_FLOOR: Record<number, number> = {
  1: 0.28,
  2: 1.57,
  3: 2.86,
  4: 4.15,
};

const TYPE_POSITION_OFFSETS: Record<"A" | "B" | "C" | "D", [number, number]> = {
  A: [0.19, 0],
  B: [0, 0],
  C: [0, 0],
  D: [0, 0],
};

const SEQUENTIAL_SPACING = 0.01;

// debug visual
const RENDER_GRID_DEBUG = true;

/** rotate point (x,z) around center (cx,cz) by angle (radians) */
function rotateAroundCenter(cx: number, cz: number, x: number, z: number, angle: number) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  // translate to origin
  const tx = x - cx;
  const tz = z - cz;
  // rotate in XZ plane
  const rx = tx * cos - tz * sin;
  const rz = tx * sin + tz * cos;
  // translate back
  return [rx + cx, rz + cz];
}

/** clamp placement in placement-space (px forward, pz lateral)
 *  Accepts optional explicit bounds {minX,maxX,minZ,maxZ} to clamp within grid bounds.
 */
function clampPlacement(
  px: number,
  pz: number,
  boxDepth: number,
  boxLateral: number,
  floorLength: number,
  floorWidth: number,
  floorCenterX = 0,
  floorCenterZ = 0,
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number }
) {
  // use explicit bounds if provided (more robust)
  if (bounds) {
    const halfDx = boxDepth / 2;
    const halfDz = boxLateral / 2;
    const nx = Math.min(Math.max(px, bounds.minX + halfDx), bounds.maxX - halfDx);
    const nz = Math.min(Math.max(pz, bounds.minZ + halfDz), bounds.maxZ - halfDz);
    return [nx, nz];
  }

  // fallback symmetric clamp based on center + floor dims
  const halfForward = floorLength / 2 - boxDepth / 2;
  const halfLateral = floorWidth / 2 - boxLateral / 2;

  const nx = Math.max(Math.min(px - floorCenterX, halfForward), -halfForward) + floorCenterX;
  const nz = Math.max(Math.min(pz - floorCenterZ, halfLateral), -halfLateral) + floorCenterZ;
  return [nx, nz];
}

const FIXED_ITEMS_PER_ROW: number | null = null;
const computeFallbackPosition = (
  idx: number,
  total: number,
  floorCenterX = 0,
  floorCenterZ = 0
): [number, number, number] => {
  const spacing = 0.1;
  const itemsPerRow = FIXED_ITEMS_PER_ROW ?? Math.max(1, Math.ceil(Math.sqrt(total)));

  const col = idx % itemsPerRow;
  const row = Math.floor(idx / itemsPerRow);

  const startPz = -((itemsPerRow - 1) * spacing) / 2;
  const pzLocal = startPz + col * spacing;
  const pxLocal = -0.08 + row * (spacing * 0.9);

  const py = 0.28;
  const px = pxLocal + floorCenterX;
  const pz = pzLocal + floorCenterZ;

  return [px, py, pz];
};

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
  const [floorInfo, setFloorInfo] = useState<any | null>(null); // receives { center:{x,y,z}, baseY, bounds:{minX,maxX,minZ,maxZ}, rotationY }
  const [selectedContainer, setSelectedContainer] = useState<ContainerItem | null>(null);
  const orbitRef = useRef<any>(null);

  React.useEffect(() => {
    console.log("[ShelfView] floors:", floors);
    console.log("[ShelfView] containersByFloor keys:", Object.keys(containersByFloor));
  }, [floors, containersByFloor]);

  const floorNumbers = Array.from(
    new Set(floors.map((f) => Number(f.floorNumber)).filter((n) => !Number.isNaN(n) && n !== 0))
  ).sort((a, b) => a - b);

  const onSelectFloor = (floorNum: number) => {
    setSelectedFloor(floorNum);
  };

  const activeContainers: ContainerItem[] = (() => {
    if (!selectedFloor) return [];

    const floorObj = floors.find((f) => Number(f.floorNumber) === Number(selectedFloor));

    if (floorObj && (floorObj as any).floorCode) {
      const code = (floorObj as any).floorCode as string;
      if (containersByFloor && containersByFloor[code] && containersByFloor[code].length > 0) {
        return containersByFloor[code];
      }
    }

    const tryKeys = [`F${selectedFloor}`, String(selectedFloor), "unknown"];
    for (const k of tryKeys) {
      if (containersByFloor && containersByFloor[k] && containersByFloor[k].length > 0) {
        return containersByFloor[k];
      }
    }

    return [];
  })();

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
      <Box sx={{ textAlign: "center" }}>
        <Typography fontWeight={600} mb={1}>
          Shelf: {shelfCode}
        </Typography>

        <Box sx={{ width: 520, height: 500, bgcolor: "#f5f7fa", borderRadius: 2, overflow: "hidden" }}>
          <Canvas camera={{ fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1.2} />

            <Suspense fallback={<group>{/* fallback */}</group>}>
              <group>
                <ShelfModel
                  selectedFloor={selectedFloor}
                  onSelectFloor={onSelectFloor}
                  setSelectedMesh={setSelectedMesh}
                  // receive richer info from ShelfModel: center, rotationY, bounds, baseY
                  onModelCenter={setFloorInfo}
                  orbitRef={orbitRef}
                />

                {selectedFloor &&
                  (() => {
                    const floorObj = floors.find((f) => Number(f.floorNumber) === Number(selectedFloor));
                  
                    const GRID_TRANSLATE = { x: -0.29, z: 0.25 }; 
                    let floorCenterX =
                      floorInfo && floorInfo.bounds
                        ? (floorInfo.bounds.minX + floorInfo.bounds.maxX) / 2
                        : modelCenter
                          ? modelCenter.x
                          : 0;
                    let floorCenterZ =
                      floorInfo && floorInfo.bounds
                        ? (floorInfo.bounds.minZ + floorInfo.bounds.maxZ) / 2
                        : modelCenter
                          ? modelCenter.z
                          : 0;

                    // áp dụng offset (world)
                    floorCenterX += GRID_TRANSLATE.x;
                    floorCenterZ += GRID_TRANSLATE.z;

                    const floorWidth =
                      floorInfo && floorInfo.bounds
                        ? Math.abs(floorInfo.bounds.maxZ - floorInfo.bounds.minZ)
                        : getFloorDimensions(floorObj).width;
                    const floorLength =
                      floorInfo && floorInfo.bounds
                        ? Math.abs(floorInfo.bounds.maxX - floorInfo.bounds.minX)
                        : getFloorDimensions(floorObj).length;

                    const floorBaseFromInfo = floorInfo && typeof floorInfo.baseY === "number" ? floorInfo.baseY : null;
                    const modelCenterY = floorInfo && floorInfo.center && typeof floorInfo.center.y === "number" ? floorInfo.center.y : (modelCenter ? modelCenter.y : 0);

                    // Nếu baseY từ ShelfModel là offset (local), cộng vào center.y để ra world Y.
                    // Nếu không có info thì fallback về map cứng hoặc 0.
                    const floorBaseY = FLOOR_BASE_Y_BY_FLOOR[Number(selectedFloor)] ?? 0;

                    const rotationY = (floorInfo && typeof floorInfo.rotationY === "number") ? floorInfo.rotationY : 0;

                    const boxesOverlap = (
                      ax: number, az: number, aDepth: number, aLat: number,
                      bx: number, bz: number, bDepth: number, bLat: number
                    ) => {
                      const aMinX = ax - aDepth / 2, aMaxX = ax + aDepth / 2;
                      const aMinZ = az - aLat / 2, aMaxZ = az + aLat / 2;
                      const bMinX = bx - bDepth / 2, bMaxX = bx + bDepth / 2;
                      const bMinZ = bz - bLat / 2, bMaxZ = bz + bLat / 2;
                      const overlapX = aMinX < bMaxX && aMaxX > bMinX;
                      const overlapZ = aMinZ < bMaxZ && aMaxZ > bMinZ;
                      return overlapX && overlapZ;
                    };

                    // diagnostic: theoretical slot capacity for a given box type (single layer)
                    function computeTheoreticalSlots(boxKey: keyof typeof BOX_SIZES, spacing = SEQUENTIAL_SPACING) {
                      const [boxDepth, boxLat] = BOX_SIZES[boxKey];
                      const cols = Math.max(1, Math.floor((floorWidth + spacing) / (boxLat + spacing)));
                      const rows = Math.max(1, Math.floor((floorLength + spacing) / (boxDepth + spacing)));
                      return { cols, rows, total: cols * rows };
                    }
                    // debug print (helps check expected capacity)
                    // eslint-disable-next-line no-console
                    console.log("[diag] floor dims:", { floorWidth, floorLength, floorCenterX, floorCenterZ });
                    // eslint-disable-next-line no-console
                    console.log("[diag] theoretical slots for A:", computeTheoreticalSlots("A"));

                    // === MULTI-LAYER GRID BUILD & ASSIGNMENT ===

                    // compute how many vertical stack layers fit for a box height on this floor
                    function computeLayersForFloor(floorNum: number, boxHeight: number) {
                      const baseY = FLOOR_BASE_Y_BY_FLOOR[floorNum] ?? 0;
                      const nextBaseY = FLOOR_BASE_Y_BY_FLOOR[floorNum + 1] ?? (baseY + 1.2);
                      const verticalSpace = Math.max(0, nextBaseY - baseY);
                      const layers = Math.max(1, Math.floor(verticalSpace / boxHeight));
                      // eslint-disable-next-line no-console
                      console.log(`[layers] floor=${floorNum} baseY=${baseY} nextBaseY=${nextBaseY} verticalSpace=${verticalSpace.toFixed(3)} boxH=${boxHeight} -> layers=${layers}`);
                      return { layers, baseY, nextBaseY, verticalSpace };
                    }

                    function buildGridSlotsWithLayers(
                      floorCenterX: number,
                      floorCenterZ: number,
                      floorLength: number,
                      floorWidth: number,
                      boxDepth: number, // forward (X) size
                      boxLat: number,   // lateral (Z) size
                      boxHeight: number,
                      floorNum: number,
                      spacing = SEQUENTIAL_SPACING
                    ) {
                      // raw (floating) counts
                      const rawCols = (floorWidth + spacing) / (boxLat + spacing);
                      const rawRows = (floorLength + spacing) / (boxDepth + spacing);

                      // base (floor) counts
                      let cols = Math.max(1, Math.floor(rawCols + 1e-9));
                      let rows = Math.max(1, Math.floor(rawRows + 1e-9));

                      const stepZ = boxLat + spacing; // lateral step (Z)
                      const stepX = boxDepth + spacing; // forward step (X)

                      // Try to add extra column first (prefer columns) if it fits
                      const totalWidthIfExtraCol = cols * stepZ + boxLat; // width needed if we add a column
                      if (totalWidthIfExtraCol <= floorWidth + 1e-6) {
                        cols = cols + 1;
                      } else {
                        // if cannot add a column, try adding a row
                        const totalLengthIfExtraRow = rows * stepX + boxDepth;
                        if (totalLengthIfExtraRow <= floorLength + 1e-6) {
                          rows = rows + 1;
                        }
                      }

                      // (Edge-case) if we still have a lot of leftover width but small leftover length,
                      // allow a second pass: try column again (rare).
                      const totalWidthAfter = cols * stepZ;
                      if (totalWidthAfter + 1e-9 <= floorWidth && cols < Math.floor(rawCols + 1 + 1e-6)) {
                        // only bump if it won't exceed and rawCols suggests possible extra
                        const maybeExtra = cols + 1;
                        if (maybeExtra * stepZ <= floorWidth + 1e-6) cols = maybeExtra;
                      }

                      // recompute totals and starts
                      const totalWidth = cols * stepZ;
                      const totalLength = rows * stepX;
                      const startPz = floorCenterZ - totalWidth / 2 + stepZ / 2;
                      const startPx = floorCenterX - totalLength / 2 + stepX / 2;

                      const { layers, baseY } = computeLayersForFloor(floorNum, boxHeight);

                      const slots: Array<{ px: number; pz: number; layer: number; row: number; col: number }> = [];

                      for (let layer = 0; layer < layers; layer++) {
                        for (let r = 0; r < rows; r++) {
                          for (let c = 0; c < cols; c++) {
                            const px = startPx + r * stepX;
                            const pz = startPz + c * stepZ;
                            slots.push({ px, pz, layer, row: r, col: c });
                          }
                        }
                      }

                      // CORRECT bounds: use extreme slot centers ± half box dimension
                      const minCenterX = startPx;
                      const maxCenterX = startPx + (rows - 1) * stepX;
                      const minCenterZ = startPz;
                      const maxCenterZ = startPz + (cols - 1) * stepZ;

                      const minX = minCenterX - boxDepth / 2;
                      const maxX = maxCenterX + boxDepth / 2;
                      const minZ = minCenterZ - boxLat / 2;
                      const maxZ = maxCenterZ + boxLat / 2;

                      // debug log to inspect counts & sizes
                      // eslint-disable-next-line no-console
                      console.log(
                        `[grid] box(${boxDepth.toFixed(3)}x${boxLat.toFixed(3)}) floor(w=${floorWidth.toFixed(3)},l=${floorLength.toFixed(3)}) -> cols=${cols} rows=${rows} totalW=${totalWidth.toFixed(3)} totalL=${totalLength.toFixed(3)} startPx=${startPx.toFixed(3)} startPz=${startPz.toFixed(3)}`
                      );

                      return {
                        slots,
                        cols,
                        rows,
                        layers,
                        totalSlots: slots.length,
                        stepX,
                        stepZ,
                        baseY,
                        startPx,
                        startPz,
                        totalWidth,
                        totalLength,
                        bounds: { minX, maxX, minZ, maxZ },
                      };
                    }

                    // Precompute slot grids per type
                    const slotsByType: Record<string, ReturnType<typeof buildGridSlotsWithLayers>> = {
                      A: buildGridSlotsWithLayers(floorCenterX, floorCenterZ, floorLength, floorWidth, BOX_SIZES.A[0], BOX_SIZES.A[1], BOX_SIZES.A[2], Number(selectedFloor)),
                      B: buildGridSlotsWithLayers(floorCenterX, floorCenterZ, floorLength, floorWidth, BOX_SIZES.B[0], BOX_SIZES.B[1], BOX_SIZES.B[2], Number(selectedFloor)),
                      C: buildGridSlotsWithLayers(floorCenterX, floorCenterZ, floorLength, floorWidth, BOX_SIZES.C[0], BOX_SIZES.C[1], BOX_SIZES.C[2], Number(selectedFloor)),
                      D: buildGridSlotsWithLayers(floorCenterX, floorCenterZ, floorLength, floorWidth, BOX_SIZES.D[0], BOX_SIZES.D[1], BOX_SIZES.D[2], Number(selectedFloor)),
                    };

                    // compute a floor-wide bounds (union of all type bounds) and use it for clamping explicit/fallback positions
                    const slotsBoundsList = Object.values(slotsByType).map((s) => (s as any).bounds).filter(Boolean);
                    const floorBounds = slotsBoundsList.length
                      ? {
                        minX: Math.min(...slotsBoundsList.map((b: any) => b.minX)),
                        maxX: Math.max(...slotsBoundsList.map((b: any) => b.maxX)),
                        minZ: Math.min(...slotsBoundsList.map((b: any) => b.minZ)),
                        maxZ: Math.max(...slotsBoundsList.map((b: any) => b.maxZ)),
                      }
                      : {
                        minX: floorCenterX - floorLength / 2,
                        maxX: floorCenterX + floorLength / 2,
                        minZ: floorCenterZ - floorWidth / 2,
                        maxZ: floorCenterZ + floorWidth / 2,
                      };

                    // debug log
                    // eslint-disable-next-line no-console
                    console.log("[bounds] floorBounds:", floorBounds);

                    // diagnostic totals
                    // eslint-disable-next-line no-console
                    console.log("[diag] grid totals:", {
                      A: slotsByType.A.totalSlots,
                      B: slotsByType.B.totalSlots,
                      C: slotsByType.C.totalSlots,
                      D: slotsByType.D.totalSlots,
                      floorWidth, floorLength,
                    });

                    // Filter containers and prepare assignment
                    const filteredContainers = activeContainers.filter(
                      (c) => !((c.type === "D" || c.type === "d") && Number(selectedFloor) !== 4)
                    );

                    type AssignedRec = { px: number; pz: number; py: number; type: keyof typeof BOX_SIZES; layer: number };
                    const assigned: AssignedRec[] = [];
                    const takenSlotKeys = new Set<string>(); // "row:col:layer" per grid
                    // assign deterministically: prefer explicit positions, else fill grid (layer-major)
                    for (let i = 0; i < filteredContainers.length; i++) {
                      const c = filteredContainers[i];
                      const typeKey = ((c.type as "A" | "B" | "C" | "D") ?? "A") as "A" | "B" | "C" | "D";
                      const spec = BOX_SIZES[typeKey];

                      const hasExplicit =
                        c.positionX !== null &&
                        c.positionY !== null &&
                        c.positionZ !== null &&
                        !Number.isNaN(Number(c.positionX)) &&
                        !Number.isNaN(Number(c.positionZ));

                      if (hasExplicit) {
                        const dataPx = Number(c.positionZ);
                        const dataPz = Number(c.positionX);
                        // rotate explicit DB/local coords into world if rotationY present
                        let explicitWorldX = dataPx;
                        let explicitWorldZ = dataPz;
                        if (rotationY) {
                          [explicitWorldX, explicitWorldZ] = rotateAroundCenter(floorCenterX, floorCenterZ, dataPx, dataPz, rotationY);
                        }

                        // clamp explicit positions into floor-wide bounds
                        const [mx, mz] = clampPlacement(
                          explicitWorldX,
                          explicitWorldZ,
                          spec[0],
                          spec[1],
                          floorLength,
                          floorWidth,
                          floorCenterX,
                          floorCenterZ,
                          floorBounds
                        );
                        const py = Number(c.positionY);
                        assigned.push({ px: mx, pz: mz, py, type: typeKey, layer: 0 });
                        continue;
                      }

                      let chosen: { px: number; pz: number; py: number; layer: number } | null = null;
                      const slotsInfo = slotsByType[typeKey];

                      for (const s of slotsInfo.slots) {
                        const key = `${s.row}:${s.col}:${s.layer}`;
                        if (takenSlotKeys.has(key)) continue;

                        // rotate slot center from model-local grid -> world coords
                        const [slotWorldX, slotWorldZ] = rotateAroundCenter(floorCenterX, floorCenterZ, s.px, s.pz, rotationY);

                        const [clx, clz] = clampPlacement(
                          slotWorldX,
                          slotWorldZ,
                          spec[0],
                          spec[1],
                          floorLength,
                          floorWidth,
                          floorCenterX,
                          floorCenterZ,
                          slotsInfo.bounds
                        );

                        // check overlap with existing assigned on same layer using exact sizes
                        let overlap = false;
                        for (const a of assigned) {
                          if (a.layer !== s.layer) continue;
                          const [ad, al] = BOX_SIZES[a.type];
                          const aMinX = a.px - ad / 2, aMaxX = a.px + ad / 2;
                          const aMinZ = a.pz - al / 2, aMaxZ = a.pz + al / 2;
                          const bMinX = clx - spec[0] / 2, bMaxX = clx + spec[0] / 2;
                          const bMinZ = clz - spec[1] / 2, bMaxZ = clz + spec[1] / 2;
                          const overlapX = aMinX < bMaxX && aMaxX > bMinX;
                          const overlapZ = aMinZ < bMaxZ && aMaxZ > bMinZ;
                          if (overlapX && overlapZ) {
                            overlap = true;
                            break;
                          }
                        }
                        if (!overlap) {
                          const py = FLOOR_BASE_Y_BY_FLOOR[Number(selectedFloor)] ?? slotsInfo.baseY ?? 0;
                          const pyFinal = py + s.layer * spec[2];
                          chosen = { px: clx, pz: clz, py: pyFinal, layer: s.layer };
                          takenSlotKeys.add(key);
                          break;
                        }
                      }

                      // fallback try other type grids (use floorBounds when clamping alt slots)
                      if (!chosen) {
                        const altTypes: Array<keyof typeof BOX_SIZES> = ["A", "B", "C", "D"];
                        outer: for (const at of altTypes) {
                          const altSlots = slotsByType[at];
                          for (const s of altSlots.slots) {
                            const key = `${s.row}:${s.col}:${s.layer}`;
                            if (takenSlotKeys.has(key)) continue;

                            // rotate alt slot as well
                            const [slotWorldX, slotWorldZ] = rotateAroundCenter(floorCenterX, floorCenterZ, s.px, s.pz, rotationY);

                            const [clx, clz] = clampPlacement(
                              slotWorldX,
                              slotWorldZ,
                              spec[0],
                              spec[1],
                              floorLength,
                              floorWidth,
                              floorCenterX,
                              floorCenterZ,
                              floorBounds
                            );

                            let overlap = false;
                            for (const a of assigned) {
                              if (a.layer !== s.layer) continue;
                              const [ad, al] = BOX_SIZES[a.type];
                              const aMinX = a.px - ad / 2, aMaxX = a.px + ad / 2;
                              const aMinZ = a.pz - al / 2, aMaxZ = a.pz + al / 2;
                              const bMinX = clx - spec[0] / 2, bMaxX = clx + spec[0] / 2;
                              const bMinZ = clz - spec[1] / 2, bMaxZ = clz + spec[1] / 2;
                              const overlapX = aMinX < bMaxX && aMaxX > bMinX;
                              const overlapZ = aMinZ < bMaxZ && aMaxZ > bMinZ;
                              if (overlapX && overlapZ) {
                                overlap = true;
                                break;
                              }
                            }
                            if (!overlap) {
                              const py = FLOOR_BASE_Y_BY_FLOOR[Number(selectedFloor)] ?? altSlots.baseY ?? 0;
                              const pyFinal = py + s.layer * spec[2];
                              chosen = { px: clx, pz: clz, py: pyFinal, layer: s.layer };
                              takenSlotKeys.add(key);
                              break outer;
                            }
                          }
                        }
                      }

                      if (!chosen) {
                        const [fx, fy, fz] = computeFallbackPosition(i, filteredContainers.length, floorCenterX, floorCenterZ);
                        // rotate fallback point too
                        const [fallbackWorldX, fallbackWorldZ] = rotationY ? rotateAroundCenter(floorCenterX, floorCenterZ, fx, fz, rotationY) : [fx, fz];
                        // use floorBounds for fallback clamp
                        const [clx3, clz3] = clampPlacement(
                          fallbackWorldX,
                          fallbackWorldZ,
                          spec[0],
                          spec[1],
                          floorLength,
                          floorWidth,
                          floorCenterX,
                          floorCenterZ,
                          floorBounds
                        );
                        const py = FLOOR_BASE_Y_BY_FLOOR[Number(selectedFloor)] ?? 0.28;
                        chosen = { px: clx3, pz: clz3, py, layer: 0 };
                      }

                      assigned.push({ px: chosen.px, pz: chosen.pz, py: chosen.py, type: typeKey, layer: chosen.layer });
                    }

                    // ---------- DEBUG BLOCK (after assigned is populated) ----------
                    type SlotsInfo = ReturnType<typeof buildGridSlotsWithLayers>;
                    const slotsBoundsList2 = Object.values(slotsByType).map((s) => (s as SlotsInfo).bounds).filter(Boolean);
                    const floorBoundsComputed = slotsBoundsList2.length
                      ? {
                        minX: Math.min(...slotsBoundsList2.map((b: any) => b.minX)),
                        maxX: Math.max(...slotsBoundsList2.map((b: any) => b.maxX)),
                        minZ: Math.min(...slotsBoundsList2.map((b: any) => b.minZ)),
                        maxZ: Math.max(...slotsBoundsList2.map((b: any) => b.maxZ)),
                      }
                      : {
                        minX: floorCenterX - floorLength / 2,
                        maxX: floorCenterX + floorLength / 2,
                        minZ: floorCenterZ - floorWidth / 2,
                        maxZ: floorCenterZ + floorWidth / 2,
                      };

                    // eslint-disable-next-line no-console
                    console.log("[DBG] modelCenter:", modelCenter);
                    // eslint-disable-next-line no-console
                    console.log("[DBG] floorCenterX,Z:", floorCenterX, floorCenterZ, "floorBaseY:", floorBaseY);
                    // eslint-disable-next-line no-console
                    console.log("[DBG] floorWidth/Length:", floorWidth, floorLength);
                    // eslint-disable-next-line no-console
                    console.log("[bounds] floorBounds (computed):", floorBoundsComputed);

                    Object.keys(slotsByType).forEach((k) => {
                      const info = (slotsByType as any)[k] as SlotsInfo;
                      // eslint-disable-next-line no-console
                      console.log(
                        `[DBG-grid] type=${k} rows=${info.rows} cols=${info.cols} startPx=${info.startPx?.toFixed(
                          4
                        )} startPz=${info.startPz?.toFixed(4)} totalWidth=${info.totalWidth?.toFixed(3)} totalLength=${info.totalLength?.toFixed(
                          3
                        )} bounds=${JSON.stringify(info.bounds)}`
                      );

                      for (let i = 0; i < Math.min(6, info.slots.length); i++) {
                        const s = info.slots[i];
                        // eslint-disable-next-line no-console
                        console.log(
                          `[DBG-slot] type=${k} idx=${i} px=${s.px.toFixed(4)} pz=${s.pz.toFixed(4)} ΔX=${(s.px - floorCenterX).toFixed(
                            4
                          )} ΔZ=${(s.pz - floorCenterZ).toFixed(4)}`
                        );
                      }
                    });

                    const assignedDebugMeshes: React.ReactNode[] = (assigned as AssignedRec[]).map((a: AssignedRec, i: number) => {
                      const inside =
                        a.px >= (floorBoundsComputed.minX - 1e-8) &&
                        a.px <= (floorBoundsComputed.maxX + 1e-8) &&
                        a.pz >= (floorBoundsComputed.minZ - 1e-8) &&
                        a.pz <= (floorBoundsComputed.maxZ + 1e-8);

                      if (!inside) {
                        // eslint-disable-next-line no-console
                        console.warn(
                          `[assigned-outside] idx=${i} type=${a.type} px=${a.px.toFixed(3)} pz=${a.pz.toFixed(3)} bounds=${JSON.stringify(
                            floorBoundsComputed
                          )}`
                        );
                      }

                      return (
                        <mesh key={`assigned-debug-${i}`} position={[a.px, floorBaseY + 0.02 + (a.layer || 0) * BOX_SIZES[a.type][2], a.pz]}>
                          <sphereGeometry args={[0.03, 8, 8]} />
                          <meshBasicMaterial attach="material" color={inside ? 0x00ff00 : 0xff0000} />
                        </mesh>
                      );
                    });

                    // for rendering below, reuse floorBoundsComputed
                    const floorBoundsForUse = floorBoundsComputed;
                    // ---------- END DEBUG BLOCK ----------

                    // Prepare debug grid visuals
                    const debugGridMeshes: React.ReactNode[] = [];
                    if (RENDER_GRID_DEBUG) {
                      Object.keys(slotsByType).forEach((k) => {
                        const info = (slotsByType as any)[k];
                        info.slots.forEach((s: any, idx: number) => {
                          // rotate slot for display
                          const [dispX, dispZ] = rotateAroundCenter(floorCenterX, floorCenterZ, s.px, s.pz, rotationY);
                          // s.px -> X (forward), s.pz -> Z (lateral)
                          debugGridMeshes.push(
                            <mesh key={`grid-${k}-${idx}`} position={[dispX, floorBaseY + 0.02 + s.layer * BOX_SIZES[k as keyof typeof BOX_SIZES][2], dispZ]}>
                              <sphereGeometry args={[0.01, 6, 6]} />
                              <meshBasicMaterial attach="material" color={k === "A" ? 0x00aa00 : 0x999999} />
                            </mesh>
                          );
                        });

                        // draw bounds wireframe for this type (semi-transparent)
                        const b = info.bounds;
                        if (b) {
                          const boxWidth = b.maxX - b.minX;
                          const boxDepth = b.maxZ - b.minZ;
                          const centerX = (b.minX + b.maxX) / 2;
                          const centerZ = (b.minZ + b.maxZ) / 2;
                          // wireframe plane
                          debugGridMeshes.push(
                            <group key={`bounds-${k}`} position={[centerX, floorBaseY + 0.001, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
                              <mesh>
                                <planeGeometry args={[boxWidth, boxDepth]} />
                                <meshBasicMaterial attach="material" color={0xff0000} wireframe opacity={0.6} />
                              </mesh>
                            </group>
                          );
                        }
                      });
                    }

                    // Render using assigned[]
                    return (
                      <>
                        <group key="floor-boundary">
                          <mesh position={[floorCenterX, floorBaseY + 0.001, floorCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[floorLength, floorWidth]} />
                            <meshBasicMaterial attach="material" color={0xffea00} transparent opacity={0.16} />
                          </mesh>

                          <mesh position={[floorCenterX, floorBaseY + 0.003, floorCenterZ]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[floorLength, floorWidth]} />
                            <meshBasicMaterial attach="material" color={0xff9900} wireframe />
                          </mesh>
                        </group>

                        {RENDER_GRID_DEBUG && debugGridMeshes}
                        {RENDER_GRID_DEBUG && assignedDebugMeshes}

                        {assigned.map((a, idx) => {
                          const typeKey = a.type;
                          const [boxDepth, boxLat, boxH] = BOX_SIZES[typeKey];

                          const finalY = a.py;
                          const key = `assigned-${idx}-${typeKey}`;

                          return (
                            <BoxModel
                              key={key}
                              type={typeKey}
                              url={null}
                              position={[a.px, finalY, a.pz]}
                              scale={1}
                              onClick={() => {
                                // no-op for assigned-only visualization
                              }}
                            />
                          );
                        })}
                      </>
                    );
                  })()}
              </group>
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
              target={
                // prefer floorInfo center for target if available, else fallback to modelCenter or default
                floorInfo && floorInfo.center
                  ? [floorInfo.center.x, floorInfo.center.y, floorInfo.center.z]
                  : modelCenter
                    ? [modelCenter.x, modelCenter.y, modelCenter.z]
                    : [0, 3, 0]
              }
            />
          </Canvas>
        </Box>

        <Box mt={1} display="flex" alignItems="center" justifyContent="center" gap={1}>
          <CircularProgress size={16} />
          <Typography fontSize={13} fontWeight={600}>
            {selectedFloor ? `Selected: Floor ${selectedFloor}` : "Click a floor on the model"}
          </Typography>
        </Box>

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
