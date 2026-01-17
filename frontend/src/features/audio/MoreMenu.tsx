import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Info, Coffee } from "lucide-react";
import { getName, getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const [appInfo, setAppInfo] = useState({ name: "Radiolite", version: "..." });

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
      // Last resort fallback
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
            
            <div className="more-menu-divider" />
            
            <div className="more-menu-info">
              <Info size={16} />
              <span>{appInfo.name} v{appInfo.version}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
