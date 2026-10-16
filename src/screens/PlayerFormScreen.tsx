import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '../constants/colors';
import { POSITIONS, type Position } from '../constants/football';
import { deletePlayer, getPlayer, getTeam, insertPlayer, updatePlayer } from '../db/queries';
import { deletePhoto } from '../lib/photos';
import type { RootStackScreenProps } from '../navigation/types';
import { PlayerAvatar } from '../components/Avatars';
import { PhotoSheet, useSheet } from '../components/Sheets';
import { Button, Chip, FormField } from '../components/ui';

export default function PlayerFormScreen({ route, navigation }: RootStackScreenProps<'PlayerForm'>) {
  const id = route.params?.id;
  const db = useSQLiteContext();
  const photoSheet = useSheet();

  const [loaded, setLoaded] = useState(!id);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState<Position>('MED');
  const [photo, setPhoto] = useState<string | null>(null);
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [kit, setKit] = useState<string>(Colors.white);

  useLayoutEffect(() => {
    navigation.setOptions({ title: id ? 'Editar jogador' : 'Novo jogador' });
  }, [navigation, id]);

  useEffect(() => {
    getTeam(db).then((t) => t && setKit(t.kit_color));
    if (!id) return;
    getPlayer(db, id).then((p) => {
      if (p) {
        setName(p.name);
        setNumber(p.number != null ? String(p.number) : '');
        setPosition(p.position);
        setPhoto(p.photo_uri);
        setOriginalPhoto(p.photo_uri);
      }
      setLoaded(true);
    });
  }, [db, id]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Falta o nome', 'Indique o nome do jogador.');
      return;
    }
    const parsed = number.trim() === '' ? null : Number.parseInt(number, 10);
    const input = { name: trimmed, number: Number.isNaN(parsed) ? null : parsed, position, photo_uri: photo };
    if (id) await updatePlayer(db, id, input);
    else await insertPlayer(db, input);
    if (originalPhoto && originalPhoto !== photo) deletePhoto(originalPhoto);
    navigation.goBack();
  };

  const remove = () => {
    if (!id) return;
    Alert.alert('Eliminar jogador?', 'Os golos e cartões já registados continuam a contar para a equipa.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deletePlayer(db, id);
          deletePhoto(originalPhoto);
          navigation.popToTop();
        },
      },
    ]);
  };

  if (!loaded) return <View style={styles.container} />;

  const parsedNumber = Number.parseInt(number, 10);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={photoSheet.open} style={styles.photo}>
        <PlayerAvatar
          photoUri={photo}
          number={Number.isNaN(parsedNumber) ? null : parsedNumber}
          kitColor={kit}
          size={120}
        />
        <View style={styles.cameraBadge}>
          <MaterialCommunityIcons name="camera" size={18} color={Colors.white} />
        </View>
      </Pressable>
      <Text style={styles.photoHint}>Toque para {photo ? 'mudar' : 'adicionar'} a foto</Text>

      <View style={styles.form}>
        <FormField label="Nome" value={name} onChangeText={setName} placeholder="Ex.: João Silva" autoCapitalize="words" />
        <FormField
          label="Número da camisola"
          value={number}
          onChangeText={(t) => setNumber(t.replace(/[^0-9]/g, ''))}
          placeholder="Ex.: 10"
          keyboardType="number-pad"
          maxLength={2}
        />
        <View style={styles.positions}>
          <Text style={styles.label}>Posição</Text>
          <View style={styles.chips}>
            {POSITIONS.map((p) => (
              <Chip key={p.key} label={p.label} selected={position === p.key} onPress={() => setPosition(p.key)} />
            ))}
          </View>
        </View>
      </View>

      <Button title="Guardar" icon="check" onPress={save} style={styles.button} />
      {id && <Button title="Eliminar jogador" icon="delete-outline" variant="danger" onPress={remove} style={styles.button} />}

      <PhotoSheet
        visible={photoSheet.visible}
        onClose={photoSheet.close}
        hasPhoto={!!photo}
        onPicked={setPhoto}
        onRemove={() => setPhoto(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  photo: { alignSelf: 'center', marginTop: 8 },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: { textAlign: 'center', color: Colors.textSecondary, marginTop: 8, fontSize: 13 },
  form: { gap: 18, marginTop: 24 },
  positions: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { marginTop: 16 },
});
