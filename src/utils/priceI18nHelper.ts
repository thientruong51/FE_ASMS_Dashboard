import type { PricingItem, ShippingRateItem } from "@/api/priceApi";
import type { TFunction } from "i18next";

type EnrichOptions = {
  namespacePrefix?: string; 
  locale?: string;
  includeBothLanguages?: boolean; 
};


function priceI18nHelper() {
  function formatCurrency(n: number | null | undefined, locale: string | undefined) {
    if (n == null) return "";
    try {
      const loc = locale ?? "vi-VN";
      const formatted = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(n);
      if (loc.startsWith("en")) return `${formatted} VND`;
      return `${formatted} ₫`;
    } catch {
      return String(n);
    }
  }

  function safeT(t: TFunction, key: string | undefined | null, fallback?: string) {
    if (!key) return fallback ?? "";
    try {
      const txt = t(key);
      if (!txt || txt === key) return fallback ?? key;
      return txt;
    } catch {
      return fallback ?? key;
    }
  }

  function buildDistanceDisplay(_t: TFunction, r: ShippingRateItem) {
    if (r.distanceRangeDisplay) return r.distanceRangeDisplay;
    const min = r.distanceMinKm;
    const max = r.distanceMaxKm;
    if (min == null && max == null) return "";
    if (min != null && max != null) return `${min.toFixed(2)}-${max.toFixed(2)} km`;
    if (min != null) return `> ${min.toFixed(2)} km`;
    return `< ${max} km`;
  }

  function buildContainerQtyDisplay(r: ShippingRateItem) {
    if (r.containerQtyDisplay) return r.containerQtyDisplay;
    const min = r.containerQtyMin;
    const max = r.containerQtyMax;
    if (min == null && max == null) return "";
    if (min != null && max != null) return `${min}-${max}`;
    if (min != null) return `> ${min}`;
    return `< ${max}`;
  }

  function enrichPricingItem(t: TFunction, p: PricingItem, locale: string | undefined, includeBoth: boolean, nsPrefix?: string) {
    const ns = nsPrefix ? `${nsPrefix}` : "";

    const serviceTypeKey = `${ns ? ns + ":" : ""}serviceType.${String(p.serviceType ?? "")}`;
    const itemCodeKey = `${ns ? ns + ":" : ""}itemCode.${String(p.itemCode ?? "")}`;

    const serviceType_t = p.serviceType ? safeT(t, serviceTypeKey, p.serviceType) : "";
    const itemCode_t = p.itemCode ? safeT(t, itemCodeKey, p.itemCode) : "";

    const acKey = `${ns ? ns + ":" : ""}acOptions.${String(Boolean(p.hasAirConditioning))}`;
    const hasAirConditioning_t = p.hasAirConditioning == null ? "" : safeT(t, acKey, p.hasAirConditioning ? (locale && locale.startsWith("en") ? "Yes" : "Có") : (locale && locale.startsWith("en") ? "No" : "Không"));

    const additionalInfo_t = p.additionalInfo ?? "";

    const out: any = {
      ...p,
      __full: { ...p },
      serviceType_t,
      itemCode_t,
      hasAirConditioning_t,
      additionalInfo_t,
    };

    const localesToCreate = includeBoth ? ["vi-VN", "en-US"] : [locale ?? "vi-VN"];

    for (const L of localesToCreate) {
      const short = L.split("-")[0];
      out[`pricePerMonth_display_${short}`] = p.pricePerMonth != null ? formatCurrency(p.pricePerMonth, L) : "";
      out[`pricePerWeek_display_${short}`] = p.pricePerWeek != null ? formatCurrency(p.pricePerWeek, L) : "";
      out[`pricePerTrip_display_${short}`] = p.pricePerTrip != null ? formatCurrency(p.pricePerTrip, L) : "";
      out[`serviceType_t_${short}`] = serviceType_t;
      out[`itemCode_t_${short}`] = itemCode_t;
      out[`additionalInfo_t_${short}`] = additionalInfo_t;
      out[`hasAirConditioning_t_${short}`] = hasAirConditioning_t;
    }

    return out;
  }

  function enrichShippingItem(t: TFunction, r: ShippingRateItem, locale: string | undefined, includeBoth: boolean, nsPrefix?: string) {
    const ns = nsPrefix ? `${nsPrefix}` : "";

    const priceUnitKey = `${ns ? ns + ":" : ""}priceUnit.${String(r.priceUnit ?? "")}`;
    const priceUnit_t = r.priceUnit ? safeT(t, priceUnitKey, r.priceUnit) : "";

    const distanceRangeDisplay = buildDistanceDisplay(t, r);
    const containerQtyDisplay = buildContainerQtyDisplay(r);

    const out: any = {
      ...r,
      __full: { ...r },
      distanceRangeDisplay_t: distanceRangeDisplay,
      containerQtyDisplay_t: containerQtyDisplay,
      priceUnit_t,
    };

    const localesToCreate = includeBoth ? ["vi-VN", "en-US"] : [locale ?? "vi-VN"];

    for (const L of localesToCreate) {
      const short = L.split("-")[0];
      out[`basePrice_display_${short}`] = r.basePrice != null ? formatCurrency(r.basePrice, L) : "";
      out[`distanceRangeDisplay_t_${short}`] = distanceRangeDisplay;
      out[`containerQtyDisplay_t_${short}`] = containerQtyDisplay;
      out[`priceUnit_t_${short}`] = priceUnit_t;
    }

    return out;
  }

  function enrichAllWithI18n(
    pricings: PricingItem[] | null | undefined,
    shippingRates: ShippingRateItem[] | null | undefined,
    t: TFunction,
    options?: EnrichOptions
  ) {
    const nsPrefix = options?.namespacePrefix ?? "";
    const locale = options?.locale ?? "vi-VN";
    const includeBoth = !!options?.includeBothLanguages;
    const pArr = Array.isArray(pricings) ? pricings : [];
    const sArr = Array.isArray(shippingRates) ? shippingRates : [];

    const enrichedPricings = pArr.map((p) => enrichPricingItem(t, p, locale, includeBoth, nsPrefix));
    const enrichedShipping = sArr.map((r) => enrichShippingItem(t, r, locale, includeBoth, nsPrefix));

    return {
      pricings: enrichedPricings,
      shippingRates: enrichedShipping,
    };
  }

  return {
    enrichAllWithI18n,
    formatCurrency,
    enrichPricingItem,
    enrichShippingItem,
  };
}

const helper = priceI18nHelper();
export type PriceI18nHelper = typeof helper;
export default helper;
