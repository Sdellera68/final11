import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import {
  getStats, getKnowledge, clearKnowledge, clearLogs,
  clearChatHistory, generateDocumentation, triggerLearning,
} from '../src/api';

export default function Settings() {
  const [stats, setStats] = useState<any>(null);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [learnLoading, setLearnLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, k] = await Promise.all([getStats(), getKnowledge()]);
      setStats(s);
      setKnowledge(k || []);
    } catch (e) { console.log('Settings load error:', e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleGenerateDoc = async () => {
    setDocLoading(true);
    try {
      const res = await generateDocumentation();
      Alert.alert('Documentation générée', 'Voulez-vous partager le document ?', [
        { text: 'Fermer' },
        {
          text: 'Partager',
          onPress: () => { Share.share({ message: res.documentation }).catch(() => {}); },
        },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de générer la documentation.');
    }
    setDocLoading(false);
  };

  const handleLearn = async () => {
    setLearnLoading(true);
    try {
      const res = await triggerLearning();
      Alert.alert('Apprentissage', `${res.learnings_extracted} nouvelles connaissances extraites.`);
      await load();
    } catch {
      Alert.alert('Erreur', 'Impossible d\'extraire les apprentissages.');
    }
    setLearnLoading(false);
  };

  const handleClearKnowledge = () => {
    Alert.alert('Vider la base de connaissances', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Vider', style: 'destructive',
        onPress: async () => {
          await clearKnowledge().catch(() => {});
          setKnowledge([]);
          await load();
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Réinitialisation complète', 'Supprimer toutes les données (historique, logs, connaissances) ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Tout supprimer', style: 'destructive',
        onPress: async () => {
          await Promise.all([
            clearChatHistory().catch(() => {}),
            clearLogs().catch(() => {}),
            clearKnowledge().catch(() => {}),
          ]);
          await load();
        },
      },
    ]);
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'preference': return Colors.brand.primary;
      case 'pattern': return Colors.status.warning;
      case 'insight': return Colors.brand.secondary;
      case 'system': return Colors.text.tertiary;
      default: return Colors.text.secondary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator size="large" color={Colors.brand.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Paramètres</Text>

        {/* Stats Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Vue d'ensemble</Text>
          <View style={s.statsGrid}>
            {[
              { label: 'Messages', value: stats?.messages || 0, icon: 'message-circle' as const },
              { label: 'Connaissances', value: stats?.knowledge || 0, icon: 'book-open' as const },
              { label: 'Automatisations', value: stats?.automations || 0, icon: 'zap' as const },
              { label: 'Événements', value: stats?.logs || 0, icon: 'activity' as const },
            ].map((item) => (
              <View key={item.label} style={s.statCard}>
                <Feather name={item.icon} size={18} color={Colors.brand.primary} />
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Knowledge Base */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Base de connaissances</Text>
            <Text style={s.sectionCount}>{knowledge.length} entrées</Text>
          </View>
          {knowledge.length === 0 ? (
            <View style={s.emptyKnowledge}>
              <Feather name="book" size={24} color={Colors.text.tertiary} />
              <Text style={s.emptyText}>Aucune connaissance acquise</Text>
            </View>
          ) : (
            knowledge.slice(0, 10).map((k: any, i: number) => (
              <View key={k.id || i} style={s.knowledgeItem}>
                <View style={[s.knowledgeDot, { backgroundColor: categoryColor(k.category) }]} />
                <View style={s.knowledgeContent}>
                  <Text style={s.knowledgeText} numberOfLines={2}>{k.content}</Text>
                  <View style={s.knowledgeMeta}>
                    <Text style={s.knowledgeCategory}>{k.category}</Text>
                    <Text style={s.knowledgeImp}>{'★'.repeat(k.importance || 1)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
          {knowledge.length > 10 && (
            <Text style={s.moreText}>+ {knowledge.length - 10} autres connaissances</Text>
          )}
        </View>

        {/* Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Actions</Text>

          <TouchableOpacity testID="learn-btn-settings" style={s.actionBtn} onPress={handleLearn} disabled={learnLoading}>
            {learnLoading ? <ActivityIndicator size="small" color={Colors.brand.secondary} /> :
              <Feather name="book-open" size={20} color={Colors.brand.secondary} />}
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Extraire les apprentissages</Text>
              <Text style={s.actionDesc}>Analyser les conversations récentes</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity testID="generate-doc-btn" style={s.actionBtn} onPress={handleGenerateDoc} disabled={docLoading}>
            {docLoading ? <ActivityIndicator size="small" color={Colors.brand.primary} /> :
              <Feather name="file-text" size={20} color={Colors.brand.primary} />}
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Générer la documentation</Text>
              <Text style={s.actionDesc}>Document technique complet</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity testID="clear-knowledge-btn" style={s.actionBtn} onPress={handleClearKnowledge}>
            <Feather name="database" size={20} color={Colors.status.warning} />
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Vider la base de connaissances</Text>
              <Text style={s.actionDesc}>Supprimer tous les apprentissages</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity testID="reset-all-btn" style={[s.actionBtn, s.dangerBtn]} onPress={handleClearAll}>
            <Feather name="alert-triangle" size={20} color={Colors.status.error} />
            <View style={s.actionInfo}>
              <Text style={[s.actionTitle, { color: Colors.status.error }]}>Réinitialisation complète</Text>
              <Text style={s.actionDesc}>Supprimer toutes les données</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.status.error} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>À propos</Text>
          <View style={s.aboutCard}>
            <Text style={s.aboutName}>ARIA v1.0</Text>
            <Text style={s.aboutDesc}>Assistant Réactif Intelligent Autonome</Text>
            <Text style={s.aboutPhase}>Phase 1 — Pré-développement fonctionnel</Text>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>IA :</Text>
              <Text style={s.aboutValue}>Claude Sonnet 4.5</Text>
            </View>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>Backend :</Text>
              <Text style={s.aboutValue}>FastAPI + MongoDB</Text>
            </View>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>Frontend :</Text>
              <Text style={s.aboutValue}>Expo SDK 54</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: Sp.xl },
  pageTitle: { fontSize: Fs.xxxl, fontWeight: '900', color: Colors.text.primary, marginBottom: Sp.xxl },
  section: { marginBottom: Sp.xxxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp.md },
  sectionTitle: { fontSize: Fs.lg, fontWeight: '700', color: Colors.text.primary, marginBottom: Sp.md },
  sectionCount: { fontSize: Fs.xs, color: Colors.text.tertiary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Sp.md },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.bg.secondary,
    borderRadius: Rad.lg, padding: Sp.lg, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  statValue: { fontSize: Fs.xxl, fontWeight: '800', color: Colors.text.primary, marginTop: Sp.sm },
  statLabel: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: 2 },
  knowledgeItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Sp.md,
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.md,
    padding: Sp.md, marginBottom: Sp.sm,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  knowledgeDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  knowledgeContent: { flex: 1 },
  knowledgeText: { fontSize: Fs.sm, color: Colors.text.primary, lineHeight: 20 },
  knowledgeMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Sp.xs },
  knowledgeCategory: { fontSize: Fs.xs, color: Colors.text.tertiary },
  knowledgeImp: { fontSize: Fs.xs, color: Colors.status.warning },
  moreText: { fontSize: Fs.xs, color: Colors.brand.primary, textAlign: 'center', marginTop: Sp.sm },
  emptyKnowledge: {
    alignItems: 'center', padding: Sp.xxl,
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.lg,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  emptyText: { color: Colors.text.tertiary, fontSize: Fs.sm, marginTop: Sp.sm },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Sp.lg,
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.lg,
    padding: Sp.lg, marginBottom: Sp.sm,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  dangerBtn: { borderColor: 'rgba(239,83,80,0.2)' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: Fs.base, fontWeight: '600', color: Colors.text.primary },
  actionDesc: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: 2 },
  aboutCard: {
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.xl,
    padding: Sp.xl, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  aboutName: { fontSize: Fs.xl, fontWeight: '800', color: Colors.brand.primary },
  aboutDesc: { fontSize: Fs.sm, color: Colors.text.secondary, marginTop: 2 },
  aboutPhase: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: Sp.xs, marginBottom: Sp.lg },
  aboutRow: { flexDirection: 'row', gap: Sp.sm, marginTop: Sp.xs },
  aboutLabel: { fontSize: Fs.sm, color: Colors.text.tertiary, width: 80 },
  aboutValue: { fontSize: Fs.sm, color: Colors.text.primary },
});
