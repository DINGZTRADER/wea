
import React from 'react';
import { WEALogo, COMPANY_INFO } from '../constants';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  BrainCircuit, 
  MessageSquare, 
  Settings,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  currentPath: string;
  setPath: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPath, setPath }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'ops', label: 'WEA-Ops Console', icon: BrainCircuit },
    { id: 'support', label: 'Customer Support', icon: MessageSquare },
  ];

  return (
    <div className="h-full w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <WEALogo className="h-8 w-8" />
        <span className="font-bold text-xl tracking-tight">{COMPANY_INFO.initials}</span>
      </div>
      
      <nav className="flex-1 mt-4 px-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setPath(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
              currentPath === item.id 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={() => setPath('settings')}
          className="w-full flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-white transition-colors"
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </button>
        <div className="mt-4 px-3 py-2 bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Operator</p>
          <p className="text-sm font-medium text-blue-400 truncate">peter@wachaexperience.com</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
