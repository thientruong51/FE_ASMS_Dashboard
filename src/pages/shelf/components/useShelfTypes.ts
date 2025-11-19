import { useEffect, useState } from "react";
import shelfTypeApi from "@/api/shelfTypeApi";
import type { ShelfType } from "./types";

export default function useShelfTypes() {
  const [data, setData] = useState<ShelfType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await shelfTypeApi.getShelfTypes();
      setData(res.data.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch shelf types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, reload: fetchData, setData };
}
