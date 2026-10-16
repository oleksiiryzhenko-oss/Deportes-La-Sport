import { slotRole, type Formation, type Position } from '../constants/football';
import type { LineupSlot, Player } from '../db/types';

/** slot index → player id */
export type LineupMap = Record<number, number>;

export function toLineupMap(rows: LineupSlot[]): LineupMap {
  const map: LineupMap = {};
  for (const row of rows) map[row.slot] = row.player_id;
  return map;
}

export function resolveLineup(map: LineupMap, players: Player[]): Record<number, Player | undefined> {
  const byId = new Map(players.map((p) => [p.id, p]));
  const out: Record<number, Player | undefined> = {};
  for (const [slot, id] of Object.entries(map)) out[Number(slot)] = byId.get(id);
  return out;
}

export function assignSlot(map: LineupMap, slot: number, playerId: number | null): LineupMap {
  const next: LineupMap = {};
  for (const [s, id] of Object.entries(map)) {
    if (id !== playerId && Number(s) !== slot) next[Number(s)] = id;
  }
  if (playerId !== null) next[slot] = playerId;
  return next;
}

export function swapSlots(map: LineupMap, a: number, b: number): LineupMap {
  const next = { ...map };
  const pa = map[a];
  const pb = map[b];
  delete next[a];
  delete next[b];
  if (pb !== undefined) next[a] = pb;
  if (pa !== undefined) next[b] = pa;
  return next;
}

export function trimLineup(map: LineupMap, slotCount: number): LineupMap {
  const next: LineupMap = {};
  for (const [s, id] of Object.entries(map)) if (Number(s) < slotCount) next[Number(s)] = id;
  return next;
}

export function firstEmptySlotFor(map: LineupMap, formation: Formation, position: Position): number | null {
  const empty = formation.slots.map((_, i) => i).filter((i) => map[i] === undefined);
  const matching = empty.find((i) => slotRole(formation.slots[i], i) === position);
  return matching ?? empty[0] ?? null;
}

export function autoFill(map: LineupMap, formation: Formation, players: Player[]): LineupMap {
  const next = trimLineup(map, formation.slots.length);
  const used = new Set(Object.values(next));
  const free = players.filter((p) => !used.has(p.id));

  formation.slots.forEach((slot, i) => {
    if (next[i] !== undefined || free.length === 0) return;
    const role = slotRole(slot, i);
    let idx = free.findIndex((p) => p.position === role);
    if (idx === -1 && role !== 'GR') idx = free.findIndex((p) => p.position !== 'GR');
    if (idx === -1) idx = 0;
    next[i] = free[idx].id;
    free.splice(idx, 1);
  });
  return next;
}
