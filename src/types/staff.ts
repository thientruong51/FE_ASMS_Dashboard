// src/types/staff.ts
export interface EmployeeRole {
  employeeRoleId?: number;
  name?: string;
  isActive?: boolean;
}

export interface Building {
  buildingId?: number;
  name?: string;
}

export interface Employee {
  id: number;
  employeeCode?: string;
  employeeRoleId?: number;
  name?: string;
  buildingId?: number;
  phone?: string;
  address?: string;
  username?: string;
  password?: string;
  status?: string;
  isActive?: boolean;
  // normalized nested objects for UI convenience
  employeeRole?: EmployeeRole;
  building?: Building;
  // backend extra fields
  roleName?: string;
  buildingName?: string;
  [key: string]: any;
}
