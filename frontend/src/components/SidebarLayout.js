import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Clipboard,
  Truck,
  Wrench,
  Warehouse,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';

// Komponenty pomocnicze
const SidebarItem = ({ icon: Icon, label, isExpanded, isActive, onClick }) => (
  <div
    className={`flex items-center p-3 cursor-pointer hover:bg-orange-50 ${
      isActive ? 'bg-orange-100 text-orange-600' : 'text-gray-600'
    } rounded-lg transition-all duration-200`}
    onClick={onClick}
  >
    <Icon className="mr-3" size={20} />
    {isExpanded && <span className="text-sm font-medium">{label}</span>}
  </div>
);

const SidebarLayout = ({ children, setIsAuthenticated, activePage }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout/', {
        method: 'POST',
        credentials: 'same-origin',
      });

      if (response.ok) {
        // Aktualizujemy stan autentykacji
        if (setIsAuthenticated) setIsAuthenticated(false);
        // Przekierowujemy do strony logowania
        navigate('/');
      } else {
        console.error('Błąd wylogowania - serwer zwrócił błąd');
      }
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Projekty', path: '/projects' },
    { icon: Clipboard, label: 'Raporty', path: '/reports' },
    { icon: Truck, label: 'Zapotrzebowania', path: '/requirements' },
    { icon: Wrench, label: 'Brygada Narzędzia', path: '/tools' },
    { icon: Warehouse, label: 'Magazyn', path: '/warehouse' },
    { icon: HelpCircle, label: 'Zgłoszenia', path: '/tickets' }
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div
        className={`bg-white shadow-lg transition-all duration-300 ${
          isSidebarExpanded ? 'w-64' : 'w-20'
        } p-4 flex flex-col border-r`}
      >
        <div
          className="flex justify-between items-center mb-8 cursor-pointer"
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        >
          {isSidebarExpanded && (
            <h2 className="text-xl font-bold text-orange-600">Solar For You</h2>
          )}
          {isSidebarExpanded ? <ChevronLeft /> : <ChevronRight />}
        </div>

        <div className="space-y-2 flex-grow">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              isExpanded={isSidebarExpanded}
              isActive={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </div>

        {/* Przycisk wylogowania */}
        <div className="mt-auto pt-4 border-t">
          <div
            className="flex items-center p-3 cursor-pointer hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="mr-3" size={20} />
            {isSidebarExpanded && <span className="text-sm font-medium">Wyloguj</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default SidebarLayout;