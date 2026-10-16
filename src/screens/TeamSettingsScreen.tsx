import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../constants/colors';
import { KIT_COLORS } from '../constants/football';
import { PRIVACY_POLICY_URL } from '../constants/links';
import { clearAllData, loadDemoData } from '../db/demo';
import { getTeam, updateTeam } from '../db/queries';
import { isLightColor } from '../lib/color';
import { deletePhoto } from '../lib/photos';
import type { RootStackScreenProps } from '../navigation/types';
import { TeamCrest } from '../components/Avatars';
import { Jersey } from '../components/Jersey';
import { PhotoSheet, useSheet } from '../components/Sheets';
import { Button, FormField, cardShadow } from '../components/ui';

export default function TeamSettingsScreen({ navigation }: RootStackScreenProps<'TeamSettings'>) {
  const db = useSQLiteContext();
  const photoSheet = useSheet();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [kit, setKit] = useState('#FFFFFF');
  const [crest, setCrest] = useState<string | null>(null);
  const [originalCrest, setOriginalCrest] = useState<string | null>(null);

  useEffect(() => {
    getTeam(db).then((t) => {
      if (t) {
        setName(t.name);
        setKit(t.kit_color);
        setCrest(t.crest_uri);
        setOriginalCrest(t.crest_uri);
      }
      setLoaded(true);
    });
  }, [db]);

  const save = async () => {
    await updateTeam(db, { name: name.trim(), kit_color: kit, crest_uri: crest });
    if (originalCrest && originalCrest !== crest) deletePhoto(originalCrest);
    navigation.goBack();
  };

  const confirmReplace = (title: string, message: string, action: () => Promise<void>) =>
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        style: 'destructive',
        onPress: async () => {
          await action();
          navigation.popToTop();
        },
      },
    ]);

  if (!loaded) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.preview}>
        <MaterialCommunityIcons name="soccer-field" size={220} color="rgba(255,255,255,0.06)" style={styles.previewBg} />
        <Pressable onPress={photoSheet.open} style={styles.crestWrap}>
          <TeamCrest uri={crest} size={96} onDark />
          <View style={styles.cameraBadge}>
            <MaterialCommunityIcons name="camera" size={16} color={Colors.white} />
          </View>
        </Pressable>
        <Jersey color={kit} number={10} size={96} />
        <Text style={styles.previewName} numberOfLines={1}>
          {name.trim() || 'A minha equipa'}
        </Text>
      </View>
      <Text style={styles.hint}>Toque no emblema para escolher uma imagem</Text>

      <View style={styles.form}>
        <FormField label="Nome da equipa" value={name} onChangeText={setName} placeholder="Ex.: Os Amigos FC" autoCapitalize="words" />

        <View style={styles.colors}>
          <Text style={styles.label}>Cor do equipamento</Text>
          <View style={styles.swatches}>
            {KIT_COLORS.map((c) => {
              const selected = c.hex === kit;
              return (
                <Pressable key={c.hex} onPress={() => setKit(c.hex)} style={styles.swatchItem}>
                  <View style={[styles.swatch, { backgroundColor: c.hex }, selected && styles.swatchSelected]}>
                    {selected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={22}
                        color={isLightColor(c.hex) ? Colors.primary : Colors.white}
                      />
                    )}
                  </View>
                  <Text style={styles.swatchLabel}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Button title="Guardar" icon="check" onPress={save} style={styles.button} />

      <Text style={styles.aboutTitle}>Sobre a aplicação</Text>
      <View style={styles.aboutCard}>
        <Pressable
          onPress={() =>
            WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL, { toolbarColor: Colors.primary, showTitle: true })
          }
          android_ripple={{ color: Colors.primarySoft }}
          style={styles.aboutRow}
        >
          <View style={styles.aboutIcon}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.aboutLabel}>Política de privacidade</Text>
          <MaterialCommunityIcons name="open-in-new" size={20} color={Colors.draw} />
        </Pressable>
        <View style={styles.aboutDivider} />
        <View style={styles.aboutRow}>
          <View style={styles.aboutIcon}>
            <MaterialCommunityIcons name="information-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.aboutLabel}>Versão</Text>
          <Text style={styles.aboutValue}>{Constants.expoConfig?.version ?? '—'}</Text>
        </View>
      </View>

      {__DEV__ && (
        <View style={styles.dev}>
          <Text style={styles.devTitle}>Desenvolvimento</Text>
          <Text style={styles.devText}>Visível apenas em builds de desenvolvimento.</Text>
          <Button
            title="Carregar dados de demonstração"
            icon="database-import-outline"
            variant="outline"
            onPress={() =>
              confirmReplace('Carregar dados de demonstração?', 'Todos os dados atuais serão substituídos.', () => loadDemoData(db))
            }
          />
          <Button
            title="Apagar todos os dados"
            icon="delete-sweep-outline"
            variant="danger"
            onPress={() =>
              confirmReplace('Apagar todos os dados?', 'Jogadores, jogos e estatísticas serão apagados.', () => clearAllData(db))
            }
          />
        </View>
      )}

      <PhotoSheet
        visible={photoSheet.visible}
        onClose={photoSheet.close}
        hasPhoto={!!crest}
        onPicked={setCrest}
        onRemove={() => setCrest(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  preview: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  previewBg: { position: 'absolute', right: -50, top: -20 },
  crestWrap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: { fontSize: 20, fontWeight: '800', color: Colors.white, paddingHorizontal: 16 },
  hint: { textAlign: 'center', color: Colors.textSecondary, fontSize: 13, marginTop: 8 },
  form: { gap: 20, marginTop: 20 },
  colors: { gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  swatchItem: { alignItems: 'center', gap: 4, width: 60 },
  swatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3, borderColor: Colors.primary },
  swatchLabel: { fontSize: 11, color: Colors.textSecondary },
  button: { marginTop: 24 },
  aboutTitle: {
    marginTop: 32,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  aboutCard: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', ...cardShadow },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  aboutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text },
  aboutValue: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  aboutDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 66 },
  dev: {
    marginTop: 32,
    padding: 16,
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.draw,
  },
  devTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  devText: { fontSize: 13, color: Colors.textSecondary },
});
