import type { Match } from '../db/types';

export type Result = 'V' | 'E' | 'D';

export function matchResult(m: Match): Result {
  if (m.goals_for > m.goals_against) return 'V';
  if (m.goals_for === m.goals_against) return 'E';
  return 'D';
}

/** Expects matches ordered by date, newest first. */
export function teamRecord(matches: Match[]) {
  const finished = matches.filter((m) => m.status === 'finished');
  const record = {
    played: finished.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    form: finished.slice(0, 5).map(matchResult).reverse(),
  };
  for (const m of finished) {
    const r = matchResult(m);
    if (r === 'V') record.wins++;
    else if (r === 'E') record.draws++;
    else record.losses++;
    record.goalsFor += m.goals_for;
    record.goalsAgainst += m.goals_against;
  }
  return record;
}

export type TeamRecord = ReturnType<typeof teamRecord>;
