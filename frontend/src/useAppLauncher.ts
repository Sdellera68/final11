import { useState, useEffect } from 'react';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, Linking } from 'react-native';
import { launchApp } from './api';

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

      try {
        // Try to launch the app using IntentLauncher
        await IntentLauncher.startActivityAsync('android.intent.action.MAIN', {
          packageName,
          className: packageName + '.MainActivity',
        });
        return true;
      } catch (launchError) {
        // Fallback: try to open with Linking
        try {
          const supported = await Linking.canOpenURL(`package:${packageName}`);
          if (supported) {
            await Linking.openURL(`package:${packageName}`);
            return true;
          } else {
            // Try to open in Play Store
            await Linking.openURL(`market://details?id=${packageName}`);
            Alert.alert('Application non installée', `Voulez-vous installer ${appName} depuis le Play Store ?`);
            return false;
          }
        } catch (linkError) {
          console.error('Launch error:', linkError);
          Alert.alert('Erreur', `Impossible d'ouvrir ${appName}. L'application n'est peut-être pas installée.`);
          return false;
        }
      }
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
