import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { createLog } from './api';

let addScreenshotListenerFn: any = null;

// Dynamic import since expo-screen-capture may fail on web
async function loadScreenCapture() {
  try {
    const mod = await import('expo-screen-capture');
    addScreenshotListenerFn = mod.addScreenshotListener;
    return mod;
  } catch {
    return null;
  }
}

export function useScreenCapture() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [available, setAvailable] = useState(false);
  const [appActive, setAppActive] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track app state for lock screen detection
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const active = nextState === 'active';
      setAppActive(active);
      if (!active) {
        // Phone locked or app backgrounded — log event
        createLog({
          type: 'info',
          module: 'system',
          message: active ? 'Application active' : 'Application en arrière-plan / Écran verrouillé',
        }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  // Screenshot listener
  useEffect(() => {
    let subscription: any = null;

    const setup = async () => {
      const mod = await loadScreenCapture();
      if (!mod) return;
      setAvailable(true);

      try {
        subscription = mod.addScreenshotListener(() => {
          setCaptureCount((prev) => prev + 1);
          setIsCapturing(true);
          createLog({
            type: 'info',
            module: 'system',
            message: `Capture d'écran détectée (#${captureCount + 1})`,
            details: { timestamp: new Date().toISOString() },
          }).catch(() => {});

          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setIsCapturing(false), 3000);
        });
      } catch {
        // Silent — web doesn't support this
      }
    };

    setup();
    return () => {
      if (subscription) subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [captureCount]);

  // Recording simulation detection — check every 5s for system state
  const getRecordingStatus = useCallback(() => {
    return { isCapturing, captureCount, available, appActive };
  }, [isCapturing, captureCount, available, appActive]);

  return { isCapturing, captureCount, available, appActive, getRecordingStatus };
}
