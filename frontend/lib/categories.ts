import { api } from "./api";

export type Category = {
  id: number;
  name: string;
};

export async function listCategories(): Promise<Category[]> {
  const res = await api<{ categories: Category[] }>("/categories");
  return res.categories;
}

export async function createCategory(name: string): Promise<Category> {
  return api<Category>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  return api<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  await api<void>(`/categories/${id}`, { method: "DELETE" });
}
