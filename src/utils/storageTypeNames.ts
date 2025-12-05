import { type TFunction } from "i18next";

const cleanWhitespace = (s?: string | null) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ");

const toSnake = (s?: string | null) => cleanWhitespace(s).replace(/\s+/g, "_");
const normalize = (s?: string | null) => cleanWhitespace(s);

const buildNormalizedMap = (raw: Record<string, string>) => {
  const spacedMap: Record<string, string> = {};
  const snakeMap: Record<string, string> = {};
  for (const k of Object.keys(raw)) {
    const spaced = cleanWhitespace(k);
    const snake = spaced.replace(/\s+/g, "_");
    spacedMap[spaced] = raw[k];
    snakeMap[snake] = raw[k];
  }
  return { spacedMap, snakeMap };
};


const storageKeyMapRaw: Record<string, string> = {
  small: "small",
  medium: "medium",
  large: "large",
  smallac: "small_ac",
  mediumac: "medium_ac",
  largeac: "large_ac",
  warehouse: "warehouse",
  warehouseac: "warehouse_ac",
  warehouseexpired: "warehouse_expired",
  warehouseoversize: "warehouse_oversize",
  "nhỏ": "small",
  "vừa": "medium",
  "lớn": "large",
  "phòng có điều hòa": "small_ac", 
  "phòng không có điều hòa": "small",
};

const storageMaps = buildNormalizedMap(storageKeyMapRaw);

export const canonicalStorageKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (storageMaps.spacedMap[spaced]) return storageMaps.spacedMap[spaced];
  if (storageMaps.snakeMap[snake]) return storageMaps.snakeMap[snake];
  return snake; 
};

const noData = (t: TFunction) => {
  const looked = t("storageTypeNames.noData");
  return looked !== "storageTypeNames.noData" ? looked : "-";
};


export const translateStorageTypeName = (t: TFunction, raw?: string | null, alt?: string | null) => {
  const key = canonicalStorageKey(raw ?? alt);
  if (!key) return noData(t);

  const looked = t(`storageTypeNames.${key}`);
  if (looked !== `storageTypeNames.${key}`) return looked;


  if (raw && alt) {
    const r = raw?.toString().trim();
    const a = alt?.toString().trim();
    if (r && a && r.toLowerCase() !== a.toLowerCase()) return `${r} — ${a}`;
  }

  if (raw) return raw;
  if (alt) return alt;
  return key || noData(t);
};
