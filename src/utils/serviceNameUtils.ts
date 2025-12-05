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


const serviceKeyMapRaw: Record<string, string> = {
  "from shipping to warehouse": "from_shipping_to_warehouse",
  "gửi hàng đến kho": "from_shipping_to_warehouse",

  "protecting": "protecting",
  "bảo hiểm hàng hóa": "protecting",

  "product packaging": "product_packaging",
  "đóng gói": "product_packaging",
  "đóng gói sản phẩm": "product_packaging",

  "delivery": "delivery",
  "giao hàng": "delivery",

  "basic": "basic",
  "gói basic": "basic",

  "basic ac": "basic_ac",
  "gói basic ac": "basic_ac",

  "business": "business",
  "gói business": "business",

  "business ac": "business_ac",
  "gói business ac": "business_ac",

  "premium": "premium",
  "gói premium": "premium",

  "premium ac": "premium_ac",
  "gói premium ac": "premium_ac"
};

const serviceMaps = buildNormalizedMap(serviceKeyMapRaw);


export const canonicalServiceKey = (raw?: string | null) => {
  if (!raw) return "";

  const spaced = normalize(raw);
  const snake = toSnake(raw);

  if (serviceMaps.spacedMap[spaced]) return serviceMaps.spacedMap[spaced];
  if (serviceMaps.snakeMap[snake]) return serviceMaps.snakeMap[snake];

  return snake || "";
};


export const translateServiceName = (
  t: TFunction,
  raw?: string | null,
  alt?: string | null
) => {
  const key = canonicalServiceKey(raw ?? alt);

  if (key) {
    const translated = t(`serviceNames.${key}`);
    if (translated !== `serviceNames.${key}`) {
      return translated; 
    }
  }

  const r = (raw ?? "").trim();
  const a = (alt ?? "").trim();

  if (r && a && r !== a) return `${r} — ${a}`;

  return r || a || key || "-";
};
