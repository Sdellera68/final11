import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Share, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as IntentLauncher from 'expo-intent-launcher';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import {
  getStats, getKnowledge, clearKnowledge, clearLogs,
  clearChatHistory, generateDocumentation, triggerLearning,
  getADBGuide, getADBConsent, setADBConsent,
} from '../src/api';

export default function Settings() {
  const [stats, setStats] = useState<any>(null);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [learnLoading, setLearnLoading] = useState(false);
  const [showADB, setShowADB] = useState(false);
  const [adbGuide, setAdbGuide] = useState<any>(null);
  const [adbConsent, setAdbConsentState] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, k, consent] = await Promise.all([getStats(), getKnowledge(), getADBConsent().catch(() => ({ accepted: false }))]);
      setStats(s);
      setKnowledge(k || []);
      setAdbConsentState(consent?.accepted || false);
    } catch (e) { console.log('Settings load error:', e); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleGenerateDoc = async () => {
    setDocLoading(true);
    try {
      const res = await generateDocumentation();
      Alert.alert('Documentation generee', 'Voulez-vous partager le document ?', [
        { text: 'Fermer' },
        { text: 'Partager', onPress: () => Share.share({ message: res.documentation }).catch(() => {}) },
      ]);
    } catch { Alert.alert('Erreur', 'Impossible de generer la documentation.'); }
    setDocLoading(false);
  };

  const handleLearn = async () => {
    setLearnLoading(true);
    try {
      const res = await triggerLearning();
      Alert.alert('Apprentissage', `${res.learnings_extracted} connaissances extraites.`);
      await load();
    } catch { Alert.alert('Erreur', 'Extraction impossible.'); }
    setLearnLoading(false);
  };

  const handleClearKnowledge = () => {
    Alert.alert('Vider la base', 'Irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vider', style: 'destructive', onPress: async () => { await clearKnowledge().catch(() => {}); await load(); } },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Reinitialisation', 'Supprimer toutes les donnees ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Tout supprimer', style: 'destructive',
        onPress: async () => {
          await Promise.all([clearChatHistory().catch(() => {}), clearLogs().catch(() => {}), clearKnowledge().catch(() => {})]);
          await load();
        },
      },
    ]);
  };

  const openADBSetup = async () => {
    try {
      const guide = await getADBGuide();
      setAdbGuide(guide);
      setShowADB(true);
    } catch { setShowADB(true); }
  };

  const handleADBConsent = async (accepted: boolean) => {
    await setADBConsent(accepted).catch(() => {});
    setAdbConsentState(accepted);
    if (accepted && Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.APPLICATION_DEVELOPMENT_SETTINGS);
      } catch {
        Alert.alert('Info', 'Ouvrez manuellement: Parametres > Options pour les developpeurs');
      }
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case 'preference': return Colors.brand.primary;
      case 'pattern': return Colors.status.warning;
      case 'insight': return Colors.brand.secondary;
      default: return Colors.text.tertiary;
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
        <Text style={s.pageTitle}>Parametres</Text>

        {/* Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Vue d'ensemble</Text>
          <View style={s.statsGrid}>
            {[
              { label: 'Messages', value: stats?.messages || 0, icon: 'message-circle' as const },
              { label: 'Connaissances', value: stats?.knowledge || 0, icon: 'book-open' as const },
              { label: 'Automatisations', value: stats?.automations || 0, icon: 'zap' as const },
              { label: 'Evenements', value: stats?.logs || 0, icon: 'activity' as const },
            ].map((item) => (
              <View key={item.label} style={s.statCard}>
                <Feather name={item.icon} size={18} color={Colors.brand.primary} />
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ADB Wireless */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ADB Wireless</Text>
          <View style={[s.adbCard, adbConsent && { borderColor: Colors.status.success + '40' }]}>
            <View style={s.adbHeader}>
              <View style={[s.adbIconCircle, { backgroundColor: adbConsent ? Colors.status.success + '20' : Colors.bg.tertiary }]}>
                <Feather name="terminal" size={20} color={adbConsent ? Colors.status.success : Colors.text.tertiary} />
              </View>
              <View style={s.adbInfo}>
                <Text style={s.adbTitle}>Debogage sans fil</Text>
                <Text style={s.adbStatus}>
                  {adbConsent ? 'Autorise — Mode avance actif' : 'Non autorise'}
                </Text>
              </View>
              <View style={[s.adbBadge, { backgroundColor: adbConsent ? Colors.status.success + '20' : Colors.status.error + '20' }]}>
                <Text style={[s.adbBadgeText, { color: adbConsent ? Colors.status.success : Colors.status.error }]}>
                  {adbConsent ? 'ON' : 'OFF'}
                </Text>
              </View>
            </View>
            <Text style={s.adbDesc}>
              Permet a ARIA d'interagir avec les applications installees via ADB wireless pour une autonomie maximale.
            </Text>
            <View style={s.adbActions}>
              {!adbConsent ? (
                <TouchableOpacity testID="adb-auto-btn" style={s.adbAutoBtn} onPress={() => handleADBConsent(true)}>
                  <Feather name="zap" size={16} color={Colors.brand.fg} />
                  <Text style={s.adbAutoBtnText}>Activer automatiquement</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity testID="adb-disable-btn" style={s.adbDisableBtn} onPress={() => handleADBConsent(false)}>
                  <Feather name="x" size={16} color={Colors.status.error} />
                  <Text style={[s.adbAutoBtnText, { color: Colors.status.error }]}>Desactiver</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity testID="adb-guide-btn" style={s.adbGuideBtn} onPress={openADBSetup}>
                <Feather name="book" size={16} color={Colors.brand.primary} />
                <Text style={[s.adbAutoBtnText, { color: Colors.brand.primary }]}>Guide manuel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Knowledge Base */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Base de connaissances</Text>
            <Text style={s.sectionCount}>{knowledge.length} entrees</Text>
          </View>
          {knowledge.length === 0 ? (
            <View style={s.emptyKnowledge}>
              <Feather name="book" size={24} color={Colors.text.tertiary} />
              <Text style={s.emptyText}>Aucune connaissance</Text>
            </View>
          ) : (
            knowledge.slice(0, 10).map((k: any, i: number) => (
              <View key={k.id || i} style={s.knowledgeItem}>
                <View style={[s.knowledgeDot, { backgroundColor: categoryColor(k.category) }]} />
                <View style={s.knowledgeContent}>
                  <Text style={s.knowledgeText} numberOfLines={2}>{k.content}</Text>
                  <View style={s.knowledgeMeta}>
                    <Text style={s.knowledgeCategory}>{k.category} ({k.source || '?'})</Text>
                    <Text style={s.knowledgeImp}>{'★'.repeat(k.importance || 1)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
          {knowledge.length > 10 && <Text style={s.moreText}>+ {knowledge.length - 10} autres</Text>}
        </View>

        {/* Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Actions</Text>

          <TouchableOpacity testID="learn-btn-settings" style={s.actionBtn} onPress={handleLearn} disabled={learnLoading}>
            {learnLoading ? <ActivityIndicator size="small" color={Colors.brand.secondary} /> :
              <Feather name="book-open" size={20} color={Colors.brand.secondary} />}
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Extraire les apprentissages</Text>
              <Text style={s.actionDesc}>Analyser les conversations recentes</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity testID="generate-doc-btn" style={s.actionBtn} onPress={handleGenerateDoc} disabled={docLoading}>
            {docLoading ? <ActivityIndicator size="small" color={Colors.brand.primary} /> :
              <Feather name="file-text" size={20} color={Colors.brand.primary} />}
            <View style={s.actionInfo}>
              <Text style={s.actionTitle}>Generer la documentation</Text>
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
              <Text style={[s.actionTitle, { color: Colors.status.error }]}>Reinitialisation complete</Text>
              <Text style={s.actionDesc}>Supprimer toutes les donnees</Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.status.error} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>A propos</Text>
          <View style={s.aboutCard}>
            <Text style={s.aboutName}>ARIA v2.0</Text>
            <Text style={s.aboutDesc}>Assistant Reactif Intelligent Autonome — Debride</Text>
            <Text style={s.aboutPhase}>Phase 1 — Pre-developpement fonctionnel</Text>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>IA 1 :</Text>
              <Text style={s.aboutValue}>Claude Sonnet 4.5 (principal)</Text>
            </View>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>IA 2 :</Text>
              <Text style={s.aboutValue}>Mistral 7B (fallback gratuit)</Text>
            </View>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>IA 3 :</Text>
              <Text style={s.aboutValue}>Mode local (ultime fallback)</Text>
            </View>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>Backend :</Text>
              <Text style={s.aboutValue}>FastAPI + MongoDB</Text>
            </View>
            <View style={s.aboutRow}>
              <Text style={s.aboutLabel}>Actions :</Text>
              <Text style={s.aboutValue}>Autonomes et debriddees</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ADB Guide Modal */}
      <Modal visible={showADB} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Guide ADB Wireless</Text>
              <TouchableOpacity testID="close-adb-modal" onPress={() => setShowADB(false)}>
                <Feather name="x" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.guideSection}>Mode Automatique</Text>
              {(adbGuide?.steps_auto || [
                "1. ARIA ouvre les Parametres developpeur",
                "2. Activez 'Debogage USB'",
                "3. Activez 'Debogage sans fil'",
                "4. Notez l'adresse IP et le port",
                "5. ARIA peut interagir via ADB",
              ]).map((step: string, i: number) => (
                <View key={i} style={s.guideStep}>
                  <View style={s.guideStepNum}>
                    <Text style={s.guideStepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.guideStepText}>{step.replace(/^\d+\.\s*/, '')}</Text>
                </View>
              ))}

              <Text style={[s.guideSection, { marginTop: Sp.xxl }]}>Mode Manuel</Text>
              {(adbGuide?.steps_manual || [
                "1. Parametres > A propos du telephone",
                "2. Tapez 7x sur 'Numero de build'",
                "3. Options pour les developpeurs",
                "4. Activez 'Debogage USB'",
                "5. Activez 'Debogage sans fil'",
                "6. Notez l'IP et le port",
                "7. PC: adb connect <IP>:<PORT>",
              ]).map((step: string, i: number) => (
                <View key={i} style={s.guideStep}>
                  <View style={s.guideStepNum}>
                    <Text style={s.guideStepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.guideStepText}>{step.replace(/^\d+\.\s*/, '')}</Text>
                </View>
              ))}

              <Text style={[s.guideSection, { marginTop: Sp.xxl }]}>Permissions debloquees</Text>
              {(adbGuide?.permissions_unlocked || [
                "Acces aux applications via ADB",
                "Commandes shell distantes",
                "Installation/desinstallation d'apps",
                "Capture/enregistrement d'ecran",
                "Lecture des logs systeme",
                "Interaction avec les interfaces",
              ]).map((perm: string, i: number) => (
                <View key={i} style={s.permRow}>
                  <Feather name="check" size={14} color={Colors.status.success} />
                  <Text style={s.permText}>{perm}</Text>
                </View>
              ))}

              {Platform.OS === 'android' && (
                <TouchableOpacity testID="open-dev-settings" style={s.openSettingsBtn} onPress={() => handleADBConsent(true)}>
                  <Feather name="external-link" size={18} color={Colors.brand.fg} />
                  <Text style={s.openSettingsBtnText}>Ouvrir les Parametres developpeur</Text>
                </TouchableOpacity>
              )}
              <View style={{ height: Sp.xxxl }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  // ADB
  adbCard: {
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.xl, padding: Sp.xl,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  adbHeader: { flexDirection: 'row', alignItems: 'center', gap: Sp.md, marginBottom: Sp.md },
  adbIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  adbInfo: { flex: 1 },
  adbTitle: { fontSize: Fs.base, fontWeight: '700', color: Colors.text.primary },
  adbStatus: { fontSize: Fs.xs, color: Colors.text.secondary, marginTop: 1 },
  adbBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Rad.full },
  adbBadgeText: { fontSize: Fs.xs, fontWeight: '800' },
  adbDesc: { fontSize: Fs.sm, color: Colors.text.tertiary, lineHeight: 20, marginBottom: Sp.lg },
  adbActions: { flexDirection: 'row', gap: Sp.sm },
  adbAutoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp.xs,
    backgroundColor: Colors.brand.primary, borderRadius: Rad.full, paddingVertical: Sp.md,
  },
  adbDisableBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp.xs,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.status.error,
    borderRadius: Rad.full, paddingVertical: Sp.md,
  },
  adbGuideBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp.xs,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.brand.primary,
    borderRadius: Rad.full, paddingVertical: Sp.md,
  },
  adbAutoBtnText: { fontSize: Fs.sm, fontWeight: '600', color: Colors.brand.fg },
  // Knowledge
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
    alignItems: 'center', padding: Sp.xxl, backgroundColor: Colors.bg.secondary,
    borderRadius: Rad.lg, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  emptyText: { color: Colors.text.tertiary, fontSize: Fs.sm, marginTop: Sp.sm },
  // Actions
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
  // About
  aboutCard: {
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.xl,
    padding: Sp.xl, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  aboutName: { fontSize: Fs.xl, fontWeight: '800', color: Colors.brand.primary },
  aboutDesc: { fontSize: Fs.sm, color: Colors.text.secondary, marginTop: 2 },
  aboutPhase: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: Sp.xs, marginBottom: Sp.lg },
  aboutRow: { flexDirection: 'row', gap: Sp.sm, marginTop: Sp.xs },
  aboutLabel: { fontSize: Fs.sm, color: Colors.text.tertiary, width: 70 },
  aboutValue: { fontSize: Fs.sm, color: Colors.text.primary, flex: 1 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: Colors.bg.secondary, borderTopLeftRadius: Rad.xl, borderTopRightRadius: Rad.xl,
    padding: Sp.xl, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp.xl },
  modalTitle: { fontSize: Fs.xl, fontWeight: '800', color: Colors.text.primary },
  guideSection: { fontSize: Fs.lg, fontWeight: '700', color: Colors.brand.primary, marginBottom: Sp.md },
  guideStep: { flexDirection: 'row', alignItems: 'flex-start', gap: Sp.md, marginBottom: Sp.md },
  guideStepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.brand.primary + '20',
    justifyContent: 'center', alignItems: 'center',
  },
  guideStepNumText: { fontSize: Fs.sm, fontWeight: '700', color: Colors.brand.primary },
  guideStepText: { flex: 1, fontSize: Fs.sm, color: Colors.text.primary, lineHeight: 22 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.sm, marginBottom: Sp.sm },
  permText: { fontSize: Fs.sm, color: Colors.text.secondary },
  openSettingsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Sp.sm,
    backgroundColor: Colors.brand.primary, borderRadius: Rad.full,
    paddingVertical: Sp.lg, marginTop: Sp.xxl,
  },
  openSettingsBtnText: { fontSize: Fs.base, fontWeight: '700', color: Colors.brand.fg },
});
