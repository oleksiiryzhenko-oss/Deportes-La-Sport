import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { assistLeaders, cardLeaders, getTeam, goalLeaders, listMatches } from '../db/queries';
import type { Leader } from '../db/types';
import { useDbQuery } from '../hooks/useDbQuery';
import { teamRecord } from '../lib/stats';
import { PlayerAvatar } from '../components/Avatars';
import { CardIcon, ResultBadge } from '../components/Badges';
import { Card, EmptyState, SectionHeader, StatTile } from '../components/ui';

const loadStats = async (db: SQLiteDatabase) => {
  const [team, matches, goals, assists, cards] = await Promise.all([
    getTeam(db),
    listMatches(db),
    goalLeaders(db),
    assistLeaders(db),
    cardLeaders(db),
  ]);
  return { team, matches, goals, assists, cards };
};

function Leaderboard({
  title,
  icon,
  leaders,
  kitColor,
  renderValue,
}: {
  title: string;
  icon: ReactNode;
  leaders: Leader[];
  kitColor: string;
  renderValue: (l: Leader) => ReactNode;
}) {
  const navigation = useNavigation();
  if (leaders.length === 0) return null;
  return (
    <>
      <SectionHeader title={title} />
      <Card style={styles.board}>
        {leaders.map((l, i) => (
          <View key={l.id} style={[styles.leaderRow, i > 0 && styles.leaderBorder]}>
            <Text style={[styles.rank, i === 0 && styles.rankFirst]}>{i + 1}</Text>
            <PlayerAvatar photoUri={l.photo_uri} number={l.number} kitColor={kitColor} size={38} />
            <Text
              style={styles.leaderName}
              numberOfLines={1}
              onPress={() => navigation.navigate('Player', { id: l.id })}
            >
              {l.name}
            </Text>
            <View style={styles.leaderValue}>
              {i === 0 && icon}
              {renderValue(l)}
            </View>
          </View>
        ))}
      </Card>
    </>
  );
}

export default function EstatisticasScreen() {
  const { data } = useDbQuery(loadStats);
  if (!data) return <View style={styles.container} />;

  const { team, matches, goals, assists, cards } = data;
  const kit = team?.kit_color ?? Colors.white;
  const r = teamRecord(matches);

  if (r.played === 0 && goals.length === 0 && cards.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="chart-bar"
          title="Sem estatísticas ainda"
          message="Registe jogos e os seus eventos (golos, assistências, cartões) e as estatísticas aparecem aqui automaticamente."
        />
      </View>
    );
  }

  const pct = (n: number) => (r.played > 0 ? Math.round((n / r.played) * 100) : 0);
  const diff = r.goalsFor - r.goalsAgainst;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.summary}>
        <MaterialCommunityIcons name="trophy" size={140} color="rgba(255,255,255,0.07)" style={styles.summaryBg} />
        <Text style={styles.summaryTitle}>Balanço da época</Text>
        <View style={styles.summaryRow}>
          {[
            { label: 'Jogos', value: r.played },
            { label: 'Vitórias', value: r.wins },
            { label: 'Empates', value: r.draws },
            { label: 'Derrotas', value: r.losses },
          ].map((s) => (
            <View key={s.label} style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{s.value}</Text>
              <Text style={styles.summaryLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
        {r.played > 0 && (
          <>
            <View style={styles.bar}>
              {r.wins > 0 && <View style={{ flex: r.wins, backgroundColor: Colors.success }} />}
              {r.draws > 0 && <View style={{ flex: r.draws, backgroundColor: Colors.draw }} />}
              {r.losses > 0 && <View style={{ flex: r.losses, backgroundColor: Colors.danger }} />}
            </View>
            <Text style={styles.barLegend}>
              {pct(r.wins)}% vitórias · {pct(r.draws)}% empates · {pct(r.losses)}% derrotas
            </Text>
          </>
        )}
      </Card>

      <Card style={styles.tiles}>
        <StatTile icon={<MaterialCommunityIcons name="soccer" size={22} color={Colors.primary} />} value={r.goalsFor} label="Marcados" />
        <StatTile icon={<MaterialCommunityIcons name="shield-off-outline" size={22} color={Colors.primary} />} value={r.goalsAgainst} label="Sofridos" />
        <StatTile
          icon={<MaterialCommunityIcons name="plus-minus-variant" size={22} color={Colors.primary} />}
          value={diff > 0 ? `+${diff}` : diff}
          label="Diferença"
        />
      </Card>

      {r.form.length > 0 && (
        <>
          <SectionHeader title="Forma recente" />
          <Card style={styles.form}>
            {r.form.map((res, i) => (
              <ResultBadge key={i} result={res} size={36} />
            ))}
            <Text style={styles.formHint}>→ mais recente</Text>
          </Card>
        </>
      )}

      <Leaderboard
        title="Melhores marcadores"
        icon={<MaterialCommunityIcons name="crown" size={18} color={Colors.yellowCard} />}
        leaders={goals}
        kitColor={kit}
        renderValue={(l) => <Text style={styles.value}>{l.value}</Text>}
      />
      <Leaderboard
        title="Assistências"
        icon={<MaterialCommunityIcons name="shoe-cleat" size={18} color={Colors.primary} />}
        leaders={assists}
        kitColor={kit}
        renderValue={(l) => <Text style={styles.value}>{l.value}</Text>}
      />
      <Leaderboard
        title="Disciplina"
        icon={null}
        leaders={cards}
        kitColor={kit}
        renderValue={(l) => (
          <View style={styles.cards}>
            <CardIcon color={Colors.yellowCard} size={16} />
            <Text style={styles.cardCount}>{l.yellows ?? 0}</Text>
            <CardIcon color={Colors.redCard} size={16} />
            <Text style={styles.cardCount}>{l.reds ?? 0}</Text>
          </View>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  summary: { backgroundColor: Colors.primary, gap: 14, paddingVertical: 20 },
  summaryBg: { position: 'absolute', right: -24, top: -16 },
  summaryTitle: { color: Colors.onPrimaryMuted, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 },
  summaryRow: { flexDirection: 'row' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { color: Colors.white, fontSize: 28, fontWeight: '900' },
  summaryLabel: { color: Colors.onPrimaryMuted, fontSize: 12, fontWeight: '600' },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  barLegend: { color: Colors.onPrimaryMuted, fontSize: 12, textAlign: 'center' },
  tiles: { flexDirection: 'row', marginTop: 12, paddingVertical: 18 },
  form: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formHint: { flex: 1, textAlign: 'right', fontSize: 12, color: Colors.draw },
  board: { paddingVertical: 4 },
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  leaderBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
  rank: { width: 18, fontSize: 15, fontWeight: '800', color: Colors.draw, textAlign: 'center' },
  rankFirst: { color: Colors.primary },
  leaderName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  leaderValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 18, fontWeight: '900', color: Colors.primary, minWidth: 24, textAlign: 'right' },
  cards: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardCount: { fontSize: 15, fontWeight: '800', color: Colors.text, minWidth: 14 },
});
