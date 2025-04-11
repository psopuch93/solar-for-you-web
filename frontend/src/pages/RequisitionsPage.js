// frontend/src/pages/RequisitionsPage.js
import React, { useState, useRef, memo, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  ArrowUpDown,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  Eye,
  Check,
  Server,
  Users,
  Truck,
  ChevronRight
} from 'lucide-react';
import MaterialRequisitionsPage from './MaterialRequisitionsPage';
import HRRequisitionsPage from './HRRequisitionsPage';
import TransportRequestsPage from './TransportRequestsPage';
import { useRequisitions } from '../contexts/RequisitionContext';
import { useDialog } from '../contexts/DialogContext';

const RequisitionsPage = memo(() => {
  const {
    requisitions,
    loading,
    error,
    forceRefresh,
    updateSingleRequisition
  } = useRequisitions();

  const { showInfo, confirm } = useDialog();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localStatuses, setLocalStatuses] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [expandedRequisition, setExpandedRequisition] = useState(null);
  const [requisitionDetails, setRequisitionDetails] = useState({});
  const [statusUpdating, setStatusUpdating] = useState({});

  const mountedRef = useRef(true);
  const navigate = useNavigate();

  // Force refresh on component mount
  useEffect(() => {
    if (!isInitialized) {
      forceRefresh();
      setIsInitialized(true);
    }
  }, [forceRefresh, isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Watch for changes in requisitions to update local statuses
  useEffect(() => {
    const newLocalStatuses = {};
    requisitions.forEach(req => {
      newLocalStatuses[req.id] = req.status;
    });
    setLocalStatuses(newLocalStatuses);
  }, [requisitions]);

  // Typy zapotrzebowań
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
    },
    // Nowy typ zapotrzebowania - transport
    {
      id: 'transport',
      name: 'Transport',
      description: 'Zapotrzebowania na transport zasobów i przesyłek',
      icon: Truck,
      color: 'bg-orange-500',
      path: '/dashboard/requests/transport'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <Route path="/transport/*" element={<TransportRequestsPage />} />
    </Routes>
  );
});

export default RequisitionsPage;