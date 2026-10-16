import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { initials } from '../lib/format';
import { Jersey } from './Jersey';

export function PlayerAvatar({
  photoUri,
  number,
  kitColor,
  size = 44,
  bordered,
}: {
  photoUri: string | null;
  number: number | null;
  kitColor: string;
  size?: number;
  bordered?: boolean;
}) {
  const frame = [
    { width: size, height: size, borderRadius: size / 2 },
    bordered && styles.bordered,
  ];
  if (photoUri) return <Image source={{ uri: photoUri }} style={frame} />;
  return (
    <View style={[styles.jerseyFrame, frame]}>
      <Jersey color={kitColor} number={number} size={size * 0.72} />
    </View>
  );
}

export function TeamCrest({ uri, size = 56, onDark }: { uri: string | null; size?: number; onDark?: boolean }) {
  const frame = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[frame, onDark && styles.bordered]} />;
  return (
    <View style={[styles.center, frame, { backgroundColor: onDark ? Colors.onPrimarySoft : Colors.primarySoft }]}>
      <MaterialCommunityIcons name="shield-half-full" size={size * 0.55} color={onDark ? Colors.white : Colors.primary} />
    </View>
  );
}

export function OpponentCrest({ name, size = 56 }: { name: string; size?: number }) {
  return (
    <View style={[styles.center, styles.opponent, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.opponentText, { fontSize: size * 0.32 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  jerseyFrame: { backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  bordered: { borderWidth: 3, borderColor: Colors.white },
  opponent: { backgroundColor: Colors.onPrimarySoft, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  opponentText: { color: Colors.white, fontWeight: '800' },
});
