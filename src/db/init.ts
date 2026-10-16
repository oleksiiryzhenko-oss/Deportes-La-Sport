import type { SQLiteDatabase } from 'expo-sqlite';
import { loadDemoDataIfEmpty } from './demo';
import { migrateDbIfNeeded } from './schema';

export async function initDatabase(db: SQLiteDatabase) {
  await migrateDbIfNeeded(db);
  // Debug builds start with demo data (for screenshots); release builds always start empty.
  if (__DEV__) await loadDemoDataIfEmpty(db);
}
