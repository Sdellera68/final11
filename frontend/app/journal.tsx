import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import { getLogs, clearLogs } from '../src/api';

const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'info', label: 'Info' },
  { key: 'success', label: 'Succès' },
  { key: 'warning', label: 'Alerte' },
  { key: 'error', label: 'Erreur' },
];

const typeConfig = (type: string) => {
  switch (type) {
    case 'success': return { icon: 'check-circle' as const, color: Colors.status.success };
    case 'warning': return { icon: 'alert-triangle' as const, color: Colors.status.warning };
    case 'error': return { icon: 'x-circle' as const, color: Colors.status.error };
    case 'info': return { icon: 'info' as const, color: Colors.status.info };
    default: return { icon: 'circle' as const, color: Colors.text.tertiary };
  }
};

const moduleIcon = (mod: string) => {
  switch (mod) {
    case 'ai': return 'cpu' as const;
    case 'automation': return 'zap' as const;
    case 'learning': return 'book-open' as const;
    case 'system': return 'settings' as const;
    default: return 'layers' as const;
  }
};

export default function Journal() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const data = await getLogs(200, filter === 'all' ? undefined : filter);
      setLogs(data || []);
    } catch (e) { console.log('Logs error:', e); }
    setLoading(false);
  }, [filter]);

  useFocusEffect(
    useCallback(() => { setLoading(true); load(); }, [load])
  );

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleClear = () => {
    Alert.alert('Effacer les journaux', 'Supprimer tous les journaux ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer', style: 'destructive',
        onPress: async () => { await clearLogs().catch(() => {}); setLogs([]); },
      },
    ]);
  };

  const renderLog = ({ item }: { item: any }) => {
    const cfg = typeConfig(item.type);
    return (
      <View testID={`log-${item.id}`} style={s.logCard}>
        <View style={[s.typeBar, { backgroundColor: cfg.color }]} />
        <View style={s.logBody}>
          <View style={s.logTop}>
            <View style={s.logIcons}>
              <Feather name={cfg.icon} size={14} color={cfg.color} />
              <Feather name={moduleIcon(item.module)} size={14} color={Colors.text.tertiary} />
            </View>
            <Text style={s.logTime}>
              {item.timestamp ? new Date(item.timestamp).toLocaleString('fr-FR', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                day: '2-digit', month: 'short',
              }) : ''}
            </Text>
          </View>
          <Text style={s.logMsg}>{item.message}</Text>
          {item.module && <Text style={s.logModule}>{item.module}</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Journal d'activité</Text>
          <Text style={s.headerSub}>{logs.length} événement{logs.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity testID="clear-logs-btn" onPress={handleClear} style={s.clearBtn}>
          <Feather name="trash-2" size={18} color={Colors.status.error} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            testID={`filter-${f.key}`}
            style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={Colors.brand.primary} /></View>
      ) : logs.length === 0 ? (
        <View style={s.emptyState}>
          <Feather name="inbox" size={40} color={Colors.text.tertiary} />
          <Text style={s.emptyTitle}>Aucun événement</Text>
          <Text style={s.emptyText}>Les activités du système apparaîtront ici.</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderLog}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Sp.xl, paddingVertical: Sp.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.border.subtle,
  },
  headerTitle: { fontSize: Fs.xl, fontWeight: '800', color: Colors.text.primary },
  headerSub: { fontSize: Fs.xs, color: Colors.text.secondary, marginTop: 2 },
  clearBtn: { padding: Sp.sm },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: Sp.xl,
    paddingVertical: Sp.md, gap: Sp.sm,
  },
  filterBtn: {
    paddingHorizontal: Sp.lg, paddingVertical: Sp.sm,
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.full,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  filterBtnActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  filterText: { fontSize: Fs.xs, color: Colors.text.secondary, fontWeight: '600' },
  filterTextActive: { color: Colors.brand.fg },
  listContent: { paddingHorizontal: Sp.xl, paddingTop: Sp.sm, paddingBottom: 100 },
  logCard: {
    flexDirection: 'row', backgroundColor: Colors.bg.secondary,
    borderRadius: Rad.md, marginBottom: Sp.sm, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  typeBar: { width: 3 },
  logBody: { flex: 1, padding: Sp.md },
  logTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp.xs },
  logIcons: { flexDirection: 'row', gap: Sp.sm },
  logTime: { fontSize: Fs.xs, color: Colors.text.tertiary },
  logMsg: { fontSize: Fs.sm, color: Colors.text.primary, lineHeight: 20 },
  logModule: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: Sp.xs },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: Fs.lg, fontWeight: '700', color: Colors.text.primary, marginTop: Sp.lg },
  emptyText: { fontSize: Fs.sm, color: Colors.text.tertiary, marginTop: Sp.xs },
});
