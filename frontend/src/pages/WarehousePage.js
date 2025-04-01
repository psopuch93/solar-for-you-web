// frontend/src/pages/WarehousePage.js
import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeftRight,
  Clipboard,
  Truck,
  Home,
  ChevronRight
} from 'lucide-react';
import WarehouseEquipmentPage from './WarehouseEquipmentPage';
import WarehouseTransfersPage from './WarehouseTransfersPage';
import WarehouseRequisitionsPage from './WarehouseRequisitionsPage';
import WarehouseFleetPage from './WarehouseFleetPage';
import WarehouseQuartersPage from './WarehouseQuartersPage';

const WarehousePage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'equipment',
      name: 'Sprzęt',
      description: 'Zarządzanie sprzętem, narzędziami i materiałami',
      icon: Package,
      color: 'bg-blue-500',
      path: '/dashboard/warehouse/equipment'
    },
    {
      id: 'transfers',
      name: 'Przekazania',
      description: 'Wydawanie i przyjmowanie sprzętu, historia transferów',
      icon: ArrowLeftRight,
      color: 'bg-green-500',
      path: '/dashboard/warehouse/transfers'
    },
    {
      id: 'requisitions',
      name: 'Zapotrzebowania',
      description: 'Zarządzanie zapotrzebowaniami magazynowymi',
      icon: Clipboard,
      color: 'bg-orange-500',
      path: '/dashboard/warehouse/requisitions'
    },
    {
      id: 'fleet',
      name: 'Flota',
      description: 'Zarządzanie pojazdami, serwis, przeglądy, lokalizacja',
      icon: Truck,
      color: 'bg-purple-500',
      path: '/dashboard/warehouse/fleet'
    },
    {
      id: 'quarters',
      name: 'Kwatery',
      description: 'Zarządzanie kwaterami pracowniczymi, rezerwacje, przydziały',
      icon: Home,
      color: 'bg-indigo-500',
      path: '/dashboard/warehouse/quarters'
    }
  ];

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Magazyn</h1>
            <p className="text-gray-600">Wybierz obszar zarządzania zasobami, którym chcesz się zająć</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sections.map((section) => (
              <div
                key={section.id}
                onClick={() => navigate(section.path)}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="flex items-start">
                  <div className={`${section.color} p-3 rounded-lg text-white`}>
                    <section.icon size={24} />
                  </div>
                  <div className="ml-4 flex-1">
                    <h2 className="text-xl font-semibold text-gray-800">{section.name}</h2>
                    <p className="text-gray-600 mt-1">{section.description}</p>
                  </div>
                  <div className="text-gray-400">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      } />
      <Route path="/equipment/*" element={<WarehouseEquipmentPage />} />
      <Route path="/transfers/*" element={<WarehouseTransfersPage />} />
      <Route path="/requisitions/*" element={<WarehouseRequisitionsPage />} />
      <Route path="/fleet/*" element={<WarehouseFleetPage />} />
      <Route path="/quarters/*" element={<WarehouseQuartersPage />} />
    </Routes>
  );
};

export default WarehousePage;