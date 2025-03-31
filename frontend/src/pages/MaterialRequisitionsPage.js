// frontend/src/pages/MaterialRequisitionsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useRequisitions } from '../contexts/RequisitionContext';
import {
  PlusCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertCircle,
  Loader,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import MaterialRequisitionForm from '../components/MaterialRequisitionForm';
import { useDialog } from '../contexts/DialogContext';

const MaterialRequisitionsPage = () => {
  const {
      requisitions,
      shouldRefresh,
      loading,
      error,
      refreshRequisitions,
      refreshTimestamp  // Dodaj tę zmienną
    } = useRequisitions();

    useEffect(() => {
      // Kiedy refreshTimestamp się zmienia, odśwież dane
      if (refreshTimestamp) {
        console.log("MaterialRequisitionsPage: Wykryto zmianę w danych zapotrzebowań");
        refreshRequisitions();
      }
    }, [refreshTimestamp, refreshRequisitions]);

    // Opcjonalnie: dodaj efekt, który wyświetli komunikat dla debugowania
    useEffect(() => {
      console.log("MaterialRequisitionsPage: Aktualne dane zapotrzebowań:", requisitions.length, "elementów");
    }, [requisitions]);


  const { confirmDelete } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localLoading, setLocalLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleDelete = async (id, number) => {
    confirmDelete({
      type: 'delete',
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

          // Odśwież dane lokalnie
          refreshRequisitions();
        } catch (err) {
          console.error('Błąd:', err);
          confirmDelete({
            type: 'warning',
            message: 'Nie udało się usunąć zapotrzebowania'
          });
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

  // Sortowanie zapotrzebowań
  const sortedRequisitions = [...requisitions].sort((a, b) => {
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

  // Filtrowanie zapotrzebowań
  const filteredRequisitions = sortedRequisitions.filter(requisition => {
    // Filtrowanie po statusie
    if (statusFilter !== 'all' && requisition.status !== statusFilter) {
      return false;
    }

    // Filtrowanie po wyszukiwanej frazie
    const searchLower = searchTerm.toLowerCase();
    return (
      requisition.number?.toLowerCase().includes(searchLower) ||
      requisition.project_name?.toLowerCase().includes(searchLower) ||
      (requisition.comment && requisition.comment.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Routes>
      <Route path="/" element={
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
                Brak zapotrzebowań spełniających kryteria wyszukiwania
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
                              onClick={() => handleDelete(requisition.id, requisition.number)}
                              className="text-red-600 hover:text-red-900"
                              title="Usuń"
                            >
                              <Trash2 size={18} />
                            </button>
                            {/* Usunięto dropdown do zmiany statusu */}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Wskaźnik ładowania dla operacji aktualizacji */}
          {localLoading && (
            <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-lg">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
            </div>
          )}
        </div>
      } />
      <Route path="/new" element={<MaterialRequisitionForm mode="create" />} />
      <Route path="/:id" element={<MaterialRequisitionForm mode="view" />} />
      <Route path="/:id/edit" element={<MaterialRequisitionForm mode="edit" />} />
    </Routes>
  );
};

export default MaterialRequisitionsPage;