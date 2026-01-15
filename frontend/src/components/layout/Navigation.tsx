import { Compass, Heart, Search, Menu } from "lucide-react";

interface NavItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  return (
    <div 
      className={`nav-item ${active ? 'active' : ''}`} 
      onClick={onClick}
    >
      <Icon size={24} />
      <span>{label}</span>
    </div>
  );
}

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  return (
    <nav className="navigation-container">
      <NavItem 
        icon={Compass} 
        label="Explore" 
        active={activeTab === 'explore'} 
        onClick={() => setActiveTab('explore')}
      />
      <NavItem 
        icon={Heart} 
        label="Favorites" 
        active={activeTab === 'favorites'} 
        onClick={() => setActiveTab('favorites')}
      />
      <NavItem 
        icon={Search} 
        label="Search" 
        active={activeTab === 'search'} 
        onClick={() => setActiveTab('search')}
      />
      <NavItem 
        icon={Menu} 
        label="Settings" 
        active={activeTab === 'settings'} 
        onClick={() => setActiveTab('settings')}
      />
    </nav>
  );
}
