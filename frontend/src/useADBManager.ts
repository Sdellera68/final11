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

// Safe access to native module - only available on native Android builds
const ADBManager = Platform.OS === 'android' ? NativeModules.ADBManager : null;

const isADBManagerAvailable = (): boolean => {
  return Platform.OS === 'android' && ADBManager !== null && ADBManager !== undefined;
};

export function useADBManager() {
  const getDeviceIP = async (): Promise<string> => {
    if (!isADBManagerAvailable()) {
      throw new Error('ADB Manager requires a native Android build (not available in Expo preview)');
    }
    return await ADBManager.getDeviceIP();
  };

  const isADBEnabled = async (): Promise<boolean> => {
    if (!isADBManagerAvailable()) return false;
    return await ADBManager.isADBEnabled();
  };

  const getADBPort = async (): Promise<number> => {
    if (!isADBManagerAvailable()) return 5555;
    return await ADBManager.getADBPort();
  };

  const startADBWireless = async (): Promise<boolean> => {
    if (!isADBManagerAvailable()) {
      throw new Error('ADB Manager requires a native Android build');
    }
    return await ADBManager.startADBWireless();
  };

  const executeCommand = async (command: string): Promise<CommandResult> => {
    if (!isADBManagerAvailable()) {
      throw new Error('ADB Manager requires a native Android build');
    }
    return await ADBManager.executeCommand(command);
  };

  const getADBPairingInfo = async (): Promise<ADBPairingInfo> => {
    if (!isADBManagerAvailable()) {
      throw new Error('ADB Manager requires a native Android build');
    }
    return await ADBManager.getADBPairingInfo();
  };

  const getInstalledPackages = async (): Promise<InstalledPackage[]> => {
    if (!isADBManagerAvailable()) {
      throw new Error('ADB Manager requires a native Android build');
    }
    return await ADBManager.getInstalledPackages();
  };

  const launchAppNative = async (packageName: string): Promise<boolean> => {
    if (!isADBManagerAvailable()) {
      throw new Error('ADB Manager requires a native Android build');
    }
    return await ADBManager.launchApp(packageName);
  };

  const isDeviceRooted = async (): Promise<boolean> => {
    if (!isADBManagerAvailable()) return false;
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
    isAvailable: isADBManagerAvailable(),
  };
}
