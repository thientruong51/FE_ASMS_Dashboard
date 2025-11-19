// src/pages/storage/widgets/useBoxLayoutReal.ts
import { getFloors, type FloorItem } from "@/api/floorApi";
import { getContainers, type ContainerItem } from "@/api/containerApi";

/**
 * BoxData - shape used by 3D renderer (BoxModel)
 * Keep status as string to match backend.
 */
export type BoxData = {
  id: string;
  containerCode?: string;
  type?: string;
  floor: number;
  position: [number, number, number];
  status?: string;
  productName?: string;
  quantity?: number;
  modelUrl?: string | undefined;
};

/** FloorBoxMap: floorNumber -> BoxData[] */
export type FloorBoxMap = Record<number, BoxData[]>;

/** parse floor number from floorCode like "...-F1" */
function parseFloorFromFloorCode(floorCode?: string): number {
  if (!floorCode) return 1;
  const m = floorCode.match(/-F0*([0-9]+)$/i);
  if (m && m[1]) return Number(m[1]);
  // fallback: take last numeric group
  const parts = floorCode.split("-");
  const last = parts[parts.length - 1] || "";
  const digits = last.replace(/\D/g, "");
  return digits ? Number(digits) : 1;
}

/**
 * computeBoxPositionForIndex
 * - basic deterministic layout using shelf dimensions
 * - prefers container.positionX/Y/Z if backend provides them
 */
function computeBoxPositionForIndex(floor: number, index: number, container?: ContainerItem): [number, number, number] {
  const SHELF_LENGTH = 1.7; // along Z
  const SHELF_DEPTH = 1.07; // along X
  const FLOOR_HEIGHTS: Record<number, number> = {
    1: 0.5,
    2: 1.6,
    3: 2.8,
    4: 4.2,
  };

  const xCenter = 0;
  const y = FLOOR_HEIGHTS[floor] ?? (0.5 + (floor - 1) * 1.2);

  const approxBoxLength = 0.45;
  const gap = 0.02;
  const startZ = -SHELF_LENGTH / 2 + approxBoxLength / 2 + gap;
  const zCalc = startZ + index * (approxBoxLength + gap);

  const x = container?.positionX != null ? container.positionX : xCenter;
  const py = container?.positionY != null ? container.positionY : y;
  const pz = container?.positionZ != null ? container.positionZ : zCalc;

  return [x as number, py as number, pz as number];
}

/**
 * getAllFloorsReal
 * - calls Floor API to get floor list for a shelf
 * - then for each floor fetch containers and map to BoxData
 */
export async function getAllFloorsReal(shelf: any): Promise<FloorBoxMap> {
  if (!shelf || !shelf.shelfCode) {
    console.warn("getAllFloorsReal: invalid shelf", shelf);
    return {};
  }

  try {
    // 1) load floors for shelf
    const floorsResp = await getFloors({ shelfCode: shelf.shelfCode, pageNumber: 1, pageSize: 100 });
    const floors: FloorItem[] = Array.isArray((floorsResp as any).data) ? (floorsResp as any).data : [];

    const result: FloorBoxMap = {};

    // 2) for each floor, fetch containers (may be zero)
    // Do this sequentially to avoid hammering backend; change to parallel if desired
    for (const f of floors) {
      const floorNum = Number(f.floorNumber ?? parseFloorFromFloorCode(f.floorCode));
      if (!result[floorNum]) result[floorNum] = [];

      try {
        const contResp = await getContainers({ floorCode: f.floorCode, pageNumber: 1, pageSize: 1000 });
        const list: ContainerItem[] = Array.isArray((contResp as any).data) ? (contResp as any).data : [];

        list.forEach((c, idx) => {
          const indexInFloor = result[floorNum].length;
          const pos = computeBoxPositionForIndex(floorNum, indexInFloor, c);

          const box: BoxData = {
            id: c.containerCode ?? `container-${Math.random().toString(36).slice(2, 9)}`,
            containerCode: c.containerCode,
            type: c.type,
            floor: floorNum,
            position: pos,
            status: c.status ?? "unknown",
            productName: (c as any).productName ?? undefined,
            quantity: (c as any).quantity ?? undefined,
            modelUrl: c.imageUrl ?? undefined,
          };

          result[floorNum].push(box);
        });
      } catch (err) {
        // still create empty floor entry
        console.error("getContainers error for floor", f.floorCode, err);
      }
    }

    return result;
  } catch (err) {
    console.error("getAllFloorsReal overall error", err);
    return {};
  }
}
