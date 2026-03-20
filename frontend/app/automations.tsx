import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, Alert, TextInput, Modal, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import { getAutomations, createAutomation, deleteAutomation, toggleAutomation } from '../src/api';

const TRIGGER_TYPES = [
  { value: 'battery', label: 'Batterie', icon: 'battery-charging' as const },
  { value: 'network', label: 'Réseau', icon: 'wifi' as const },
  { value: 'app_state', label: 'État app', icon: 'smartphone' as const },
];

const ACTION_TYPES = [
  { value: 'notification', label: 'Notification', icon: 'bell' as const },
  { value: 'log', label: 'Journaliser', icon: 'file-text' as const },
  { value: 'ai_analysis', label: 'Analyse IA', icon: 'cpu' as const },
];

export default function Automations() {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', trigger_type: 'battery', action_type: 'notification',
    threshold: '20', condition: 'below',
  });

  const load = useCallback(async () => {
    try {
      const data = await getAutomations();
      setAutomations(data || []);
    } catch (e) { console.log('Load error:', e); }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => { load(); }, [load])
  );

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleAutomation(id);
      setAutomations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: res.active } : a))
      );
    } catch { Alert.alert('Erreur', 'Impossible de modifier l\'automatisation.'); }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Supprimer', `Supprimer "${name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteAutomation(id).catch(() => {});
          setAutomations((prev) => prev.filter((a) => a.id !== id));
        },
      },
    ]);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { Alert.alert('Erreur', 'Nom requis.'); return; }
    let trigger_config: any = {};
    if (form.trigger_type === 'battery') {
      trigger_config = { threshold: parseInt(form.threshold) || 20, condition: form.condition };
    } else if (form.trigger_type === 'network') {
      trigger_config = { connected: form.condition === 'connected' };
    } else {
      trigger_config = { state: form.condition || 'active' };
    }
    try {
      await createAutomation({
        name: form.name.trim(),
        description: form.description.trim() || form.name.trim(),
        trigger_type: form.trigger_type,
        trigger_config,
        action_type: form.action_type,
        action_config: { title: form.name.trim(), body: form.description.trim() || 'Action automatique' },
      });
      setShowCreate(false);
      setForm({ name: '', description: '', trigger_type: 'battery', action_type: 'notification', threshold: '20', condition: 'below' });
      await load();
    } catch { Alert.alert('Erreur', 'Impossible de créer l\'automatisation.'); }
  };

  const triggerIcon = (type: string) => {
    const t = TRIGGER_TYPES.find((tt) => tt.value === type);
    return t?.icon || 'zap';
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
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Automatisations</Text>
          <Text style={s.headerSub}>{automations.length} règle{automations.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity testID="create-auto-btn" style={s.addBtn} onPress={() => setShowCreate(true)}>
          <Feather name="plus" size={22} color={Colors.brand.fg} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {automations.length === 0 ? (
          <View style={s.emptyCard}>
            <Feather name="zap-off" size={40} color={Colors.text.tertiary} />
            <Text style={s.emptyTitle}>Aucune automatisation</Text>
            <Text style={s.emptyText}>Créez votre première règle d'automatisation.</Text>
          </View>
        ) : (
          automations.map((auto) => (
            <View key={auto.id} testID={`auto-${auto.id}`} style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.iconCircle, { backgroundColor: auto.active ? 'rgba(93,138,168,0.15)' : Colors.bg.tertiary }]}>
                  <Feather name={triggerIcon(auto.trigger_type) as any} size={18} color={auto.active ? Colors.brand.primary : Colors.text.tertiary} />
                </View>
                <View style={s.cardInfo}>
                  <Text style={s.cardName}>{auto.name}</Text>
                  <Text style={s.cardDesc} numberOfLines={1}>{auto.description}</Text>
                </View>
                <Switch
                  testID={`toggle-${auto.id}`}
                  value={auto.active}
                  onValueChange={() => handleToggle(auto.id)}
                  trackColor={{ false: Colors.bg.tertiary, true: 'rgba(93,138,168,0.4)' }}
                  thumbColor={auto.active ? Colors.brand.primary : Colors.text.tertiary}
                />
              </View>
              <View style={s.cardBottom}>
                <View style={s.tagRow}>
                  <View style={s.tag}>
                    <Text style={s.tagText}>{auto.trigger_type}</Text>
                  </View>
                  <Feather name="arrow-right" size={12} color={Colors.text.tertiary} />
                  <View style={s.tag}>
                    <Text style={s.tagText}>{auto.action_type}</Text>
                  </View>
                </View>
                <View style={s.cardMeta}>
                  <Text style={s.metaText}>{auto.trigger_count || 0}x déclenché</Text>
                  <TouchableOpacity testID={`delete-${auto.id}`} onPress={() => handleDelete(auto.id, auto.name)}>
                    <Feather name="trash-2" size={16} color={Colors.status.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nouvelle automatisation</Text>
              <TouchableOpacity testID="close-modal-btn" onPress={() => setShowCreate(false)}>
                <Feather name="x" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>Nom</Text>
              <TextInput
                testID="auto-name-input"
                style={s.input}
                placeholder="Ex: Alerte batterie faible"
                placeholderTextColor={Colors.text.tertiary}
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
              />

              <Text style={s.label}>Description</Text>
              <TextInput
                testID="auto-desc-input"
                style={s.input}
                placeholder="Description optionnelle"
                placeholderTextColor={Colors.text.tertiary}
                value={form.description}
                onChangeText={(t) => setForm((f) => ({ ...f, description: t }))}
              />

              <Text style={s.label}>Déclencheur</Text>
              <View style={s.optionRow}>
                {TRIGGER_TYPES.map((tt) => (
                  <TouchableOpacity
                    key={tt.value}
                    testID={`trigger-${tt.value}`}
                    style={[s.optionBtn, form.trigger_type === tt.value && s.optionBtnActive]}
                    onPress={() => setForm((f) => ({ ...f, trigger_type: tt.value }))}
                  >
                    <Feather name={tt.icon} size={16} color={form.trigger_type === tt.value ? Colors.brand.fg : Colors.text.secondary} />
                    <Text style={[s.optionText, form.trigger_type === tt.value && s.optionTextActive]}>{tt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.trigger_type === 'battery' && (
                <>
                  <Text style={s.label}>Seuil (%)</Text>
                  <TextInput
                    testID="threshold-input"
                    style={s.input}
                    keyboardType="number-pad"
                    value={form.threshold}
                    onChangeText={(t) => setForm((f) => ({ ...f, threshold: t }))}
                  />
                  <View style={s.optionRow}>
                    {['below', 'above'].map((c) => (
                      <TouchableOpacity
                        key={c}
                        testID={`cond-${c}`}
                        style={[s.optionBtn, form.condition === c && s.optionBtnActive]}
                        onPress={() => setForm((f) => ({ ...f, condition: c }))}
                      >
                        <Text style={[s.optionText, form.condition === c && s.optionTextActive]}>
                          {c === 'below' ? 'En dessous' : 'Au dessus'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              {form.trigger_type === 'network' && (
                <View style={s.optionRow}>
                  {['connected', 'disconnected'].map((c) => (
                    <TouchableOpacity
                      key={c}
                      testID={`net-${c}`}
                      style={[s.optionBtn, form.condition === c && s.optionBtnActive]}
                      onPress={() => setForm((f) => ({ ...f, condition: c }))}
                    >
                      <Text style={[s.optionText, form.condition === c && s.optionTextActive]}>
                        {c === 'connected' ? 'Connecté' : 'Déconnecté'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={s.label}>Action</Text>
              <View style={s.optionRow}>
                {ACTION_TYPES.map((at) => (
                  <TouchableOpacity
                    key={at.value}
                    testID={`action-${at.value}`}
                    style={[s.optionBtn, form.action_type === at.value && s.optionBtnActive]}
                    onPress={() => setForm((f) => ({ ...f, action_type: at.value }))}
                  >
                    <Feather name={at.icon} size={16} color={form.action_type === at.value ? Colors.brand.fg : Colors.text.secondary} />
                    <Text style={[s.optionText, form.action_type === at.value && s.optionTextActive]}>{at.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity testID="save-auto-btn" style={s.saveBtn} onPress={handleCreate}>
                <Text style={s.saveBtnText}>Créer l'automatisation</Text>
              </TouchableOpacity>
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
  scroll: { flex: 1 },
  scrollContent: { padding: Sp.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Sp.xl, paddingVertical: Sp.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  headerTitle: { fontSize: Fs.xl, fontWeight: '800', color: Colors.text.primary },
  headerSub: { fontSize: Fs.xs, color: Colors.text.secondary, marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.xl,
    padding: Sp.lg, marginBottom: Sp.md,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Sp.md },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: Fs.base, fontWeight: '700', color: Colors.text.primary },
  cardDesc: { fontSize: Fs.xs, color: Colors.text.secondary, marginTop: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Sp.md },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.xs },
  tag: { backgroundColor: Colors.bg.tertiary, paddingHorizontal: Sp.sm, paddingVertical: 2, borderRadius: Rad.sm },
  tagText: { fontSize: Fs.xs, color: Colors.text.secondary },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Sp.md },
  metaText: { fontSize: Fs.xs, color: Colors.text.tertiary },
  emptyCard: { alignItems: 'center', paddingVertical: Sp.section, backgroundColor: Colors.bg.secondary, borderRadius: Rad.xl, borderWidth: 1, borderColor: Colors.border.subtle },
  emptyTitle: { fontSize: Fs.lg, fontWeight: '700', color: Colors.text.primary, marginTop: Sp.lg },
  emptyText: { fontSize: Fs.sm, color: Colors.text.tertiary, marginTop: Sp.xs },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modal: {
    backgroundColor: Colors.bg.secondary, borderTopLeftRadius: Rad.xl, borderTopRightRadius: Rad.xl,
    padding: Sp.xl, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp.xl },
  modalTitle: { fontSize: Fs.xl, fontWeight: '800', color: Colors.text.primary },
  label: { fontSize: Fs.sm, fontWeight: '600', color: Colors.text.secondary, marginBottom: Sp.sm, marginTop: Sp.lg },
  input: {
    backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.border.subtle,
    borderRadius: Rad.md, paddingHorizontal: Sp.lg, paddingVertical: Sp.md,
    color: Colors.text.primary, fontSize: Fs.base,
  },
  optionRow: { flexDirection: 'row', gap: Sp.sm, flexWrap: 'wrap' },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Sp.xs,
    backgroundColor: Colors.bg.primary, borderWidth: 1, borderColor: Colors.border.subtle,
    borderRadius: Rad.full, paddingHorizontal: Sp.lg, paddingVertical: Sp.sm,
  },
  optionBtnActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  optionText: { fontSize: Fs.sm, color: Colors.text.secondary },
  optionTextActive: { color: Colors.brand.fg },
  saveBtn: {
    backgroundColor: Colors.brand.primary, borderRadius: Rad.full,
    paddingVertical: Sp.lg, alignItems: 'center', marginTop: Sp.xxl, marginBottom: Sp.xxxl,
  },
  saveBtnText: { fontSize: Fs.base, fontWeight: '700', color: Colors.brand.fg },
});
