import axiosClient from "./axiosClient";

export type BusinessRuleItem = {
  businessRuleId?: number;
  ruleCode?: string | null;
  category?: string | null;
  ruleName?: string | null;
  ruleDescription?: string | null;
  ruleType?: string | null;
  priority?: string | null;
  isActive?: boolean | null;
  effectiveDate?: string | null; 
  expiryDate?: string | null; 
  createdDate?: string | null;
  updatedDate?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  notes?: string | null;

  [key: string]: any;
};

export type BusinessRuleListResponse = {
  success?: boolean;
  data: BusinessRuleItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pagination?: any;
};


export async function getBusinessRules(params?: Record<string, any>): Promise<BusinessRuleListResponse> {
  const resp = await axiosClient.get<BusinessRuleListResponse>("/api/BusinessRules", { params });
  return resp.data;
}


export async function getBusinessRule(businessRuleId: number | string): Promise<{ success?: boolean; data: BusinessRuleItem | null }> {
  const resp = await axiosClient.get<{ success?: boolean; data: BusinessRuleItem | null }>(`/api/BusinessRules/${encodeURIComponent(String(businessRuleId))}`);
  return resp.data;
}


export async function createBusinessRule(payload: Partial<BusinessRuleItem>): Promise<{ success?: boolean; data?: BusinessRuleItem }> {
  const resp = await axiosClient.post<{ success?: boolean; data?: BusinessRuleItem }>("/api/BusinessRules", payload);
  return resp.data;
}


export async function updateBusinessRule(businessRuleId: number | string, payload: Partial<BusinessRuleItem>): Promise<{ success?: boolean; data?: BusinessRuleItem }> {
  const resp = await axiosClient.put<{ success?: boolean; data?: BusinessRuleItem }>(`/api/BusinessRules/${encodeURIComponent(String(businessRuleId))}`, payload);
  return resp.data;
}


export async function deleteBusinessRule(businessRuleId: number | string): Promise<{ success?: boolean; message?: string }> {
  const resp = await axiosClient.delete<{ success?: boolean; message?: string }>(`/api/BusinessRules/${encodeURIComponent(String(businessRuleId))}`);
  return resp.data;
}

export default {
  getBusinessRules,
  getBusinessRule,
  createBusinessRule,
  updateBusinessRule,
  deleteBusinessRule,
};
