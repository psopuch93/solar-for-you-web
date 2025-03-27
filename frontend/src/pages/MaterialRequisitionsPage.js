// frontend/src/pages/MaterialRequisitionsPage.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertCircle,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import MaterialRequisitionForm from '../components/MaterialRequisitionForm';

const MaterialRequisitionsPage = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  const navigate = useNavigate();

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requisitions/?requisition_type=material', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania zapotrzebowań');
      }

      const data = await response.json();
      setRequisitions(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać zapotrzebowań. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zapotrzebowanie?')) {
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

        fetchRequisitions();
      } catch (err) {
        console.error('Błąd:', err);
        setError('Nie udało się usunąć zapotrzebowania. Spróbuj ponownie później.');
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

  // Sortowanie zapotrzebowań
  const sortedRequisitions = [...requisitions].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Obsługa pól zagnieżdżonych
    if (sortField === 'project_name') {
      aValue = a.project_name;
      bValue = b.project_name;
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

  // Filtrowanie zapotrzebowań
  const filteredRequisitions = sortedRequisitions.filter(requisition => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (requisition.number && requisition.number.toLowerCase().includes(searchTermLower)) ||
      (requisition.project_name && requisition.project_name.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate('/dashboard/requests')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Zapotrzebowania Materiałowe</h1>
              <p className="text-gray-600 mt-1">Zarządzaj zapotrzebowaniami na materiały, narzędzia i sprzęt</p>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/dashboard/requests/material/new')}
              className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusCircle className="mr-2" size={18} />
              Nowe zapotrzebowanie
            </button>

            <div className="relative w-full max-w-md ml-4">
              <input
                type="text"
                placeholder="Szukaj zapotrzebowań..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            {loading ? (
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
                <FileText className="mx-auto mb-2" size={48} />
                <p className="text-lg font-medium">Brak zapotrzebowań</p>
                <p className="mt-1">Utwórz nowe zapotrzebowanie, aby zobaczyć je na liście</p>
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_price')}>
                        <div className="flex items-center">
                          Wartość
                          {sortField === 'total_price' && <ArrowUpDown className="ml-1" size={14} />}
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
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${requisition.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              requisition.status === 'approved' ? 'bg-green-100 text-green-800' :
                              requisition.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {requisition.status === 'pending' ? 'Oczekujące' :
                             requisition.status === 'approved' ? 'Zatwierdzone' :
                             requisition.status === 'rejected' ? 'Odrzucone' :
                             requisition.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {requisition.total_price !== null ?
                             `${requisition.total_price.toLocaleString()} zł` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {requisition.created_at ? new Date(requisition.created_at).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/dashboard/requests/material/${requisition.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Zobacz szczegóły"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/requests/material/${requisition.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edytuj"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(requisition.id)}
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
      <Route path="/new" element={<MaterialRequisitionForm mode="create" />} />
      <Route path="/:id" element={<MaterialRequisitionForm mode="view" />} />
      <Route path="/:id/edit" element={<MaterialRequisitionForm mode="edit" />} />
    </Routes>
  );
};

export default MaterialRequisitionsPage;