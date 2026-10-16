import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { deleteMatch, getMatch, insertMatch, updateMatch } from '../db/queries';
import { formatDate, formatTime } from '../lib/format';
import type { RootStackScreenProps } from '../navigation/types';
import { Button, Chip, FormField, type IconName } from '../components/ui';

function nextFullHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d;
}

function PickerField({ icon, label, value, onPress }: { icon: IconName; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.pickerField}>
      <MaterialCommunityIcons name={icon} size={22} color={Colors.primary} />
      <View>
        <Text style={styles.pickerLabel}>{label}</Text>
        <Text style={styles.pickerValue}>{value}</Text>
      </View>
    </Pressable>
  );
}

export default function MatchFormScreen({ route, navigation }: RootStackScreenProps<'MatchForm'>) {
  const id = route.params?.id;
  const db = useSQLiteContext();
  const [loaded, setLoaded] = useState(!id);
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState(nextFullHour);
  const [location, setLocation] = useState('');
  const [isHome, setIsHome] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? 'Editar jogo' : 'Novo jogo' });
  }, [navigation, id]);

  useEffect(() => {
    if (!id) return;
    getMatch(db, id).then((m) => {
      if (m) {
        setOpponent(m.opponent);
        setDate(new Date(m.date));
        setLocation(m.location ?? '');
        setIsHome(m.is_home === 1);
      }
      setLoaded(true);
    });
  }, [db, id]);

  const openAndroidPicker = (mode: 'date' | 'time') => {
    DateTimePickerAndroid.open({
      value: date,
      mode,
      is24Hour: true,
      onChange: (event, selected) => {
        if (event.type !== 'set' || !selected) return;
        const next = new Date(date);
        if (mode === 'date') next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
        else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setDate(next);
      },
    });
  };

  const save = async () => {
    const name = opponent.trim();
    if (!name) {
      Alert.alert('Falta o adversário', 'Indique contra quem é o jogo.');
      return;
    }
    const input = { opponent: name, date: date.toISOString(), location: location.trim() || null, is_home: isHome };
    if (id) {
      await updateMatch(db, id, input);
      navigation.goBack();
    } else {
      const newId = await insertMatch(db, input);
      navigation.replace('Match', { id: newId });
    }
  };

  const remove = () => {
    if (!id) return;
    Alert.alert('Eliminar jogo?', 'O resultado e todos os eventos deste jogo serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteMatch(db, id);
          navigation.popToTop();
        },
      },
    ]);
  };

  if (!loaded) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormField label="Adversário" value={opponent} onChangeText={setOpponent} placeholder="Ex.: Unidos da Vila" autoCapitalize="words" />

      <View style={styles.group}>
        <Text style={styles.label}>Data e hora</Text>
        {Platform.OS === 'android' ? (
          <View style={styles.row}>
            <PickerField icon="calendar" label="Data" value={formatDate(date)} onPress={() => openAndroidPicker('date')} />
            <PickerField icon="clock-outline" label="Hora" value={formatTime(date)} onPress={() => openAndroidPicker('time')} />
          </View>
        ) : (
          <DateTimePicker value={date} mode="datetime" onChange={(_, d) => d && setDate(d)} />
        )}
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Onde se joga</Text>
        <View style={styles.row}>
          <Chip label="Em casa" icon="home-outline" selected={isHome} onPress={() => setIsHome(true)} />
          <Chip label="Fora" icon="bus" selected={!isHome} onPress={() => setIsHome(false)} />
        </View>
      </View>

      <FormField label="Local (opcional)" value={location} onChangeText={setLocation} placeholder="Ex.: Campo Municipal" />

      <Button title="Guardar" icon="check" onPress={save} style={styles.button} />
      {id && <Button title="Eliminar jogo" icon="delete-outline" variant="danger" onPress={remove} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  group: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  row: { flexDirection: 'row', gap: 10 },
  pickerField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
  },
  pickerLabel: { fontSize: 11, color: Colors.textSecondary },
  pickerValue: { fontSize: 16, fontWeight: '700', color: Colors.text },
  button: { marginTop: 8 },
});
