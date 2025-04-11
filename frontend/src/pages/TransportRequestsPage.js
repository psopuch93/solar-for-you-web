// frontend/src/pages/TransportRequestsPage.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  ArrowUpDown,
  AlertCircle,
  Truck,
  Calendar,
  MapPin,
  Eye,
  Edit,
  ArrowLeft,
  Clock
} from 'lucide-react';
import TransportRequestForm from '../components/TransportRequestForm';
import { getCsrfToken } from '../utils/csrfToken';
import { useDialog } from '../contexts/DialogContext';

const TransportRequestsPage = () => {
  const navigate = useNavigate();
  const { confirm, showInfo } = useDialog();

  const [transportRequests, setTransportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  // Efekt do ładowania zapotrzebowań transportowych
  useEffect(() => {
    fetchTransportRequests();
  }, []);

  const fetchTransportRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transport-requests/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych zapotrzebowań transportowych');
      }

      const data = await response.json();
      setTransportRequests(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać zapotrzebowań transportowych. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    // Znajdź zapotrzebowanie
    const transportRequest = transportRequests.find(req => req.id === requestId);
    if (!transportRequest) return;

    // Pokaż dialog potwierdzenia
    confirm(
      `Czy na pewno chcesz zmienić status zapotrzebowania na "${getStatusText(newStatus)}"?`,
      async () => {
        try {
          const response = await fetch(`/api/transport-requests/${requestId}/change_status/`, {
            method: 'POST',
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
          setTransportRequests(prev =>
            prev.map(req =>
              req.id === requestId ? { ...req, status: newStatus } : req
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
      "Czy na pewno chcesz usunąć to zapotrzebowanie transportowe?",
      async () => {
        try {
          const response = await fetch(`/api/transport-requests/${id}/`, {
            method: 'DELETE',
            headers: {
              'X-CSRFToken': getCsrfToken()
            },
            credentials: 'same-origin',
          });

          if (!response.ok) {
            throw new Error('Błąd usuwania zapotrzebowania transportowego');
          }

          // Aktualizuj listę po usunięciu
          setTransportRequests(prev => prev.filter(req => req.id !== id));
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
      case 'new':
        return <Clock className="text-blue-500" size={20} />;
      case 'accepted':
        return <Clock className="text-green-500" size={20} />;
      case 'in_progress':
        return <Truck className="text-orange-500" size={20} />;
      case 'completed':
        return <Truck className="text-green-500" size={20} />;
      case 'cancelled':
        return <Truck className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'new': 'Nowy',
      'accepted': 'Zaakceptowany',
      'in_progress': 'W realizacji',
      'completed': 'Zrealizowany',
      'cancelled': 'Anulowany'
    };
    return statusMap[status] || status;
  };

  const getLoadingMethodText = (method) => {
    const methodMap = {
      'external': 'Firma zewnętrzna',
      'internal': 'Nasz wewnętrzny'
    };
    return methodMap[method] || method;
  };

  // Filtrowane i posortowane zapotrzebowania
  const filteredTransportRequests = transportRequests
    .filter(req => {
      // Filtruj po statusie
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }

      // Filtruj po wyszukiwanej frazie
      const searchLower = searchTerm.toLowerCase();
      return !searchTerm ||
        (req.number && req.number.toLowerCase().includes(searchLower)) ||
        (req.pickup_project_name && req.pickup_project_name.toLowerCase().includes(searchLower)) ||
        (req.delivery_project_name && req.delivery_project_name.toLowerCase().includes(searchLower)) ||
        (req.pickup_address && req.pickup_address.toLowerCase().includes(searchLower)) ||
        (req.delivery_address && req.delivery_address.toLowerCase().includes(searchLower)) ||
        (req.notes && req.notes.toLowerCase().includes(searchLower));
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Obsługa pól zagnieżdżonych
      if (sortField === 'pickup_project_name') {
        aValue = a.pickup_project_name || '';
        bValue = b.pickup_project_name || '';
      } else if (sortField === 'delivery_project_name') {
        aValue = a.delivery_project_name || '';
        bValue = b.delivery_project_name || '';
      }

      // Obsługa dat
      if (sortField === 'created_at' || sortField === 'pickup_date' || sortField === 'delivery_date') {
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

  const MainView = () => (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Transport zasobów</h1>
          <p className="text-gray-600 mt-1">Zarządzaj transportem materiałów, narzędzi i sprzętu</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/requests/transport/new')}
          className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <PlusCircle className="mr-2" size={18} />
          Nowy transport
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-auto md:flex-1">
            <input
              type="text"
              placeholder="Szukaj transportów..."
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
              onClick={() => setStatusFilter('new')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'new'
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              }`}
            >
              Nowe
            </button>
            <button
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'accepted'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-green-100 text-green-600 hover:bg-green-200'
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
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                statusFilter === 'cancelled'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
            >
              Anulowane
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
        ) : filteredTransportRequests.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            {transportRequests.length === 0 ?
              "Nie znaleziono żadnych zapotrzebowań transportowych" :
              "Brak zapotrzebowań spełniających kryteria wyszukiwania"}

            <button
              onClick={fetchTransportRequests}
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('pickup_project_name')}>
                    <div className="flex items-center">
                      Z
                      {sortField === 'pickup_project_name' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('delivery_project_name')}>
                    <div className="flex items-center">
                      Do
                      {sortField === 'delivery_project_name' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('pickup_date')}>
                    <div className="flex items-center">
                      Data załadunku
                      {sortField === 'pickup_date' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('loading_method')}>
                    <div className="flex items-center">
                      Sposób
                      {sortField === 'loading_method' && <ArrowUpDown className="ml-1" size={14} />}
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
                {filteredTransportRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{request.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="text-gray-400 mr-1" size={16} />
                        <span className="text-gray-500">
                          {request.pickup_project_name || (request.pickup_address ? 'Inny adres' : '-')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="text-gray-400 mr-1" size={16} />
                        <span className="text-gray-500">
                          {request.delivery_project_name || (request.delivery_address ? 'Inny adres' : '-')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="text-gray-400 mr-1" size={16} />
                        <span className="text-gray-500">
                          {request.pickup_date ? new Date(request.pickup_date).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">
                        {getLoadingMethodText(request.loading_method)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(request.status)}
                        <span className="ml-2">{getStatusText(request.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => navigate(`/dashboard/requests/transport/${request.id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Zobacz szczegóły"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/requests/transport/${request.id}/edit`)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Edytuj"
                        >
                          <Edit size={18} />
                        </button>
                        <select
                          value={request.status}
                          onChange={(e) => handleStatusChange(request.id, e.target.value)}
                          className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="new">Nowy</option>
                          <option value="accepted">Zaakceptowany</option>
                          <option value="in_progress">W realizacji</option>
                          <option value="completed">Zrealizowany</option>
                          <option value="cancelled">Anulowany</option>
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
      <Route path="/new" element={<TransportRequestForm mode="create" />} />
      <Route path="/:id" element={<TransportRequestForm mode="view" />} />
      <Route path="/:id/edit" element={<TransportRequestForm mode="edit" />} />
    </Routes>
  );
};

export default TransportRequestsPage;