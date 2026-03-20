import { useState, useEffect, useCallback, useRef } from 'react';
import * as Battery from 'expo-battery';
import * as Network from 'expo-network';

export type ResourceMode = 'turbo' | 'normal' | 'eco' | 'minimal';

export interface ResourceState {
  batteryLevel: number;
  isCharging: boolean;
  networkConnected: boolean;
  networkType: string;
  pollInterval: number;
  mode: ResourceMode;
  modeLabel: string;
  unrestricted: boolean;
}

const MODE_CONFIG: Record<ResourceMode, { label: string; interval: number }> = {
  turbo: { label: 'Turbo (en charge)', interval: 10000 },
  normal: { label: 'Normal', interval: 25000 },
  eco: { label: 'Économique', interval: 50000 },
  minimal: { label: 'Minimal', interval: 90000 },
};

function resolveMode(batteryLevel: number, isCharging: boolean): ResourceMode {
  if (isCharging) return 'turbo';
  if (batteryLevel > 60) return 'normal';
  if (batteryLevel > 25) return 'eco';
  return 'minimal';
}

export function useResourceManager() {
  const [state, setState] = useState<ResourceState>({
    batteryLevel: 100,
    isCharging: false,
    networkConnected: true,
    networkType: 'Inconnu',
    pollInterval: 25000,
    mode: 'normal',
    modeLabel: 'Normal',
    unrestricted: true,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [lvl, battState, net] = await Promise.all([
        Battery.getBatteryLevelAsync().catch(() => -1),
        Battery.getBatteryStateAsync().catch(() => Battery.BatteryState.UNKNOWN),
        Network.getNetworkStateAsync().catch(() => ({ type: 'Unknown', isConnected: true })),
      ]);
      const batteryLevel = lvl >= 0 ? Math.round(lvl * 100) : 100;
      const isCharging = battState === Battery.BatteryState.CHARGING;
      const networkConnected = net.isConnected ?? true;
      const networkType = String(net.type || 'Inconnu');
      const mode = resolveMode(batteryLevel, isCharging);
      const cfg = MODE_CONFIG[mode];

      setState({
        batteryLevel,
        isCharging,
        networkConnected,
        networkType,
        pollInterval: cfg.interval,
        mode,
        modeLabel: cfg.label,
        unrestricted: true,
      });
    } catch {
      // silent — never crash
    }
  }, []);

  useEffect(() => {
    refresh();
    // Adaptive self-adjusting interval
    const tick = () => {
      refresh();
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, state.pollInterval);
    };
    intervalRef.current = setInterval(tick, state.pollInterval);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [refresh, state.pollInterval]);

  return { ...state, refresh };
}
