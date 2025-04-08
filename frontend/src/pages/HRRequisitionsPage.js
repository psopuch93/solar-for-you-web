// frontend/src/pages/HRRequisitionsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader,
  Eye,
  Edit,
  UserPlus,
  Calendar,
  Briefcase,
  Filter
} from 'lucide-react';
import HRRequisitionForm from '../components/HRRequisitionForm';
import { getCsrfToken } from '../utils/csrfToken';
import { useDialog } from '../contexts/DialogContext';

const HRRequisitionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm, showInfo } = useDialog();

  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  // Efekt do ładowania zapotrzebowań HR
  useEffect(() => {
    fetchRequisitions();
  }, [location.pathname]);

  const fetchRequisitions = async () => {
    if (location.pathname !== '/dashboard/requests/hr') return;

    try {
      setLoading(true);
      const response = await fetch('/api/hr-requisitions/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych zapotrzebowań HR');
      }

      const data = await response.json();
      setRequisitions(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych zapotrzebowań HR. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requisitionId, newStatus) => {
    // Znajdź zapotrzebowanie
    const requisition = requisitions.find(req => req.id === requisitionId);
    if (!requisition) return;

    // Pokaż dialog potwierdzenia
    confirm(
      `Czy na pewno chcesz zmienić status zapotrzebowania na "${getStatusText(newStatus)}"?`,
      async () => {
        try {
          const response = await fetch(`/api/hr-requisitions/${requisitionId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'same-origin',
          });

          if (!response.ok) {
            throw new Error('Nie udało się zaktualizować statusu');
          }

          // Aktualizuj lokalną listę
          setRequisitions(prev =>
            prev.map(req =>
              req.id === requisitionId ? { ...req, status: newStatus } : req
            )
          );

          showInfo("Status został zaktualizowany");
        } catch (err) {
          console.error('Błąd:', err);
          showInfo("Wystąpił błąd podczas aktualizacji statusu", { type: "warning" });
        }
      }
    );
  };

  const handleDelete = async (id) => {
    confirm(
      "Czy na pewno chcesz usunąć to zapotrzebowanie HR?",
      async () => {
        try {
          const response = await fetch(`/api/hr-requisitions/${id}/`, {
            method: 'DELETE',
            headers: {
              'X-CSRFToken': getCsrfToken()
            },
            credentials: 'same-origin',
          });

          if (!response.ok) {
            throw new Error('Błąd usuwania zapotrzebowania HR');
          }

          // Aktualizuj listę po usunięciu
          setRequisitions(prev => prev.filter(req => req.id !== id));
          showInfo("Zapotrzebowanie zostało usunięte");
        } catch (err) {
          console.error('Błąd:', err);
          showInfo("Wystąpił błąd podczas usuwania zapotrzebowania", { type: "warning" });
        }
      }
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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

  const getExperienceText = (experience) => {
    const experienceMap = {
      'konstrukcja': 'Na konstrukcji',
      'panele': 'Na panelach',
      'elektryka': 'Elektryka',
      'operator': 'Operator',
      'brak': 'Brak'
    };
    return experienceMap[experience] || experience;
  };

  // Filtrowane i posortowane zapotrzebowania
  const filteredRequisitions = requisitions
    .filter(req => {
      // Filtruj po statusie
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }

      // Filtruj po wyszukiwanej frazie
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm ||
        (req.number && req.number.toLowerCase().includes(searchLower)) ||
        (req.project_name && req.project_name.toLowerCase().includes(searchLower)) ||
        (req.special_requirements && req.special_requirements.toLowerCase().includes(searchLower)) ||
        (req.created_by_name && req.created_by_name.toLowerCase().includes(searchLower));
    })
    .sort((a, b) => {
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

  // Oblicz całkowitą liczbę osób w zapotrzebowaniu
  const calculateTotalPeople = (requisition) => {
    if (!requisition.positions || !Array.isArray(requisition.positions)) {
      return 0;
    }
    return requisition.positions.reduce((total, pos) => total + (pos.quantity || 0), 0);
  };

  const MainView = () => (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zapotrzebowania HR</h1>
          <p className="text-gray-600 mt-1">Zarządzaj zapotrzebowaniami kadrowymi i rekrutacjami</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/requests/hr/new')}
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
              "Nie znaleziono żadnych zapotrzebowań HR" :
              "Brak zapotrzebowań spełniających kryteria wyszukiwania"}

            <button
              onClick={fetchRequisitions}
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      Doświadczenie
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      Stanowiska
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <Briefcase className="text-gray-400 mr-2" size={16} />
                        <span>{getExperienceText(requisition.experience)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserPlus className="text-gray-400 mr-2" size={16} />
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {calculateTotalPeople(requisition)} osób
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(requisition.status)}
                        <span className="ml-2">{getStatusText(requisition.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => navigate(`/dashboard/requests/hr/${requisition.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Zobacz szczegóły"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/requests/hr/${requisition.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edytuj"
                        >
                          <Edit size={18} />
                        </button>
                        <select
                          value={requisition.status}
                          onChange={(e) => handleStatusChange(requisition.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
        )}
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainView />} />
      <Route path="/new" element={<HRRequisitionForm mode="create" />} />
      <Route path="/:id" element={<HRRequisitionForm mode="view" />} />
      <Route path="/:id/edit" element={<HRRequisitionForm mode="edit" />} />
    </Routes>
  );
};

export default HRRequisitionsPage;