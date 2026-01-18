import { useState, useEffect, useCallback } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
}

export function useUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [lastCheckStatus, setLastCheckStatus] = useState<'success' | 'error' | null>(null);

  const checkForUpdates = useCallback(async (isManual = false) => {
    if (isManual) setChecking(true);
    setError(null);
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable({
          version: update.version,
          body: update.body,
          date: update.date,
        });
        setLastCheckStatus('success');
        return update;
      } else {
        setUpdateAvailable(null);
        setLastCheckStatus('success');
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
      
      // In dev mode, we might get errors because of missing assets or unsigned binaries.
      // We treat this as "no update" to avoid misleading the user in dev.
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log('Defaulting to "Up to date" in dev mode due to check failure.');
        setLastCheckStatus('success');
      } else {
        setLastCheckStatus('error');
        if (isManual) {
          setError('Failed to check for updates. Please check your internet connection and try again.');
        }
      }
    } finally {
      setChecking(false);
      setHasChecked(true);
    }
    return null;
  }, []);

  const installUpdate = useCallback(async () => {
    if (!updateAvailable) return;
    
    setDownloading(true);
    setError(null);
    try {
      const update = await check();
      if (update) {
        // This will download and install the update
        await update.downloadAndInstall();
        // Relaunch the app to apply the update
        await relaunch();
      }
    } catch (err) {
      console.error('Failed to install update:', err);
      setError('Failed to install update. Please try again later.');
    } finally {
      setDownloading(false);
    }
  }, [updateAvailable]);

  // Initial check on mount
  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    updateAvailable,
    checking,
    downloading,
    error,
    hasChecked,
    lastCheckStatus,
    checkForUpdates,
    installUpdate
  };
}
