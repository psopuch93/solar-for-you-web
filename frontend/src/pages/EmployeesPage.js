// frontend/src/pages/EmployeesPage.js
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
import EmployeeForm from '../components/EmployeeForm';
import { getCsrfToken } from '../utils/csrfToken';
import { useEmployees } from '../contexts/EmployeeContext';

const EmployeesPage = () => {
  const { employees, shouldRefresh, refreshEmployees, updateEmployees } = useEmployees();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('last_name');
  const [sortDirection, setSortDirection] = useState('asc');

  const navigate = useNavigate();
  const location = useLocation();

  // Efekt do ładowania pracowników przy pierwszym renderowaniu
  // lub gdy shouldRefresh z kontekstu zmienia się na true
  useEffect(() => {
    if (shouldRefresh || location.pathname === '/dashboard/employees') {
      fetchEmployees();
    }
  }, [shouldRefresh, location.pathname]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employees/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania pracowników');
      }

      const data = await response.json();
      updateEmployees(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać pracowników. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego pracownika?')) {
      try {
        const response = await fetch(`/api/employees/${id}/`, {
          method: 'DELETE',
          headers: {
            'X-CSRFToken': getCsrfToken()
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Błąd usuwania pracownika');
        }

        // Odśwież listę pracowników
        refreshEmployees();
      } catch (err) {
        console.error('Błąd:', err);
        setError('Nie udało się usunąć pracownika. Spróbuj ponownie później.');
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

  // Sortowanie pracowników
  const sortedEmployees = [...employees].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Obsługa pól zagnieżdżonych
    if (sortField === 'project_name') {
      aValue = a.project_name;
      bValue = b.project_name;
    }

    // Obsługa dat
    if (sortField === 'created_at') {
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

  // Filtrowanie pracowników
  const filteredEmployees = sortedEmployees.filter(employee => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (employee.first_name && employee.first_name.toLowerCase().includes(searchTermLower)) ||
      (employee.last_name && employee.last_name.toLowerCase().includes(searchTermLower)) ||
      (employee.pesel && employee.pesel.toLowerCase().includes(searchTermLower)) ||
      (employee.project_name && employee.project_name.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Pracownicy</h1>
            <button
              onClick={() => navigate('/dashboard/employees/new')}
              className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusCircle className="mr-2" size={18} />
              Nowy pracownik
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Szukaj pracowników..."
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
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                Nie znaleziono pracowników
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('last_name')}>
                        <div className="flex items-center">
                          Nazwisko
                          {sortField === 'last_name' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('first_name')}>
                        <div className="flex items-center">
                          Imię
                          {sortField === 'first_name' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('pesel')}>
                        <div className="flex items-center">
                          PESEL
                          {sortField === 'pesel' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('project_name')}>
                        <div className="flex items-center">
                          Aktualny projekt
                          {sortField === 'project_name' && <ArrowUpDown className="ml-1" size={14} />}
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
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{employee.last_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{employee.first_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{employee.pesel || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{employee.project_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/dashboard/employees/${employee.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Zobacz szczegóły"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/employees/${employee.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edytuj"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(employee.id)}
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
      <Route path="/new" element={<EmployeeForm mode="create" onSuccess={() => navigate('/dashboard/employees')} />} />
      <Route path="/:id" element={<EmployeeForm mode="view" onSuccess={() => navigate('/dashboard/employees')} />} />
      <Route path="/:id/edit" element={<EmployeeForm mode="edit" onSuccess={() => navigate('/dashboard/employees')} />} />
    </Routes>
  );
};

export default EmployeesPage;