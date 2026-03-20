import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import { getADBGuide, getADBConsent, setADBConsent } from '../src/api';
import { useAppLauncher } from '../src/useAppLauncher';
import { useADBManager } from '../src/useADBManager';

interface ADBGuideData {
  steps_auto: string[];
  steps_manual: string[];
  permissions_unlocked: string[];
}

export default function ADBGuide() {
  const [guide, setGuide] = useState<ADBGuideData | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pairingInfo, setPairingInfo] = useState<any>(null);
  const [adbEnabled, setAdbEnabled] = useState(false);
  const [isRooted, setIsRooted] = useState(false);
  const [pairingCode, setPairingCode] = useState<string>('');
  const appLauncher = useAppLauncher();
  const adbManager = useADBManager();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [guideData, consentData] = await Promise.all([
        getADBGuide(),
        getADBConsent(),
      ]);
      setGuide(guideData);
      setConsent(consentData.accepted || false);

      // Check ADB status
      try {
        const [info, enabled, rooted] = await Promise.all([
          adbManager.getADBPairingInfo(),
          adbManager.isADBEnabled(),
          adbManager.isDeviceRooted(),
        ]);
        setPairingInfo(info);
        setAdbEnabled(enabled);
        setIsRooted(rooted);
        
        // Generate random 6-digit pairing code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setPairingCode(code);
      } catch (e) {
        console.log('ADB Manager not available:', e);
      }
    } catch (e) {
      console.log('ADB guide error:', e);
    }
    setLoading(false);
  };

  const handleConsent = async () => {
    try {
      await setADBConsent(!consent);
      setConsent(!consent);
      Alert.alert(
        'Consentement enregistré',
        !consent
          ? 'Vous acceptez l\'activation ADB sans fil.'
          : 'Vous avez révoqué le consentement ADB.'
      );
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer le consentement.');
    }
  };

  const handleOpenDeveloperOptions = async () => {
    try {
      await appLauncher.openDeveloperOptions();
    } catch (error) {
      Alert.alert(
        'Options développeur',
        'Ouvrez Paramètres > À propos du téléphone > Tapez 7x sur "Numéro de build"'
      );
    }
  };

  const handleStartADBWireless = async () => {
    if (!isRooted) {
      Alert.alert(
        'Root requis',
        'L\'activation automatique d\'ADB nécessite un accès root. Veuillez suivre les étapes manuelles.'
      );
      return;
    }

    try {
      const success = await adbManager.startADBWireless();
      if (success) {
        Alert.alert('Succès', 'ADB Wireless activé automatiquement !');
        await loadData();
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible d\'activer ADB automatiquement');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brand.primary} />
          <Text style={s.loadText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>ADB Wireless</Text>
          <Text style={s.headerSub}>Contrôle total du smartphone</Text>
        </View>
        <TouchableOpacity onPress={handleOpenDeveloperOptions} style={s.openBtn}>
          <Feather name="external-link" size={20} color={Colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Status Card */}
        <View style={[s.card, { borderColor: adbEnabled ? Colors.status.success : Colors.status.warning }]}>
          <View style={s.statusHeader}>
            <Feather
              name={adbEnabled ? 'check-circle' : 'alert-circle'}
              size={24}
              color={adbEnabled ? Colors.status.success : Colors.status.warning}
            />
            <View style={s.statusInfo}>
              <Text style={s.statusTitle}>
                {adbEnabled ? 'ADB Activé' : 'ADB Désactivé'}
              </Text>
              <Text style={s.statusSub}>
                {isRooted ? '🔓 Appareil rooté' : '🔒 Pas de root'}
              </Text>
            </View>
            {isRooted && !adbEnabled && (
              <TouchableOpacity style={s.autoBtn} onPress={handleStartADBWireless}>
                <Feather name="zap" size={16} color={Colors.brand.fg} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Pairing Information */}
        {pairingInfo && (
          <View style={s.pairingCard}>
            <View style={s.pairingHeader}>
              <Feather name="link" size={20} color={Colors.brand.primary} />
              <Text style={s.pairingTitle}>Informations de Pairing</Text>
            </View>
            
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Adresse IP :</Text>
              <Text style={s.infoValue}>{pairingInfo.ip}</Text>
            </View>
            
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Port de connexion :</Text>
              <Text style={s.infoValue}>{pairingInfo.port}</Text>
            </View>
            
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Port de pairing :</Text>
              <Text style={s.infoValue}>{pairingInfo.pairingPort}</Text>
            </View>

            {/* Pairing Code */}
            <View style={s.codeCard}>
              <Text style={s.codeLabel}>Code de pairing :</Text>
              <Text style={s.codeValue}>{pairingCode}</Text>
              <Text style={s.codeHint}>
                (Code généré aléatoirement - utilisez-le pour le pairing ADB)
              </Text>
            </View>

            {/* Connection Strings */}
            <View style={s.commandCard}>
              <Text style={s.commandLabel}>1. Commande de pairing (PC) :</Text>
              <View style={s.commandBox}>
                <Text style={s.commandText}>
                  adb pair {pairingInfo.pairingString}
                </Text>
              </View>
              <Text style={s.commandHint}>
                Entrez le code {pairingCode} quand demandé
              </Text>
            </View>

            <View style={s.commandCard}>
              <Text style={s.commandLabel}>2. Commande de connexion (PC) :</Text>
              <View style={s.commandBox}>
                <Text style={s.commandText}>
                  adb connect {pairingInfo.connectionString}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Consent Card */}
        <View style={[s.card, { borderColor: consent ? Colors.status.success : Colors.status.warning }]}>
          <View style={s.consentHeader}>
            <Feather
              name={consent ? 'check-circle' : 'alert-circle'}
              size={24}
              color={consent ? Colors.status.success : Colors.status.warning}
            />
            <Text style={s.consentTitle}>
              {consent ? 'Consentement accordé' : 'Consentement requis'}
            </Text>
          </View>
          <Text style={s.consentText}>
            {consent
              ? 'ARIA peut maintenant contrôler totalement votre smartphone via ADB.'
              : 'Accordez le consentement pour débloquer le contrôle total d\'ARIA.'}
          </Text>
          <TouchableOpacity
            style={[s.consentBtn, consent && s.consentBtnActive]}
            onPress={handleConsent}
          >
            <Text style={[s.consentBtnText, consent && s.consentBtnTextActive]}>
              {consent ? 'Révoquer' : 'Accorder le consentement'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual Steps */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Feather name="list" size={20} color={Colors.brand.primary} />
            <Text style={s.sectionTitle}>Étapes manuelles</Text>
          </View>
          {guide?.steps_manual.map((step, i) => (
            <View key={i} style={s.step}>
              <View style={s.stepNumber}>
                <Text style={s.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Permissions Unlocked */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Feather name="unlock" size={20} color={Colors.status.success} />
            <Text style={s.sectionTitle}>Capacités débloquées</Text>
          </View>
          {guide?.permissions_unlocked.map((perm, i) => (
            <View key={i} style={s.permItem}>
              <Feather name="check" size={16} color={Colors.status.success} />
              <Text style={s.permText}>{perm}</Text>
            </View>
          ))}
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
  loadText: { color: Colors.text.secondary, fontSize: Fs.base },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Sp.xl,
    paddingVertical: Sp.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerTitle: { fontSize: Fs.xl, fontWeight: '800', color: Colors.text.primary },
  headerSub: { fontSize: Fs.xs, color: Colors.text.tertiary, marginTop: 2 },
  openBtn: {
    padding: Sp.sm,
    borderRadius: Rad.sm,
    backgroundColor: Colors.brand.primary + '20',
  },
  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Rad.xl,
    padding: Sp.xl,
    marginBottom: Sp.lg,
    borderWidth: 2,
  },
  consentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.md,
    marginBottom: Sp.md,
  },
  consentTitle: {
    fontSize: Fs.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  consentText: {
    fontSize: Fs.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Sp.lg,
  },
  consentBtn: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Sp.md,
    borderRadius: Rad.lg,
    alignItems: 'center',
  },
  consentBtnActive: {
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  consentBtnText: {
    fontSize: Fs.base,
    fontWeight: '700',
    color: Colors.brand.fg,
  },
  consentBtnTextActive: {
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: Sp.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.sm,
    marginBottom: Sp.lg,
  },
  sectionTitle: {
    fontSize: Fs.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Sp.md,
    marginBottom: Sp.md,
    backgroundColor: Colors.bg.secondary,
    padding: Sp.lg,
    borderRadius: Rad.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: Fs.sm,
    fontWeight: '700',
    color: Colors.brand.fg,
  },
  stepText: {
    flex: 1,
    fontSize: Fs.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Sp.sm,
    marginBottom: Sp.sm,
    paddingLeft: Sp.md,
  },
  permText: {
    flex: 1,
    fontSize: Fs.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    gap: Sp.md,
    backgroundColor: Colors.status.info + '15',
    padding: Sp.lg,
    borderRadius: Rad.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.status.info,
  },
  infoText: {
    flex: 1,
    fontSize: Fs.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Fs.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statusSub: {
    fontSize: Fs.xs,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  autoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pairingCard: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Rad.xl,
    padding: Sp.xl,
    marginBottom: Sp.lg,
    borderWidth: 1,
    borderColor: Colors.brand.primary + '40',
  },
  pairingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Sp.sm,
    marginBottom: Sp.lg,
  },
  pairingTitle: {
    fontSize: Fs.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Sp.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  infoLabel: {
    fontSize: Fs.sm,
    color: Colors.text.tertiary,
  },
  infoValue: {
    fontSize: Fs.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: 'monospace',
  },
  codeCard: {
    backgroundColor: Colors.brand.primary + '10',
    borderRadius: Rad.lg,
    padding: Sp.xl,
    marginTop: Sp.lg,
    marginBottom: Sp.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.brand.primary,
  },
  codeLabel: {
    fontSize: Fs.sm,
    color: Colors.text.secondary,
    marginBottom: Sp.sm,
  },
  codeValue: {
    fontSize: 48,
    fontWeight: '900',
    color: Colors.brand.primary,
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  codeHint: {
    fontSize: Fs.xs,
    color: Colors.text.tertiary,
    marginTop: Sp.sm,
    textAlign: 'center',
  },
  commandCard: {
    marginTop: Sp.md,
  },
  commandLabel: {
    fontSize: Fs.sm,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Sp.sm,
  },
  commandBox: {
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Rad.md,
    padding: Sp.md,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  commandText: {
    fontSize: Fs.sm,
    color: Colors.brand.primary,
    fontFamily: 'monospace',
  },
  commandHint: {
    fontSize: Fs.xs,
    color: Colors.text.tertiary,
    marginTop: Sp.xs,
    fontStyle: 'italic',
  },
});
