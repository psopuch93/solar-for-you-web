// frontend/src/pages/ClientsPage.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertCircle,
} from 'lucide-react';
import ClientForm from '../components/ClientForm';
import { getCsrfToken } from '../utils/csrfToken';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [shouldRefresh, setShouldRefresh] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  // Efekt do ładowania klientów przy pierwszym renderowaniu
  // lub gdy shouldRefresh zmienia się na true
  useEffect(() => {
    if (shouldRefresh || location.pathname === '/dashboard/clients') {
      fetchClients();
    }
  }, [shouldRefresh, location.pathname]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clients/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania klientów');
      }

      const data = await response.json();
      setClients(data);
      setError(null);
      setShouldRefresh(false);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać klientów. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego klienta?')) {
      try {
        const response = await fetch(`/api/clients/${id}/`, {
          method: 'DELETE',
          headers: {
            'X-CSRFToken': getCsrfToken()
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Błąd usuwania klienta');
        }

        // Odśwież listę klientów
        setShouldRefresh(true);
      } catch (err) {
        console.error('Błąd:', err);
        setError('Nie udało się usunąć klienta. Spróbuj ponownie później.');
      }
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sortowanie klientów
  const sortedClients = [...clients].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Obsługa tekstów
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Obsługa dat
    if (sortField === 'created_at' || sortField === 'updated_at') {
      aValue = aValue ? new Date(aValue) : null;
      bValue = bValue ? new Date(bValue) : null;

      if (!aValue && !bValue) return 0;
      if (!aValue) return 1;
      if (!bValue) return -1;
    }

    // Obsługa innych typów
    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    return sortDirection === 'asc'
      ? aValue < bValue ? -1 : 1
      : aValue < bValue ? 1 : -1;
  });

  // Filtrowanie klientów
  const filteredClients = sortedClients.filter(client => {
    return client.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Klienci</h1>
            <button
              onClick={() => navigate('/dashboard/clients/new')}
              className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusCircle className="mr-2" size={18} />
              Nowy klient
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Szukaj klientów..."
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 p-4">
                <AlertCircle className="mx-auto mb-2" size={24} />
                {error}
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                Nie znaleziono klientów
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                          Nazwa klienta
                          {sortField === 'name' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center">
                          Data utworzenia
                          {sortField === 'created_at' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_by_name')}>
                        <div className="flex items-center">
                          Utworzony przez
                          {sortField === 'created_by_name' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{client.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {client.created_at ? new Date(client.created_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{client.created_by_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/dashboard/clients/${client.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Zobacz szczegóły"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/clients/${client.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edytuj"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Usuń"
                            >
                              <Trash2 size={18} />
                            </button>
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
      } />
      <Route path="/new" element={<ClientForm mode="create" onSuccess={() => { setShouldRefresh(true); navigate('/dashboard/clients'); }} />} />
      <Route path="/:id" element={<ClientForm mode="view" onSuccess={() => { setShouldRefresh(true); navigate('/dashboard/clients'); }} />} />
      <Route path="/:id/edit" element={<ClientForm mode="edit" onSuccess={() => { setShouldRefresh(true); navigate('/dashboard/clients'); }} />} />
    </Routes>
  );
};

export default ClientsPage;