// frontend/src/pages/RequisitionsPage.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Server,
  Users,
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';
import MaterialRequisitionsPage from './MaterialRequisitionsPage';
import HRRequisitionsPage from './HRRequisitionsPage';
import { useRequisitions } from '../contexts/RequisitionContext';

const RequisitionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requisitions, loading, error, refreshRequisitions, forceRefresh } = useRequisitions();
  const [isInitialized, setIsInitialized] = useState(false);

  // Force refresh when component mounts to ensure we have the latest data
  useEffect(() => {
    console.log("RequisitionsPage: Component mounted, forcing refresh...");
    forceRefresh(); // Use forceRefresh instead of refreshRequisitions for immediate data fetch
    setIsInitialized(true);
  }, [forceRefresh]);

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

  // Main view - selection between material and HR requisitions
  const MainView = () => (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Zapotrzebowania</h1>
        <p className="text-gray-600">Wybierz rodzaj zapotrzebowania, które chcesz złożyć lub przeglądać</p>
      </div>

      {/* Display error message if any */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Display loading indicator */}
      {loading && (
        <div className="flex justify-center items-center p-6 mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Ładowanie danych...</span>
        </div>
      )}

      {/* Display requisition type selection cards */}
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
                <p className="text-gray-500 mt-2">
                  {type.id === 'material' &&
                    `Dostępne zapotrzebowania: ${requisitions.filter(req => req.requisition_type === 'material').length}`
                  }
                </p>
              </div>
              <div className="text-gray-400">
                <ChevronRight size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Debug info - consider removing in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
          <p>Debug: Total requisitions in context: {requisitions.length}</p>
          <button
            onClick={() => forceRefresh()}
            className="mt-2 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Refresh Data
          </button>
        </div>
      )}
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