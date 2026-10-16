import { useCallback, useLayoutEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { getFormation, type EventType } from '../constants/football';
import {
  addEvent,
  deleteEvent,
  finishMatch,
  getMatch,
  getMatchLineup,
  getTeam,
  listEvents,
  listPlayers,
  recordResult,
  startMatch,
} from '../db/queries';
import type { MatchEvent } from '../db/types';
import { useDbQuery } from '../hooks/useDbQuery';
import { currentMinute, formatDateTime } from '../lib/format';
import { resolveLineup, toLineupMap } from '../lib/lineup';
import { matchResult } from '../lib/stats';
import type { RootStackScreenProps } from '../navigation/types';
import { OpponentCrest, TeamCrest } from '../components/Avatars';
import { CardIcon, LiveBadge, LiveClock, ResultBadge } from '../components/Badges';
import { EventSheet, type EventDraft } from '../components/EventSheet';
import { LineupPitch } from '../components/LineupPitch';
import { Button, Card, EmptyState, HeaderIconButton, SectionHeader } from '../components/ui';

function EventIcon({ type }: { type: EventType }) {
  switch (type) {
    case 'goal':
      return <MaterialCommunityIcons name="soccer" size={22} color={Colors.primary} />;
    case 'opp_goal':
      return <MaterialCommunityIcons name="soccer" size={22} color={Colors.draw} />;
    case 'yellow':
      return <CardIcon color={Colors.yellowCard} />;
    case 'red':
      return <CardIcon color={Colors.redCard} />;
    case 'sub':
      return <MaterialCommunityIcons name="swap-vertical-bold" size={22} color={Colors.success} />;
  }
}

function describeEvent(e: MatchEvent, opponent: string): { title: string; subtitle?: string } {
  const name = e.player_name ?? (e.player_id === null ? 'Jogador não indicado' : 'Jogador removido');
  switch (e.type) {
    case 'goal':
      return { title: `Golo · ${name}`, subtitle: e.related_name ? `Assistência: ${e.related_name}` : undefined };
    case 'opp_goal':
      return { title: `Golo do ${opponent}` };
    case 'yellow':
      return { title: `Cartão amarelo · ${name}` };
    case 'red':
      return { title: `Cartão vermelho · ${name}` };
    case 'sub':
      return { title: 'Substituição', subtitle: `Entra ${name} · Sai ${e.related_name ?? '—'}` };
  }
}

function ActionTile({ icon, label, onPress }: { icon: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: Colors.primarySoft }}
      style={({ pressed }) => [styles.actionTile, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function MatchScreen({ route, navigation }: RootStackScreenProps<'Match'>) {
  const { id } = route.params;
  const db = useSQLiteContext();
  const [sheet, setSheet] = useState<{ type: EventType; minute: number | null; key: number } | null>(null);

  const { data, reload } = useDbQuery(
    useCallback(
      async (d) => {
        const [match, events, team, players, lineup] = await Promise.all([
          getMatch(d, id),
          listEvents(d, id),
          getTeam(d),
          listPlayers(d),
          getMatchLineup(d, id),
        ]);
        return { match, events, team, players, lineup };
      },
      [id]
    )
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderIconButton icon="pencil" onPress={() => navigation.navigate('MatchForm', { id })} />,
    });
  }, [navigation, id]);

  if (!data) return <View style={styles.container} />;
  const { match, events, team, players, lineup } = data;
  if (!match) return <EmptyState icon="calendar-remove" title="Jogo não encontrado" />;

  const teamName = team?.name || 'A minha equipa';
  const kit = team?.kit_color ?? Colors.white;
  const isHome = match.is_home === 1;
  const onFieldIds = new Set(lineup.map((l) => l.player_id));
  const orderedPlayers = [...players].sort((a, b) => Number(onFieldIds.has(b.id)) - Number(onFieldIds.has(a.id)));
  const formation = getFormation(match.formation);

  const run = async (action: () => Promise<unknown>) => {
    await action();
    await reload();
  };

  const openEvent = (type: EventType) => {
    const minute = match.status === 'live' && match.started_at != null ? currentMinute(match.started_at) : null;
    setSheet({ type, minute, key: Date.now() });
  };

  const confirmEvent = (draft: EventDraft) => {
    if (!sheet) return;
    const type = sheet.type;
    setSheet(null);
    run(() => addEvent(db, { match_id: id, type, ...draft }));
  };

  const removeEvent = (e: MatchEvent) => {
    Alert.alert('Apagar evento?', describeEvent(e, match.opponent).title, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar', style: 'destructive', onPress: () => run(() => deleteEvent(db, e.id)) },
    ]);
  };

  const finish = () => {
    Alert.alert('Terminar o jogo?', 'O resultado fica registado nas estatísticas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Terminar', onPress: () => run(() => finishMatch(db, id)) },
    ]);
  };

  const ours = (
    <View style={styles.side}>
      <TeamCrest uri={team?.crest_uri ?? null} size={64} onDark />
      <Text style={styles.sideName} numberOfLines={2}>
        {teamName}
      </Text>
    </View>
  );
  const theirs = (
    <View style={styles.side}>
      <OpponentCrest name={match.opponent} size={64} />
      <Text style={styles.sideName} numberOfLines={2}>
        {match.opponent}
      </Text>
    </View>
  );
  const homeGoals = isHome ? match.goals_for : match.goals_against;
  const awayGoals = isHome ? match.goals_against : match.goals_for;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.scoreboard}>
          <Text style={styles.when}>{formatDateTime(match.date)}</Text>
          <View style={styles.scoreRow}>
            {isHome ? ours : theirs}
            <View style={styles.center}>
              {match.status === 'scheduled' ? (
                <Text style={styles.vs}>VS</Text>
              ) : (
                <Text style={styles.score}>
                  {homeGoals} – {awayGoals}
                </Text>
              )}
              {match.status === 'live' && (
                <View style={styles.statusRow}>
                  <LiveBadge />
                  {match.started_at != null && <LiveClock startedAt={match.started_at} style={styles.clock} />}
                </View>
              )}
              {match.status === 'finished' && (
                <View style={styles.statusRow}>
                  <ResultBadge result={matchResult(match)} size={20} />
                  <Text style={styles.statusText}>Terminado</Text>
                </View>
              )}
              {match.status === 'scheduled' && <Text style={styles.statusText}>Agendado</Text>}
            </View>
            {isHome ? theirs : ours}
          </View>
          {match.location && (
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.onPrimaryMuted} />
              <Text style={styles.location}>{match.location}</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          {match.status === 'scheduled' ? (
            <Card style={styles.startCard}>
              <MaterialCommunityIcons name="whistle" size={40} color={Colors.primary} />
              <Text style={styles.startTitle}>Pronto para o apito inicial?</Text>
              <Text style={styles.startText}>
                O onze atual da Tática fica guardado como titulares deste jogo.
              </Text>
              <Button title="Iniciar jogo ao vivo" icon="timer-play-outline" onPress={() => run(() => startMatch(db, id))} style={styles.fullWidth} />
              <Button
                title="Registar resultado"
                icon="clipboard-check-outline"
                variant="outline"
                onPress={() => run(() => recordResult(db, id))}
                style={styles.fullWidth}
              />
              <Text style={styles.startHint}>Use «Registar resultado» para jogos que já aconteceram.</Text>
            </Card>
          ) : (
            <>
              <SectionHeader title="Registar" />
              <View style={styles.actions}>
                <ActionTile icon={<MaterialCommunityIcons name="soccer" size={26} color={Colors.primary} />} label="Golo" onPress={() => openEvent('goal')} />
                <ActionTile icon={<MaterialCommunityIcons name="soccer" size={26} color={Colors.draw} />} label="Golo sofrido" onPress={() => openEvent('opp_goal')} />
                <ActionTile icon={<MaterialCommunityIcons name="swap-vertical-bold" size={26} color={Colors.success} />} label="Substituição" onPress={() => openEvent('sub')} />
                <ActionTile icon={<CardIcon color={Colors.yellowCard} size={24} />} label="Amarelo" onPress={() => openEvent('yellow')} />
                <ActionTile icon={<CardIcon color={Colors.redCard} size={24} />} label="Vermelho" onPress={() => openEvent('red')} />
              </View>
              {match.status === 'live' && (
                <Button title="Terminar jogo" icon="flag-checkered" variant="danger" onPress={finish} style={styles.finish} />
              )}
            </>
          )}

          {match.status !== 'scheduled' && (
            <>
              <SectionHeader title="Eventos" />
              {events.length === 0 ? (
                <Card>
                  <EmptyState compact icon="timeline-clock-outline" title="Ainda sem eventos" message="Os golos, cartões e substituições aparecem aqui." />
                </Card>
              ) : (
                <Card style={styles.events}>
                  {events.map((e, i) => {
                    const d = describeEvent(e, match.opponent);
                    return (
                      <Pressable key={e.id} onLongPress={() => removeEvent(e)} style={[styles.eventRow, i > 0 && styles.eventBorder]}>
                        <Text style={styles.eventMinute}>{e.minute != null ? `${e.minute}'` : '—'}</Text>
                        <View style={styles.eventIcon}>
                          <EventIcon type={e.type} />
                        </View>
                        <View style={styles.eventText}>
                          <Text style={styles.eventTitle}>{d.title}</Text>
                          {d.subtitle && <Text style={styles.eventSubtitle}>{d.subtitle}</Text>}
                        </View>
                      </Pressable>
                    );
                  })}
                  <Text style={styles.eventHint}>Mantenha premido um evento para o apagar</Text>
                </Card>
              )}
            </>
          )}

          {lineup.length > 0 && (
            <>
              <SectionHeader title={`Titulares · ${formation.name}`} />
              <Card style={styles.pitchCard}>
                <LineupPitch formation={formation} lineup={resolveLineup(toLineupMap(lineup), players)} kitColor={kit} />
              </Card>
            </>
          )}
        </View>
      </ScrollView>

      {sheet && (
        <EventSheet
          key={sheet.key}
          type={sheet.type}
          opponent={match.opponent}
          initialMinute={sheet.minute}
          players={orderedPlayers}
          onFieldIds={onFieldIds}
          kitColor={kit}
          onClose={() => setSheet(null)}
          onConfirm={confirmEvent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 40 },
  scoreboard: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 16,
  },
  when: { color: Colors.onPrimaryMuted, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-start' },
  side: { flex: 1, alignItems: 'center', gap: 8 },
  sideName: { color: Colors.white, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  center: { alignItems: 'center', gap: 8, paddingTop: 10, minWidth: 110 },
  score: { color: Colors.white, fontSize: 40, fontWeight: '900', fontVariant: ['tabular-nums'] },
  vs: { color: Colors.white, fontSize: 28, fontWeight: '900', marginTop: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { color: Colors.onPrimaryMuted, fontWeight: '700', fontSize: 13 },
  clock: { color: Colors.white, fontWeight: '800', fontSize: 15, fontVariant: ['tabular-nums'] },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  location: { color: Colors.onPrimaryMuted, fontSize: 13 },
  body: { paddingHorizontal: 16 },
  startCard: { alignItems: 'center', gap: 10, marginTop: 20, paddingVertical: 24 },
  startTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  startText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 6 },
  startHint: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionTile: {
    width: '31.5%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  finish: { marginTop: 14 },
  events: { paddingVertical: 4 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  eventBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  eventMinute: { width: 36, fontSize: 15, fontWeight: '800', color: Colors.primary, fontVariant: ['tabular-nums'] },
  eventIcon: { width: 28, alignItems: 'center' },
  eventText: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  eventSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  eventHint: { fontSize: 12, color: Colors.draw, textAlign: 'center', paddingVertical: 8 },
  pitchCard: { padding: 10 },
});
