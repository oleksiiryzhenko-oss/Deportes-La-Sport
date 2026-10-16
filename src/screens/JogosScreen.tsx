import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/colors';
import { listMatches } from '../db/queries';
import { useDbQuery } from '../hooks/useDbQuery';
import { MatchCard } from '../components/MatchCard';
import { Chip, EmptyState, Fab } from '../components/ui';

type Tab = 'upcoming' | 'finished';

export default function JogosScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('upcoming');
  const { data: matches } = useDbQuery(listMatches);
  if (!matches) return <View style={styles.container} />;

  const upcoming = matches
    .filter((m) => m.status !== 'finished')
    .sort((a, b) => (a.status === 'live' ? -1 : b.status === 'live' ? 1 : a.date.localeCompare(b.date)));
  const finished = matches.filter((m) => m.status === 'finished');
  const list = tab === 'upcoming' ? upcoming : finished;

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Chip label={`Próximos (${upcoming.length})`} icon="calendar-clock" selected={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <Chip label={`Terminados (${finished.length})`} icon="flag-checkered" selected={tab === 'finished'} onPress={() => setTab('finished')} />
      </View>

      <FlatList
        data={list}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <MatchCard match={item} onPress={() => navigation.navigate('Match', { id: item.id })} />
        )}
        ListEmptyComponent={
          tab === 'upcoming' ? (
            <EmptyState
              icon="calendar-blank"
              title="Sem jogos agendados"
              message="Agende o próximo jogo ou registe um jogo que já aconteceu."
              actionLabel="Agendar jogo"
              onAction={() => navigation.navigate('MatchForm')}
            />
          ) : (
            <EmptyState
              icon="trophy-outline"
              title="Ainda não há resultados"
              message="Os jogos terminados aparecem aqui, com o resultado e os marcadores."
            />
          )
        }
      />
      <Fab icon="calendar-plus" onPress={() => navigation.navigate('MatchForm')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  list: { padding: 16, paddingBottom: 100 },
});
