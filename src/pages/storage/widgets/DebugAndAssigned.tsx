import React, { useState, useEffect } from "react";
import type { FloorItem } from "@/api/floorApi";
import type { ContainerItem } from "@/api/containerApi";
import BoxModel from "./ShelfView/BoxModel";
import {
  BOX_SIZES,
  FLOOR_BASE_Y_BY_FLOOR,
  buildGridSlotsWithLayers,
  rotateAroundCenter,
  clampPlacement,
  computeFallbackPosition,
} from "./gridUtils";

type Props = {
  floors: FloorItem[];
  floorInfo: any | null;
  modelCenter: any | null;
  selectedFloor: number;
  activeContainers: ContainerItem[];
  setSelectedContainer?: (c: ContainerItem | null) => void;
};

const GRID_TRANSLATES: Record<keyof typeof BOX_SIZES, { x: number; z: number }> = {
  A: { x: -0.28, z: 0.25 },
  B: { x: -0.53, z: 0.375 },
  C: { x: -0.53, z: 0.25 },
  D: { x: -0.3, z: 0.253 },
};

const RENDER_GRID_DEBUG = true;

export default function DebugAndAssigned({
  floors,
  floorInfo,
  modelCenter,
  selectedFloor,
  activeContainers,
  setSelectedContainer,
}: Props) {
  const [highlightKey, setHighlightKey] = useState<string | null>(null);

  const floorObj = floors.find((f) => Number(f.floorNumber) === Number(selectedFloor));

  const floorCenterXBase =
    floorInfo && floorInfo.bounds
      ? (floorInfo.bounds.minX + floorInfo.bounds.maxX) / 2
      : modelCenter
      ? modelCenter.x
      : 0;
  const floorCenterZBase =
    floorInfo && floorInfo.bounds
      ? (floorInfo.bounds.minZ + floorInfo.bounds.maxZ) / 2
      : modelCenter
      ? modelCenter.z
      : 0;

  const floorWidth =
    floorInfo && floorInfo.bounds ? Math.abs(floorInfo.bounds.maxZ - floorInfo.bounds.minZ) : (floorObj && (floorObj as any).width) ?? 1.07;
  const floorLength =
    floorInfo && floorInfo.bounds ? Math.abs(floorInfo.bounds.maxX - floorInfo.bounds.minX) : (floorObj && (floorObj as any).length) ?? 1.7;

  const rotationY = (floorInfo && typeof floorInfo.rotationY === "number") ? floorInfo.rotationY : 0;
  const floorBaseY = FLOOR_BASE_Y_BY_FLOOR[Number(selectedFloor)] ?? 0;

  function centerForType(typeKey: keyof typeof BOX_SIZES) {
    const g = GRID_TRANSLATES[typeKey] ?? { x: 0, z: 0 };
    return { cx: floorCenterXBase + g.x, cz: floorCenterZBase + g.z };
  }

  const slotsByType: Record<string, ReturnType<typeof buildGridSlotsWithLayers>> = {
    A: buildGridSlotsWithLayers(centerForType("A").cx, centerForType("A").cz, floorLength, floorWidth, BOX_SIZES.A[0], BOX_SIZES.A[1], BOX_SIZES.A[2], Number(selectedFloor)),
    B: buildGridSlotsWithLayers(centerForType("B").cx, centerForType("B").cz, floorLength, floorWidth, BOX_SIZES.B[0], BOX_SIZES.B[1], BOX_SIZES.B[2], Number(selectedFloor)),
    C: buildGridSlotsWithLayers(centerForType("C").cx, centerForType("C").cz, floorLength, floorWidth, BOX_SIZES.C[0], BOX_SIZES.C[1], BOX_SIZES.C[2], Number(selectedFloor)),
    D: buildGridSlotsWithLayers(centerForType("D").cx, centerForType("D").cz, floorLength, floorWidth, BOX_SIZES.D[0], BOX_SIZES.D[1], BOX_SIZES.D[2], Number(selectedFloor)),
  };

  const slotsBoundsList = Object.values(slotsByType).map((s) => (s as any).bounds).filter(Boolean);
  const floorBounds = slotsBoundsList.length
    ? {
        minX: Math.min(...slotsBoundsList.map((b: any) => b.minX)),
        maxX: Math.max(...slotsBoundsList.map((b: any) => b.maxX)),
        minZ: Math.min(...slotsBoundsList.map((b: any) => b.minZ)),
        maxZ: Math.max(...slotsBoundsList.map((b: any) => b.maxZ)),
      }
    : {
        minX: floorCenterXBase - floorLength / 2,
        maxX: floorCenterXBase + floorLength / 2,
        minZ: floorCenterZBase - floorWidth / 2,
        maxZ: floorCenterZBase + floorWidth / 2,
      };

  const filteredContainers = activeContainers.filter(
    (c) => !((c.type === "D" || c.type === "d") && Number(selectedFloor) !== 4)
  );

  type AssignedRec = { px: number; pz: number; py: number; type: keyof typeof BOX_SIZES; layer: number; container?: ContainerItem };
  const assigned: AssignedRec[] = [];
  const takenSlotKeys = new Set<string>();

  for (let i = 0; i < filteredContainers.length; i++) {
    const c = filteredContainers[i];
    const typeKey = ((c.type as "A" | "B" | "C" | "D") ?? "A") as keyof typeof BOX_SIZES;
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
      let explicitWorldX = dataPx;
      let explicitWorldZ = dataPz;

      const { cx: tCx, cz: tCz } = centerForType(typeKey);

      if (rotationY) {
        [explicitWorldX, explicitWorldZ] = rotateAroundCenter(tCx, tCz, dataPx, dataPz, rotationY);
      }

      const [mx, mz] = clampPlacement(
        explicitWorldX,
        explicitWorldZ,
        spec[0],
        spec[1],
        floorLength,
        floorWidth,
        tCx,
        tCz,
        floorBounds
      );
      const py = Number(c.positionY);
      assigned.push({ px: mx, pz: mz, py, type: typeKey, layer: 0, container: c });
      continue;
    }

    let chosen: { px: number; pz: number; py: number; layer: number } | null = null;
    const slotsInfo = slotsByType[typeKey];

    for (const s of slotsInfo.slots) {
      const key = `${s.row}:${s.col}:${s.layer}`;
      if (takenSlotKeys.has(key)) continue;

      const { cx: typeCx, cz: typeCz } = centerForType(typeKey);
      const [slotWorldX, slotWorldZ] = rotateAroundCenter(typeCx, typeCz, s.px, s.pz, rotationY);

      const [clx, clz] = clampPlacement(
        slotWorldX,
        slotWorldZ,
        spec[0],
        spec[1],
        floorLength,
        floorWidth,
        typeCx,
        typeCz,
        slotsInfo.bounds
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
        const py = FLOOR_BASE_Y_BY_FLOOR[Number(selectedFloor)] ?? slotsInfo.baseY ?? 0;
        const pyFinal = py + s.layer * spec[2];
        chosen = { px: clx, pz: clz, py: pyFinal, layer: s.layer };
        takenSlotKeys.add(key);
        break;
      }
    }

    if (!chosen) {
      const altTypes: Array<keyof typeof BOX_SIZES> = ["A", "B", "C", "D"];
      outer: for (const at of altTypes) {
        const altSlots = slotsByType[at];
        for (const s of altSlots.slots) {
          const key = `${s.row}:${s.col}:${s.layer}`;
          if (takenSlotKeys.has(key)) continue;

          const { cx: altCx, cz: altCz } = centerForType(at);
          const [slotWorldX, slotWorldZ] = rotateAroundCenter(altCx, altCz, s.px, s.pz, rotationY);

          const [clx, clz] = clampPlacement(
            slotWorldX,
            slotWorldZ,
            spec[0],
            spec[1],
            floorLength,
            floorWidth,
            altCx,
            altCz,
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
      const [fx, _fy, fz] = computeFallbackPosition(i, filteredContainers.length, floorCenterXBase, floorCenterZBase);
      const [fallbackWorldX, fallbackWorldZ] = rotationY ? rotateAroundCenter(floorCenterXBase, floorCenterZBase, fx, fz, rotationY) : [fx, fz];
      const [clx3, clz3] = clampPlacement(
        fallbackWorldX,
        fallbackWorldZ,
        spec[0],
        spec[1],
        floorLength,
        floorWidth,
        floorCenterXBase,
        floorCenterZBase,
        floorBounds
      );
      const py = FLOOR_BASE_Y_BY_FLOOR[Number(selectedFloor)] ?? 0.28;
      chosen = { px: clx3, pz: clz3, py, layer: 0 };
    }

    assigned.push({ px: chosen.px, pz: chosen.pz, py: chosen.py, type: typeKey, layer: chosen.layer, container: c });
  }

  const debugGridMeshes: React.ReactNode[] = [];
  if (RENDER_GRID_DEBUG) {
    Object.keys(slotsByType).forEach((k) => {
      const info = (slotsByType as any)[k];
      info.slots.forEach((s: any, idx: number) => {
        const { cx: dispCx, cz: dispCz } = centerForType(k as keyof typeof BOX_SIZES);
        const [dispX, dispZ] = rotateAroundCenter(dispCx, dispCz, s.px, s.pz, rotationY);
        debugGridMeshes.push(
          <mesh key={`grid-${k}-${idx}`} position={[dispX, floorBaseY + 0.02 + s.layer * BOX_SIZES[k as keyof typeof BOX_SIZES][2], dispZ]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshBasicMaterial attach="material" color={k === "A" ? 0x00aa00 : 0x999999} />
          </mesh>
        );
      });
    });
  }

  const assignedDebugMeshes: React.ReactNode[] = assigned.map((a, i) => {
    const inside =
      a.px >= (floorBounds.minX - 1e-8) &&
      a.px <= (floorBounds.maxX + 1e-8) &&
      a.pz >= (floorBounds.minZ - 1e-8) &&
      a.pz <= (floorBounds.maxZ + 1e-8);

    return (
      <mesh key={`assigned-debug-${i}`} position={[a.px, floorBaseY + 0.02 + (a.layer || 0) * BOX_SIZES[a.type][2], a.pz]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial attach="material" color={inside ? 0x00ff00 : 0xff0000} />
      </mesh>
    );
  });

  useEffect(() => {
    if (!highlightKey) return;
    const t = setTimeout(() => setHighlightKey(null), 4000); 
    return () => clearTimeout(t);
  }, [highlightKey]);

  return (
    <>
      <group key="floor-boundary">
        <mesh position={[floorCenterXBase, floorBaseY + 0.001, floorCenterZBase]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[floorLength, floorWidth]} />
          <meshBasicMaterial attach="material" color={0xffea00} transparent opacity={0.16} />
        </mesh>

        <mesh position={[floorCenterXBase, floorBaseY + 0.003, floorCenterZBase]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[floorLength, floorWidth]} />
          <meshBasicMaterial attach="material" color={0xff9900} wireframe />
        </mesh>
      </group>

      {RENDER_GRID_DEBUG && debugGridMeshes}
      {RENDER_GRID_DEBUG && assignedDebugMeshes}

      {assigned.map((a, idx) => {
        const typeKey = a.type;
        const [_boxDepth, _boxLat, _boxH] = BOX_SIZES[typeKey];
        const finalY = a.py;
        const key = `assigned-${idx}-${typeKey}`;

        const containerCodeLike = a.container?.containerCode ?? `${idx}`;

        const handleOpen = (e?: any) => {
          try {
            e?.stopPropagation?.();
          } catch {}

          if (setSelectedContainer) {
            setSelectedContainer(a.container ? { ...(a.container as ContainerItem) } : null);
          }

          setHighlightKey(containerCodeLike);
        };

        const isHighlighted = highlightKey === containerCodeLike;

        return (
          <group key={key}>
            {isHighlighted && (
              <pointLight position={[a.px, finalY + 0.25, a.pz]} intensity={2.9} distance={2.9} decay={2} />
            )}

            <BoxModel
              key={`boxmodel-${key}`}
              type={typeKey}
              url={a.container?.imageUrl || null}
              position={[a.px, finalY, a.pz]}
              scale={1}
              onPointerDown={(e: any) => {
                e.stopPropagation();
                handleOpen(e);
              }}
              onClick={(e: any) => {
                e.stopPropagation();
                handleOpen(e);
              }}
            />
          </group>
        );
      })}
    </>
  );
}
