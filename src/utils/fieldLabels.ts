import type { TFunction } from "i18next";

const clean = (s?: string | null) =>
  (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/\u00A0/g, " ");

const humanize = (k: string) =>
  k
    .replace(/[_-]/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const FIELD_MAP: Record<string, string> = {
  is_active: "isActive",
  isactive: "isActive",
  product_type_id: "productTypeId",
  producttypeid: "productTypeId",
  product_type_ids: "productTypeIds",
  producttypeids: "productTypeIds",
  order_detail_id: "orderDetailId",
  orderdetailid: "orderDetailId",
  price: "price",
  position_x: "positionX",
  positiony: "positionY",
  position_y: "positionY",
  position_z: "positionZ",
  last_optimized_date: "lastOptimizedDate",
  lastoptimizeddate: "lastOptimizedDate",
  optimization_score: "optimizationScore",
  optimizationscore: "optimizationScore",
  notes: "notes",
  container_above_code: "containerAboveCode",
  containerabovecode: "containerAboveCode",
  status: "status",
};

const toCamel = (s: string) =>
  s.replace(/[_-][a-z]/g, (m) => m[1].toUpperCase()).replace(/^[a-z]/, (m) => m.toLowerCase());

export const i18nKeyForField = (raw: string) => {
  const nk = clean(raw);

  if (FIELD_MAP[nk]) return `containerFields.${FIELD_MAP[nk]}`;

  const camel = toCamel(nk);
  if (camel) return `containerFields.${camel}`;

  return `containerFields.${nk}`;
};

export const translateFieldLabel = (t: TFunction, raw: string) => {
  const nk = clean(raw);
  const candidates = new Set<string>();

  if (FIELD_MAP[nk]) candidates.add(`containerFields.${FIELD_MAP[nk]}`);

  candidates.add(`containerFields.${toCamel(nk)}`);

  candidates.add(`containerFields.${nk}`);

  for (const key of candidates) {
    const looked = t(key, { ns: "storagePage" });
    if (looked !== key) return looked;
  }

  return humanize(raw);
};

export const formatBoolean = (t: TFunction, v: any) => {
  const s = String(v ?? "").toLowerCase();
  if (v === true || s === "true" || s === "1") return t("common.yes");
  if (v === false || s === "false" || s === "0") return t("common.no");
  return v ?? "-";
};
