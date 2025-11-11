
export interface Customer {
  id: number;
  customerCode: string;
  name: string;
  phone?: string;
  email: string;
  address?: string;
  password?: string;
  isActive: boolean;
  orders?: Order[];
}

export interface Order {
  id: number;
  orderCode: string;
  customerId: number;
  orderDate: string;
  totalAmount?: number;
  status?: string;
}