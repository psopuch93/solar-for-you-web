// frontend/src/components/EmployeeForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Edit as EditIcon
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import { useEmployees } from '../contexts/EmployeeContext';
import { useProjects } from '../contexts/ProjectContext';

const EmployeeForm = ({ mode = 'view', onSuccess }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshEmployees } = useEmployees();
  const { projects } = useProjects();

  const [employee, setEmployee] = useState({
    first_name: '',
    last_name: '',
    pesel: '',
    current_project: ''
  });

  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');
  const [peselValid, setPeselValid] = useState(true);
  const [peselMessage, setPeselMessage] = useState('');

  // Efekt do pobierania danych pracownika, jeśli edytujemy lub wyświetlamy istniejący
  useEffect(() => {
    if (id && (mode === 'view' || mode === 'edit')) {
      fetchEmployee();
    }
  }, [id, mode]);

  // Obserwuj listę projektów z kontekstu
  useEffect(() => {
    if (projects && projects.length > 0) {
      setAvailableProjects(projects);
    } else {
      // Jeśli projekty nie są jeszcze załadowane przez kontekst, pobierz je bezpośrednio
      fetchProjects();
    }
  }, [projects]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees/${id}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych pracownika');
      }

      const data = await response.json();
      setEmployee(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych pracownika. Spróbuj ponownie później.');
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
      // Nie pokazujemy tego błędu użytkownikowi - to mniej krytyczne
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee(prev => ({ ...prev, [name]: value }));

    // Walidacja PESEL podczas pisania
    if (name === 'pesel' && value) {
      validatePesel(value);
    } else if (name === 'pesel' && !value) {
      setPeselValid(true);
      setPeselMessage('');
    }
  };

  const validatePesel = async (pesel) => {
    // Podstawowa walidacja - tylko cyfry i długość 11
    if (!/^\d{11}$/.test(pesel)) {
      setPeselValid(false);
      setPeselMessage('PESEL musi składać się z 11 cyfr');
      return false;
    }

    try {
      const url = `/api/check-pesel/?pesel=${pesel}${id ? `&id=${id}` : ''}`;
      const response = await fetch(url, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd sprawdzania PESEL');
      }

      const data = await response.json();
      setPeselValid(data.valid);
      setPeselMessage(data.message);
      return data.valid;
    } catch (err) {
      console.error('Błąd walidacji PESEL:', err);
      setPeselValid(false);
      setPeselMessage('Błąd sprawdzania PESEL. Spróbuj ponownie.');
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Walidacja
      if (!employee.first_name.trim() || !employee.last_name.trim()) {
        setError('Imię i nazwisko są wymagane');
        setLoading(false);
        return;
      }

      // Walidacja PESEL jeśli został podany
      if (employee.pesel && !(await validatePesel(employee.pesel))) {
        setError('Nieprawidłowy numer PESEL');
        setLoading(false);
        return;
      }

      // Przygotuj dane do wysłania, kopia głęboka
      const employeeData = JSON.parse(JSON.stringify(employee));

      // Sprawdź, czy current_project to pusty string i zamień go na null
      if (employeeData.current_project === "") {
        employeeData.current_project = null;
      }

      // Usuń niepotrzebne pola, które mogą powodować problemy
      delete employeeData.project_name;
      delete employeeData.created_by_name;
      delete employeeData.updated_by_name;
      delete employeeData.tag_serial;
      delete employeeData.full_name;

      console.log('Dane pracownika do wysłania:', employeeData);

      let response;

      if (mode === 'create') {
        // Tworzenie nowego pracownika
        response = await fetch('/api/employees/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(employeeData),
          credentials: 'same-origin',
        });
      } else {
        // Aktualizacja istniejącego pracownika
        response = await fetch(`/api/employees/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(employeeData),
          credentials: 'same-origin',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Odpowiedź z serwera:', errorData);

        // Przygotuj bardziej szczegółową wiadomość błędu
        let errorMessage = 'Wystąpił błąd podczas zapisywania pracownika';
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

      // Odśwież listę pracowników
      refreshEmployees();

      // Sukces - powrót do listy pracowników
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/employees');
      }

    } catch (err) {
      console.error('Błąd:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania pracownika');
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
    if (mode === 'create') return 'Nowy pracownik';
    if (mode === 'edit') return 'Edycja pracownika';
    return 'Szczegóły pracownika';
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
            onClick={() => navigate('/dashboard/employees')}
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
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                Imię
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={employee.first_name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź imię"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Nazwisko
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={employee.last_name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź nazwisko"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="pesel" className="block text-sm font-medium text-gray-700 mb-1">
                PESEL
              </label>
              <input
                type="text"
                id="pesel"
                name="pesel"
                value={employee.pesel || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${
                  isEditing
                    ? peselValid
                      ? 'border-gray-300'
                      : 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                } rounded-lg focus:outline-none ${
                  isEditing
                    ? peselValid
                      ? 'focus:ring-2 focus:ring-orange-500'
                      : 'focus:ring-2 focus:ring-red-500'
                    : ''
                }`}
                placeholder="Wprowadź numer PESEL"
              />
              {isEditing && !peselValid && peselMessage && (
                <p className="mt-1 text-sm text-red-600">{peselMessage}</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="current_project" className="block text-sm font-medium text-gray-700 mb-1">
                Aktualny projekt
              </label>
              <select
                id="current_project"
                name="current_project"
                value={employee.current_project || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              >
                <option value="">-- Brak aktualnego projektu --</option>
                {availableProjects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(mode === 'view' && !isEditing) ? (
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Data utworzenia</p>
                <p className="mt-1">
                  {employee.created_at ? new Date(employee.created_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Utworzony przez</p>
                <p className="mt-1">{employee.created_by_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Data aktualizacji</p>
                <p className="mt-1">
                  {employee.updated_at ? new Date(employee.updated_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Zaktualizowany przez</p>
                <p className="mt-1">{employee.updated_by_name || '-'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/employees')}
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

export default EmployeeForm;