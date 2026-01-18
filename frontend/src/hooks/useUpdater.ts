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
        return update;
      } else {
        setUpdateAvailable(null);
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
      // Don't set error state for background checks to avoid annoying the user
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
    checkForUpdates,
    installUpdate
  };
}
