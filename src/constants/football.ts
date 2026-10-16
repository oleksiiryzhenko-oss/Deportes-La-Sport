export type Position = 'GR' | 'DEF' | 'MED' | 'AV';

export const POSITIONS: { key: Position; label: string; plural: string }[] = [
  { key: 'GR', label: 'Guarda-redes', plural: 'Guarda-redes' },
  { key: 'DEF', label: 'Defesa', plural: 'Defesas' },
  { key: 'MED', label: 'Médio', plural: 'Médios' },
  { key: 'AV', label: 'Avançado', plural: 'Avançados' },
];

export function positionLabel(position: Position): string {
  return POSITIONS.find((p) => p.key === position)?.label ?? position;
}

export type GameMode = 11 | 7 | 5;

export const GAME_MODES: { mode: GameMode; label: string }[] = [
  { mode: 11, label: 'Futebol 11' },
  { mode: 7, label: 'Futebol 7' },
  { mode: 5, label: 'Futebol 5' },
];

export interface SlotPoint {
  x: number;
  y: number;
}

export interface Formation {
  id: string;
  name: string;
  mode: GameMode;
  slots: SlotPoint[];
}

// x: 0 = left touchline, 1 = right. y: 0 = opponent goal line, 1 = own goal line. Slot 0 is always the goalkeeper.
const GK: SlotPoint = { x: 0.5, y: 0.92 };
const row = (y: number, xs: number[]): SlotPoint[] => xs.map((x) => ({ x, y }));

export const FORMATIONS: Formation[] = [
  { id: '11:4-3-3', name: '4-3-3', mode: 11, slots: [GK, ...row(0.74, [0.14, 0.38, 0.62, 0.86]), ...row(0.52, [0.25, 0.5, 0.75]), ...row(0.24, [0.18, 0.5, 0.82])] },
  { id: '11:4-4-2', name: '4-4-2', mode: 11, slots: [GK, ...row(0.74, [0.14, 0.38, 0.62, 0.86]), ...row(0.5, [0.14, 0.38, 0.62, 0.86]), ...row(0.24, [0.36, 0.64])] },
  { id: '11:4-2-3-1', name: '4-2-3-1', mode: 11, slots: [GK, ...row(0.74, [0.14, 0.38, 0.62, 0.86]), ...row(0.58, [0.36, 0.64]), ...row(0.4, [0.18, 0.5, 0.82]), ...row(0.2, [0.5])] },
  { id: '11:3-5-2', name: '3-5-2', mode: 11, slots: [GK, ...row(0.74, [0.25, 0.5, 0.75]), ...row(0.5, [0.1, 0.3, 0.5, 0.7, 0.9]), ...row(0.24, [0.36, 0.64])] },
  { id: '11:3-4-3', name: '3-4-3', mode: 11, slots: [GK, ...row(0.74, [0.25, 0.5, 0.75]), ...row(0.52, [0.14, 0.38, 0.62, 0.86]), ...row(0.24, [0.18, 0.5, 0.82])] },
  { id: '11:5-3-2', name: '5-3-2', mode: 11, slots: [GK, ...row(0.74, [0.08, 0.29, 0.5, 0.71, 0.92]), ...row(0.5, [0.25, 0.5, 0.75]), ...row(0.24, [0.36, 0.64])] },
  { id: '7:2-3-1', name: '2-3-1', mode: 7, slots: [GK, ...row(0.72, [0.3, 0.7]), ...row(0.48, [0.18, 0.5, 0.82]), ...row(0.22, [0.5])] },
  { id: '7:3-2-1', name: '3-2-1', mode: 7, slots: [GK, ...row(0.72, [0.2, 0.5, 0.8]), ...row(0.46, [0.33, 0.67]), ...row(0.22, [0.5])] },
  { id: '7:3-3', name: '3-3', mode: 7, slots: [GK, ...row(0.7, [0.2, 0.5, 0.8]), ...row(0.32, [0.2, 0.5, 0.8])] },
  { id: '5:1-2-1', name: '1-2-1', mode: 5, slots: [GK, ...row(0.7, [0.5]), ...row(0.48, [0.22, 0.78]), ...row(0.24, [0.5])] },
  { id: '5:2-2', name: '2-2', mode: 5, slots: [GK, ...row(0.66, [0.3, 0.7]), ...row(0.32, [0.3, 0.7])] },
];

export const DEFAULT_FORMATION_ID = FORMATIONS[0].id;

export function getFormation(id: string | null | undefined): Formation {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
}

export function slotRole(slot: SlotPoint, index: number): Position {
  if (index === 0) return 'GR';
  if (slot.y >= 0.62) return 'DEF';
  if (slot.y >= 0.36) return 'MED';
  return 'AV';
}

export const KIT_COLORS: { name: string; hex: string }[] = [
  { name: 'Branco', hex: '#FFFFFF' },
  { name: 'Azul', hex: '#043494' },
  { name: 'Celeste', hex: '#6CB4EE' },
  { name: 'Vermelho', hex: '#D62828' },
  { name: 'Grená', hex: '#7B1E3A' },
  { name: 'Verde', hex: '#2A9D4B' },
  { name: 'Amarelo', hex: '#F4C430' },
  { name: 'Laranja', hex: '#F77F00' },
  { name: 'Preto', hex: '#1A1A1A' },
];

export type EventType = 'goal' | 'opp_goal' | 'yellow' | 'red' | 'sub';
