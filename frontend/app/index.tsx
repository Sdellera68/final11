import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Accelerometer } from 'expo-sensors';
import * as Device from 'expo-device';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import { getStats, updateSystemStatus, seedData, evaluateAutomations, createLog } from '../src/api';
import { useResourceManager } from '../src/useResourceManager';
import { useScreenCapture } from '../src/useScreenCapture';

interface Stats {
  messages: number;
  knowledge: number;
  automations: number;
  active_automations: number;
  logs: number;
  recent_logs: any[];
  system_status: any;
}

const MODE_COLORS: Record<string, string> = {
  turbo: Colors.status.success,
  normal: Colors.brand.primary,
  eco: Colors.status.warning,
  minimal: Colors.status.error,
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [appActive, setAppActive] = useState(true);

  const resource = useResourceManager();
  const screen = useScreenCapture();

  // Accelerometer for real-time sensor interaction (native only)
  useEffect(() => {
    let sub: any = null;
    const setup = async () => {
      try {
        if (Accelerometer && typeof Accelerometer.addListener === 'function') {
          Accelerometer.setUpdateInterval(1000);
          sub = Accelerometer.addListener((data) => {
            setAccel({ x: +data.x.toFixed(2), y: +data.y.toFixed(2), z: +data.z.toFixed(2) });
          });
        }
      } catch (e) {
        // Accelerometer not available (web preview) - silent fallback
        console.log('Accelerometer not available on this platform');
      }
    };
    setup();
    return () => { if (sub) sub.remove(); };
  }, []);

  // App state tracking (lock screen detection)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      const active = state === 'active';
      setAppActive(active);
      if (!active) {
        createLog({
          type: 'info', module: 'system',
          message: 'Écran verrouillé — ARIA en pause',
        }).catch(() => {});
      } else {
        createLog({
          type: 'success', module: 'system',
          message: 'Écran déverrouillé — ARIA reprend',
        }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) { console.log('Stats error:', e); }
  }, []);

  const sendSystemStatus = useCallback(async () => {
    try {
      await updateSystemStatus({
        battery_level: resource.batteryLevel >= 0 ? resource.batteryLevel : null,
        battery_charging: resource.isCharging,
        network_type: resource.networkType,
        network_connected: resource.networkConnected,
        device_name: Device.deviceName || 'Appareil',
        device_model: Device.modelName || 'Inconnu',
        os_version: Device.osVersion || '?',
        app_state: appActive ? 'active' : 'background',
      });
      await evaluateAutomations({
        battery_level: resource.batteryLevel >= 0 ? resource.batteryLevel : null,
        battery_charging: resource.isCharging,
        network_connected: resource.networkConnected,
        network_type: resource.networkType,
        app_state: appActive ? 'active' : 'background',
      });
    } catch {}
  }, [resource, appActive]);

  // Initial load + adaptive polling
  useEffect(() => {
    const init = async () => {
      await seedData().catch(() => {});
      await Promise.all([fetchStats(), sendSystemStatus()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      fetchStats();
      sendSystemStatus();
    }, resource.pollInterval);
    return () => clearInterval(interval);
  }, [resource.pollInterval, loading, fetchStats, sendSystemStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), sendSystemStatus(), resource.refresh()]);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <Text style={s.loadText}>Initialisation d'ARIA...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const batteryColor = resource.batteryLevel > 50
    ? Colors.status.success
    : resource.batteryLevel > 20 ? Colors.status.warning : Colors.status.error;
  const modeColor = MODE_COLORS[resource.mode] || Colors.brand.primary;

  const logTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return { name: 'check-circle' as const, color: Colors.status.success };
      case 'warning': return { name: 'alert-triangle' as const, color: Colors.status.warning };
      case 'error': return { name: 'x-circle' as const, color: Colors.status.error };
      default: return { name: 'info' as const, color: Colors.status.info };
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>ARIA</Text>
            <Text style={s.subtitle}>Assistant Réactif Intelligent Autonome</Text>
          </View>
          <View style={s.headerRight}>
            {screen.isCapturing && (
              <View testID="capture-indicator" style={s.captureIndicator}>
                <View style={s.captureRedDot} />
                <Text style={s.captureText}>REC</Text>
              </View>
            )}
            <View style={[s.statusDot, { backgroundColor: appActive ? Colors.status.success : Colors.status.warning }]} />
          </View>
        </View>

        {/* Resource Mode Banner */}
        <View testID="resource-mode-card" style={[s.modeBanner, { borderColor: modeColor + '40' }]}>
          <View style={s.modeRow}>
            <View style={[s.modeIconCircle, { backgroundColor: modeColor + '20' }]}>
              <Feather name="cpu" size={16} color={modeColor} />
            </View>
            <View style={s.modeInfo}>
              <Text style={s.modeTitle}>Mode : {resource.modeLabel}</Text>
              <Text style={s.modeDesc}>
                Rafraîchissement toutes les {Math.round(resource.pollInterval / 1000)}s — Aucune restriction
              </Text>
            </View>
            <View style={[s.unrestrictedBadge, { backgroundColor: Colors.status.success + '20' }]}>
              <Feather name="unlock" size={12} color={Colors.status.success} />
              <Text style={s.unrestrictedText}>Libre</Text>
            </View>
          </View>
        </View>

        {/* System Cards Row */}
        <View style={s.row}>
          <View testID="battery-card" style={[s.card, s.cardHalf]}>
            <View style={s.cardHeader}>
              <Feather name={resource.isCharging ? 'battery-charging' : 'battery'} size={18} color={batteryColor} />
              <Text style={s.cardLabel}>Batterie</Text>
            </View>
            <Text style={[s.cardValue, { color: batteryColor }]}>
              {resource.batteryLevel >= 0 ? `${resource.batteryLevel}%` : 'N/A'}
            </Text>
            <Text style={s.cardSub}>{resource.isCharging ? 'En charge' : 'Sur batterie'}</Text>
          </View>
          <View testID="network-card" style={[s.card, s.cardHalf]}>
            <View style={s.cardHeader}>
              <Feather name="wifi" size={18} color={resource.networkConnected ? Colors.status.success : Colors.status.error} />
              <Text style={s.cardLabel}>Réseau</Text>
            </View>
            <Text style={[s.cardValue, { color: resource.networkConnected ? Colors.status.success : Colors.status.error }]}>
              {resource.networkConnected ? 'Connecté' : 'Hors ligne'}
            </Text>
            <Text style={s.cardSub}>{resource.networkType}</Text>
          </View>
        </View>

        {/* Screen Capture & Sensors Card */}
        <View style={s.row}>
          <View testID="screen-card" style={[s.card, s.cardHalf]}>
            <View style={s.cardHeader}>
              <Feather name="monitor" size={18} color={screen.isCapturing ? Colors.status.error : Colors.brand.primary} />
              <Text style={s.cardLabel}>Écran</Text>
            </View>
            <Text style={[s.cardValue, { fontSize: Fs.lg }]}>
              {screen.isCapturing ? 'Capture' : 'Normal'}
            </Text>
            <Text style={s.cardSub}>{screen.captureCount} captures détectées</Text>
          </View>
          <View testID="sensors-card" style={[s.card, s.cardHalf]}>
            <View style={s.cardHeader}>
              <Feather name="move" size={18} color={Colors.status.warning} />
              <Text style={s.cardLabel}>Capteurs</Text>
            </View>
            <Text style={[s.sensorText]}>x: {accel.x}</Text>
            <Text style={[s.sensorText]}>y: {accel.y}</Text>
            <Text style={[s.sensorText]}>z: {accel.z}</Text>
          </View>
        </View>

        {/* AI Intelligence Card */}
        <View testID="ai-card" style={s.card}>
          <View style={s.cardHeader}>
            <Feather name="cpu" size={18} color={Colors.brand.primary} />
            <Text style={s.cardLabel}>Intelligence ARIA</Text>
          </View>
          <View style={s.progressRow}>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${Math.min((stats?.knowledge || 0) * 5, 100)}%` }]} />
            </View>
            <Text style={s.progressText}>{stats?.knowledge || 0} savoirs</Text>
          </View>
          <View style={s.statRow}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{stats?.messages || 0}</Text>
              <Text style={s.statLabel}>Messages</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNum}>{stats?.knowledge || 0}</Text>
              <Text style={s.statLabel}>Connaissances</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNum}>{stats?.logs || 0}</Text>
              <Text style={s.statLabel}>Événements</Text>
            </View>
          </View>
        </View>

        {/* Automations Card */}
        <View testID="automations-card" style={s.card}>
          <View style={s.cardHeader}>
            <Feather name="zap" size={18} color={Colors.status.warning} />
            <Text style={s.cardLabel}>Automatisations</Text>
          </View>
          <Text style={s.cardValue}>
            {stats?.active_automations || 0}
            <Text style={s.cardValueSub}> / {stats?.automations || 0} actives</Text>
          </Text>
        </View>

        {/* Recent Activity */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Activité récente</Text>
        </View>
        {(stats?.recent_logs || []).length === 0 ? (
          <View style={s.emptyCard}>
            <Feather name="inbox" size={24} color={Colors.text.tertiary} />
            <Text style={s.emptyText}>Aucune activité récente</Text>
          </View>
        ) : (
          (stats?.recent_logs || []).map((log: any, i: number) => {
            const icon = logTypeIcon(log.type);
            return (
              <View key={log.id || i} testID={`log-${i}`} style={s.logItem}>
                <Feather name={icon.name} size={16} color={icon.color} />
                <View style={s.logContent}>
                  <Text style={s.logMsg} numberOfLines={1}>{log.message}</Text>
                  <Text style={s.logTime}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('fr-FR') : ''}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Device Info */}
        <View style={[s.card, { marginTop: Sp.lg }]}>
          <View style={s.cardHeader}>
            <Feather name="smartphone" size={18} color={Colors.text.secondary} />
            <Text style={s.cardLabel}>Appareil</Text>
          </View>
          <Text style={s.deviceText}>{Device.modelName || 'Inconnu'} — {Device.deviceName || ''}</Text>
          <Text style={s.deviceText}>Android {Device.osVersion || '?'}</Text>
          <View style={s.deviceRow}>
            <View style={[s.deviceTag, { backgroundColor: Colors.status.success + '20' }]}>
              <Feather name="unlock" size={10} color={Colors.status.success} />
              <Text style={[s.deviceTagText, { color: Colors.status.success }]}>Aucune limitation</Text>
            </View>
            <View style={[s.deviceTag, { backgroundColor: Colors.brand.primary + '20' }]}>
              <Feather name="shield" size={10} color={Colors.brand.primary} />
              <Text style={[s.deviceTagText, { color: Colors.brand.primary }]}>Auto-adaptatif</Text>
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
  scroll: { flex: 1 },
  scrollContent: { padding: Sp.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadText: { color: Colors.text.secondary, marginTop: Sp.lg, fontSize: Fs.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Sp.xl },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Sp.md },
  title: { fontSize: Fs.xxxl, fontWeight: '900', color: Colors.brand.primary, letterSpacing: 2 },
  subtitle: { fontSize: Fs.sm, color: Colors.text.secondary, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  captureIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,83,80,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: Rad.full },
  captureRedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.status.error },
  captureText: { fontSize: Fs.xs, fontWeight: '800', color: Colors.status.error },
  modeBanner: {
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.lg, padding: Sp.lg,
    marginBottom: Sp.md, borderWidth: 1,
  },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.md },
  modeIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modeInfo: { flex: 1 },
  modeTitle: { fontSize: Fs.sm, fontWeight: '700', color: Colors.text.primary },
  modeDesc: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: 1 },
  unrestrictedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Rad.full },
  unrestrictedText: { fontSize: Fs.xs, fontWeight: '700', color: Colors.status.success },
  row: { flexDirection: 'row', gap: Sp.md, marginBottom: Sp.md },
  card: {
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.xl, padding: Sp.xl,
    marginBottom: Sp.md, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  cardHalf: { flex: 1, marginBottom: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Sp.sm, marginBottom: Sp.md },
  cardLabel: { fontSize: Fs.sm, color: Colors.text.secondary, fontWeight: '600' },
  cardValue: { fontSize: Fs.xxl, fontWeight: '800', color: Colors.text.primary },
  cardValueSub: { fontSize: Fs.base, fontWeight: '400', color: Colors.text.tertiary },
  cardSub: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: 2 },
  sensorText: { fontSize: Fs.xs, color: Colors.text.secondary, fontFamily: 'monospace' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Sp.md, marginBottom: Sp.md },
  progressBg: { flex: 1, height: 6, backgroundColor: Colors.bg.tertiary, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: Colors.brand.primary, borderRadius: 3 },
  progressText: { fontSize: Fs.xs, color: Colors.text.secondary },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Sp.sm },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: Fs.xl, fontWeight: '700', color: Colors.text.primary },
  statLabel: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: 2 },
  sectionHeader: { marginTop: Sp.lg, marginBottom: Sp.md },
  sectionTitle: { fontSize: Fs.lg, fontWeight: '700', color: Colors.text.primary },
  logItem: {
    flexDirection: 'row', alignItems: 'center', gap: Sp.md,
    backgroundColor: Colors.bg.secondary, padding: Sp.lg,
    borderRadius: Rad.md, marginBottom: Sp.sm,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  logContent: { flex: 1 },
  logMsg: { fontSize: Fs.sm, color: Colors.text.primary },
  logTime: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: 2 },
  emptyCard: {
    alignItems: 'center', padding: Sp.xxxl,
    backgroundColor: Colors.bg.secondary, borderRadius: Rad.lg,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  emptyText: { color: Colors.text.tertiary, fontSize: Fs.sm, marginTop: Sp.sm },
  deviceText: { fontSize: Fs.sm, color: Colors.text.tertiary, marginTop: 2 },
  deviceRow: { flexDirection: 'row', gap: Sp.sm, marginTop: Sp.md },
  deviceTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Rad.full },
  deviceTagText: { fontSize: Fs.xs, fontWeight: '600' },
});
