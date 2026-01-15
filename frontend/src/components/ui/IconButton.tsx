import { LucideIcon } from "lucide-react";

interface IconButtonProps {
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
  size?: number;
  isActive?: boolean;
  activeColor?: string;
  disabled?: boolean;
  fill?: string;
  strokeWidth?: number;
}

export function IconButton({ 
  icon: Icon, 
  onClick, 
  className = "", 
  size = 24, 
  isActive = false, 
  activeColor = "text-[#1db954]",
  disabled = false,
  fill = "currentColor",
  strokeWidth = 1.5
}: IconButtonProps) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`icon-btn ${isActive ? (activeColor === 'text-white' ? 'btn-active-white' : 'active-accent') : ''} ${fill !== 'none' ? 'btn-filled' : ''} ${className}`}
    >
      <Icon 
        size={size} 
        fill={fill} 
        strokeWidth={strokeWidth} 
      />
    </button>
  );
}
