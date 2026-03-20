import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

interface ADBPairingInfo {
  ip: string;
  port: number;
  pairingPort: number;
  connectionString: string;
  pairingString: string;
}

interface CommandResult {
  exitCode: number;
  output: string;
  success: boolean;
}

interface InstalledPackage {
  packageName: string;
  appName: string;
}

const { ADBManager } = NativeModules;

export function useADBManager() {
  const getDeviceIP = async (): Promise<string> => {
    if (Platform.OS !== 'android') {
      throw new Error('ADB Manager is only available on Android');
    }
    return await ADBManager.getDeviceIP();
  };

  const isADBEnabled = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    return await ADBManager.isADBEnabled();
  };

  const getADBPort = async (): Promise<number> => {
    if (Platform.OS !== 'android') return 5555;
    return await ADBManager.getADBPort();
  };

  const startADBWireless = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      throw new Error('ADB Manager is only available on Android');
    }
    return await ADBManager.startADBWireless();
  };

  const executeCommand = async (command: string): Promise<CommandResult> => {
    if (Platform.OS !== 'android') {
      throw new Error('ADB Manager is only available on Android');
    }
    return await ADBManager.executeCommand(command);
  };

  const getADBPairingInfo = async (): Promise<ADBPairingInfo> => {
    if (Platform.OS !== 'android') {
      throw new Error('ADB Manager is only available on Android');
    }
    return await ADBManager.getADBPairingInfo();
  };

  const getInstalledPackages = async (): Promise<InstalledPackage[]> => {
    if (Platform.OS !== 'android') {
      throw new Error('ADB Manager is only available on Android');
    }
    return await ADBManager.getInstalledPackages();
  };

  const launchAppNative = async (packageName: string): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      throw new Error('ADB Manager is only available on Android');
    }
    return await ADBManager.launchApp(packageName);
  };

  const isDeviceRooted = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    return await ADBManager.isDeviceRooted();
  };

  return {
    getDeviceIP,
    isADBEnabled,
    getADBPort,
    startADBWireless,
    executeCommand,
    getADBPairingInfo,
    getInstalledPackages,
    launchAppNative,
    isDeviceRooted,
  };
}
