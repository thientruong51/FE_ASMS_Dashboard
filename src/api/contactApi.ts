import axiosClient from "./axiosClient";

/* =========================
 * Types
 * ========================= */

export type ContactItem = {
  contactId?: number;

  customerCode?: string | null;
  customerName?: string | null;

  employeeCode?: string | null;
  employeeName?: string | null;

  orderCode?: string | null;

  name?: string | null;
  phoneContact?: string | null;
  email?: string | null;

  message?: string | null;

  isActive?: boolean | null;

  /** NEW */
  image?: string[] | null;

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

/* =========================
 * CRUD APIs
 * ========================= */

export async function getContacts(
  params?: Record<string, any>
): Promise<ContactListResponse> {
  const resp = await axiosClient.get<ContactListResponse>(
    "/api/Contacts",
    { params }
  );
  return resp.data;
}

export async function getContact(
  contactId: number | string
): Promise<{ success?: boolean; data: ContactItem | null }> {
  const resp = await axiosClient.get(
    `/api/Contacts/${encodeURIComponent(String(contactId))}`
  );
  return resp.data;
}

export async function createContact(
  payload: Partial<ContactItem>
): Promise<{ success?: boolean; data?: ContactItem }> {
  const resp = await axiosClient.post("/api/Contacts", payload);
  return resp.data;
}

export async function updateContact(
  contactId: number | string,
  payload: Partial<ContactItem>
): Promise<{ success?: boolean; data?: ContactItem }> {
  const resp = await axiosClient.put(
    `/api/Contacts/${encodeURIComponent(String(contactId))}`,
    payload
  );
  return resp.data;
}

export async function deleteContact(
  contactId: number | string
): Promise<{ success?: boolean; message?: string }> {
  const resp = await axiosClient.delete(
    `/api/Contacts/${encodeURIComponent(String(contactId))}`
  );
  return resp.data;
}

export async function toggleActive(
  contactId: number | string
): Promise<{ success?: boolean; data?: ContactItem; message?: string }> {
  const resp = await axiosClient.patch(
    `/api/Contacts/${encodeURIComponent(String(contactId))}/toggle-active`
  );
  return resp.data;
}

/* =========================
 * NEW: create with email
 * ========================= */

export async function createContactWithEmail(
  payload: Partial<ContactItem>
): Promise<{ success?: boolean; data?: ContactItem; message?: string }> {
  const resp = await axiosClient.post(
    "/api/Contacts/with-email",
    payload
  );
  return resp.data;
}

export default {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  toggleActive,
  createContactWithEmail,
};
