import { type TFunction } from "i18next";

/* ---------- Normalization ---------- */
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

/* ---------- Raw key maps (canonical target keys) ---------- */
const statusKeyMapRaw: Record<string, string> = {
  "processing order": "processing",
  "order retrieved": "retrieved",
  "order created": "pending",
  pending: "pending",
  processing: "processing",
  retrieved: "retrieved",
  "wait pick up": "wait_pick_up",
  verify: "verify",
  checkout: "checkout",
  "pick up": "pick_up",
  renting: "renting",
  stored: "stored",
  overdue: "overdue",
  "store in expired storage": "store_in_expired_storage",
};

const paymentStatusKeyMapRaw: Record<string, string> = {
  paid: "paid",
  unpaid: "unpaid",
  pending: "pending",
  refunded: "refunded",
};

const serviceKeyMapRaw: Record<string, string> = {
  protecting: "protecting",
  "product packaging": "product_packaging",
  product_packaging: "product_packaging",
  delivery: "delivery",
};

const productTypeKeyMapRaw: Record<string, string> = {
  fragile: "fragile",
  "hàng dễ vỡ": "fragile",
  electronics: "electronics",
  "điện tử": "electronics",
  cold_storage: "cold_storage",
  "cần kho lạnh": "cold_storage",
  heavy: "heavy",
  "hàng nặng": "heavy",
};

/* ---------- Prebuilt maps ---------- */
const statusMaps = buildNormalizedMap(statusKeyMapRaw);
const paymentMaps = buildNormalizedMap(paymentStatusKeyMapRaw);
const serviceMaps = buildNormalizedMap(serviceKeyMapRaw);
const productTypeMaps = buildNormalizedMap(productTypeKeyMapRaw);

/* ---------- Canonical functions ---------- */
export const canonicalStatusKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (statusMaps.spacedMap[spaced]) return statusMaps.spacedMap[spaced];
  if (statusMaps.snakeMap[snake]) return statusMaps.snakeMap[snake];
  return snake;
};

export const canonicalPaymentStatusKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (paymentMaps.spacedMap[spaced]) return paymentMaps.spacedMap[spaced];
  if (paymentMaps.snakeMap[snake]) return paymentMaps.snakeMap[snake];
  return snake;
};

export const canonicalServiceKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (serviceMaps.spacedMap[spaced]) return serviceMaps.spacedMap[spaced];
  if (serviceMaps.snakeMap[snake]) return serviceMaps.snakeMap[snake];
  return snake;
};

export const canonicalProductTypeKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (productTypeMaps.spacedMap[spaced]) return productTypeMaps.spacedMap[spaced];
  if (productTypeMaps.snakeMap[snake]) return productTypeMaps.snakeMap[snake];
  return snake;
};

/* ---------- Translate functions (use group-specific noData fallback) ---------- */
const groupNoData = (t: TFunction, groupKey: string) => {
  const looked = t(`${groupKey}.noData`);
  return looked !== `${groupKey}.noData` ? looked : "-";
};

export const translateStatus = (t: TFunction, s?: string | null) => {
  const key = canonicalStatusKey(s);
  const noData = groupNoData(t, "statusNames");
  if (!key) return noData;
  const looked = t(`statusNames.${key}`);
  return looked !== `statusNames.${key}` ? looked : (s ?? noData);
};

export const translatePaymentStatus = (t: TFunction, s?: string | null) => {
  const key = canonicalPaymentStatusKey(s);
  const noData = groupNoData(t, "paymentStatus");
  if (!key) return noData;
  const looked = t(`paymentStatus.${key}`);
  return looked !== `paymentStatus.${key}` ? looked : (s ?? noData);
};

export const translateServiceName = (t: TFunction, s?: string | null) => {
  const key = canonicalServiceKey(s);
  const noData = groupNoData(t, "serviceNames");
  if (!key) return noData;
  const looked = t(`serviceNames.${key}`);
  return looked !== `serviceNames.${key}` ? looked : (s ?? noData);
};

export const translateProductType = (t: TFunction, s?: string | null) => {
  const key = canonicalProductTypeKey(s);
  const noData = groupNoData(t, "productTypeNames");
  if (!key) return noData;
  const looked = t(`productTypeNames.${key}`);
  return looked !== `productTypeNames.${key}` ? looked : (s ?? noData);
};
/* ------------ ACTION TYPE ------------ */
const actionTypeKeyMapRaw: Record<string, string> = {
  "Order Retrieved": "order_retrieved",
  "Order Created": "order_created",
  "Processing Order": "processing_order",
  "Stored in Warehouse": "stored_in_warehouse",
  "Picked Up": "picked_up",
  "Checkout Completed": "checkout_completed",
  "Verification": "verification",
  "Ready for Pickup": "ready_for_pickup",
  "Renting Active":"renting_active",
  "Customer Retrieved from Expired Storage": "customer_retrieved_from_expired-storage"
};

const actionTypeMaps = buildNormalizedMap(actionTypeKeyMapRaw);

export const canonicalActionTypeKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (actionTypeMaps.spacedMap[spaced]) return actionTypeMaps.spacedMap[spaced];
  if (actionTypeMaps.snakeMap[snake]) return actionTypeMaps.snakeMap[snake];
  return snake;
};

export const translateActionType = (t: TFunction, s?: string | null) => {
  const key = canonicalActionTypeKey(s);
  const noData = groupNoData(t, "actionTypeNames");
  if (!key) return noData;
  const looked = t(`actionTypeNames.${key}`);
  return looked !== `actionTypeNames.${key}` ? looked : (s ?? noData);
};
/* ---------- STYLE (full / self) ---------- */
const styleKeyMapRaw: Record<string, string> = {
  full: "full",
  self: "self",
  "full service": "full",
  "self service": "self",
  "self_service": "self",
  "full_service": "full",
  "toàn phần": "full",
  "tự phục vụ": "self",
};

const styleMaps = buildNormalizedMap(styleKeyMapRaw);

export const canonicalStyleKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  if (styleMaps.spacedMap[spaced]) return styleMaps.spacedMap[spaced];
  if (styleMaps.snakeMap[snake]) return styleMaps.snakeMap[snake];
  return snake;
};

export const translateStyle = (t: TFunction, s?: string | null) => {
  const key = canonicalStyleKey(s);
  const noData = groupNoData(t, "styleNames");
  if (!key) return noData;
  const looked = t(`styleNames.${key}`);
  return looked !== `styleNames.${key}` ? looked : (s ?? noData);
};
