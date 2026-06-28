import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Info, Coffee, Download, RefreshCw, ArrowDownToLine } from "lucide-react";
import { getName, getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUpdater } from "../../hooks/useUpdater";

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const [appInfo, setAppInfo] = useState({ name: "Radiolite", version: "..." });
  const {
    updateAvailable,
    downloading,
    downloadProgress,
    installUpdate,
    checking,
    hasChecked,
    lastCheckStatus,
    checkForUpdates,
    error,
  } = useUpdater();

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const [name, version] = await Promise.all([getName(), getVersion()]);
        setAppInfo({ name, version });
      } catch (err) {
        console.error("Failed to fetch app info", err);
      }
    };
    fetchInfo();
  }, []);

  const handleVisitWebsite = async () => {
    try {
      await openUrl("https://radiolite.aabidhasan.com.np");
    } catch (err) {
      window.open("https://radiolite.aabidhasan.com.np", "_blank");
    }
    onClose();
  };

  const handleBuyCoffee = async () => {
    const url = "https://www.paypal.com/ncp/payment/UQNMW76DYZGD4";
    try {
      await openUrl(url);
    } catch (err) {
      window.open(url, "_blank");
    }
    onClose();
  };

  const updateLabel = () => {
    if (downloading) {
      return downloadProgress > 0
        ? `Downloading... ${downloadProgress}%`
        : "Preparing download...";
    }
    if (!updateAvailable) return null;
    return updateAvailable.canAutoInstall ? "Install Update" : "Download Update";
  };

  const updateIcon = () => {
    if (downloading) return <RefreshCw size={16} className="animate-spin" />;
    if (updateAvailable?.canAutoInstall) return <ArrowDownToLine size={16} />;
    return <Download size={16} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[999]"
            onClick={onClose}
            style={{ pointerEvents: "auto" }}
          />

          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="more-menu"
          >
            <div className="more-menu-item" onClick={handleVisitWebsite}>
              <ExternalLink size={16} />
              <span>Visit website</span>
            </div>

            <div className="more-menu-item" onClick={handleBuyCoffee}>
              <Coffee size={16} />
              <span>Buy me a coffee</span>
            </div>

            {/* Update row */}
            {updateAvailable ? (
              <div
                className={`more-menu-item ${
                  downloading
                    ? "opacity-60 cursor-default"
                    : "text-green-400 font-semibold"
                }`}
                onClick={downloading ? undefined : installUpdate}
              >
                {updateIcon()}
                <span>{updateLabel()}</span>
              </div>
            ) : (
              <div
                className={`more-menu-item ${checking ? "opacity-50 cursor-default" : ""}`}
                onClick={checking ? undefined : () => checkForUpdates(true)}
              >
                {checking ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                <span>
                  {checking
                    ? "Checking..."
                    : lastCheckStatus === "error"
                    ? "Check failed — retry"
                    : hasChecked
                    ? "Up to date"
                    : "Check for updates"}
                </span>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="px-3 py-1">
                <p className="text-red-400 text-xs leading-snug">{error}</p>
              </div>
            )}

            <div className="more-menu-divider" />

            <div className="more-menu-info">
              <div className="flex items-center gap-2">
                <Info size={16} />
                <span>
                  {appInfo.name} v{appInfo.version}
                </span>
              </div>
              {/* Pulsing dot when update is available */}
              {updateAvailable && (
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </div>
              )}
            </div>

            {/* Update version badge */}
            {updateAvailable && (
              <div className="px-3 pb-2">
                <p className="text-green-400/80 text-xs">
                  v{updateAvailable.version} available
                  {!updateAvailable.canAutoInstall && " — opens in browser"}
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
