import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { RULES } from '../constants/rules';
import { Card } from '../components/ui';

export default function RegrasScreen() {
  const [open, setOpen] = useState<string | null>(RULES[0].id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <MaterialCommunityIcons name="whistle" size={150} color="rgba(255,255,255,0.07)" style={styles.introBg} />
        <View style={styles.introIcon}>
          <MaterialCommunityIcons name="book-open-variant" size={28} color={Colors.primary} />
        </View>
        <Text style={styles.introTitle}>Leis do Jogo</Text>
        <Text style={styles.introText}>
          Resumo das principais regras do futebol de 11, com base nas Leis do Jogo do IFAB. O futebol de 7 e de 5 usa
          adaptações definidas por cada competição.
        </Text>
      </View>

      {RULES.map((rule) => {
        const expanded = open === rule.id;
        return (
          <Card key={rule.id} onPress={() => setOpen(expanded ? null : rule.id)} style={styles.rule}>
            <View style={styles.ruleHeader}>
              <View style={[styles.ruleIcon, expanded && styles.ruleIconActive]}>
                <MaterialCommunityIcons name={rule.icon} size={24} color={expanded ? Colors.white : Colors.primary} />
              </View>
              <View style={styles.ruleText}>
                <Text style={styles.ruleTitle}>{rule.title}</Text>
                <Text style={styles.ruleSummary}>{rule.summary}</Text>
              </View>
              <MaterialCommunityIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color={Colors.draw} />
            </View>
            {expanded && (
              <View style={styles.points}>
                {rule.points.map((p) => (
                  <View key={p} style={styles.point}>
                    <View style={styles.bullet} />
                    <Text style={styles.pointText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  intro: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  introBg: { position: 'absolute', right: -30, bottom: -30 },
  introIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { fontSize: 22, fontWeight: '800', color: Colors.white },
  introText: { fontSize: 14, lineHeight: 20, color: Colors.onPrimaryMuted },
  rule: { padding: 14 },
  ruleHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ruleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleIconActive: { backgroundColor: Colors.primary },
  ruleText: { flex: 1 },
  ruleTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  ruleSummary: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  points: { gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  point: { flexDirection: 'row', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 8 },
  pointText: { flex: 1, fontSize: 14, lineHeight: 21, color: Colors.text },
});
