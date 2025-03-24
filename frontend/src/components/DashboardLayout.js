import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const DashboardLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Projekty', path: '/projects' },
    { name: 'Klienci', path: '/clients' },
    { name: 'Statystyki', path: '/stats' },
    { name: 'Profil', path: '/profile' },
    { name: 'Ustawienia', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-green-600">SolarForYou</h1>
        </div>
        <nav className="mt-6">
          <ul>
            {navItems.map(item => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-600 hover:bg-green-50 hover:text-green-600 ${
                    location.pathname === item.path ? 'bg-green-50 text-green-600 border-r-4 border-green-600' : ''
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="absolute bottom-0 w-64 border-t p-4">
          <button className="flex items-center text-gray-600 hover:text-red-500">
            Wyloguj
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            <div className="flex items-center">
              <div className="ml-4 relative">
                <div className="flex items-center">
                  <img
                    className="h-8 w-8 rounded-full border-2 border-green-600"
                    src="https://ui-avatars.com/api/?name=User"
                    alt="User avatar"
                  />
                  <span className="ml-2 text-sm font-medium">Jan Kowalski</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;