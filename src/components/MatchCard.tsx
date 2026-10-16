import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import type { Match } from '../db/types';
import { formatTime, monthShort, weekdayShort } from '../lib/format';
import { matchResult } from '../lib/stats';
import { LiveBadge, ResultBadge } from './Badges';
import { Card } from './ui';

export function MatchCard({ match, onPress }: { match: Match; onPress: () => void }) {
  const date = new Date(match.date);
  const isHome = match.is_home === 1;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.dateBox}>
        <Text style={styles.weekday}>{weekdayShort(date)}</Text>
        <Text style={styles.day}>{date.getDate()}</Text>
        <Text style={styles.month}>{monthShort(date)}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.opponent} numberOfLines={1}>
          {match.opponent}
        </Text>
        <View style={styles.meta}>
          <MaterialCommunityIcons name={isHome ? 'home-outline' : 'bus'} size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {isHome ? 'Casa' : 'Fora'}
            {match.location ? ` · ${match.location}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {match.status === 'scheduled' ? (
          <>
            <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.primary} />
            <Text style={styles.time}>{formatTime(date)}</Text>
          </>
        ) : (
          <>
            <Text style={styles.score}>
              {isHome ? match.goals_for : match.goals_against}–{isHome ? match.goals_against : match.goals_for}
            </Text>
            {match.status === 'live' ? <LiveBadge /> : <ResultBadge result={matchResult(match)} size={22} />}
          </>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, padding: 14 },
  dateBox: {
    width: 54,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
  },
  weekday: { fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  day: { fontSize: 20, fontWeight: '800', color: Colors.primary, lineHeight: 24 },
  month: { fontSize: 11, color: Colors.primary },
  info: { flex: 1, gap: 4 },
  opponent: { fontSize: 16, fontWeight: '700', color: Colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: Colors.textSecondary, flexShrink: 1 },
  right: { alignItems: 'center', gap: 4, minWidth: 56 },
  time: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  score: { fontSize: 20, fontWeight: '800', color: Colors.text },
});
