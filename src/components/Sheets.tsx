import { useState, type ReactNode } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { positionLabel } from '../constants/football';
import type { Player } from '../db/types';
import { pickPhoto } from '../lib/photos';
import { PlayerAvatar } from './Avatars';
import type { IconName } from './ui';

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          {title && <Text style={styles.title}>{title}</Text>}
          {children}
        </View>
      </View>
    </Modal>
  );
}

export interface SheetOption {
  label: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
}

function OptionRow({ option }: { option: SheetOption }) {
  const color = option.destructive ? Colors.danger : Colors.primary;
  return (
    <Pressable onPress={option.onPress} android_ripple={{ color: Colors.primarySoft }} style={styles.row}>
      <View style={[styles.optionIcon, option.destructive && styles.optionIconDanger]}>
        <MaterialCommunityIcons name={option.icon} size={22} color={color} />
      </View>
      <Text style={[styles.rowTitle, option.destructive && { color: Colors.danger }]}>{option.label}</Text>
    </Pressable>
  );
}

export function ActionSheet({
  visible,
  onClose,
  title,
  options,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: SheetOption[];
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {options.map((o) => (
        <OptionRow key={o.label} option={o} />
      ))}
    </BottomSheet>
  );
}

export function PhotoSheet({
  visible,
  onClose,
  hasPhoto,
  onPicked,
  onRemove,
}: {
  visible: boolean;
  onClose: () => void;
  hasPhoto: boolean;
  onPicked: (uri: string) => void;
  onRemove: () => void;
}) {
  const pick = async (source: 'library' | 'camera') => {
    onClose();
    const uri = await pickPhoto(source);
    if (uri) onPicked(uri);
  };
  const options: SheetOption[] = [
    { label: 'Escolher da galeria', icon: 'image-multiple', onPress: () => pick('library') },
    { label: 'Tirar fotografia', icon: 'camera', onPress: () => pick('camera') },
  ];
  if (hasPhoto) {
    options.push({
      label: 'Remover foto',
      icon: 'delete-outline',
      destructive: true,
      onPress: () => {
        onClose();
        onRemove();
      },
    });
  }
  return <ActionSheet visible={visible} onClose={onClose} title="Foto" options={options} />;
}

export function PlayerList({
  players,
  kitColor,
  onSelect,
  options = [],
  highlightIds,
  highlightLabel,
}: {
  players: Player[];
  kitColor: string;
  onSelect: (player: Player) => void;
  options?: SheetOption[];
  highlightIds?: Set<number>;
  highlightLabel?: string;
}) {
  return (
    <FlatList
      style={styles.list}
      data={players}
      keyExtractor={(p) => String(p.id)}
      ListHeaderComponent={
        <>
          {options.map((o) => (
            <OptionRow key={o.label} option={o} />
          ))}
        </>
      }
      ListEmptyComponent={<Text style={styles.emptyText}>Ainda não há jogadores na equipa.</Text>}
      renderItem={({ item }) => (
        <Pressable onPress={() => onSelect(item)} android_ripple={{ color: Colors.primarySoft }} style={styles.row}>
          <PlayerAvatar photoUri={item.photo_uri} number={item.number} kitColor={kitColor} size={40} />
          <View style={styles.rowText}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.rowSubtitle}>
              {item.number != null ? `#${item.number} · ` : ''}
              {positionLabel(item.position)}
            </Text>
          </View>
          {highlightIds?.has(item.id) && highlightLabel && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{highlightLabel}</Text>
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

export function PlayerPicker({
  visible,
  onClose,
  title,
  ...listProps
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
} & Parameters<typeof PlayerList>[0]) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <PlayerList {...listProps} />
    </BottomSheet>
  );
}

export function MinuteStepper({ value, onChange }: { value: number | null; onChange: (minute: number) => void }) {
  const step = (delta: number) => onChange(Math.min(130, Math.max(1, (value ?? 0) + delta)));
  return (
    <View style={styles.stepper}>
      {[-10, -1].map((d) => (
        <Pressable key={d} onPress={() => step(d)} style={styles.stepButton}>
          <Text style={styles.stepText}>{d}</Text>
        </Pressable>
      ))}
      <View style={styles.minuteBox}>
        <Text style={styles.minuteValue}>{value != null ? `${value}'` : '—'}</Text>
        <Text style={styles.minuteLabel}>minuto</Text>
      </View>
      {[1, 10].map((d) => (
        <Pressable key={d} onPress={() => step(d)} style={styles.stepButton}>
          <Text style={styles.stepText}>+{d}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function useSheet() {
  const [visible, setVisible] = useState(false);
  return { visible, open: () => setVisible(true), close: () => setVisible(false) };
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(16,24,40,0.5)' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text, paddingHorizontal: 20, paddingVertical: 8 },
  list: { flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
  rowSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconDanger: { backgroundColor: '#FDECEC' },
  tag: { backgroundColor: Colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tagText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, padding: 24 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  stepButton: {
    width: 48,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  minuteBox: { minWidth: 72, alignItems: 'center' },
  minuteValue: { fontSize: 26, fontWeight: '800', color: Colors.text },
  minuteLabel: { fontSize: 11, color: Colors.textSecondary },
});
