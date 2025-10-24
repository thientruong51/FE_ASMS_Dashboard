import type { BoxData } from "./types";

// 🧱 Loại thùng
type BoxType = "A" | "B" | "C" | "D";

// 📦 Kích thước (D × R × C, mét) — D: chiều dài (Z), R: chiều sâu (X), C: chiều cao (Y)
const BOX_SIZES: Record<BoxType, [number, number, number]> = {
  A: [0.5, 0.5, 0.45],
  B: [0.75, 0.75, 0.45],
  C: [1.0, 0.5, 0.45],
  D: [0.6, 0.6, 0.8],
};

// 🧱 Kích thước tổng thể của kệ (m)
const SHELF_BOUNDS = {
  length: 1.7, // theo trục Z (dài)
  depth: 1.07, // theo trục X (sâu)
  height: 6.2, // theo trục Y (cao)
};

// 🧭 Chiều cao đáy từng tầng (tổng cao 6.2 m)
const FLOOR_BASE = [-0.1, 1.19, 2.47, 3.57];

// ⚙️ Cấu hình từng tầng
const FLOOR_CONFIG = {
  1: { usableTypes: ["A", "B", "C"] as BoxType[], stack: 2 },
  2: { usableTypes: ["A", "B", "C"] as BoxType[], stack: 2 },
  3: { usableTypes: ["A", "B", "C"] as BoxType[], stack: 2 },
  4: { usableTypes: ["D"] as BoxType[], stack: 2 }, // tầng 4 chỉ chứa D
};

// ⚙️ Offset tinh chỉnh vị trí hộp trong lòng kệ (m)
const OFFSET_Y = -0.15; // hạ nhẹ xuống mặt sàn
const OFFSET_Z = -0.6; // đẩy vào trong lòng kệ

/**
 * 🧮 Tính toán bố cục thùng cho 1 tầng
 */
export function computeBoxesForFloor(floor: number): BoxData[] {
  const config = FLOOR_CONFIG[floor as 1 | 2 | 3 | 4];
  const floorBase = FLOOR_BASE[floor - 1];
  const usable = config.usableTypes;
  const boxes: BoxData[] = [];
  const gap = 0.001;

  // ✅ Giới hạn theo chiều dài (Z direction)
  const halfLength = SHELF_BOUNDS.length / 2;
  const maxZ = halfLength - gap;
  const minZ = -halfLength + gap;

  const xCenter = 0; // giữa chiều sâu (X)

  // ✅ Ưu tiên loại to hơn trước
  const sortedTypes = [...usable].sort(
    (a, b) => BOX_SIZES[b][0] - BOX_SIZES[a][0]
  );

  let zCursor = minZ;

  while (zCursor < maxZ) {
    const type =
      sortedTypes[Math.floor(Math.random() * sortedTypes.length)];
    const [length, , height] = BOX_SIZES[type]; // D × R × C

    if (zCursor + length / 2 > maxZ) break;

    // ✅ xếp chồng theo chiều cao (Y)
    for (let layer = 0; layer < config.stack; layer++) {
      const y = floorBase + height / 2 + layer * (height + 0.02); // layer 2 lớp

      boxes.push({
        id: `F${floor}-${type}-${zCursor.toFixed(2)}-${layer}`,
        type,
        floor,
        // ⚙️ vị trí cuối cùng
        position: [xCenter , y - OFFSET_Y, zCursor + length / 2 + OFFSET_Z],
        status: Math.random() > 0.8 ? "shipping" : "stored",
        productName: ["Laptop", "Phone", "TV", "Printer", "Camera"][
          Math.floor(Math.random() * 5)
        ],
        quantity: Math.floor(Math.random() * 40) + 10,
      });
    }

    // sang vị trí kế tiếp
    zCursor += length + gap;
  }

  return boxes;
}

/**
 * ✅ Mock dữ liệu tĩnh (static)
 */
const STATIC_DATA: Record<number, BoxData[]> = {
  1: computeBoxesForFloor(1),
  2: computeBoxesForFloor(2),
  3: computeBoxesForFloor(3),
  4: computeBoxesForFloor(4),
};

/**
 * ✅ Hàm chính — sinh dữ liệu mock
 * @param mode "static" hoặc "random"
 */
export function getAllFloorsMock(
  mode: "static" | "random" = "static"
): Record<number, BoxData[]> {
  if (mode === "random") {
    return {
      1: computeBoxesForFloor(1),
      2: computeBoxesForFloor(2),
      3: computeBoxesForFloor(3),
      4: computeBoxesForFloor(4),
    };
  }
  return STATIC_DATA;
}
