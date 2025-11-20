export const BOX_SIZES: Record<"A" | "B" | "C" | "D", [number, number, number]> = {
  A: [0.5, 0.5, 0.45],
  B: [0.75, 0.75, 0.45],
  C: [1.0, 0.5, 0.45],
  D: [0.5, 0.5, 0.8],
};

export const DEFAULT_FLOOR_DIM = { width: 1.07, length: 1.7 };

export function getFloorDimensions(floorObj: any) {
  if (!floorObj) return DEFAULT_FLOOR_DIM;
  const width = typeof floorObj.width === "number" ? floorObj.width : DEFAULT_FLOOR_DIM.width;
  const length = typeof floorObj.length === "number" ? floorObj.length : DEFAULT_FLOOR_DIM.length;
  return { width, length };
}

export const FLOOR_BASE_Y_BY_FLOOR: Record<number, number> = {
  1: 0.28,
  2: 1.57,
  3: 2.86,
  4: 4.15,
};

export const TYPE_POSITION_OFFSETS: Record<"A" | "B" | "C" | "D", [number, number]> = {
  A: [0.19, 0],
  B: [0, 0],
  C: [0, 0],
  D: [0, 0],
};

export const SEQUENTIAL_SPACING = 0.01;

export function rotateAroundCenter(cx: number, cz: number, x: number, z: number, angle: number) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const tx = x - cx;
  const tz = z - cz;
  const rx = tx * cos - tz * sin;
  const rz = tx * sin + tz * cos;
  return [rx + cx, rz + cz];
}

export function clampPlacement(
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
  if (bounds) {
    const halfDx = boxDepth / 2;
    const halfDz = boxLateral / 2;
    const nx = Math.min(Math.max(px, bounds.minX + halfDx), bounds.maxX - halfDx);
    const nz = Math.min(Math.max(pz, bounds.minZ + halfDz), bounds.maxZ - halfDz);
    return [nx, nz];
  }

  const halfForward = floorLength / 2 - boxDepth / 2;
  const halfLateral = floorWidth / 2 - boxLateral / 2;

  const nx = Math.max(Math.min(px - floorCenterX, halfForward), -halfForward) + floorCenterX;
  const nz = Math.max(Math.min(pz - floorCenterZ, halfLateral), -halfLateral) + floorCenterZ;
  return [nx, nz];
}

export const FIXED_ITEMS_PER_ROW: number | null = null;
export const computeFallbackPosition = (
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

export function computeLayersForFloor(floorNum: number, boxHeight: number) {
  const baseY = FLOOR_BASE_Y_BY_FLOOR[floorNum] ?? 0;
  const nextBaseY = FLOOR_BASE_Y_BY_FLOOR[floorNum + 1] ?? (baseY + 1.2);
  const verticalSpace = Math.max(0, nextBaseY - baseY);
  const layers = Math.max(1, Math.floor(verticalSpace / boxHeight));
  return { layers, baseY, nextBaseY, verticalSpace };
}

export function buildGridSlotsWithLayers(
  floorCenterX: number,
  floorCenterZ: number,
  floorLength: number,
  floorWidth: number,
  boxDepth: number, 
  boxLat: number, 
  boxHeight: number,
  floorNum: number,
  spacing = SEQUENTIAL_SPACING
) {
  const rawCols = (floorWidth + spacing) / (boxLat + spacing);
  const rawRows = (floorLength + spacing) / (boxDepth + spacing);

  let cols = Math.max(1, Math.floor(rawCols + 1e-9));
  let rows = Math.max(1, Math.floor(rawRows + 1e-9));

  const stepZ = boxLat + spacing;
  const stepX = boxDepth + spacing;

  const totalWidthIfExtraCol = cols * stepZ + boxLat;
  if (totalWidthIfExtraCol <= floorWidth + 1e-6) {
    cols = cols + 1;
  } else {
    const totalLengthIfExtraRow = rows * stepX + boxDepth;
    if (totalLengthIfExtraRow <= floorLength + 1e-6) {
      rows = rows + 1;
    }
  }

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

  const minCenterX = startPx;
  const maxCenterX = startPx + (rows - 1) * stepX;
  const minCenterZ = startPz;
  const maxCenterZ = startPz + (cols - 1) * stepZ;

  const minX = minCenterX - boxDepth / 2;
  const maxX = maxCenterX + boxDepth / 2;
  const minZ = minCenterZ - boxLat / 2;
  const maxZ = maxCenterZ + boxLat / 2;

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

export function computeTheoreticalSlots(boxKey: keyof typeof BOX_SIZES, floorWidth: number, floorLength: number, spacing = SEQUENTIAL_SPACING) {
  const [boxDepth, boxLat] = BOX_SIZES[boxKey];
  const cols = Math.max(1, Math.floor((floorWidth + spacing) / (boxLat + spacing)));
  const rows = Math.max(1, Math.floor((floorLength + spacing) / (boxDepth + spacing)));
  return { cols, rows, total: cols * rows };
}
