import { useCallback, useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { positionLabel } from '../constants/football';
import { getPlayer, getTeam, playerStats } from '../db/queries';
import { useDbQuery } from '../hooks/useDbQuery';
import type { RootStackScreenProps } from '../navigation/types';
import { PlayerAvatar } from '../components/Avatars';
import { CardIcon } from '../components/Badges';
import { Card, EmptyState, HeaderIconButton, SectionHeader, StatTile } from '../components/ui';

export default function PlayerScreen({ route, navigation }: RootStackScreenProps<'Player'>) {
  const { id } = route.params;
  const { data } = useDbQuery(
    useCallback(
      async (db) => {
        const [player, stats, team] = await Promise.all([getPlayer(db, id), playerStats(db, id), getTeam(db)]);
        return { player, stats, team };
      },
      [id]
    )
  );

  const name = data?.player?.name;
  useLayoutEffect(() => {
    navigation.setOptions({
      title: name ?? 'Jogador',
      headerRight: () => <HeaderIconButton icon="pencil" onPress={() => navigation.navigate('PlayerForm', { id })} />,
    });
  }, [navigation, name, id]);

  if (!data) return <View style={styles.container} />;
  const { player, stats, team } = data;
  if (!player) return <EmptyState icon="account-question" title="Jogador não encontrado" />;

  const s = stats ?? { appearances: 0, goals: 0, assists: 0, yellows: 0, reds: 0 };
  const goalsPerGame = s.appearances > 0 ? (s.goals / s.appearances).toFixed(2) : '0.00';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <MaterialCommunityIcons name="tshirt-crew" size={180} color="rgba(255,255,255,0.06)" style={styles.heroBg} />
        <PlayerAvatar
          photoUri={player.photo_uri}
          number={player.number}
          kitColor={team?.kit_color ?? Colors.white}
          size={112}
          bordered
        />
        <Text style={styles.name}>{player.name}</Text>
        <View style={styles.tags}>
          {player.number != null && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>#{player.number}</Text>
            </View>
          )}
          <View style={styles.tag}>
            <Text style={styles.tagText}>{positionLabel(player.position)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Card style={styles.statsCard}>
          <StatTile icon={<MaterialCommunityIcons name="soccer-field" size={22} color={Colors.primary} />} value={s.appearances} label="Jogos" />
          <StatTile icon={<MaterialCommunityIcons name="soccer" size={22} color={Colors.primary} />} value={s.goals} label="Golos" />
          <StatTile icon={<MaterialCommunityIcons name="shoe-cleat" size={22} color={Colors.primary} />} value={s.assists} label="Assistências" />
        </Card>

        <SectionHeader title="Disciplina" />
        <Card style={styles.statsCard}>
          <StatTile icon={<CardIcon color={Colors.yellowCard} />} value={s.yellows} label="Amarelos" />
          <StatTile icon={<CardIcon color={Colors.redCard} />} value={s.reds} label="Vermelhos" />
        </Card>

        <SectionHeader title="Rendimento" />
        <Card style={styles.list}>
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Golos por jogo</Text>
            <Text style={styles.listValue}>{goalsPerGame}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.listRow}>
            <Text style={styles.listLabel}>Participações em golo</Text>
            <Text style={styles.listValue}>{s.goals + s.assists}</Text>
          </View>
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
    paddingTop: 16,
    paddingBottom: 48,
    gap: 10,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  heroBg: { position: 'absolute', left: -40, bottom: -40 },
  name: { fontSize: 24, fontWeight: '800', color: Colors.white },
  tags: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: Colors.onPrimarySoft, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  tagText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  body: { paddingHorizontal: 16 },
  statsCard: { flexDirection: 'row', paddingVertical: 20 },
  list: { paddingVertical: 4 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  listLabel: { fontSize: 15, color: Colors.textSecondary },
  listValue: { fontSize: 17, fontWeight: '800', color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border },
});
