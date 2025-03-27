// frontend/src/components/ProjectForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Edit as EditIcon,
  MapPin
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import { useProjects } from '../contexts/ProjectContext';
import { useClients } from '../contexts/ClientContext';
import ProjectMap from './ProjectMap';
import CoordinatesInput from './CoordinatesInput';

const ProjectForm = ({ mode = 'view', onSuccess }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshProjects } = useProjects();
  const { clients } = useClients();

  const [project, setProject] = useState({
    name: '',
    client: '',
    description: '',
    status: 'new',
    start_date: '',
    end_date: '',
    budget: '',
    country: '',
    city: '',
    street: '',
    post_code: '',
    latitude: '',
    longitude: ''
  });

  const [availableClients, setAvailableClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Efekt do pobierania danych projektu, jeśli edytujemy lub wyświetlamy istniejący
  useEffect(() => {
    if (id && (mode === 'view' || mode === 'edit')) {
      fetchProject();
    }

    // Ładuj listę klientów bez względu na tryb
    fetchClients();
  }, [id, mode]);

  // Obserwuj listę klientów z kontekstu
  useEffect(() => {
    if (clients && clients.length > 0) {
      setAvailableClients(clients);
    }
  }, [clients]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${id}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych projektu');
      }

      const data = await response.json();
      setProject(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych projektu. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania listy klientów');
      }

      const data = await response.json();
      setAvailableClients(data);
    } catch (err) {
      console.error('Błąd pobierania klientów:', err);
      // Nie pokazujemy tego błędu użytkownikowi - to mniej krytyczne
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProject(prev => ({ ...prev, [name]: value }));
  };

  // Obsługa zmiany współrzędnych
  const handleCoordinatesChange = ({ lat, lng }) => {
    setProject(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Walidacja
      if (!project.name.trim()) {
        setError('Nazwa projektu jest wymagana');
        setLoading(false);
        return;
      }

      // Przygotuj dane do wysłania, kopia głęboka
      const projectData = JSON.parse(JSON.stringify(project));

      // Sprawdź, czy client to pusty string i zamień go na null
      if (projectData.client === "") {
        projectData.client = null;
      }

      // Obsługa dat - upewnij się, że są w formacie YYYY-MM-DD
      if (projectData.start_date === "") {
        projectData.start_date = null;
      } else if (projectData.start_date) {
        // Upewnij się, że data jest w formacie YYYY-MM-DD
        // Jeśli data jest już w tym formacie, nie zmieniaj jej
        if (!/^\d{4}-\d{2}-\d{2}$/.test(projectData.start_date)) {
          try {
            const date = new Date(projectData.start_date);
            projectData.start_date = date.toISOString().split('T')[0];
          } catch {
            projectData.start_date = null;
          }
        }
      }

      if (projectData.end_date === "") {
        projectData.end_date = null;
      } else if (projectData.end_date) {
        // Upewnij się, że data jest w formacie YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(projectData.end_date)) {
          try {
            const date = new Date(projectData.end_date);
            projectData.end_date = date.toISOString().split('T')[0];
          } catch {
            projectData.end_date = null;
          }
        }
      }

      // Obsługa współrzędnych - zachowaj tylko 8 miejsc po przecinku i ogranicz liczbę cyfr
      if (projectData.latitude === "" || projectData.latitude === undefined) {
        projectData.latitude = null;
      } else if (projectData.latitude !== null) {
        let lat = parseFloat(projectData.latitude);
        if (isNaN(lat)) {
          projectData.latitude = null;
        } else {
          // Zaokrąglij do 8 cyfr po przecinku
          lat = parseFloat(lat.toFixed(8));
          // Sprawdź czy mieści się w ograniczeniach modelu (max 10 cyfr łącznie)
          const latStr = lat.toString().replace('.', '');
          if (latStr.length > 10) {
            // Jeśli przekracza, zaokrąglij do mniejszej liczby miejsc po przecinku
            const integerPart = Math.floor(Math.abs(lat)).toString().length;
            const maxDecimalPlaces = 10 - integerPart - (lat < 0 ? 1 : 0);
            lat = parseFloat(lat.toFixed(maxDecimalPlaces));
          }
          projectData.latitude = lat;
        }
      }

      if (projectData.longitude === "" || projectData.longitude === undefined) {
        projectData.longitude = null;
      } else if (projectData.longitude !== null) {
        let lng = parseFloat(projectData.longitude);
        if (isNaN(lng)) {
          projectData.longitude = null;
        } else {
          // Zaokrąglij do 8 cyfr po przecinku
          lng = parseFloat(lng.toFixed(8));
          // Sprawdź czy mieści się w ograniczeniach modelu (max 11 cyfr łącznie)
          const lngStr = lng.toString().replace('.', '');
          if (lngStr.length > 11) {
            // Jeśli przekracza, zaokrąglij do mniejszej liczby miejsc po przecinku
            const integerPart = Math.floor(Math.abs(lng)).toString().length;
            const maxDecimalPlaces = 11 - integerPart - (lng < 0 ? 1 : 0);
            lng = parseFloat(lng.toFixed(maxDecimalPlaces));
          }
          projectData.longitude = lng;
        }
      }

      // Sprawdź, czy budżet jest liczbą
      if (projectData.budget === "" || projectData.budget === undefined) {
        projectData.budget = null;
      } else if (typeof projectData.budget !== 'number') {
        const budget = parseFloat(projectData.budget);
        projectData.budget = isNaN(budget) ? null : budget;
      }

      // Konwertuj puste stringi na null dla tekstowych pól opcjonalnych
      ['country', 'city', 'street', 'post_code', 'description'].forEach(field => {
        if (projectData[field] === "") {
          projectData[field] = null;
        }
      });

      // Usuwamy niepotrzebne pola, które mogą powodować problemy
      delete projectData.client_name;
      delete projectData.created_by_name;
      delete projectData.updated_by_name;
      delete projectData.status_display;
      delete projectData.tag_serial;

      console.log('Dane projektu do wysłania:', projectData);

      let response;

      if (mode === 'create') {
        // Tworzenie nowego projektu
        response = await fetch('/api/projects/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(projectData),
          credentials: 'same-origin',
        });
      } else {
        // Aktualizacja istniejącego projektu
        response = await fetch(`/api/projects/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(projectData),
          credentials: 'same-origin',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Odpowiedź z serwera:', errorData);

        // Przygotuj bardziej szczegółową wiadomość błędu
        let errorMessage = 'Wystąpił błąd podczas zapisywania projektu';
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          // Przygotuj czytelną wiadomość z pól błędów
          const errorFields = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('; ');

          if (errorFields) {
            errorMessage = `Błędy w danych: ${errorFields}`;
          }
        }

        throw new Error(errorMessage);
      }

      // Odśwież listę projektów
      refreshProjects();

      // Sukces - powrót do listy projektów
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/projects');
      }

    } catch (err) {
      console.error('Błąd:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania projektu');
    } finally {
      setLoading(false);
    }
  };

  // Zmiana trybu z podglądu na edycję
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // Generowanie tytułu formularza w zależności od trybu
  const getFormTitle = () => {
    if (mode === 'create') return 'Nowy projekt';
    if (mode === 'edit') return 'Edycja projektu';
    return 'Szczegóły projektu';
  };

  if (loading && mode !== 'create') {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/projects')}
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
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informacje podstawowe */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Informacje podstawowe</h2>
            </div>

            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwa projektu
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={project.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź nazwę projektu"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                Klient
              </label>
              <select
                id="client"
                name="client"
                value={project.client || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              >
                <option value="">-- Wybierz klienta --</option>
                {availableClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Opis projektu
              </label>
              <textarea
                id="description"
                name="description"
                value={project.description || ''}
                onChange={handleChange}
                disabled={!isEditing}
                rows="4"
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź opis projektu"
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={project.status}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              >
                <option value="new">Nowy</option>
                <option value="in_progress">W trakcie</option>
                <option value="completed">Zakończony</option>
                <option value="cancelled">Anulowany</option>
                <option value="on_hold">Wstrzymany</option>
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                Budżet (PLN)
              </label>
              <input
                type="number"
                id="budget"
                name="budget"
                value={project.budget || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź budżet projektu"
                step="0.01"
              />
            </div>

            {/* Daty */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2 mt-4">Daty realizacji</h2>
            </div>

            <div className="mb-4">
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data rozpoczęcia
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={project.start_date || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data zakończenia
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={project.end_date || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              />
            </div>

            {/* Lokalizacja */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2 mt-4">Lokalizacja</h2>
            </div>

            <div className="mb-4">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                Kraj
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={project.country || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź kraj"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Miasto
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={project.city || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź miasto"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Ulica
              </label>
              <input
                type="text"
                id="street"
                name="street"
                value={project.street || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź ulicę"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="post_code" className="block text-sm font-medium text-gray-700 mb-1">
                Kod pocztowy
              </label>
              <input
                type="text"
                id="post_code"
                name="post_code"
                value={project.post_code || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź kod pocztowy"
              />
            </div>

            <div className="md:col-span-2 mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <MapPin size={16} className="mr-1" />
                Współrzędne geograficzne
              </label>
              {isEditing ? (
                <CoordinatesInput
                  latitude={project.latitude}
                  longitude={project.longitude}
                  onChange={handleCoordinatesChange}
                  disabled={!isEditing}
                />
              ) : (
                <div className="px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg">
                  {project.latitude && project.longitude ? (
                    <span>{project.latitude}, {project.longitude}</span>
                  ) : (
                    <span className="text-gray-500">Brak współrzędnych</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Zawsze pokazuj mapę */}
          <div className="mt-6">
            <ProjectMap
              latitude={project.latitude}
              longitude={project.longitude}
              height="400px"
            />
          </div>

          {(mode === 'view' && !isEditing) ? (
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Data utworzenia</p>
                <p className="mt-1">
                  {project.created_at ? new Date(project.created_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Utworzony przez</p>
                <p className="mt-1">{project.created_by_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Data aktualizacji</p>
                <p className="mt-1">
                  {project.updated_at ? new Date(project.updated_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Zaktualizowany przez</p>
                <p className="mt-1">{project.updated_by_name || '-'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/projects')}
                className="mr-4 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="mr-2" size={18} />
                )}
                Zapisz
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProjectForm;