// frontend/src/pages/RequisitionsPage.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Server,
  Users,
  ChevronRight,
  Eye
} from 'lucide-react';
import MaterialRequisitionsPage from './MaterialRequisitionsPage';
import HRRequisitionsPage from './HRRequisitionsPage';
import { useRequisitions } from '../contexts/RequisitionContext';

const RequisitionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requisitions, refreshRequisitions } = useRequisitions();
  const [isInitialized, setIsInitialized] = useState(false);

  // Jednorazowe ładowanie danych przy pierwszym renderowaniu strony
  useEffect(() => {
    if (!isInitialized && requisitions.length === 0) {
      console.log("RequisitionsPage: Inicjalizacja danych...");
      refreshRequisitions();
      setIsInitialized(true);
    }
  }, [isInitialized, requisitions.length, refreshRequisitions]);

  // Nie odświeżamy automatycznie po każdej zmianie lokalizacji
  // Dane są aktualizowane przez współdzielony kontekst

  const types = [
    {
      id: 'material',
      name: 'Materiałowe',
      description: 'Zapotrzebowania na materiały, narzędzia i sprzęt IT',
      icon: Server,
      color: 'bg-blue-500',
      path: '/dashboard/requests/material'
    },
    {
      id: 'hr',
      name: 'HR',
      description: 'Zapotrzebowania kadrowe, szkolenia, rekrutacje',
      icon: Users,
      color: 'bg-green-500',
      path: '/dashboard/requests/hr'
    }
  ];

  // Główny widok strony wyboru typu zapotrzebowań
  const MainView = () => (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Zapotrzebowania</h1>
        <p className="text-gray-600">Wybierz rodzaj zapotrzebowania, które chcesz złożyć lub przeglądać</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {types.map((type) => (
          <div
            key={type.id}
            onClick={() => navigate(type.path)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 duration-200"
          >
            <div className="flex items-start">
              <div className={`${type.color} p-3 rounded-lg text-white`}>
                <type.icon size={24} />
              </div>
              <div className="ml-4 flex-1">
                <h2 className="text-xl font-semibold text-gray-800">{type.name}</h2>
                <p className="text-gray-600 mt-1">{type.description}</p>
              </div>
              <div className="text-gray-400">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainView />} />
      <Route path="/material/*" element={<MaterialRequisitionsPage />} />
      <Route path="/hr/*" element={<HRRequisitionsPage />} />
    </Routes>
  );
};

export default RequisitionsPage;