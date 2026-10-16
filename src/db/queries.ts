import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_FORMATION_ID, type EventType, type Position } from '../constants/football';
import type { Leader, LineupSlot, Match, MatchEvent, Player, PlayerStats, SquadPlayer, Team } from './types';

type Db = SQLiteDatabase;

// Team

export function getTeam(db: Db) {
  return db.getFirstAsync<Team>('SELECT name, kit_color, crest_uri, formation FROM team WHERE id = 1');
}

export async function updateTeam(db: Db, team: Pick<Team, 'name' | 'kit_color' | 'crest_uri'>) {
  await db.runAsync(
    'UPDATE team SET name = ?, kit_color = ?, crest_uri = ? WHERE id = 1',
    team.name,
    team.kit_color,
    team.crest_uri
  );
}

// Players

const PLAYER_COLS = 'id, name, number, position, photo_uri';
const POSITION_ORDER = "CASE position WHEN 'GR' THEN 0 WHEN 'DEF' THEN 1 WHEN 'MED' THEN 2 ELSE 3 END";

export function listPlayers(db: Db) {
  return db.getAllAsync<Player>(
    `SELECT ${PLAYER_COLS} FROM players ORDER BY ${POSITION_ORDER}, number IS NULL, number, name`
  );
}

export function listSquad(db: Db) {
  return db.getAllAsync<SquadPlayer>(
    `SELECT ${PLAYER_COLS},
       (SELECT COUNT(*) FROM events e WHERE e.player_id = players.id AND e.type = 'goal') AS goals
     FROM players ORDER BY ${POSITION_ORDER}, number IS NULL, number, name`
  );
}

export function getPlayer(db: Db, id: number) {
  return db.getFirstAsync<Player>(`SELECT ${PLAYER_COLS} FROM players WHERE id = ?`, id);
}

export interface PlayerInput {
  name: string;
  number: number | null;
  position: Position;
  photo_uri: string | null;
}

export async function insertPlayer(db: Db, p: PlayerInput) {
  const result = await db.runAsync(
    'INSERT INTO players (name, number, position, photo_uri) VALUES (?, ?, ?, ?)',
    p.name,
    p.number,
    p.position,
    p.photo_uri
  );
  return result.lastInsertRowId;
}

export async function updatePlayer(db: Db, id: number, p: PlayerInput) {
  await db.runAsync(
    'UPDATE players SET name = ?, number = ?, position = ?, photo_uri = ? WHERE id = ?',
    p.name,
    p.number,
    p.position,
    p.photo_uri,
    id
  );
}

export async function deletePlayer(db: Db, id: number) {
  await db.runAsync('DELETE FROM players WHERE id = ?', id);
}

export function playerStats(db: Db, id: number) {
  return db.getFirstAsync<PlayerStats>(
    `SELECT
       (SELECT COUNT(*) FROM (
          SELECT match_id FROM match_lineup WHERE player_id = $id
          UNION SELECT match_id FROM events WHERE type = 'sub' AND player_id = $id
       )) AS appearances,
       (SELECT COUNT(*) FROM events WHERE type = 'goal' AND player_id = $id) AS goals,
       (SELECT COUNT(*) FROM events WHERE type = 'goal' AND related_player_id = $id) AS assists,
       (SELECT COUNT(*) FROM events WHERE type = 'yellow' AND player_id = $id) AS yellows,
       (SELECT COUNT(*) FROM events WHERE type = 'red' AND player_id = $id) AS reds`,
    { $id: id }
  );
}

// Lineup

export function getLineup(db: Db) {
  return db.getAllAsync<LineupSlot>('SELECT slot, player_id FROM lineup');
}

export async function saveLineup(db: Db, formationId: string, lineup: Record<number, number>) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('UPDATE team SET formation = ? WHERE id = 1', formationId);
    await txn.runAsync('DELETE FROM lineup');
    for (const [slot, playerId] of Object.entries(lineup)) {
      await txn.runAsync('INSERT INTO lineup (slot, player_id) VALUES (?, ?)', Number(slot), playerId);
    }
  });
}

// Matches

const MATCH_SELECT = `
  SELECT m.id, m.opponent, m.date, m.location, m.is_home, m.status, m.started_at, m.formation,
    (SELECT COUNT(*) FROM events e WHERE e.match_id = m.id AND e.type = 'goal') AS goals_for,
    (SELECT COUNT(*) FROM events e WHERE e.match_id = m.id AND e.type = 'opp_goal') AS goals_against
  FROM matches m`;

export function listMatches(db: Db) {
  return db.getAllAsync<Match>(`${MATCH_SELECT} ORDER BY m.date DESC`);
}

export function getMatch(db: Db, id: number) {
  return db.getFirstAsync<Match>(`${MATCH_SELECT} WHERE m.id = ?`, id);
}

export interface MatchInput {
  opponent: string;
  date: string;
  location: string | null;
  is_home: boolean;
}

export async function insertMatch(db: Db, m: MatchInput) {
  const result = await db.runAsync(
    'INSERT INTO matches (opponent, date, location, is_home) VALUES (?, ?, ?, ?)',
    m.opponent,
    m.date,
    m.location,
    m.is_home ? 1 : 0
  );
  return result.lastInsertRowId;
}

export async function updateMatch(db: Db, id: number, m: MatchInput) {
  await db.runAsync(
    'UPDATE matches SET opponent = ?, date = ?, location = ?, is_home = ? WHERE id = ?',
    m.opponent,
    m.date,
    m.location,
    m.is_home ? 1 : 0,
    id
  );
}

export async function deleteMatch(db: Db, id: number) {
  await db.runAsync('DELETE FROM matches WHERE id = ?', id);
}

async function snapshotLineup(txn: Db, matchId: number) {
  const team = await txn.getFirstAsync<{ formation: string }>('SELECT formation FROM team WHERE id = 1');
  await txn.runAsync('DELETE FROM match_lineup WHERE match_id = ?', matchId);
  await txn.runAsync(
    'INSERT INTO match_lineup (match_id, slot, player_id) SELECT ?, slot, player_id FROM lineup',
    matchId
  );
  await txn.runAsync('UPDATE matches SET formation = ? WHERE id = ?', team?.formation ?? DEFAULT_FORMATION_ID, matchId);
}

export async function startMatch(db: Db, id: number) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await snapshotLineup(txn, id);
    await txn.runAsync("UPDATE matches SET status = 'live', started_at = ? WHERE id = ?", Date.now(), id);
  });
}

export async function recordResult(db: Db, id: number) {
  await db.withExclusiveTransactionAsync(async (txn) => {
    await snapshotLineup(txn, id);
    await txn.runAsync("UPDATE matches SET status = 'finished' WHERE id = ?", id);
  });
}

export async function finishMatch(db: Db, id: number) {
  await db.runAsync("UPDATE matches SET status = 'finished' WHERE id = ?", id);
}

export function getMatchLineup(db: Db, matchId: number) {
  return db.getAllAsync<LineupSlot>(
    'SELECT slot, player_id FROM match_lineup WHERE match_id = ? AND player_id IS NOT NULL',
    matchId
  );
}

// Events

export function listEvents(db: Db, matchId: number) {
  return db.getAllAsync<MatchEvent>(
    `SELECT e.id, e.match_id, e.type, e.player_id, e.related_player_id, e.minute,
       p.name AS player_name, r.name AS related_name
     FROM events e
     LEFT JOIN players p ON p.id = e.player_id
     LEFT JOIN players r ON r.id = e.related_player_id
     WHERE e.match_id = ?
     ORDER BY e.minute IS NULL, e.minute, e.id`,
    matchId
  );
}

export interface EventInput {
  match_id: number;
  type: EventType;
  player_id: number | null;
  related_player_id: number | null;
  minute: number | null;
}

export async function addEvent(db: Db, e: EventInput) {
  await db.runAsync(
    'INSERT INTO events (match_id, type, player_id, related_player_id, minute) VALUES (?, ?, ?, ?, ?)',
    e.match_id,
    e.type,
    e.player_id,
    e.related_player_id,
    e.minute
  );
}

export async function deleteEvent(db: Db, id: number) {
  await db.runAsync('DELETE FROM events WHERE id = ?', id);
}

// Leaderboards

const LEADER_COLS = 'p.id, p.name, p.number, p.position, p.photo_uri';

export function goalLeaders(db: Db, limit = 5) {
  return db.getAllAsync<Leader>(
    `SELECT ${LEADER_COLS}, COUNT(*) AS value
     FROM events e JOIN players p ON p.id = e.player_id
     WHERE e.type = 'goal'
     GROUP BY p.id ORDER BY value DESC, p.name LIMIT ?`,
    limit
  );
}

export function assistLeaders(db: Db, limit = 5) {
  return db.getAllAsync<Leader>(
    `SELECT ${LEADER_COLS}, COUNT(*) AS value
     FROM events e JOIN players p ON p.id = e.related_player_id
     WHERE e.type = 'goal'
     GROUP BY p.id ORDER BY value DESC, p.name LIMIT ?`,
    limit
  );
}

export function cardLeaders(db: Db, limit = 5) {
  return db.getAllAsync<Leader>(
    `SELECT ${LEADER_COLS}, COUNT(*) AS value,
       SUM(e.type = 'yellow') AS yellows, SUM(e.type = 'red') AS reds
     FROM events e JOIN players p ON p.id = e.player_id
     WHERE e.type IN ('yellow', 'red')
     GROUP BY p.id ORDER BY reds DESC, yellows DESC, p.name LIMIT ?`,
    limit
  );
}
