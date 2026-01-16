import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Info } from "lucide-react";
import { getName, getVersion } from "@tauri-apps/api/app";

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

  const handleShare = async () => {
    const shareText = `Check out ${appInfo.name} - The ultimate radio experience!`;
    const shareUrl = "https://radiolite.onrender.com";
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: appInfo.name,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Share failed", err);
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
          />
          
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="more-menu"
          >
            <div className="more-menu-item" onClick={handleShare}>
              <Share2 size={16} />
              <span>Share this app</span>
            </div>
            
            <div className="more-menu-divider" />
            
            <div className="more-menu-item !cursor-default active:scale-100 hover:bg-transparent">
              <Info size={16} />
              <span>{appInfo.name} v{appInfo.version}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
