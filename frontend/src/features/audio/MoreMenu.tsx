import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Info, Coffee, Download, RefreshCw } from "lucide-react";
import { getName, getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useUpdater } from "../../hooks/useUpdater";

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const [appInfo, setAppInfo] = useState({ name: "Radiolite", version: "..." });
  const { updateAvailable, downloading, installUpdate, checking, hasChecked, checkForUpdates } = useUpdater();

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
      await openUrl("https://radiolite.onrender.com");
    } catch (err) {
      console.error("Failed to open website via plugin:", err);
      window.open("https://radiolite.onrender.com", "_blank");
    }
    onClose();
  };

  const handleBuyCoffee = async () => {
    const url = "https://www.paypal.com/ncp/payment/UQNMW76DYZGD4";
    try {
      await openUrl(url);
    } catch (err) {
      console.error("Failed to open coffee link via plugin:", err);
      window.open(url, "_blank");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[999]" 
            onClick={onClose} 
            style={{ pointerEvents: 'auto' }}
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

            {updateAvailable ? (
              <div 
                className={`more-menu-item ${downloading ? 'opacity-50 cursor-default' : 'text-green-500 font-bold'}`} 
                onClick={downloading ? undefined : installUpdate}
              >
                {downloading ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{downloading ? 'Installing...' : 'Install Update'}</span>
              </div>
            ) : (
              <div 
                className={`more-menu-item ${checking ? 'opacity-50 cursor-default' : ''}`}
                onClick={checking ? undefined : () => checkForUpdates(true)}
              >
                {checking ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                <span>{checking ? 'Checking...' : (hasChecked ? 'App is up to date' : 'Check for updates')}</span>
              </div>
            )}
            
            <div className="more-menu-divider" />
            
            <div className="more-menu-info">
              <div className="flex items-center gap-2">
                <Info size={16} />
                <span>{appInfo.name} v{appInfo.version}</span>
              </div>
              {updateAvailable && (
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
