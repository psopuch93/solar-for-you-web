// frontend/src/pages/Dashboard.js
import React, { useState } from 'react';
import { useNavigate, Routes, Route, NavLink } from 'react-router-dom';
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
  LogOut,
  Folder,
  Users
} from 'lucide-react';

import ProjectsPage from './ProjectsPage';
import ClientsPage from './ClientsPage';
import ClientForm from '../components/ClientForm';
import MainDashboard from './MainDashboard';
import { ProjectProvider } from '../contexts/ProjectContext';
import { getCsrfToken } from '../utils/csrfToken';

// Komponenty pomocnicze
const SidebarItem = ({ icon: Icon, label, isExpanded, to }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `flex items-center p-3 cursor-pointer hover:bg-orange-50 ${
      isActive ? 'bg-orange-100 text-orange-600' : 'text-gray-600'
    } rounded-lg transition-all duration-200`}
  >
    <Icon className="mr-3" size={20} />
    {isExpanded && <span className="text-sm font-medium">{label}</span>}
  </NavLink>
);

const BusinessDashboard = ({ setIsAuthenticated }) => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const navigate = useNavigate();

  // Funkcja obsługi wylogowania
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken()
        },
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
    { icon: Folder, label: 'Projekty', path: '/dashboard/projects' },
    { icon: Users, label: 'Klienci', path: '/dashboard/clients' },
    { icon: FileText, label: 'Progres Raport', path: '/dashboard/reports' },
    { icon: Clipboard, label: 'Raporty', path: '/dashboard/analytics' },
    { icon: Truck, label: 'Zapotrzebowania', path: '/dashboard/requests' },
    { icon: Wrench, label: 'Brygada Narzędzia', path: '/dashboard/tools' },
    { icon: Warehouse, label: 'Magazyn', path: '/dashboard/warehouse' },
    { icon: HelpCircle, label: 'Zgłoszenia', path: '/dashboard/tickets' }
  ];

  return (
    <ProjectProvider>
      <div className="flex min-h-screen bg-gray-50 font-sans">
        {/* Sidebar */}
        <div
          className={`bg-white shadow-lg transition-all duration-300 ${
            isSidebarExpanded ? 'w-64' : 'w-20'
          } p-4 flex flex-col border-r fixed h-full z-10`}
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
                to={item.path}
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
        <div className={`flex-grow transition-all duration-300 ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
          <div className="p-8">
            <Routes>
              <Route path="/" element={<MainDashboard />} />
              <Route path="/projects/*" element={<ProjectsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/new" element={<ClientForm />} />
              <Route path="/clients/:id" element={<ClientForm />} />
              {/* Pozostałe trasy można dodać w przyszłości */}
              <Route path="*" element={<div>Strona nie została znaleziona</div>} />
            </Routes>
          </div>
        </div>
      </div>
    </ProjectProvider>
  );
};

export default BusinessDashboard;