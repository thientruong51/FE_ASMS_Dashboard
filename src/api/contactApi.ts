import axiosClient from "./axiosClient";

export type ContactItem = {
  contactId: number;
  customerCode?: string | null;
  customerName?: string | null;
  employeeCode?: string | null;
  employeeName?: string | null;
  orderCode?: string | null;
  name?: string | null;
  phoneContact?: string | null;
  email?: string | null;
  message?: string | null;

  [key: string]: any;
};

export type ContactListResponse = {
  success?: boolean;
  data: ContactItem[];
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  pagination?: any;
};


export async function getContacts(params?: Record<string, any>): Promise<ContactListResponse> {
  const resp = await axiosClient.get<ContactListResponse>("/api/Contacts", { params });
  return resp.data;
}

export async function getContact(contactId: number | string): Promise<{ success?: boolean; data: ContactItem | null }> {
  const resp = await axiosClient.get<{ success?: boolean; data: ContactItem | null }>(`/api/Contacts/${encodeURIComponent(String(contactId))}`);
  return resp.data;
}

export async function createContact(payload: Partial<ContactItem>): Promise<{ success?: boolean; data?: ContactItem }> {
  const resp = await axiosClient.post<{ success?: boolean; data?: ContactItem }>("/api/Contacts", payload);
  return resp.data;
}


export async function updateContact(contactId: number | string, payload: Partial<ContactItem>): Promise<{ success?: boolean; data?: ContactItem }> {
  const resp = await axiosClient.put<{ success?: boolean; data?: ContactItem }>(`/api/Contacts/${encodeURIComponent(String(contactId))}`, payload);
  return resp.data;
}


export async function deleteContact(contactId: number | string): Promise<{ success?: boolean; message?: string }> {
  const resp = await axiosClient.delete<{ success?: boolean; message?: string }>(`/api/Contacts/${encodeURIComponent(String(contactId))}`);
  return resp.data;
}

export default {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
};
