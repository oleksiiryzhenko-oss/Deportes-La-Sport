import type { EventType, Position } from '../constants/football';

export interface Team {
  name: string;
  kit_color: string;
  crest_uri: string | null;
  formation: string;
}

export interface Player {
  id: number;
  name: string;
  number: number | null;
  position: Position;
  photo_uri: string | null;
}

export type SquadPlayer = Player & { goals: number };

export interface LineupSlot {
  slot: number;
  player_id: number;
}

export type MatchStatus = 'scheduled' | 'live' | 'finished';

export interface Match {
  id: number;
  opponent: string;
  date: string;
  location: string | null;
  is_home: number;
  status: MatchStatus;
  started_at: number | null;
  formation: string | null;
  goals_for: number;
  goals_against: number;
}

export interface MatchEvent {
  id: number;
  match_id: number;
  type: EventType;
  player_id: number | null;
  related_player_id: number | null;
  minute: number | null;
  player_name: string | null;
  related_name: string | null;
}

export type Leader = Player & { value: number; yellows?: number; reds?: number };

export interface PlayerStats {
  appearances: number;
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
}
