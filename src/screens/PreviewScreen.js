import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { Colors } from '../constants/colors';

const DURATION_MS = 6000;
const TICK_MS = 50;
const UPDATE_TIMEOUT_MS = 10000;

const STEPS = [
  'A preparar o plantel…',
  'A carregar os jogos…',
  'A calcular as estatísticas…',
  'A montar a tática…',
];

export default function PreviewScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const [pulse] = useState(() => new Animated.Value(0));
  const [timeUp, setTimeUp] = useState(false);
  const [updateChecked, setUpdateChecked] = useState(() => __DEV__ || !Updates.isEnabled);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const t = Date.now() - startedAt;
      setElapsed(Math.min(t, DURATION_MS));
      if (t >= DURATION_MS) {
        clearInterval(timer);
        setTimeUp(true);
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    let cancelled = false;
    const timeout = setTimeout(() => {
      if (!cancelled) setUpdateChecked(true);
    }, UPDATE_TIMEOUT_MS);

    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (cancelled) return;
        if (check.isAvailable) {
          clearTimeout(timeout);
          const result = await Updates.fetchUpdateAsync();
          if (cancelled) return;
          if (result.isNew) {
            await Updates.reloadAsync();
            return;
          }
        }
      } catch (e) {
        console.warn('Expo update check failed', e);
      }
      if (!cancelled) {
        clearTimeout(timeout);
        setUpdateChecked(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (timeUp && updateChecked) {
      navigation.replace('Tabs', { screen: 'Inicio' });
    }
  }, [timeUp, updateChecked, navigation]);

  const progress = elapsed / DURATION_MS;
  const percent = Math.round(progress * 100);
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))];
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 48 }]}>
      <View style={styles.center}>
        <Animated.Image
          source={require('../../assets/logo.png')}
          style={[styles.logo, { transform: [{ scale }] }]}
          resizeMode="contain"
        />
        <Text style={styles.title}>Deportes La Sport</Text>
        <Text style={styles.subtitle}>A sua equipa de futebol amador</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.statusRow}>
          <Text style={styles.status}>{step}</Text>
          <Text style={styles.percent}>{percent}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 32,
    marginBottom: 12,
  },
  title: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.onPrimaryMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  status: {
    color: Colors.onPrimaryMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  percent: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onPrimarySoft,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.white,
  },
});
