import type { TFunction } from "i18next";

const normalize = (s?: string | null) =>
  (s ?? "").toString().trim().toLowerCase();

const paymentStatusKeyMap: Record<string, string> = {
  paid: "paid",
  unpaid: "unpaid",
  pending: "pending",
  refunded: "refunded",
};

export const canonicalPaymentStatusKey = (s?: string | null) => {
  const n = normalize(s);
  return paymentStatusKeyMap[n] ?? n;
};

export const translatePaymentStatus = (t: TFunction, s?: string | null) => {
  const key = canonicalPaymentStatusKey(s);
  if (!key) return t("noData");

  const translated = t(`paymentStatus.${key}`);
  return translated !== `paymentStatus.${key}` ? translated : s ?? t("noData");
};
