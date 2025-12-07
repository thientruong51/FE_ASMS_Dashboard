import axiosClient from "./axiosClient";


export type PricingItem = {
  pricingId: number;
  serviceType?: string | null; 
  itemCode?: string | null; 
  hasAirConditioning?: boolean | null;
  pricePerMonth?: number | null;
  pricePerWeek?: number | null;
  pricePerTrip?: number | null;
  additionalInfo?: string | null;
  createdDate?: string | null;
  updatedDate?: string | null;
  isActive?: boolean | null;

  [key: string]: any;
};

export type PricingListResponse = {
  success?: boolean;
  data: PricingItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pagination?: any;
};


export type ShippingRateItem = {
  shippingRateId: number;
  distanceMinKm?: number | null;
  distanceMaxKm?: number | null;
  containerQtyMin?: number | null;
  containerQtyMax?: number | null;
  basePrice?: number | null;
  priceUnit?: string | null; 
  specialItemSurcharge?: number | null;
  monthlyRentalDiscount?: number | null;
  createdDate?: string | null;
  isActive?: boolean | null;
  distanceRangeDisplay?: string | null;
  containerQtyDisplay?: string | null;

  [key: string]: any;
};

export type ShippingRateListResponse = {
  success?: boolean;
  data: ShippingRateItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pagination?: any;
};


export async function getPricings(params?: Record<string, any>): Promise<PricingListResponse> {
  const resp = await axiosClient.get<PricingListResponse>("/api/Pricing", { params });
  return resp.data;
}


export async function getPricing(pricingId: number | string): Promise<{ success?: boolean; data?: PricingItem | null }> {
  const resp = await axiosClient.get<{ success?: boolean; data?: PricingItem | null }>(`/api/Pricing/${encodeURIComponent(String(pricingId))}`);
  return resp.data;
}

export async function createPricing(payload: Partial<PricingItem>): Promise<{ success?: boolean; data?: PricingItem }> {
  const resp = await axiosClient.post<{ success?: boolean; data?: PricingItem }>("/api/Pricing", payload);
  return resp.data;
}


export async function updatePricing(pricingId: number | string, payload: Partial<PricingItem>): Promise<{ success?: boolean; data?: PricingItem }> {
  const resp = await axiosClient.put<{ success?: boolean; data?: PricingItem }>(`/api/Pricing/${encodeURIComponent(String(pricingId))}`, payload);
  return resp.data;
}


export async function deletePricing(pricingId: number | string): Promise<{ success?: boolean; message?: string }> {
  const resp = await axiosClient.delete<{ success?: boolean; message?: string }>(`/api/Pricing/${encodeURIComponent(String(pricingId))}`);
  return resp.data;
}


export async function getPricingsByServiceType(serviceType: string, params?: Record<string, any>): Promise<PricingListResponse> {
  const resp = await axiosClient.get<PricingListResponse>(`/api/Pricing/service-type/${encodeURIComponent(String(serviceType))}`, { params });
  return resp.data;
}


export async function getShippingRates(params?: Record<string, any>): Promise<ShippingRateListResponse> {
  const resp = await axiosClient.get<ShippingRateListResponse>("/api/Pricing/shipping-rates", { params });
  return resp.data;
}


export async function createShippingRate(payload: Partial<ShippingRateItem>): Promise<{ success?: boolean; data?: ShippingRateItem }> {
  const resp = await axiosClient.post<{ success?: boolean; data?: ShippingRateItem }>("/api/Pricing/shipping-rates", payload);
  return resp.data;
}


export async function getShippingRate(shippingRateId: number | string): Promise<{ success?: boolean; data?: ShippingRateItem | null }> {
  const resp = await axiosClient.get<{ success?: boolean; data?: ShippingRateItem | null }>(`/api/Pricing/shipping-rates/${encodeURIComponent(String(shippingRateId))}`);
  return resp.data;
}


export async function updateShippingRate(shippingRateId: number | string, payload: Partial<ShippingRateItem>): Promise<{ success?: boolean; data?: ShippingRateItem }> {
  const resp = await axiosClient.put<{ success?: boolean; data?: ShippingRateItem }>(`/api/Pricing/shipping-rates/${encodeURIComponent(String(shippingRateId))}`, payload);
  return resp.data;
}


export async function deleteShippingRate(shippingRateId: number | string): Promise<{ success?: boolean; message?: string }> {
  const resp = await axiosClient.delete<{ success?: boolean; message?: string }>(`/api/Pricing/shipping-rates/${encodeURIComponent(String(shippingRateId))}`);
  return resp.data;
}

export default {
  getPricings,
  getPricing,
  createPricing,
  updatePricing,
  deletePricing,
  getPricingsByServiceType,
  getShippingRates,
  createShippingRate,
  getShippingRate,
  updateShippingRate,
  deleteShippingRate,
};
