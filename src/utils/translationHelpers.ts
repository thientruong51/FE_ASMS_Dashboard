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
type ParsedStatus = {
  statusPart: string;
  suffixPart?: string;
};

const splitStatusAndSuffix = (s?: string | null): ParsedStatus => {
  if (!s) return { statusPart: "" };

  // match: "overdue 7 days", "overdue 15 day"
  const match = s.match(/^(.+?)\s+(\d+\s+day(s)?)$/i);
  if (!match) return { statusPart: s };

  return {
    statusPart: match[1],
    suffixPart: match[2],
  };
};

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
  delivered: "delivered",
  completed: "completed",
  "waiting refund": "waiting_refund",
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
  return statusMaps.spacedMap[spaced] || statusMaps.snakeMap[snake] || snake;
};

export const canonicalPaymentStatusKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  return paymentMaps.spacedMap[spaced] || paymentMaps.snakeMap[snake] || snake;
};

export const canonicalServiceKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  return serviceMaps.spacedMap[spaced] || serviceMaps.snakeMap[snake] || snake;
};

export const canonicalProductTypeKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  return (
    productTypeMaps.spacedMap[spaced] ||
    productTypeMaps.snakeMap[snake] ||
    snake
  );
};

/* ---------- Translate helpers ---------- */
const groupNoData = (t: TFunction, groupKey: string) => {
  const looked = t(`${groupKey}.noData`);
  return looked !== `${groupKey}.noData` ? looked : "-";
};

/* ---------- Translate functions ---------- */
export const translateStatus = (t: TFunction, s?: string | null) => {
  const noData = groupNoData(t, "statusNames");
  if (!s) return noData;

  const { statusPart, suffixPart } = splitStatusAndSuffix(s);
  const key = canonicalStatusKey(statusPart);

  const translated = t(`statusNames.${key}`);
  const finalStatus =
    translated !== `statusNames.${key}` ? translated : statusPart;

  return suffixPart
    ? `${finalStatus} ${suffixPart}`
    : finalStatus;
};


export const translatePaymentStatus = (t: TFunction, s?: string | null) => {
  const key = canonicalPaymentStatusKey(s);
  const noData = groupNoData(t, "paymentStatus");
  if (!key) return noData;
  const looked = t(`paymentStatus.${key}`);
  return looked !== `paymentStatus.${key}` ? looked : s ?? noData;
};

export const translateServiceName = (t: TFunction, s?: string | null) => {
  const key = canonicalServiceKey(s);
  const noData = groupNoData(t, "serviceNames");
  if (!key) return noData;
  const looked = t(`serviceNames.${key}`);
  return looked !== `serviceNames.${key}` ? looked : s ?? noData;
};

export const translateProductType = (t: TFunction, s?: string | null) => {
  const key = canonicalProductTypeKey(s);
  const noData = groupNoData(t, "productTypeNames");
  if (!key) return noData;
  const looked = t(`productTypeNames.${key}`);
  return looked !== `productTypeNames.${key}` ? looked : s ?? noData;
};

/* ================= ACTION TYPE (FIXED) ================= */

/* ----- Map CHỈ phần action cố định ----- */
const actionTypeKeyMapRaw: Record<string, string> = {
  "order retrieved": "order_retrieved",
  "order created": "order_created",
  "processing order": "processing_order",
  "stored in warehouse": "stored_in_warehouse",
  "picked up": "picked_up",
  "checkout completed": "checkout_completed",
  "verification": "verification",
  "ready for pickup": "ready_for_pickup",
  "renting active": "renting_active",
  "order overdue": "order_overdue",
  "order completed": "order_completed",
  "resume workflow after refund": "resume_workflow_after_refund",
  "refund completed": "refund_completed",
 "auto update - overdue detected": "auto_update_overdue_detected",
  "order cancelled": "order_cancelled",
"Auto Update - Overdue Detected": "auto_update",
  "order extended": "order_extended",
  "waiting refund": "waiting_refund",
  "order cancelled after refund": "order_cancelled_after_refund",
};

const actionTypeMaps = buildNormalizedMap(actionTypeKeyMapRaw);

export const canonicalActionTypeKey = (s?: string | null) => {
  const spaced = normalize(s);
  const snake = toSnake(s);
  return (
    actionTypeMaps.spacedMap[spaced] ||
    actionTypeMaps.snakeMap[snake] ||
    snake
  );
};

/* ----- Action parser ----- */
type ParsedAction = {
  actionPart: string;
  detailPart?: string;
};

const splitActionAndDetail = (s?: string | null): ParsedAction => {
  if (!s) return { actionPart: "" };

  const idx = s.indexOf(" - ");
  if (idx === -1) return { actionPart: s };

  return {
    actionPart: s.slice(0, idx),
    detailPart: s.slice(idx + 3),
  };
};

/* ----- Translate Action ----- */
export const translateActionType = (t: TFunction, s?: string | null) => {
  const noData = groupNoData(t, "actionTypeNames");
  if (!s) return noData;

  const { actionPart, detailPart } = splitActionAndDetail(s);
  const key = canonicalActionTypeKey(actionPart);

  const translated = t(`actionTypeNames.${key}`);
  const finalAction =
    translated !== `actionTypeNames.${key}` ? translated : actionPart;

  return detailPart
    ? `${finalAction} - ${detailPart}`
    : finalAction;
};

/* ---------- STYLE ---------- */
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
  return styleMaps.spacedMap[spaced] || styleMaps.snakeMap[snake] || snake;
};

export const translateStyle = (t: TFunction, s?: string | null) => {
  const key = canonicalStyleKey(s);
  const noData = groupNoData(t, "styleNames");
  if (!key) return noData;
  const looked = t(`styleNames.${key}`);
  return looked !== `styleNames.${key}` ? looked : s ?? noData;
};
