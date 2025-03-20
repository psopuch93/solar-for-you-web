import React, { useState } from 'react';
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
  Search,
  Bell,
  ShoppingCart,
  TrendingUp,
  ShoppingBag
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

const StatCard = ({ icon: Icon, title, value, change, color }) => (
  <div className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300">
    <div className="flex justify-between items-center">
      <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
        <Icon className="text-white" size={24} />
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        <span className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change > 0 ? '+' : ''}{change}%
        </span>
      </div>
    </div>
  </div>
);

const BusinessDashboard = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeSidebarItem, setActiveSidebarItem] = useState('Dashboard');

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: FileText, label: 'Progres Raport' },
    { icon: Clipboard, label: 'Raporty' },
    { icon: Truck, label: 'Zapotrzebowania' },
    { icon: Wrench, label: 'Brygada Narzędzia' },
    { icon: Warehouse, label: 'Magazyn' },
    { icon: HelpCircle, label: 'Zgłoszenia' }
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
              isActive={activeSidebarItem === item.label}
              onClick={() => setActiveSidebarItem(item.label)}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-8 overflow-auto">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Szukaj..."
                className="pl-8 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Search className="absolute left-2 top-3 text-gray-400" size={18} />
            </div>
            <div className="bg-white p-2 rounded-full shadow-md">
              <Bell className="text-gray-600" size={20} />
            </div>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={ShoppingCart}
            title="Klienci"
            value="5,428"
            change={12.5}
            color="bg-orange-500"
          />
          <StatCard
            icon={TrendingUp}
            title="Przychód"
            value="$780,452"
            change={8.2}
            color="bg-green-500"
          />
          <StatCard
            icon={ShoppingBag}
            title="Sprzedane produkty"
            value="6,410"
            change={15.3}
            color="bg-blue-500"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-2 space-y-6">
            {/* Data Analytics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Analityka danych</h3>
                <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                  Rozpocznij
                </button>
              </div>
              <p className="text-gray-500 mb-4">
                Sprawdź, jak rozwija się Twoje konto i jak możesz je jeszcze bardziej rozwinąć.
              </p>
              <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Miejsce na wykres</p>
              </div>
            </div>

            {/* Przepływ finansowy */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Przepływ finansowy</h3>
                <p className="text-gray-500">Wrzesień 2021: $2,530</p>
              </div>
              <div className="w-full h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-400">Wykres przepływu finansowego</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Saldo */}
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Twoje saldo</h3>
              <p className="text-3xl font-bold text-green-600">$10,632.02</p>
              <p className="text-red-500 mt-2">-$1,062.90</p>
            </div>

            {/* Aktywność */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Aktywność</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-full">
                      <TrendingUp className="text-orange-500" size={20} />
                    </div>
                    <span>Wypłata zarobków</span>
                  </div>
                  <span className="font-bold text-orange-500">$4,120</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-full">
                      <TrendingUp className="text-red-500" size={20} />
                    </div>
                    <span>Opłata podatkowa</span>
                  </div>
                  <span className="font-bold text-red-500">-$230</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;