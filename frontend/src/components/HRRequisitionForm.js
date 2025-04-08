// frontend/src/components/HRRequisitionForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Edit as EditIcon,
  PlusCircle,
  Trash2,
  UserPlus,
  Calendar,
  Briefcase,
  FileText
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import { useProjects } from '../contexts/ProjectContext';

const HRRequisitionForm = ({ mode = 'view' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useProjects();

  const [requisition, setRequisition] = useState({
    project: '',
    deadline: '',
    status: 'to_accept',
    special_requirements: '',
    comment: '',
    positions: []
  });

  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Modal do dodawania stanowisk
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState('');
  const [positionQuantity, setPositionQuantity] = useState(1);
  const [positionExperience, setPositionExperience] = useState('brak');
  const [currentPositionIndex, setCurrentPositionIndex] = useState(null);

  // Opcje stanowisk i doświadczeń
  const positionOptions = [
    { value: 'brygadzista', label: 'Brygadzista' },
    { value: 'brygada_elektryków', label: 'Brygada elektryków' },
    { value: 'brygada_monterów', label: 'Brygada monterów' },
    { value: 'elektromonter', label: 'Elektromonter' },
    { value: 'kafar', label: 'Kafar' },
    { value: 'koparka', label: 'Koparka' },
    { value: 'mini_ladowarka', label: 'Mini ładowarka gąsienicowa' },
    { value: 'monter', label: 'Monter' },
    { value: 'starszy_elektryk', label: 'Starszy elektryk' },
    { value: 'starszy_monter', label: 'Starszy monter' },
    { value: 'miernica', label: 'Miernica' },
  ];

  const experienceOptions = [
    { value: 'konstrukcja', label: 'Na konstrukcji' },
    { value: 'panele', label: 'Na panelach' },
    { value: 'elektryka', label: 'Elektryka' },
    { value: 'operator', label: 'Operator' },
    { value: 'brak', label: 'Brak' },
  ];

  // Efekt do pobierania danych zapotrzebowania, jeśli edytujemy lub wyświetlamy istniejące
  useEffect(() => {
    if (id && (mode === 'view' || mode === 'edit')) {
      fetchRequisition();
    } else {
      setLoading(false);
    }

    // Ładuj listę projektów
    fetchProjects();

    // Efekt cleanup
    return () => {
      // Zmniejszamy ryzyko równoczesnych zapytań przy zmianie widoku
      setLoading(false);
    };
  }, [id, mode]);

  // Obserwuj listę projektów z kontekstu
  useEffect(() => {
    if (projects && projects.length > 0) {
      setAvailableProjects(projects);
    }
  }, [projects]);

  const fetchRequisition = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/hr-requisitions/${id}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych zapotrzebowania HR');
      }

      const data = await response.json();
      console.log("Pobrane zapotrzebowanie HR:", data);
      setRequisition(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych zapotrzebowania. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania listy projektów');
      }

      const data = await response.json();
      setAvailableProjects(data);
    } catch (err) {
      console.error('Błąd pobierania projektów:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequisition(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPosition = () => {
    setSelectedPosition('');
    setPositionQuantity(1);
    setPositionExperience('brak');
    setCurrentPositionIndex(null);
    setShowPositionModal(true);
  };

  const handleEditPosition = (index) => {
    const position = requisition.positions[index];
    setSelectedPosition(position.position);
    setPositionQuantity(position.quantity);
    setPositionExperience(position.experience || 'brak');
    setCurrentPositionIndex(index);
    setShowPositionModal(true);
  };

  const handleRemovePosition = (index) => {
    setRequisition(prev => ({
      ...prev,
      positions: prev.positions.filter((_, i) => i !== index)
    }));
  };

  const handleSavePosition = () => {
    if (!selectedPosition) {
      setError('Wybierz stanowisko');
      return;
    }

    // Znajdź etykietę stanowiska
    const positionLabel = positionOptions.find(opt => opt.value === selectedPosition)?.label || '';

    // Znajdź etykietę doświadczenia
    const experienceLabel = experienceOptions.find(opt => opt.value === positionExperience)?.label || '';

    const newPosition = {
      position: selectedPosition,
      position_display: positionLabel,
      quantity: parseInt(positionQuantity) || 1,
      experience: positionExperience,
      experience_display: experienceLabel
    };

    if (currentPositionIndex !== null) {
      // Edycja istniejącego stanowiska
      setRequisition(prev => ({
        ...prev,
        positions: prev.positions.map((pos, i) => i === currentPositionIndex ? newPosition : pos)
      }));
    } else {
      // Dodanie nowego stanowiska
      setRequisition(prev => ({
        ...prev,
        positions: [...prev.positions, newPosition]
      }));
    }

    setShowPositionModal(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);

      // Walidacja
      const validationResponse = await fetch('/api/validate-hr-requisition/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(requisition),
        credentials: 'same-origin',
      });

      const validationData = await validationResponse.json();

      if (!validationData.valid) {
        setError(validationData.message);
        setSubmitting(false);
        return;
      }

      // Przygotuj dane zapotrzebowania bez pozycji
      const requisitionData = {
        project: requisition.project,
        deadline: requisition.deadline,
        status: requisition.status,
        special_requirements: requisition.special_requirements || '',
        comment: requisition.comment || ''
      };

      // Określamy ścieżkę odpowiednio do trybu
      let url = '/api/hr-requisitions/';
      let method = 'POST';

      if (mode === 'edit') {
        url = `/api/hr-requisitions/${id}/`;
        method = 'PATCH';
      }

      // Krok 1: Zapisz główne zapotrzebowanie
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(requisitionData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Błąd zapisu zapotrzebowania HR');
      }

      // Pobierz zapisane zapotrzebowanie, aby uzyskać jego ID
      const savedRequisition = await response.json();
      const requisitionId = savedRequisition.id || id;

      // Krok 2: Jeśli jesteśmy w trybie edycji, usuń najpierw wszystkie istniejące pozycje
      if (mode === 'edit') {
        // Pobieramy aktualne pozycje
        const currentPositionsResponse = await fetch(`/api/hr-requisitions/${requisitionId}/`, {
          credentials: 'same-origin',
        });

        if (currentPositionsResponse.ok) {
          const currentData = await currentPositionsResponse.json();

          // Usuwamy istniejące pozycje
          if (currentData.positions && currentData.positions.length > 0) {
            for (const position of currentData.positions) {
              if (position.id) {
                await fetch(`/api/hr-requisition-positions/${position.id}/`, {
                  method: 'DELETE',
                  headers: {
                    'X-CSRFToken': getCsrfToken(),
                  },
                  credentials: 'same-origin',
                });
              }
            }
          }
        }
      }

      // Krok 3: Dodaj wszystkie pozycje pojedynczo
      for (const position of requisition.positions) {
        const positionData = {
          hr_requisition: requisitionId,
          position: position.position,
          quantity: position.quantity,
          experience: position.experience || 'brak'
        };

        const positionResponse = await fetch('/api/hr-requisition-positions/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(positionData),
          credentials: 'same-origin',
        });

        if (!positionResponse.ok) {
          console.error('Błąd dodawania pozycji:', await positionResponse.json());
          // Kontynuujemy mimo błędu, aby spróbować dodać pozostałe pozycje
        }
      }

      // Sukces - powrót do listy zapotrzebowań
      navigate('/dashboard/requests/hr');

    } catch (err) {
      console.error('Błąd:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania zapotrzebowania HR');
    } finally {
      setSubmitting(false);
    }
  };

  // Zmiana trybu z podglądu na edycję
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Obliczanie łącznej ilości pracowników
  const calculateTotalEmployees = () => {
    return requisition.positions.reduce((total, position) => {
      return total + (position.quantity || 0);
    }, 0);
  };

  // Generowanie tytułu formularza w zależności od trybu
  const getFormTitle = () => {
    if (mode === 'create') return 'Nowe zapotrzebowanie HR';
    if (mode === 'edit') return 'Edycja zapotrzebowania HR';
    return 'Szczegóły zapotrzebowania HR';
  }

  if (loading && mode !== 'create') {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Renderowanie formularza
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/requests/hr')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{getFormTitle()}</h1>
        </div>

        {mode === 'view' && !isEditing && (
          <button
            onClick={handleEditClick}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <EditIcon className="mr-2" size={18} />
            Edytuj
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Podstawowe informacje */}
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                Projekt <span className="text-red-500">*</span>
              </label>
              <select
                id="project"
                name="project"
                value={requisition.project || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              >
                <option value="">-- Wybierz projekt --</option>
                {availableProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Termin realizacji <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-gray-400" size={16} />
                </div>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={requisition.deadline || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                />
              </div>
            </div>

            {/* Usunięto pole "Wymagane doświadczenie" z głównego formularza - teraz jest na poziomie stanowisk */}

            {mode !== 'create' && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={requisition.status || 'to_accept'}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                >
                  <option value="to_accept">Do akceptacji</option>
                  <option value="accepted">Zaakceptowano</option>
                  <option value="rejected">Odrzucono</option>
                  <option value="in_progress">W trakcie realizacji</option>
                  <option value="completed">Zrealizowano</option>
                </select>
              </div>
            )}
          </div>

          {/* Specjalne wymagania */}
          <div>
            <label htmlFor="special_requirements" className="block text-sm font-medium text-gray-700 mb-1">
              Specjalne wymagania
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-gray-400">
                <FileText size={16} />
              </div>
              <textarea
                id="special_requirements"
                name="special_requirements"
                rows="3"
                value={requisition.special_requirements || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Opisz dodatkowe wymagania dla pracowników..."
                className={`w-full pl-10 pr-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              ></textarea>
            </div>
          </div>

          {/* Komentarz */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Komentarz
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-gray-400">
                <FileText size={16} />
              </div>
              <textarea
                id="comment"
                name="comment"
                rows="3"
                value={requisition.comment || ''}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Dodatkowe uwagi..."
                className={`w-full pl-10 pr-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              ></textarea>
            </div>
          </div>

          {/* Lista stanowisk */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Stanowiska ({calculateTotalEmployees()} pracowników)
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="flex items-center text-blue-500 hover:text-blue-600"
                >
                  <PlusCircle className="mr-1" size={18} />
                  Dodaj stanowisko
                </button>
              )}
            </div>

            {requisition.positions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <UserPlus className="mx-auto text-gray-400" size={32} />
                <p className="mt-2 text-gray-500">Brak dodanych stanowisk</p>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddPosition}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Dodaj stanowisko
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stanowisko
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ilość
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wymagane doświadczenie
                      </th>
                      {isEditing && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requisition.positions.map((position, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {position.position_display ||
                              positionOptions.find(opt => opt.value === position.position)?.label ||
                              position.position}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{position.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {position.experience_display ||
                              experienceOptions.find(opt => opt.value === position.experience)?.label ||
                              'Brak'}
                          </div>
                        </td>
                        {isEditing && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleEditPosition(index)}
                              className="text-blue-500 hover:text-blue-700 mr-3"
                            >
                              <EditIcon size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemovePosition(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Przyciski formularza */}
          {isEditing && (
            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/requests/hr')}
                className="mr-4 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    Zapisz
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Modal do dodawania/edycji stanowiska */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentPositionIndex !== null ? 'Edytuj stanowisko' : 'Dodaj nowe stanowisko'}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Stanowisko <span className="text-red-500">*</span>
                </label>
                <select
                  id="position"
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Wybierz stanowisko --</option>
                  {positionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Liczba pracowników <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={positionQuantity}
                  onChange={(e) => setPositionQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="position_experience" className="block text-sm font-medium text-gray-700 mb-1">
                  Wymagane doświadczenie <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="text-gray-400" size={16} />
                  </div>
                  <select
                    id="position_experience"
                    value={positionExperience}
                    onChange={(e) => setPositionExperience(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {experienceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowPositionModal(false)}
                  className="mr-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSavePosition}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRRequisitionForm;