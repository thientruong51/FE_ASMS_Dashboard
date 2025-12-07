import type { TFunction } from "i18next";

const normalize = (s?: string | null) =>
  (s ?? "").toString().trim().toLowerCase();

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
  completed:"completed"
};

export const canonicalStatusKey = (s?: string | null) => {
  const n = normalize(s);
  return statusKeyMap[n] ?? n;
};

export const translateStatus = (t: TFunction, s?: string | null) => {
  const key = canonicalStatusKey(s);
  if (!key) return t("noData");

  const translated = t(`statusNames.${key}`);
  return translated !== `statusNames.${key}` ? translated : s ?? t("noData");
};
