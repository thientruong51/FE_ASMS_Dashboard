import type { TFunction } from "i18next";

const normalize = (s?: string | null) =>
  (s ?? "").toString().trim().toLowerCase();
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
const statusKeyMap: Record<string, string> = {
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
  "overdue ": "overdue",
  "store in expired storage": "store_in_expired_storage",
  occupied: "occupied",
  "is occupied": "occupied",
  "occupied storage": "occupied",
  "occupied position": "occupied",
  Active:"active",
  Ready:"ready",
  Reserved:"reserved",
  Rented:"rented",
  delivered:"delivered",
  Delivered:"delivered",
  Completed:"completed",
  completed:"completed",
  "waiting refund":"waiting_refund",
};

export const canonicalStatusKey = (s?: string | null) => {
  const n = normalize(s);
  return statusKeyMap[n] ?? n;
};

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

const groupNoData = (t: TFunction, groupKey: string) => {
  const looked = t(`${groupKey}.noData`);
  return looked !== `${groupKey}.noData` ? looked : "-";
};


