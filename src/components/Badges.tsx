import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import { Colors } from '../constants/colors';
import { formatClock } from '../lib/format';
import type { Result } from '../lib/stats';

const RESULT_COLORS: Record<Result, string> = { V: Colors.success, E: Colors.draw, D: Colors.danger };

export function ResultBadge({ result, size = 24 }: { result: Result; size?: number }) {
  return (
    <View style={[styles.result, { width: size, height: size, borderRadius: size / 4, backgroundColor: RESULT_COLORS[result] }]}>
      <Text style={[styles.resultText, { fontSize: size * 0.5 }]}>{result}</Text>
    </View>
  );
}

export function LiveBadge() {
  return (
    <View style={styles.live}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>AO VIVO</Text>
    </View>
  );
}

export function CardIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size * 0.7,
        height: size,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ rotate: '12deg' }],
      }}
    />
  );
}

export function LiveClock({ startedAt, style }: { startedAt: number; style?: StyleProp<TextStyle> }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <Text style={style}>{formatClock(now - startedAt)}</Text>;
}

const styles = StyleSheet.create({
  result: { alignItems: 'center', justifyContent: 'center' },
  resultText: { color: Colors.white, fontWeight: '800' },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.live,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  liveText: { color: Colors.white, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
