import { SectionList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { POSITIONS, positionLabel } from '../constants/football';
import { getTeam, listSquad } from '../db/queries';
import { useDbQuery } from '../hooks/useDbQuery';
import { PlayerAvatar, TeamCrest } from '../components/Avatars';
import { Card, EmptyState, Fab } from '../components/ui';

const loadSquad = async (db: SQLiteDatabase) => {
  const [team, players] = await Promise.all([getTeam(db), listSquad(db)]);
  return { team, players };
};

export default function EquipaScreen() {
  const navigation = useNavigation();
  const { data } = useDbQuery(loadSquad);
  if (!data) return <View style={styles.container} />;

  const { team, players } = data;
  const kit = team?.kit_color ?? Colors.white;
  const sections = POSITIONS.map((p) => ({
    key: p.key,
    title: p.plural,
    data: players.filter((x) => x.position === p.key),
  })).filter((s) => s.data.length > 0);

  return (
    <View style={styles.container}>
      {players.length === 0 ? (
        <EmptyState
          icon="tshirt-crew"
          title="Ainda não há jogadores"
          message="Adicione os jogadores da sua equipa para montar o onze e registar golos, assistências e cartões."
          actionLabel="Adicionar jogador"
          onAction={() => navigation.navigate('PlayerForm')}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <Card onPress={() => navigation.navigate('TeamSettings')} style={styles.teamCard}>
              <TeamCrest uri={team?.crest_uri ?? null} size={56} onDark />
              <View style={styles.flex}>
                <Text style={styles.teamName}>{team?.name || 'A minha equipa'}</Text>
                <Text style={styles.teamMeta}>
                  {players.length} {players.length === 1 ? 'jogador' : 'jogadores'}
                </Text>
              </View>
              <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.white} />
            </Card>
          }
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{section.data.length}</Text>
              </View>
            </View>
          )}
          renderItem={({ item }) => (
            <Card onPress={() => navigation.navigate('Player', { id: item.id })} style={styles.playerRow}>
              <PlayerAvatar photoUri={item.photo_uri} number={item.number} kitColor={kit} size={48} />
              <View style={styles.flex}>
                <Text style={styles.playerName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.playerMeta}>
                  {item.number != null ? `#${item.number} · ` : ''}
                  {positionLabel(item.position)}
                </Text>
              </View>
              {item.goals > 0 && (
                <View style={styles.goals}>
                  <MaterialCommunityIcons name="soccer" size={16} color={Colors.primary} />
                  <Text style={styles.goalsText}>{item.goals}</Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.draw} />
            </Card>
          )}
        />
      )}
      <Fab icon="account-plus" onPress={() => navigation.navigate('PlayerForm')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  list: { padding: 16, paddingBottom: 100 },
  teamCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primary },
  teamName: { fontSize: 18, fontWeight: '800', color: Colors.white },
  teamMeta: { fontSize: 13, color: Colors.onPrimaryMuted, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  countBadge: { backgroundColor: Colors.primarySoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 1 },
  countText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8 },
  playerName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  playerMeta: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  goals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  goalsText: { fontSize: 14, fontWeight: '800', color: Colors.primary },
});
