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

const roleKeyMapRaw: Record<string, string> = {
  manager: "manager",
  "warehouse staff": "warehouse_staff",
  "delivery staff": "delivery_staff",
  admin: "admin",
  "warehouse": "warehouse_staff",
  "nhân viên kho": "warehouse_staff",
  "giao hàng": "delivery_staff",
  "quản lý": "manager",
};

const roleMaps = buildNormalizedMap(roleKeyMapRaw);

export const canonicalRoleKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (roleMaps.spacedMap[spaced]) return roleMaps.spacedMap[spaced];
  if (roleMaps.snakeMap[snake]) return roleMaps.snakeMap[snake];
  return snake;
};

const groupNoData = (t: TFunction, groupKey: string) => {
  const looked = t(`${groupKey}.noData`);
  return looked !== `${groupKey}.noData` ? looked : "-";
};


export const translateRoleName = (t: TFunction, raw?: string | null, alt?: string | null) => {
  const key = canonicalRoleKey(raw ?? alt);
  const noData = groupNoData(t, "roleNames");
  if (!key) return noData;
  const looked = t(`roleNames.${key}`);
  if (looked !== `roleNames.${key}`) return looked;
  return raw ?? alt ?? key ?? noData;
};
