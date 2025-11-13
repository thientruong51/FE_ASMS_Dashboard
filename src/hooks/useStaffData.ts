import { useCallback, useEffect, useState } from "react";
import staffApi from "@/api/staffApi";
import type { Employee, EmployeeRole, Building } from "../types/staff";

const extractData = (res: any) => {
  if (!res) return null;
  const maybe = res.data ?? res;
  if (maybe && typeof maybe === "object" && "data" in maybe) return maybe.data;
  return maybe;
};

export default function useStaffData() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, rolesRes, bldRes] = await Promise.allSettled([
        staffApi.getEmployees(),
        staffApi.getRoles(),
        staffApi.getBuildings(),
      ]);

      if (empRes.status === "fulfilled") {
        const raw = extractData(empRes.value);
        const arr = Array.isArray(raw) ? raw : [];
        const normalized = arr.map((it: any) => ({
          id: it.id,
          employeeCode: it.employeeCode,
          name: it.name,
          employeeRoleId: it.employeeRoleId ?? undefined,
          employeeRole: it.employeeRoleId
            ? { employeeRoleId: it.employeeRoleId, name: it.roleName ?? it.employeeRole?.name }
            : it.roleName
            ? { name: it.roleName }
            : it.employeeRole ?? undefined,
          buildingId: it.buildingId ?? undefined,
          building: it.buildingId
            ? { buildingId: it.buildingId, name: it.buildingName ?? it.building?.name }
            : it.building ?? undefined,
          phone: it.phone,
          address: it.address,
          username: it.username,
          status: it.status,
          isActive: it.isActive,
          ...it,
        })) as Employee[];
        setEmployees(normalized);
      } else {
        setEmployees([]);
      }

      if (rolesRes.status === "fulfilled") {
        const r = extractData(rolesRes.value);
        setRoles(Array.isArray(r) ? r : []);
      }

      if (bldRes.status === "fulfilled") {
        const b = extractData(bldRes.value);
        setBuildings(Array.isArray(b) ? b : []);
      }
    } catch (err) {
      console.error("Load error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    void load();
  }, [load]);

  const create = useCallback(async (data: Partial<Employee>) => {
    setLoading(true);
    try {
      const res = await staffApi.createEmployee(data);
      const body = extractData(res) ?? res.data ?? res;
      const createdRaw = body && !Array.isArray(body) ? body : Array.isArray(body) ? body[0] : body;

      const created: Employee = {
        id: createdRaw.id,
        ...createdRaw,
        employeeRole: createdRaw.roleName ? { name: createdRaw.roleName } : createdRaw.employeeRole,
        building: createdRaw.buildingId
          ? { buildingId: createdRaw.buildingId, name: createdRaw.buildingName ?? createdRaw.building?.name }
          : createdRaw.building,
      };

      setEmployees((prev) => [...prev, created]);
      return created;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, data: Partial<Employee>) => {
    setLoading(true);
    try {
      const res = await staffApi.updateEmployee(id, data);
      const body = extractData(res) ?? res.data ?? res;
      const updatedRaw = body && !Array.isArray(body) ? body : Array.isArray(body) ? body[0] : body;

      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updatedRaw } as Employee : e))
      );

      return updatedRaw;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const res = await staffApi.deleteEmployee(id);
      const body = extractData(res) ?? res.data ?? res;

      if (body && typeof body === "object" && "success" in body && !body.success) {
        throw new Error("Delete failed on server");
      }

      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      return true;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    employees,
    roles,
    buildings,
    loading,
    refresh,
    create,
    update,
    remove,
  } as const;
}
