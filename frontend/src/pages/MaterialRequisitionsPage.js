// frontend/src/pages/MaterialRequisitionsPage.js
import React, { useState, useRef, memo, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
  Check
} from 'lucide-react';
import MaterialRequisitionForm from '../components/MaterialRequisitionForm';
import { useRequisitions } from '../contexts/RequisitionContext';
import { useDialog } from '../contexts/DialogContext';
import { getCsrfToken } from '../utils/csrfToken';

const MaterialRequisitionsPage = memo(() => {
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

  // Efekt pobierający szczegóły konkretnego zapotrzebowania po rozwinięciu
  useEffect(() => {
    if (expandedRequisition && !requisitionDetails[expandedRequisition]) {
      fetchRequisitionDetails(expandedRequisition);
    }
  }, [expandedRequisition]);

  const fetchRequisitionDetails = async (requisitionId) => {
    try {
      const response = await fetch(`/api/requisitions/${requisitionId}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania szczegółów zapotrzebowania');
      }

      const data = await response.json();
      setRequisitionDetails(prev => ({
        ...prev,
        [requisitionId]: data
      }));
    } catch (err) {
      console.error('Błąd pobierania szczegółów:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'to_accept':
        return <Clock className="text-yellow-500" size={20} />;
      case 'accepted':
        return <CheckCircle className="text-blue-500" size={20} />;
      case 'in_progress':
        return <Loader className="text-orange-500" size={20} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'to_accept': 'Do akceptacji',
      'accepted': 'Zaakceptowano',
      'rejected': 'Odrzucono',
      'in_progress': 'W trakcie realizacji',
      'completed': 'Zrealizowano'
    };
    return statusMap[status] || status;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleCompleteRequisition = async (requisitionId) => {
    // Znajdź pełen obiekt zapotrzebowania
    const requisition = requisitions.find(req => req.id === requisitionId);
    if (!requisition) return;

    // Zapamiętaj obecny status przed zmianą
    const previousStatus = requisition.status;

    // Pokaz komunikat potwierdzenia
    confirm(
      "Czy na pewno chcesz oznaczać zapotrzebowanie jako zrealizowane?",
      async () => {
        try {
          // Pokaż wskaźnik ładowania dla tego konkretnego wiersza
          setStatusUpdating(prev => ({ ...prev, [requisitionId]: true }));

          // Natychmiast aktualizuj status w UI
          setLocalStatuses(prev => ({
            ...prev,
            [requisitionId]: 'completed'
          }));

          const csrfToken = getCsrfToken();
          const response = await fetch(`/api/requisitions/${requisitionId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ status: 'completed' }),
            credentials: 'same-origin',
          });

          if (!response.ok) {
            throw new Error(`Błąd serwera: ${response.status}`);
          }

          // Pobierz zaktualizowane dane
          const responseData = await response.json();

          // Aktualizuj pojedyncze zapotrzebowanie w kontekście
          updateSingleRequisition({
            ...requisition,
            status: 'completed'
          });

          // Pokaż komunikat o sukcesie
          showInfo("Zapotrzebowanie zostało oznaczone jako zrealizowane");
        } catch (err) {
          console.error('Błąd podczas zmiany statusu:', err);

          // Przywróć poprzedni status w UI
          setLocalStatuses(prev => ({
            ...prev,
            [requisitionId]: previousStatus
          }));

          // Pokaż komunikat o błędzie
          showInfo("Wystąpił błąd podczas zmiany statusu", { type: "warning" });
        } finally {
          // Usuń wskaźnik ładowania
          setStatusUpdating(prev => ({ ...prev, [requisitionId]: false }));
        }
      }
    );
  };

  // Filtruj i sortuj zapotrzebowania materiałowe
  const filteredRequisitions = useMemo(() => {
    // Filtruj tylko zapotrzebowania typu "material"
    const materialReqs = requisitions.filter(req => req.requisition_type === 'material');

    // Filtruj tylko zapotrzebowania utworzone przez aktualnego użytkownika
    const userReqs = materialReqs.filter(req => req.created_by === req.current_user_id);

    const sortableReqs = [...userReqs];

    // Sortowanie
    sortableReqs.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Obsługa pól zagnieżdżonych
      if (sortField === 'project_name') {
        aValue = a.project_name || '';
        bValue = b.project_name || '';
      }

      // Obsługa dat
      if (sortField === 'created_at' || sortField === 'deadline') {
        aValue = aValue ? new Date(aValue) : null;
        bValue = bValue ? new Date(bValue) : null;

        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;
      }

      // Obsługa tekstu
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Obsługa innych typów
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      return sortDirection === 'asc'
        ? aValue < bValue ? -1 : 1
        : aValue < bValue ? 1 : -1;
    });

    // Filtrowanie
    return sortableReqs.filter(requisition => {
      // Filtruj po statusie
      if (statusFilter !== 'all' && requisition.status !== statusFilter) {
        return false;
      }

      // Filtruj po wyszukiwanej frazie
      const searchLower = searchTerm.toLowerCase();
      return (
        (requisition.number && requisition.number.toLowerCase().includes(searchLower)) ||
        (requisition.project_name && requisition.project_name.toLowerCase().includes(searchLower)) ||
        (requisition.comment && requisition.comment.toLowerCase().includes(searchLower))
      );
    });
  }, [requisitions, sortField, sortDirection, statusFilter, searchTerm]);

const MainView = memo(() => (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zapotrzebowania Materiałowe</h1>
          <p className="text-gray-600 mt-1">Zarządzaj zapotrzebowaniami na materiały, narzędzia i sprzęt</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/requests/material/new')}
          className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <PlusCircle className="mr-2" size={18} />
          Nowe zapotrzebowanie
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-auto md:flex-1">
            <input
              type="text"
              placeholder="Szukaj zapotrzebowań..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'all'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Wszystkie
            </button>
            <button
              onClick={() => setStatusFilter('to_accept')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'to_accept'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              }`}
            >
              Do akceptacji
            </button>
            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'accepted'
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              Zaakceptowane
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'in_progress'
                  ? 'bg-orange-200 text-orange-800'
                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              }`}
            >
              W realizacji
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'completed'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
              }`}
            >
              Zrealizowane
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'rejected'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              Odrzucone
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <div className="flex items-center">
              <AlertCircle className="mr-2" size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            {requisitions.length === 0 ?
              "Trwa ładowanie zapotrzebowań..." :
              "Brak zapotrzebowań spełniających kryteria wyszukiwania"}

            <button
              onClick={() => forceRefresh()}
              className="mt-4 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Odśwież dane
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('number')}>
                    <div className="flex items-center">
                      Numer
                      {sortField === 'number' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('project_name')}>
                    <div className="flex items-center">
                      Projekt
                      {sortField === 'project_name' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('deadline')}>
                    <div className="flex items-center">
                      Termin
                      {sortField === 'deadline' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Data utworzenia
                      {sortField === 'created_at' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequisitions.map((requisition) => (
                  <React.Fragment key={requisition.id}>
                    <tr className={`hover:bg-gray-50 ${expandedRequisition === requisition.id ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{requisition.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{requisition.project_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {requisition.deadline ? new Date(requisition.deadline).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(localStatuses[requisition.id] || requisition.status)}
                          <span className="ml-2">
                            {getStatusText(localStatuses[requisition.id] || requisition.status)}
                          </span>
                          {statusUpdating[requisition.id] && (
                            <div className="ml-2 animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-500"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {requisition.created_at ? new Date(requisition.created_at).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setExpandedRequisition(expandedRequisition === requisition.id ? null : requisition.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Pokaż/ukryj przedmioty"
                          >
                            {expandedRequisition === requisition.id ?
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 15l-6-6-6 6"></path>
                              </svg> :
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9l6 6 6-6"></path>
                              </svg>
                            }
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/requests/material/${requisition.id}`)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Zobacz szczegóły"
                          >
                            <Eye size={18} />
                          </button>
                          {localStatuses[requisition.id] !== 'completed' && localStatuses[requisition.id] !== 'rejected' && (
                            <button
                              onClick={() => handleCompleteRequisition(requisition.id)}
                              className="flex items-center bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                              title="Oznacz jako zrealizowane"
                              disabled={statusUpdating[requisition.id]}
                            >
                              <Check size={14} className="mr-1" />
                              Zrealizowano
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRequisition === requisition.id && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          {requisitionDetails[requisition.id] ? (
                            <div>
                              <h3 className="font-medium text-gray-900 mb-2">Przedmioty w zapotrzebowaniu:</h3>
                              {requisitionDetails[requisition.id].items && requisitionDetails[requisition.id].items.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Indeks
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Nazwa przedmiotu
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Ilość
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Cena jedn.
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Wartość
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {requisitionDetails[requisition.id].items.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.item_index}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                            {item.item_name}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.price ? `${parseFloat(item.price).toLocaleString()} zł` : '-'}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.price ? `${(parseFloat(item.price) * item.quantity).toLocaleString()} zł` : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                      <tr className="bg-gray-50 font-medium">
                                        <td colSpan="4" className="px-4 py-2 text-right">
                                          Razem:
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          {requisitionDetails[requisition.id].total_price !== undefined ?
                                            `${parseFloat(requisitionDetails[requisition.id].total_price).toLocaleString()} zł` : '-'}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500">Brak przedmiotów w zapotrzebowaniu</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-center p-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Loading indicator only when actually loading */}
        {loading && (
          <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-lg z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}
      </div>
    </div>
  ));

  // Memoized form versions
  const ViewForm = memo(props => <MaterialRequisitionForm mode="view" {...props} />);
  const EditForm = memo(props => <MaterialRequisitionForm mode="edit" {...props} />);
  const CreateForm = memo(props => <MaterialRequisitionForm mode="create" {...props} />);

  return (
    <Routes>
      <Route path="/" element={<MainView />} />
      <Route path="/new" element={<CreateForm />} />
      <Route path="/:id" element={<ViewForm />} />
      <Route path="/:id/edit" element={<EditForm />} />
    </Routes>
  );
});

export default MaterialRequisitionsPage;