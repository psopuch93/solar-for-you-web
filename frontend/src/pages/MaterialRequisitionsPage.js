// frontend/src/pages/MaterialRequisitionsPage.js
import React, { useState, useRef, memo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import MaterialRequisitionForm from '../components/MaterialRequisitionForm';
import { useStableRequisitions } from '../components/StableRequisitionsProvider';
import { useDialog } from '../contexts/DialogContext';

// Opakowujemy cały komponent w memo, aby blokować odświeżanie gdy props nie ulegają zmianie
const MaterialRequisitionsPage = memo(() => {
  // Użyj stabilnego kontekstu zamiast oryginalnego
  const {
    requisitions,
    loading,
    updateSingleRequisition,
    error
  } = useStableRequisitions();

  const { confirmDelete, showInfo } = useDialog();

  // Stan lokalny - nie powoduje ponownego renderowania innych komponentów
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusUpdating, setStatusUpdating] = useState({});

  // Ref do śledzenia czy komponent jest zamontowany
  const mountedRef = useRef(true);

  const navigate = useNavigate();

  // Do czyszczenia przy odmontowaniu komponentu
  React.useEffect(() => {
    return () => {
      // Oznacz komponent jako odmontowany, aby zapobiec aktualizacji stanu
      mountedRef.current = false;
    };
  }, []);

  const handleDelete = async (id, number) => {
    confirmDelete({
      message: `Czy na pewno chcesz usunąć zapotrzebowanie ${number}?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/requisitions/${id}/`, {
            method: 'DELETE',
            headers: {
              'X-CSRFToken': getCsrfToken()
            },
            credentials: 'same-origin',
          });

          if (!response.ok) {
            throw new Error('Błąd usuwania zapotrzebowania');
          }

          if (mountedRef.current) {
            showInfo("Zapotrzebowanie zostało usunięte");
          }
        } catch (err) {
          console.error('Błąd:', err);
          if (mountedRef.current) {
            showInfo("Nie udało się usunąć zapotrzebowania. Spróbuj ponownie później.", { type: 'warning' });
          }
        }
      }
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Obsługa zmiany statusu
  const handleStatusChange = async (requisition, newStatus) => {
    // Zapamiętaj poprzedni status
    const originalStatus = requisition.status;

    // Natychmiastowa aktualizacja UI
    updateSingleRequisition({
      ...requisition,
      status: newStatus
    });

    // Rozpocznij ładowanie dla tego wiersza
    setStatusUpdating(prev => ({ ...prev, [requisition.id]: true }));

    try {
      const response = await fetch(`/api/requisitions/${requisition.id}/change_status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Nie udało się zmienić statusu (${response.status})`);
      }

      // Zakończono pomyślnie
      if (mountedRef.current) {
        showInfo(`Status zmieniono na "${getStatusText(newStatus)}"`);
      }
    } catch (err) {
      console.error('Błąd zmiany statusu:', err);

      // Przywróć poprzedni status w przypadku błędu
      updateSingleRequisition({
        ...requisition,
        status: originalStatus
      });

      if (mountedRef.current) {
        showInfo("Błąd zmiany statusu. Spróbuj ponownie.", { type: 'warning' });
      }
    } finally {
      // Zakończ ładowanie
      if (mountedRef.current) {
        setStatusUpdating(prev => ({ ...prev, [requisition.id]: false }));
      }
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

  // Filtrowanie zapotrzebowań - Pokaż tylko zapotrzebowania typu material
  const filteredRequisitions = React.useMemo(() => {
    // Utwórz kopię tablicy do sortowania, aby nie modyfikować oryginalnej
    const sortableReqs = [...requisitions].filter(req => req.requisition_type === 'material');

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

      // Obsługa tekstów
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

    // Filtrowanie po statusie i wyszukiwanie
    return sortableReqs.filter(requisition => {
      // Filtrowanie po statusie
      if (statusFilter !== 'all' && requisition.status !== statusFilter) {
        return false;
      }

      // Filtrowanie po wyszukiwanej frazie
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          requisition.number?.toLowerCase().includes(searchLower) ||
          requisition.project_name?.toLowerCase().includes(searchLower) ||
          (requisition.comment && requisition.comment.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });
  }, [requisitions, sortField, sortDirection, statusFilter, searchTerm]);

  // Komponent tabeli zapotrzebowań - wyodrębniony, aby zminimalizować ponowne renderowanie
  const RequisitionsTable = memo(() => (
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
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredRequisitions.map((requisition) => (
            <tr key={requisition.id} className="hover:bg-gray-50">
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
                  {getStatusIcon(requisition.status)}
                  <span className="ml-2">{getStatusText(requisition.status)}</span>
                  {statusUpdating[requisition.id] && (
                    <div className="ml-2 animate-spin h-4 w-4 border-2 border-orange-500 rounded-full border-t-transparent"></div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-gray-500">
                  {requisition.created_at ? new Date(requisition.created_at).toLocaleDateString() : '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => navigate(`/dashboard/requests/material/${requisition.id}`)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Zobacz szczegóły"
                    disabled={statusUpdating[requisition.id]}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/requests/material/${requisition.id}/edit`)}
                    className="text-indigo-600 hover:text-indigo-900"
                    title="Edytuj"
                    disabled={statusUpdating[requisition.id]}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(requisition.id, requisition.number)}
                    className="text-red-600 hover:text-red-900"
                    title="Usuń"
                    disabled={statusUpdating[requisition.id]}
                  >
                    <Trash2 size={18} />
                  </button>
                  <select
                    value={requisition.status}
                    onChange={(e) => handleStatusChange(requisition, e.target.value)}
                    className={`ml-2 border rounded px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      statusUpdating[requisition.id] ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={statusUpdating[requisition.id]}
                  >
                    <option value="to_accept">Do akceptacji</option>
                    <option value="accepted">Zaakceptowano</option>
                    <option value="in_progress">W trakcie realizacji</option>
                    <option value="completed">Zrealizowano</option>
                    <option value="rejected">Odrzucono</option>
                  </select>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ));

  // Główny widok strony zapotrzebowań materiałowych
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

        {loading && filteredRequisitions.length === 0 ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            <AlertCircle className="mx-auto mb-2" size={24} />
            {error}
          </div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            Brak zapotrzebowań spełniających kryteria wyszukiwania
          </div>
        ) : (
          <RequisitionsTable />
        )}
      </div>

      {/* Wskaźnik ładowania tylko gdy faktycznie trwa ładowanie */}
      {loading && (
        <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-lg z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      )}
    </div>
  ));

  // Memoizowane wersje formularzy
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