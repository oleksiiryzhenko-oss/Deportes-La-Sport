import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE team (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL DEFAULT '',
        kit_color TEXT NOT NULL DEFAULT '#FFFFFF',
        crest_uri TEXT,
        formation TEXT NOT NULL DEFAULT '11:4-3-3'
      );
      INSERT INTO team (id) VALUES (1);

      CREATE TABLE players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        number INTEGER,
        position TEXT NOT NULL,
        photo_uri TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE lineup (
        slot INTEGER PRIMARY KEY,
        player_id INTEGER NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE
      );

      CREATE TABLE matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opponent TEXT NOT NULL,
        date TEXT NOT NULL,
        location TEXT,
        is_home INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'scheduled',
        started_at INTEGER,
        formation TEXT
      );

      CREATE TABLE match_lineup (
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        slot INTEGER NOT NULL,
        player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
        PRIMARY KEY (match_id, slot)
      );

      CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
        related_player_id INTEGER REFERENCES players(id) ON DELETE SET NULL,
        minute INTEGER
      );
      CREATE INDEX events_match_id ON events(match_id);
    `);
    currentVersion = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
