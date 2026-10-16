import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { getFormation } from '../constants/football';
import { getLineup, getTeam, goalLeaders, listMatches, listPlayers } from '../db/queries';
import { useDbQuery } from '../hooks/useDbQuery';
import { resolveLineup, toLineupMap } from '../lib/lineup';
import { teamRecord, type TeamRecord } from '../lib/stats';
import { PlayerAvatar, TeamCrest } from '../components/Avatars';
import { LiveBadge, LiveClock } from '../components/Badges';
import { LineupPitch } from '../components/LineupPitch';
import { MatchCard } from '../components/MatchCard';
import { Card, EmptyState, SectionHeader } from '../components/ui';

const loadHome = async (db: SQLiteDatabase) => {
  const [team, players, lineup, matches, scorers] = await Promise.all([
    getTeam(db),
    listPlayers(db),
    getLineup(db),
    listMatches(db),
    goalLeaders(db, 1),
  ]);
  return { team, players, lineup, matches, topScorer: scorers[0] };
};

function RecordChips({ record }: { record: TeamRecord }) {
  const items = [
    { label: 'J', value: record.played },
    { label: 'V', value: record.wins },
    { label: 'E', value: record.draws },
    { label: 'D', value: record.losses },
  ];
  return (
    <View style={styles.chips}>
      {items.map((i) => (
        <View key={i.label} style={styles.recordChip}>
          <Text style={styles.recordValue}>{i.value}</Text>
          <Text style={styles.recordLabel}>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function InicioScreen() {
  const navigation = useNavigation();
  const { data } = useDbQuery(loadHome);
  if (!data) return <View style={styles.container} />;

  const { team, players, matches, topScorer } = data;
  const kit = team?.kit_color ?? Colors.white;
  const formation = getFormation(team?.formation);
  const lineup = resolveLineup(toLineupMap(data.lineup), players);
  const record = teamRecord(matches);
  const live = matches.find((m) => m.status === 'live');
  const next = matches
    .filter((m) => m.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const last = matches.find((m) => m.status === 'finished');

  const goTo = {
    tatica: () => navigation.navigate('Tabs', { screen: 'Tatica' }),
    jogos: () => navigation.navigate('Tabs', { screen: 'Jogos' }),
    newMatch: () => navigation.navigate('MatchForm'),
    newPlayer: () => navigation.navigate('PlayerForm'),
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="soccer" size={160} color="rgba(255,255,255,0.06)" style={styles.heroBall} />
        <TeamCrest uri={team?.crest_uri ?? null} size={76} onDark />
        <Text style={styles.heroName}>{team?.name || 'A minha equipa'}</Text>
        <RecordChips record={record} />
      </View>

      <View style={styles.body}>
        {live && (
          <Card onPress={() => navigation.navigate('Match', { id: live.id })} style={styles.liveCard}>
            <View style={styles.liveRow}>
              <LiveBadge />
              {live.started_at != null && <LiveClock startedAt={live.started_at} style={styles.liveClock} />}
            </View>
            <Text style={styles.liveTitle}>
              {team?.name || 'Nós'} {live.goals_for} – {live.goals_against} {live.opponent}
            </Text>
            <Text style={styles.liveHint}>Toque para registar golos e cartões</Text>
          </Card>
        )}

        <SectionHeader title="O meu onze" actionLabel="Editar" onAction={goTo.tatica} />
        {players.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon="tshirt-crew"
              title="Ainda não há jogadores"
              message="Adicione o plantel para montar o onze no campo."
              actionLabel="Adicionar jogador"
              onAction={goTo.newPlayer}
            />
          </Card>
        ) : (
          <Card onPress={goTo.tatica} style={styles.pitchCard}>
            <View style={styles.pitchHeader}>
              <View style={styles.formationBadge}>
                <MaterialCommunityIcons name="strategy" size={14} color={Colors.primary} />
                <Text style={styles.formationText}>{formation.name}</Text>
              </View>
              <Text style={styles.pitchMode}>Futebol {formation.mode}</Text>
            </View>
            <LineupPitch formation={formation} lineup={lineup} kitColor={kit} />
          </Card>
        )}

        <SectionHeader title="Próximo jogo" actionLabel="Ver todos" onAction={goTo.jogos} />
        {next ? (
          <MatchCard match={next} onPress={() => navigation.navigate('Match', { id: next.id })} />
        ) : (
          <Card>
            <EmptyState
              compact
              icon="calendar-plus"
              title="Nenhum jogo agendado"
              actionLabel="Agendar jogo"
              onAction={goTo.newMatch}
            />
          </Card>
        )}

        {last && (
          <>
            <SectionHeader title="Último resultado" />
            <MatchCard match={last} onPress={() => navigation.navigate('Match', { id: last.id })} />
          </>
        )}

        {topScorer && (
          <>
            <SectionHeader title="Melhor marcador" />
            <Card onPress={() => navigation.navigate('Player', { id: topScorer.id })} style={styles.row}>
              <PlayerAvatar photoUri={topScorer.photo_uri} number={topScorer.number} kitColor={kit} size={52} />
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{topScorer.name}</Text>
                <Text style={styles.rowSubtitle}>Líder de golos da equipa</Text>
              </View>
              <View style={styles.goalsBadge}>
                <MaterialCommunityIcons name="soccer" size={16} color={Colors.white} />
                <Text style={styles.goalsText}>{topScorer.value}</Text>
              </View>
            </Card>
          </>
        )}

        <SectionHeader title="Aprender" />
        <Card onPress={() => navigation.navigate('Rules')} style={styles.row}>
          <View style={styles.rulesIcon}>
            <MaterialCommunityIcons name="whistle" size={28} color={Colors.white} />
          </View>
          <View style={styles.rowText}>
            <Text style={styles.rowTitle}>Regras do jogo</Text>
            <Text style={styles.rowSubtitle}>Fora de jogo, penáltis, cartões e mais</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.draw} />
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 10,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroBall: { position: 'absolute', right: -40, top: -30 },
  heroName: { fontSize: 26, fontWeight: '800', color: Colors.white, textAlign: 'center' },
  chips: { flexDirection: 'row', gap: 8 },
  recordChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: Colors.onPrimarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recordValue: { fontSize: 17, fontWeight: '800', color: Colors.white },
  recordLabel: { fontSize: 12, fontWeight: '700', color: Colors.onPrimaryMuted },
  body: { paddingHorizontal: 16 },
  liveCard: { marginTop: 16, borderWidth: 2, borderColor: Colors.live, gap: 6 },
  liveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveClock: { fontSize: 16, fontWeight: '800', color: Colors.live, fontVariant: ['tabular-nums'] },
  liveTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  liveHint: { fontSize: 13, color: Colors.textSecondary },
  pitchCard: { padding: 10 },
  pitchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  formationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  formationText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  pitchMode: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  rowSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  goalsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  goalsText: { color: Colors.white, fontWeight: '800', fontSize: 15 },
  rulesIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
