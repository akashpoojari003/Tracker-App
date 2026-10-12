// src/db/categories.ts
import { getDb } from '@/db';

export type Category = {
  id: number;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
};

export type CategoryInput = Omit<Category, 'id' | 'is_default'>;

type CategoryRow = Omit<Category, 'is_default'> & { is_default: number };

const toCategory = (r: CategoryRow): Category => ({ ...r, is_default: r.is_default === 1 });

export async function addCategory({ name, icon, color }: CategoryInput): Promise<number> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO categories (name, icon, color, is_default) VALUES (?, ?, ?, 0)',
    name,
    icon,
    color,
  );
  return res.lastInsertRowId;
}

export async function updateCategory(id: number, { name, icon, color }: CategoryInput): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?', name, icon, color, id);
}

/** Deletes a custom category; its expenses move to the default "Other". Defaults are kept. */
export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE expenses
         SET category_id = (SELECT id FROM categories WHERE name = 'Other' AND is_default = 1)
       WHERE category_id = ?1
         AND EXISTS (SELECT 1 FROM categories WHERE id = ?1 AND is_default = 0)`,
      id,
    );
    await db.runAsync('DELETE FROM categories WHERE id = ? AND is_default = 0', id);
  });
}

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY is_default DESC, id ASC',
  );
  return rows.map(toCategory);
}
