import type { SQLiteDatabase } from 'expo-sqlite';
import type { EventType, Position } from '../constants/football';
import { deletePhoto } from '../lib/photos';

// Fictional team for store screenshots. Only reachable from __DEV__ builds.

const PLAYERS: { number: number; name: string; position: Position }[] = [
  { number: 1, name: 'Tiago Matos', position: 'GR' },
  { number: 12, name: 'Hugo Ferraz', position: 'GR' },
  { number: 2, name: 'Miguel Sousa', position: 'DEF' },
  { number: 4, name: 'André Lopes', position: 'DEF' },
  { number: 5, name: 'Rui Barros', position: 'DEF' },
  { number: 3, name: 'Daniel Pinto', position: 'DEF' },
  { number: 15, name: 'Filipe Rocha', position: 'DEF' },
  { number: 6, name: 'João Pereira', position: 'MED' },
  { number: 8, name: 'Bruno Teixeira', position: 'MED' },
  { number: 10, name: 'Ricardo Moreira', position: 'MED' },
  { number: 14, name: 'Nuno Cardoso', position: 'MED' },
  { number: 16, name: 'Vasco Almeida', position: 'MED' },
  { number: 7, name: 'Diogo Faria', position: 'AV' },
  { number: 9, name: 'Pedro Antunes', position: 'AV' },
  { number: 11, name: 'Gonçalo Lima', position: 'AV' },
  { number: 17, name: 'Rafael Correia', position: 'AV' },
];

// 4-3-3 slot → shirt number
const LINEUP: number[] = [1, 2, 4, 5, 3, 6, 10, 8, 7, 9, 11];

type Goal = [scorer: number, assist: number | null, minute: number];
type Card = [player: number, type: 'yellow' | 'red', minute: number];
type Sub = [playerIn: number, playerOut: number, minute: number];

interface DemoMatch {
  opponent: string;
  /** negative = past, positive = future */
  dayOffset: number;
  time: [number, number];
  home: boolean;
  location: string;
  status: 'finished' | 'live' | 'scheduled';
  goals?: Goal[];
  conceded?: number[];
  cards?: Card[];
  subs?: Sub[];
}

const HOME_GROUND = 'Campo Municipal da Vila';

const MATCHES: DemoMatch[] = [
  {
    opponent: 'Recreativo da Várzea', dayOffset: 0, time: [0, 0], home: true, location: HOME_GROUND, status: 'live',
    goals: [[9, 10, 12], [11, 7, 61]], conceded: [40], cards: [[5, 'yellow', 33]],
  },
  { opponent: 'Sporting da Aldeia', dayOffset: 4, time: [10, 30], home: false, location: 'Campo da Aldeia', status: 'scheduled' },
  { opponent: 'Bairro Alto FC', dayOffset: 11, time: [16, 0], home: true, location: HOME_GROUND, status: 'scheduled' },
  {
    opponent: 'Unidos da Ribeira', dayOffset: -2, time: [15, 0], home: true, location: HOME_GROUND, status: 'finished',
    goals: [[9, 10, 14], [7, 9, 38], [9, null, 71]], conceded: [55], cards: [[4, 'yellow', 62]], subs: [[17, 7, 70]],
  },
  {
    opponent: 'Atlético da Serra', dayOffset: -9, time: [11, 0], home: false, location: 'Estádio da Serra', status: 'finished',
    goals: [[10, 8, 22], [11, 7, 80]], conceded: [30, 67], cards: [[6, 'yellow', 44], [5, 'yellow', 75]],
  },
  {
    opponent: 'Juventude Vilarense', dayOffset: -16, time: [15, 0], home: true, location: HOME_GROUND, status: 'finished',
    goals: [[9, 7, 9], [9, 10, 33], [7, 2, 58], [10, 14, 85]], subs: [[14, 8, 60]],
  },
  {
    opponent: 'Os Lusitanos FC', dayOffset: -23, time: [17, 30], home: false, location: 'Campo dos Lusitanos', status: 'finished',
    goals: [[9, 11, 51]], conceded: [12, 77], cards: [[8, 'yellow', 40], [3, 'red', 79]],
  },
  {
    opponent: 'GD do Vale', dayOffset: -30, time: [15, 0], home: true, location: HOME_GROUND, status: 'finished',
    goals: [[7, 10, 27], [8, null, 64]], cards: [[2, 'yellow', 50]],
  },
  {
    opponent: 'Académico do Bairro', dayOffset: -37, time: [10, 0], home: false, location: 'Parque Desportivo do Bairro', status: 'finished',
    goals: [[9, 10, 18], [11, 9, 49], [9, 7, 88]], conceded: [35, 60],
  },
  {
    opponent: 'Estrela do Sul', dayOffset: -44, time: [15, 0], home: true, location: HOME_GROUND, status: 'finished',
    goals: [[10, 7, 72]], cards: [[4, 'yellow', 81]],
  },
  {
    opponent: 'Clube da Ponte', dayOffset: -51, time: [16, 0], home: false, location: 'Campo da Ponte', status: 'finished',
    goals: [[7, 9, 15], [4, 10, 90]], conceded: [44],
  },
];

const LIVE_STARTED_MINUTES_AGO = 67;

function matchDate(m: DemoMatch): Date {
  if (m.status === 'live') return new Date(Date.now() - LIVE_STARTED_MINUTES_AGO * 60000);
  const d = new Date();
  d.setDate(d.getDate() + m.dayOffset);
  d.setHours(m.time[0], m.time[1], 0, 0);
  return d;
}

async function collectPhotos(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ uri: string | null }>(
    'SELECT photo_uri AS uri FROM players UNION ALL SELECT crest_uri AS uri FROM team'
  );
  return rows.map((r) => r.uri).filter((u): u is string => !!u);
}

async function wipe(txn: SQLiteDatabase) {
  await txn.execAsync(`
    DELETE FROM events;
    DELETE FROM match_lineup;
    DELETE FROM matches;
    DELETE FROM lineup;
    DELETE FROM players;
    DELETE FROM sqlite_sequence WHERE name IN ('players', 'matches', 'events');
    UPDATE team SET name = '', kit_color = '#FFFFFF', crest_uri = NULL, formation = '11:4-3-3' WHERE id = 1;
  `);
}

export async function clearAllData(db: SQLiteDatabase) {
  const photos = await collectPhotos(db);
  await db.withExclusiveTransactionAsync(wipe);
  photos.forEach(deletePhoto);
}

export async function loadDemoDataIfEmpty(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT (SELECT COUNT(*) FROM players) + (SELECT COUNT(*) FROM matches) AS n'
  );
  if ((row?.n ?? 0) === 0) await loadDemoData(db);
}

export async function loadDemoData(db: SQLiteDatabase) {
  const photos = await collectPhotos(db);

  await db.withExclusiveTransactionAsync(async (txn) => {
    await wipe(txn);
    await txn.runAsync("UPDATE team SET name = 'Estrela Azul FC', kit_color = '#FFFFFF', formation = '11:4-3-3' WHERE id = 1");

    const idByNumber = new Map<number, number>();
    for (const p of PLAYERS) {
      const r = await txn.runAsync('INSERT INTO players (name, number, position) VALUES (?, ?, ?)', p.name, p.number, p.position);
      idByNumber.set(p.number, r.lastInsertRowId);
    }
    const id = (n: number | null) => (n === null ? null : (idByNumber.get(n) ?? null));

    for (const [slot, number] of LINEUP.entries()) {
      await txn.runAsync('INSERT INTO lineup (slot, player_id) VALUES (?, ?)', slot, id(number));
    }

    for (const m of MATCHES) {
      const date = matchDate(m);
      const r = await txn.runAsync(
        'INSERT INTO matches (opponent, date, location, is_home, status, started_at, formation) VALUES (?, ?, ?, ?, ?, ?, ?)',
        m.opponent,
        date.toISOString(),
        m.location,
        m.home ? 1 : 0,
        m.status,
        m.status === 'live' ? date.getTime() : null,
        m.status === 'scheduled' ? null : '11:4-3-3'
      );
      const matchId = r.lastInsertRowId;
      if (m.status === 'scheduled') continue;

      await txn.runAsync(
        'INSERT INTO match_lineup (match_id, slot, player_id) SELECT ?, slot, player_id FROM lineup',
        matchId
      );

      const addEvent = (type: EventType, player: number | null, related: number | null, minute: number) =>
        txn.runAsync(
          'INSERT INTO events (match_id, type, player_id, related_player_id, minute) VALUES (?, ?, ?, ?, ?)',
          matchId,
          type,
          id(player),
          id(related),
          minute
        );

      for (const [scorer, assist, minute] of m.goals ?? []) await addEvent('goal', scorer, assist, minute);
      for (const minute of m.conceded ?? []) await addEvent('opp_goal', null, null, minute);
      for (const [player, type, minute] of m.cards ?? []) await addEvent(type, player, null, minute);
      for (const [playerIn, playerOut, minute] of m.subs ?? []) await addEvent('sub', playerIn, playerOut, minute);
    }
  });

  photos.forEach(deletePhoto);
}
