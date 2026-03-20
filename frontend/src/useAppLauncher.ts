import { useState, useEffect } from 'react';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, Linking, NativeModules } from 'react-native';
import { launchApp } from './api';

const ADBManager = Platform.OS === 'android' ? NativeModules.ADBManager : null;

export function useAppLauncher() {
  const [loading, setLoading] = useState(false);

  const openApp = async (appName: string): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      Alert.alert('Non disponible', 'Le lanceur d\'applications est disponible uniquement sur Android.');
      return false;
    }

    setLoading(true);
    try {
      // Get package name from backend
      const response = await launchApp(appName);
      
      if (!response.success) {
        Alert.alert('Application introuvable', response.message || 'Impossible de trouver l\'application.');
        return false;
      }

      const packageName = response.package_name;

      // PRIORITY 1: Try native module (most reliable)
      if (ADBManager && ADBManager.launchApp) {
        try {
          await ADBManager.launchApp(packageName);
          console.log(`App launched via native module: ${appName}`);
          return true;
        } catch (nativeError) {
          console.log('Native module failed, trying fallback:', nativeError);
        }
      }

      // PRIORITY 2: Try IntentLauncher (Expo method)
      try {
        await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
          packageName,
        });
        console.log(`App launched via IntentLauncher: ${appName}`);
        return true;
      } catch (intentError) {
        console.log('IntentLauncher failed, trying Linking:', intentError);
      }

      // PRIORITY 3: Try Linking as last resort (may not work for all apps)
      try {
        const appUrl = `intent://${packageName}#Intent;scheme=android-app;end`;
        const canOpen = await Linking.canOpenURL(appUrl);
        if (canOpen) {
          await Linking.openURL(appUrl);
          console.log(`App launched via Linking: ${appName}`);
          return true;
        }
      } catch (linkError) {
        console.log('Linking failed:', linkError);
      }

      // All methods failed - app probably not installed
      Alert.alert(
        'Application introuvable',
        `${appName} n'est pas installée sur cet appareil.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Installer',
            onPress: () => Linking.openURL(`market://details?id=${packageName}`),
          },
        ]
      );
      return false;

    } catch (error) {
      console.error('App launcher error:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du lancement de l\'application.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const openSettings = async (settingsAction?: string) => {
    if (Platform.OS !== 'android') {
      await Linking.openSettings();
      return;
    }

    try {
      const action = settingsAction || 'android.settings.SETTINGS';
      await IntentLauncher.startActivityAsync(action);
    } catch (error) {
      console.error('Settings error:', error);
      await Linking.openSettings();
    }
  };

  const openDeveloperOptions = async () => {
    await openSettings('android.settings.APPLICATION_DEVELOPMENT_SETTINGS');
  };

  return {
    openApp,
    openSettings,
    openDeveloperOptions,
    loading,
  };
}
