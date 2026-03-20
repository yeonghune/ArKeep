import { useCallback, useEffect, useState } from "react";
import { listCategories, createCategory, updateCategory, deleteCategory, type Category } from "@/lib/categories";

export function useCategories(isLoggedIn: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) { setCategories([]); return; }
    try {
      const data = await listCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }, [isLoggedIn]);

  useEffect(() => { void refresh(); }, [refresh]);

  const addCategory = useCallback(async (name: string) => {
    const created = await createCategory(name);
    setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  const renameCategory = useCallback(async (id: number, name: string) => {
    const updated = await updateCategory(id, name);
    setCategories((prev) => prev.map((c) => c.id === id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
    return updated;
  }, []);

  const removeCategory = useCallback(async (id: number) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, refresh, addCategory, renameCategory, removeCategory };
}
