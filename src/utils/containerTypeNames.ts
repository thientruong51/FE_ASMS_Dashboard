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


const containerKeyMapRaw: Record<string, string> = {
  a_storage: "a_storage",
  b_storage: "b_storage",
  c_storage: "c_storage",
  d_storage: "d_storage",
  "A_storage": "a_storage",
  "a storage": "a_storage",
  "B_storage": "b_storage",
  "box small": "a_storage",
  "box medium": "b_storage",
  "thùng a": "a_storage",
  "thùng b": "b_storage",
};

const containerMaps = buildNormalizedMap(containerKeyMapRaw);

export const canonicalContainerKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (containerMaps.spacedMap[spaced]) return containerMaps.spacedMap[spaced];
  if (containerMaps.snakeMap[snake]) return containerMaps.snakeMap[snake];
  return snake;
};

const groupNoData = (t: TFunction) => {
  const looked = t("containerTypeNames.noData");
  return looked !== "containerTypeNames.noData" ? looked : "-";
};


export const translateContainerTypeName = (t: TFunction, raw?: string | null) => {
  if (!raw) return groupNoData(t);
  const key = canonicalContainerKey(raw);
  const looked = t(`containerTypeNames.${key}`);
  if (looked !== `containerTypeNames.${key}`) return looked;
  return raw;
};
