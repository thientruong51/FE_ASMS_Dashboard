import axiosClient from "./axiosClient";



export type ContactItem = {
  contactId?: number;

  customerCode?: string | null;
  customerName?: string | null;

  employeeCode?: string | null;
  employeeName?: string | null;

  orderCode?: string | null;
 orderDetailId?: number | null;
  name?: string | null;
  phoneContact?: string | null;
  email?: string | null;

  message?: string | null;

  isActive?: boolean | null;

  image?: string[] | null;
  contactDate: string | null;    
  retrievedDate: string | null;
  contactType?: string | null;
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



export async function createContactWithEmail(
  payload: Partial<ContactItem>
): Promise<{ success?: boolean; data?: ContactItem; message?: string }> {
  const resp = await axiosClient.post(
    "/api/Contacts/with-email",
    payload
  );
  return resp.data;
}
export async function getRetrieveRequestCount(
  orderCode: string
): Promise<{
  success?: boolean;
  orderCode?: string;
  requestToRetrieveCount?: number;
}> {
  const resp = await axiosClient.get(
    `/api/Contacts/count-retrieve-requests/${encodeURIComponent(orderCode)}`
  );
  return resp.data;
}
export async function markOrderDetailDamaged(
  id: number
): Promise<{ success?: boolean }> {
  const resp = await axiosClient.patch(
    `/api/OrderDetail/${encodeURIComponent(String(id))}/damage`,
    {
      isDamaged: true,
    }
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
  getRetrieveRequestCount,
  markOrderDetailDamaged
};
