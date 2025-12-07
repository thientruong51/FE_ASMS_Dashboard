import { type TFunction } from "i18next";

const normalize = (s?: string | null) =>
  (s ?? "").toString().trim().toLowerCase();

const serviceKeyMap: Record<string, string> = {
  "protecting": "protecting",
  "Protecting": "protecting",
  "product packaging": "product_packaging",
  "product_packaging": "product_packaging",
  "delivery": "delivery",
};

export const canonicalServiceKey = (s?: string | null) => {
  const n = normalize(s);
  return serviceKeyMap[n] ?? n;
};

export const translateServiceName = (t: TFunction, s?: string | null) => {
  const key = canonicalServiceKey(s);
  if (!key) return t("noData");

  const translated = t(`serviceNames.${key}`);
  return translated !== `serviceNames.${key}` ? translated : s ?? t("noData");
};
