// frontend/src/pages/ProjectsPage.js
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
  CheckCircle,
  Clock,
  XCircle,
  PauseCircle
} from 'lucide-react';
import ProjectForm from '../components/ProjectForm';
import { getCsrfToken } from '../utils/csrfToken';
import { useProjects } from '../contexts/ProjectContext';

const ProjectsPage = () => {
  const { projects, shouldRefresh, refreshProjects, updateProjects } = useProjects();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  const navigate = useNavigate();
  const location = useLocation();

  // Efekt do ładowania projektów przy pierwszym renderowaniu
  // lub gdy shouldRefresh z kontekstu zmienia się na true
  useEffect(() => {
    if (shouldRefresh || location.pathname === '/dashboard/projects') {
      fetchProjects();
    }
  }, [shouldRefresh, location.pathname]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/projects/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania projektów');
      }

      const data = await response.json();
      updateProjects(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać projektów. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten projekt?')) {
      try {
        const response = await fetch(`/api/projects/${id}/`, {
          method: 'DELETE',
          headers: {
            'X-CSRFToken': getCsrfToken()
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Błąd usuwania projektu');
        }

        // Odśwież listę projektów
        refreshProjects();
      } catch (err) {
        console.error('Błąd:', err);
        setError('Nie udało się usunąć projektu. Spróbuj ponownie później.');
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'new':
        return <AlertCircle className="text-blue-500" />;
      case 'in_progress':
        return <Clock className="text-orange-500" />;
      case 'completed':
        return <CheckCircle className="text-green-500" />;
      case 'cancelled':
        return <XCircle className="text-red-500" />;
      case 'on_hold':
        return <PauseCircle className="text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'new': 'Nowy',
      'in_progress': 'W trakcie',
      'completed': 'Zakończony',
      'cancelled': 'Anulowany',
      'on_hold': 'Wstrzymany'
    };
    return statusMap[status] || status;
  };

  // Sortowanie projektów
  const sortedProjects = [...projects].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Obsługa pól zagnieżdżonych
    if (sortField === 'client_name' && a.client && b.client) {
      aValue = a.client_name;
      bValue = b.client_name;
    }

    // Obsługa dat
    if (sortField === 'start_date' || sortField === 'end_date') {
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

  // Filtrowanie projektów
  const filteredProjects = sortedProjects.filter(project => {
    return project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (project.client_name && project.client_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (project.localization && project.localization.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (project.city && project.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (project.country && project.country.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <Routes>
      <Route path="/" element={
        <div>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Projekty</h1>
            <button
              onClick={() => navigate('/dashboard/projects/new')}
              className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusCircle className="mr-2" size={18} />
              Nowy projekt
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Szukaj projektów..."
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
            ) : filteredProjects.length === 0 ? (
              <div className="text-center text-gray-500 p-4">
                Nie znaleziono projektów
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('name')}>
                        <div className="flex items-center">
                          Nazwa projektu
                          {sortField === 'name' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('client_name')}>
                        <div className="flex items-center">
                          Klient
                          {sortField === 'client_name' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('city')}>
                        <div className="flex items-center">
                          Miasto
                          {sortField === 'city' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                        <div className="flex items-center">
                          Status
                          {sortField === 'status' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('start_date')}>
                        <div className="flex items-center">
                          Data rozpoczęcia
                          {sortField === 'start_date' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('budget')}>
                        <div className="flex items-center">
                          Budżet
                          {sortField === 'budget' && <ArrowUpDown className="ml-1" size={14} />}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{project.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{project.client_name || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{project.city || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(project.status)}
                            <span className="ml-2">{getStatusText(project.status)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">
                            {project.budget ? `${project.budget.toLocaleString()} zł` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/dashboard/projects/${project.id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Zobacz szczegóły"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => navigate(`/dashboard/projects/${project.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edytuj"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id)}
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
      <Route path="/new" element={<ProjectForm mode="create" onSuccess={() => navigate('/dashboard/projects')} />} />
      <Route path="/:id" element={<ProjectForm mode="view" onSuccess={() => navigate('/dashboard/projects')} />} />
      <Route path="/:id/edit" element={<ProjectForm mode="edit" onSuccess={() => navigate('/dashboard/projects')} />} />
    </Routes>
  );
};

export default ProjectsPage;