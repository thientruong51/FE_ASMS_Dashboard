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

const shelfKeyMapRaw: Record<string, string> = {
  shelf_storage: "shelf_storage",
  shelf_logistics: "shelf_logistics",
  pallet_rack: "pallet_rack",
  cantilever: "cantilever",
  mezzanine: "mezzanine",
  "Shelf_Storage": "shelf_storage",
  "Shelf_storage": "shelf_storage",
  "Shelf_logistics": "shelf_logistics",
  "kệ lưu trữ": "shelf_storage",
  "kệ logistics": "shelf_logistics",
  "kệ pallet": "pallet_rack",
};

const shelfMaps = buildNormalizedMap(shelfKeyMapRaw);

export const canonicalShelfKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (shelfMaps.spacedMap[spaced]) return shelfMaps.spacedMap[spaced];
  if (shelfMaps.snakeMap[snake]) return shelfMaps.snakeMap[snake];
  return snake;
};

const groupNoData = (t: TFunction) => {
  const looked = t("shelfTypeNames.noData");
  return looked !== "shelfTypeNames.noData" ? looked : "-";
};


export const translateShelfTypeName = (t: TFunction, raw?: string | null, alt?: string | null) => {
  const key = canonicalShelfKey(raw ?? alt);
  if (!key) return groupNoData(t);

  const looked = t(`shelfTypeNames.${key}`);
  if (looked !== `shelfTypeNames.${key}`) return looked;

  const r = raw?.toString().trim();
  const a = alt?.toString().trim();

  if (r && a && r.toLowerCase() !== a.toLowerCase()) {
    return `${r} — ${a}`;
  }

  if (r) return r;
  if (a) return a;
  return key || groupNoData(t);
};
