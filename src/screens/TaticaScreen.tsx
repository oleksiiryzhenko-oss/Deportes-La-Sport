import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import {
  DEFAULT_FORMATION_ID,
  FORMATIONS,
  GAME_MODES,
  getFormation,
  positionLabel,
  slotRole,
  type Formation,
} from '../constants/football';
import { getLineup, getTeam, listPlayers, saveLineup } from '../db/queries';
import type { Player } from '../db/types';
import { shortName } from '../lib/format';
import {
  assignSlot,
  autoFill,
  firstEmptySlotFor,
  resolveLineup,
  swapSlots,
  toLineupMap,
  trimLineup,
  type LineupMap,
} from '../lib/lineup';
import { PlayerAvatar } from '../components/Avatars';
import { LineupPitch } from '../components/LineupPitch';
import { PlayerPicker, type SheetOption } from '../components/Sheets';
import { Button, Chip, EmptyState, SectionHeader } from '../components/ui';

export default function TaticaScreen() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const [loaded, setLoaded] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [kit, setKit] = useState<string>(Colors.white);
  const [formationId, setFormationId] = useState(DEFAULT_FORMATION_ID);
  const [lineup, setLineup] = useState<LineupMap>({});
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([getTeam(db), listPlayers(db), getLineup(db)]).then(([team, ps, rows]) => {
        if (!active) return;
        setPlayers(ps);
        setKit(team?.kit_color ?? Colors.white);
        setFormationId(team?.formation ?? DEFAULT_FORMATION_ID);
        setLineup(toLineupMap(rows));
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, [db])
  );

  const formation = getFormation(formationId);

  // Update the UI immediately, then persist.
  const apply = (next: LineupMap, nextFormation: Formation = formation) => {
    setFormationId(nextFormation.id);
    setLineup(next);
    saveLineup(db, nextFormation.id, next).catch(() =>
      Alert.alert('Erro', 'Não foi possível guardar o onze. Tente novamente.')
    );
  };

  const changeFormation = (f: Formation) => apply(trimLineup(lineup, f.slots.length), f);
  const changeMode = (mode: number) => {
    if (mode === formation.mode) return;
    changeFormation(FORMATIONS.find((f) => f.mode === mode) ?? FORMATIONS[0]);
  };

  const placeFromBench = (p: Player) => {
    const slot = firstEmptySlotFor(lineup, formation, p.position);
    if (slot === null) {
      Alert.alert('Onze completo', 'Toque numa posição do campo para trocar o jogador.');
      return;
    }
    apply(assignSlot(lineup, slot, p.id));
  };

  const clear = () =>
    Alert.alert('Limpar o onze?', 'Todos os jogadores voltam para o banco.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => apply({}) },
    ]);

  if (!loaded) return <View style={styles.container} />;

  const resolved = resolveLineup(lineup, players);
  const onField = new Set(Object.values(lineup));
  const bench = players.filter((p) => !onField.has(p.id));
  const filled = Object.keys(lineup).length;

  const pickerOptions: SheetOption[] = [];
  if (pickerSlot !== null && lineup[pickerSlot] !== undefined) {
    pickerOptions.push({
      label: 'Retirar do onze',
      icon: 'account-remove-outline',
      destructive: true,
      onPress: () => {
        apply(assignSlot(lineup, pickerSlot, null));
        setPickerSlot(null);
      },
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>
      <View style={styles.modes}>
        {GAME_MODES.map((m) => (
          <Chip key={m.mode} label={m.label} selected={formation.mode === m.mode} onPress={() => changeMode(m.mode)} />
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formations}>
        {FORMATIONS.filter((f) => f.mode === formation.mode).map((f) => (
          <Chip key={f.id} label={f.name} icon="strategy" selected={f.id === formation.id} onPress={() => changeFormation(f)} />
        ))}
      </ScrollView>

      <View style={styles.pitchWrap}>
        <LineupPitch
          formation={formation}
          lineup={resolved}
          kitColor={kit}
          onSlotPress={setPickerSlot}
          onSwap={(a, b) => apply(swapSlots(lineup, a, b))}
          onDragActive={(active) => setScrollEnabled(!active)}
        />
      </View>
      <View style={styles.hintRow}>
        <MaterialCommunityIcons name="gesture-tap-hold" size={16} color={Colors.textSecondary} />
        <Text style={styles.hint}>Toque numa posição para escolher · arraste para trocar</Text>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Preencher"
          icon="auto-fix"
          variant="outline"
          disabled={bench.length === 0 || filled === formation.slots.length}
          onPress={() => apply(autoFill(lineup, formation, players))}
          style={styles.flex}
        />
        <Button title="Limpar" icon="broom" variant="outline" disabled={filled === 0} onPress={clear} style={styles.flex} />
      </View>

      <SectionHeader title={`Suplentes (${bench.length})`} />
      {players.length === 0 ? (
        <EmptyState
          compact
          icon="account-group"
          title="Sem jogadores"
          message="Adicione o plantel para montar a tática."
          actionLabel="Adicionar jogador"
          onAction={() => navigation.navigate('PlayerForm')}
        />
      ) : bench.length === 0 ? (
        <Text style={styles.benchEmpty}>Todos os jogadores estão em campo.</Text>
      ) : (
        <View style={styles.bench}>
          {bench.map((p) => (
            <Pressable key={p.id} onPress={() => placeFromBench(p)} style={styles.benchItem}>
              <PlayerAvatar photoUri={p.photo_uri} number={p.number} kitColor={kit} size={52} />
              <Text style={styles.benchName} numberOfLines={1}>
                {shortName(p.name)}
              </Text>
              <Text style={styles.benchPos}>{p.position}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <PlayerPicker
        visible={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        title={
          pickerSlot !== null
            ? `Escolher ${positionLabel(slotRole(formation.slots[pickerSlot], pickerSlot)).toLowerCase()}`
            : ''
        }
        players={players}
        kitColor={kit}
        options={pickerOptions}
        highlightIds={onField}
        highlightLabel="No onze"
        onSelect={(p) => {
          if (pickerSlot !== null) apply(assignSlot(lineup, pickerSlot, p.id));
          setPickerSlot(null);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  flex: { flex: 1 },
  modes: { flexDirection: 'row', gap: 8 },
  formations: { gap: 8, paddingVertical: 12 },
  pitchWrap: {
    borderRadius: 18,
    padding: 4,
    backgroundColor: Colors.white,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 },
  hint: { fontSize: 12, color: Colors.textSecondary },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 14 },
  bench: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  benchItem: { width: 72, alignItems: 'center', gap: 4 },
  benchName: { fontSize: 12, fontWeight: '700', color: Colors.text, maxWidth: 72 },
  benchPos: { fontSize: 11, color: Colors.textSecondary },
  benchEmpty: { color: Colors.textSecondary, textAlign: 'center', paddingVertical: 12 },
});
