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


const buildingKeyMapRaw: Record<string, string> = {
  self_storage: "self_storage",
  self_storage_ac: "self_storage_ac",
  warehouse: "warehouse",
  warehouse_ac: "warehouse_ac",
  warehouse_expired: "warehouse_expired",
  warehouse_oversize: "warehouse_oversize",
  "self-storage": "self_storage",
  "self storage": "self_storage",
  "self-storage with ac": "self_storage_ac",
  "warehouse with ac": "warehouse_ac",
  "warehouse expired": "warehouse_expired",
  "warehouse oversized": "warehouse_oversize",
  "kho": "warehouse",
  "kho có điều hòa": "warehouse_ac",
};

const buildingMaps = buildNormalizedMap(buildingKeyMapRaw);

export const canonicalBuildingKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (buildingMaps.spacedMap[spaced]) return buildingMaps.spacedMap[spaced];
  if (buildingMaps.snakeMap[snake]) return buildingMaps.snakeMap[snake];
  return snake;
};

const groupNoData = (t: TFunction) => {
  const looked = t("buildingNames.noData");
  return looked !== "buildingNames.noData" ? looked : "-";
};


export const translateBuildingName = (t: TFunction, raw?: string | null, alt?: string | null) => {
  const key = canonicalBuildingKey(raw ?? alt);
  if (!key) return groupNoData(t);

  const looked = t(`buildingNames.${key}`);
  if (looked !== `buildingNames.${key}`) return looked;

  const r = raw?.toString().trim();
  const a = alt?.toString().trim();

  if (r && a && r.toLowerCase() !== a.toLowerCase()) {
    return `${r} — ${a}`;
  }
  if (r) return r;
  if (a) return a;
  return key || groupNoData(t);
};
