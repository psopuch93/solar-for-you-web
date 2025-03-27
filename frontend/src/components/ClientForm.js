// frontend/src/components/ClientForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Edit as EditIcon
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';

const ClientForm = ({ mode = 'view', onSuccess }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState({
    name: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Efekt do pobierania danych klienta, jeśli edytujemy lub wyświetlamy istniejącego
  useEffect(() => {
    if (id && (mode === 'view' || mode === 'edit')) {
      fetchClient();
    }
  }, [id, mode]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${id}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych klienta');
      }

      const data = await response.json();
      setClient(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych klienta. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Walidacja
      if (!client.name.trim()) {
        setError('Nazwa klienta jest wymagana');
        setLoading(false);
        return;
      }

      let response;

      if (mode === 'create') {
        // Tworzenie nowego klienta
        response = await fetch('/api/clients/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(client),
          credentials: 'same-origin',
        });
      } else {
        // Aktualizacja istniejącego klienta
        response = await fetch(`/api/clients/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(client),
          credentials: 'same-origin',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Wystąpił błąd podczas zapisywania klienta');
      }

      // Sukces - powrót do listy klientów
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/clients');
      }

    } catch (err) {
      console.error('Błąd:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania klienta');
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
    if (mode === 'create') return 'Nowy klient';
    if (mode === 'edit') return 'Edycja klienta';
    return 'Szczegóły klienta';
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
            onClick={() => navigate('/dashboard/clients')}
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
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nazwa klienta
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={client.name}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              placeholder="Wprowadź nazwę klienta"
            />
          </div>

          {(mode === 'view' && !isEditing) ? (
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Data utworzenia</p>
                <p className="mt-1">
                  {client.created_at ? new Date(client.created_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Utworzony przez</p>
                <p className="mt-1">{client.created_by_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Data aktualizacji</p>
                <p className="mt-1">
                  {client.updated_at ? new Date(client.updated_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Zaktualizowany przez</p>
                <p className="mt-1">{client.updated_by_name || '-'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/clients')}
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

export default ClientForm;