import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { EventType } from '../constants/football';
import type { Player } from '../db/types';
import { BottomSheet, MinuteStepper, PlayerList, type SheetOption } from './Sheets';
import { Button } from './ui';

const STEPS: Record<Exclude<EventType, 'opp_goal'>, { first: string; second?: string; skipSecond?: string; allowUnknown: boolean }> = {
  goal: { first: 'Quem marcou?', second: 'Quem fez a assistência?', skipSecond: 'Sem assistência', allowUnknown: true },
  yellow: { first: 'Cartão amarelo para…', allowUnknown: true },
  red: { first: 'Cartão vermelho para…', allowUnknown: true },
  sub: { first: 'Quem entra?', second: 'Quem sai?', allowUnknown: false },
};

export interface EventDraft {
  player_id: number | null;
  related_player_id: number | null;
  minute: number | null;
}

interface Props {
  type: EventType;
  opponent: string;
  initialMinute: number | null;
  players: Player[];
  onFieldIds: Set<number>;
  kitColor: string;
  onClose: () => void;
  onConfirm: (draft: EventDraft) => void;
}

/** Mount a fresh instance per event (use a `key`), so the steps start from scratch. */
export function EventSheet({ type, opponent, initialMinute, players, onFieldIds, kitColor, onClose, onConfirm }: Props) {
  const [minute, setMinute] = useState(initialMinute);
  const [first, setFirst] = useState<Player | null>(null);

  const confirm = (playerId: number | null, relatedId: number | null) =>
    onConfirm({ player_id: playerId, related_player_id: relatedId, minute });

  if (type === 'opp_goal') {
    return (
      <BottomSheet visible onClose={onClose} title={`Golo do ${opponent}`}>
        <MinuteStepper value={minute} onChange={setMinute} />
        <View style={styles.footer}>
          <Button title="Registar golo sofrido" icon="soccer" onPress={() => confirm(null, null)} />
        </View>
      </BottomSheet>
    );
  }

  const step = STEPS[type];
  const onSecondStep = first !== null && !!step.second;

  const onSelect = (player: Player) => {
    if (onSecondStep) confirm(first.id, player.id);
    else if (step.second) setFirst(player);
    else confirm(player.id, null);
  };

  const options: SheetOption[] = [];
  if (onSecondStep && step.skipSecond) {
    options.push({ label: step.skipSecond, icon: 'close', onPress: () => confirm(first.id, null) });
  }
  if (!onSecondStep && step.allowUnknown) {
    options.push({ label: 'Jogador não indicado', icon: 'account-question', onPress: () => confirm(null, null) });
  }

  return (
    <BottomSheet visible onClose={onClose} title={onSecondStep ? step.second : step.first}>
      <MinuteStepper value={minute} onChange={setMinute} />
      {onSecondStep && <Text style={styles.selected}>✓ {first.name}</Text>}
      <PlayerList
        players={onSecondStep ? players.filter((p) => p.id !== first.id) : players}
        kitColor={kitColor}
        onSelect={onSelect}
        options={options}
        highlightIds={onFieldIds}
        highlightLabel="Em campo"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  selected: { paddingHorizontal: 20, paddingBottom: 8, color: Colors.primary, fontWeight: '700' },
});
