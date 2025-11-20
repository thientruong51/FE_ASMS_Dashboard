import type { ContainerItem } from "@/api/containerApi";
import type { FloorItem } from "@/api/floorApi";

export function groupContainersByFloor(containers: ContainerItem[], floors?: FloorItem[]) {
  const map: Record<string, ContainerItem[]> = {};

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

    const keys = new Set<string>();
    if (fc) keys.add(fc);               
    if (typeof num !== "undefined") {
      keys.add(String(num));          
      keys.add(`F${num}`);            
    }

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
