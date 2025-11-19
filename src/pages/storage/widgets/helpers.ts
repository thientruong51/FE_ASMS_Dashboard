// src/pages/storage/widgets/helpers.ts
import type { ContainerItem } from "@/api/containerApi";
import type { FloorItem } from "@/api/floorApi";

export function groupContainersByFloor(containers: ContainerItem[], floors?: FloorItem[]) {
  const map: Record<string, ContainerItem[]> = {};

  // lookup floorCode -> floorNumber
  const floorCodeToNumber: Record<string, number> = {};
  (floors ?? []).forEach((f) => {
    const fc = (f as any).floorCode;
    if (fc && typeof f.floorNumber !== "undefined") {
      floorCodeToNumber[fc] = f.floorNumber;
    }
  });

  for (const c of containers) {
    const fc: string | undefined = (c as any).floorCode ?? undefined;
    const num: number | undefined = (c as any).floorNumber ?? undefined;

    // tạo nhiều key để lookup an toàn
    const keys = new Set<string>();
    if (fc) keys.add(fc);               // full floorCode, ví dụ "BLD001-STR001-SH001-F1"
    if (typeof num !== "undefined") {
      keys.add(String(num));           // "1"
      keys.add(`F${num}`);             // "F1"
    }

    // nếu chưa có key nào, thử parse từ floorCode (đuôi -F#)
    if (!keys.size && fc) {
      const m = fc.match(/-F(\d+)$/i);
      if (m) {
        keys.add(`F${m[1]}`);
        keys.add(String(Number(m[1])));
      } else {
        keys.add("unknown");
      }
    }

    for (const k of keys) {
      if (!map[k]) map[k] = [];
      map[k].push(c);
    }
  }

  return map;
}
