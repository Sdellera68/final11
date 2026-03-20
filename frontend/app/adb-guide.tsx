import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Sp, Rad, Fs } from '../src/theme';
import { getADBGuide, getADBConsent, setADBConsent } from '../src/api';
import { useAppLauncher } from '../src/useAppLauncher';

interface ADBGuideData {
  steps_auto: string[];
  steps_manual: string[];
  permissions_unlocked: string[];
}

export default function ADBGuide() {
  const [guide, setGuide] = useState<ADBGuideData | null>(null);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const appLauncher = useAppLauncher();

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

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.loadText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Guide ADB Sans Fil</Text>
          <Text style={s.headerSub}>Configuration développeur avancée</Text>
        </View>
        <TouchableOpacity onPress={handleOpenDeveloperOptions} style={s.openBtn}>
          <Feather name="external-link" size={20} color={Colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Consent Card */}
        <View style={[s.card, { borderColor: consent ? Colors.status.success : Colors.status.warning }]}>
          <View style={s.consentHeader}>
            <Feather
              name={consent ? 'check-circle' : 'alert-circle'}
              size={24}
              color={consent ? Colors.status.success : Colors.status.warning}
            />
            <Text style={s.consentTitle}>
              {consent ? 'ADB activé' : 'ADB non activé'}
            </Text>
          </View>
          <Text style={s.consentText}>
            {consent
              ? 'Vous avez accepté l\'activation ADB sans fil. ARIA peut maintenant interagir avec vos applications.'
              : 'Activez ADB sans fil pour débloquer le contrôle total d\'ARIA sur votre appareil.'}
          </Text>
          <TouchableOpacity
            style={[s.consentBtn, consent && s.consentBtnActive]}
            onPress={handleConsent}
          >
            <Text style={[s.consentBtnText, consent && s.consentBtnTextActive]}>
              {consent ? 'Révoquer le consentement' : 'Accepter et activer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Manual Steps */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Feather name="list" size={20} color={Colors.brand.primary} />
            <Text style={s.sectionTitle}>Étapes d'activation manuelle</Text>
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
            <Text style={s.sectionTitle}>Permissions débloquées</Text>
          </View>
          {guide?.permissions_unlocked.map((perm, i) => (
            <View key={i} style={s.permItem}>
              <Feather name="check" size={16} color={Colors.status.success} />
              <Text style={s.permText}>{perm}</Text>
            </View>
          ))}
        </View>

        {/* Info Card */}
        <View style={s.infoCard}>
          <Feather name="info" size={20} color={Colors.status.info} />
          <Text style={s.infoText}>
            <Text style={s.infoBold}>Important :</Text> L'activation ADB sans fil nécessite que votre appareil et
            votre ordinateur soient sur le même réseau WiFi. Une fois activé, ARIA pourra exécuter des
            commandes système avancées.
          </Text>
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
});
