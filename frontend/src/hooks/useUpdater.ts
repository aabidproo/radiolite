import { useState, useEffect, useCallback, useRef } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { openUrl } from '@tauri-apps/plugin-opener';

export interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
  /** If true, the Tauri auto-installer can handle the update (has .sig files). */
  canAutoInstall: boolean;
  /** GitHub release page URL — always present as a fallback. */
  releaseUrl: string;
}

export function useUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [lastCheckStatus, setLastCheckStatus] = useState<'success' | 'error' | null>(null);

  // Store the Tauri Update object for reuse in installUpdate (avoids double network call)
  const updateRef = useRef<Update | null>(null);

  const checkForUpdates = useCallback(async (isManual = false) => {
    if (isManual) setChecking(true);
    setError(null);

    try {
      // Step 1: Ask our backend what the latest version is.
      // The backend hits GitHub's API and returns version info + html_url.
      const apiUrl = import.meta.env.VITE_API_URL || 'https://radiolite.vercel.app/api/v1';
      const res = await fetch(`${apiUrl}/releases/latest`);

      if (!res.ok) {
        throw new Error(`Update server returned ${res.status}`);
      }

      const data = await res.json();
      const latestVersion: string = data.version || data.tag_name?.replace(/^v/, '') || '';
      const releaseUrl: string = data.html_url || `https://github.com/aabidproo/radiolite/releases/latest`;
      const hasSignature: boolean = data.has_signature === true;

      if (!latestVersion) {
        throw new Error('Could not parse version from update server');
      }

      // Step 2: Try Tauri's native updater (requires .sig files on the release).
      // If the update server has proper signature files, this handles download + install.
      let tauriUpdate: Update | null = null;
      if (hasSignature) {
        try {
          tauriUpdate = await check();
        } catch (tauriErr) {
          // Tauri updater failed (e.g. signature mismatch, network) — we'll fall back to manual.
          console.warn('[Updater] Tauri native check failed, falling back to manual:', tauriErr);
        }
      }

      if (tauriUpdate) {
        // Tauri found a verifiable update it can auto-install.
        updateRef.current = tauriUpdate;
        setUpdateAvailable({
          version: tauriUpdate.version,
          body: tauriUpdate.body ?? data.notes,
          date: tauriUpdate.date ?? data.pub_date,
          canAutoInstall: true,
          releaseUrl,
        });
        setLastCheckStatus('success');
        return true;
      }

      // Step 3: Manual version comparison as fallback.
      // Compare latestVersion from our backend vs the running app version.
      const { getVersion } = await import('@tauri-apps/api/app');
      const currentVersion = await getVersion();

      if (isNewerVersion(latestVersion, currentVersion)) {
        setUpdateAvailable({
          version: latestVersion,
          body: data.notes || data.body || 'New version available',
          date: data.pub_date,
          canAutoInstall: false, // No .sig files — user must download manually
          releaseUrl,
        });
        setLastCheckStatus('success');
        return true;
      } else {
        // Already on latest
        setUpdateAvailable(null);
        setLastCheckStatus('success');
        return false;
      }
    } catch (err: any) {
      console.error('[Updater] Check failed:', err);
      setLastCheckStatus('error');
      if (isManual) {
        setError('Failed to check for updates. Please check your connection.');
      }
      return false;
    } finally {
      setChecking(false);
      setHasChecked(true);
    }
  }, []);

  /**
   * Install the update.
   * - If canAutoInstall = true: uses Tauri's native downloader + installer (requires .sig files).
   * - If canAutoInstall = false: opens the GitHub release page in the browser so the user
   *   can download and reinstall manually — the standard pattern for apps without a signing CI pipeline.
   */
  const installUpdate = useCallback(async () => {
    if (!updateAvailable) return;

    if (!updateAvailable.canAutoInstall) {
      // Manual flow: open the releases page in the system browser
      try {
        await openUrl(updateAvailable.releaseUrl);
      } catch (err) {
        window.open(updateAvailable.releaseUrl, '_blank');
      }
      return;
    }

    // Auto-install flow via Tauri updater
    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      // Reuse the cached update object if available, otherwise re-check
      let update = updateRef.current;
      if (!update) {
        update = await check();
      }
      if (!update) {
        setError('Update is no longer available. Please try again.');
        return;
      }

      let downloaded = 0;
      let total = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? 0;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (total > 0) {
            setDownloadProgress(Math.round((downloaded / total) * 100));
          }
        } else if (event.event === 'Finished') {
          setDownloadProgress(100);
        }
      });

      // Relaunch to apply the update
      await relaunch();
    } catch (err: any) {
      console.error('[Updater] Install failed:', err);
      setError('Failed to install update. Try downloading manually from the release page.');
    } finally {
      setDownloading(false);
    }
  }, [updateAvailable]);

  // Run a silent background check on mount
  useEffect(() => {
    // Slight delay so it doesn't compete with initial app render
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    updateAvailable,
    checking,
    downloading,
    downloadProgress,
    error,
    hasChecked,
    lastCheckStatus,
    checkForUpdates,
    installUpdate,
  };
}

/**
 * Returns true if `latest` is strictly newer than `current`.
 * Both are semver strings like "1.2.0".
 */
function isNewerVersion(latest: string, current: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number);
  const l = parse(latest);
  const c = parse(current);
  for (let i = 0; i < 3; i++) {
    const lv = l[i] ?? 0;
    const cv = c[i] ?? 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false; // equal
}
