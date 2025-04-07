// frontend/src/pages/ProgressReportPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  Save,
  Plus,
  Trash2,
  Calendar,
  Users,
  Folder,
  RefreshCw
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';

const ProgressReportPage = () => {
  const [userSettings, setUserSettings] = useState(null);
  const [userProject, setUserProject] = useState(null);
  const [brigadeMembers, setBrigadeMembers] = useState([]);
  const [workEntries, setWorkEntries] = useState([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const navigate = useNavigate();

  // Pobierz dane przy pierwszym renderowaniu
  useEffect(() => {
    fetchData();
  }, []);

  // Pobieranie wszystkich potrzebnych danych
  const fetchData = async () => {
    setLoading(true);
    try {
      // Pobierz ustawienia użytkownika
      const userSettingsResponse = await fetch('/api/user-settings/me/', {
        credentials: 'same-origin',
      });

      if (userSettingsResponse.ok) {
        const userSettingsData = await userSettingsResponse.json();
        setUserSettings(userSettingsData);
        setUserProject(userSettingsData.project);
      } else {
        console.error("Nie udało się pobrać ustawień użytkownika:", userSettingsResponse.status);
      }

      // Pobierz członków brygady
      const brigadeResponse = await fetch('/api/brigade-members/', {
        credentials: 'same-origin',
      });

      if (brigadeResponse.ok) {
        const brigadeData = await brigadeResponse.json();
        setBrigadeMembers(brigadeData);

        // Inicjalizuj puste wpisy pracy dla każdego członka brygady
        const initialWorkEntries = brigadeData.map(member => ({
          employeeId: member.employee,
          employeeName: member.employee_name,
          hoursWorked: '',
          notes: ''
        }));

        setWorkEntries(initialWorkEntries);
      } else {
        console.error("Błąd pobierania członków brygady:", brigadeResponse.status);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Wystąpił błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  // Aktualizacja godzin pracy dla danego pracownika
  const handleHoursChange = (employeeId, hours) => {
    // Walidacja - tylko liczby i maksymalnie 24 godziny
    if (hours === '' || (parseFloat(hours) >= 0 && parseFloat(hours) <= 24)) {
      setWorkEntries(prev =>
        prev.map(entry =>
          entry.employeeId === employeeId
            ? { ...entry, hoursWorked: hours }
            : entry
        )
      );
    }
  };

  // Aktualizacja notatek dla danego pracownika
  const handleNotesChange = (employeeId, notes) => {
    setWorkEntries(prev =>
      prev.map(entry =>
        entry.employeeId === employeeId
          ? { ...entry, notes }
          : entry
      )
    );
  };

  // Wysyłanie raportu
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sprawdź czy użytkownik ma przypisany projekt
    if (!userProject) {
      setError("Nie możesz złożyć raportu bez przypisanego projektu. Przejdź do sekcji 'Brygada' aby przypisać projekt.");
      return;
    }

    // Sprawdź czy są pracownicy w brygadzie
    if (brigadeMembers.length === 0) {
      setError("Nie masz przypisanych pracowników do swojej brygady. Przejdź do sekcji 'Brygada' aby dodać pracowników.");
      return;
    }

    // Walidacja danych
    const invalidEntries = workEntries.filter(
      entry => entry.hoursWorked !== '' && (isNaN(parseFloat(entry.hoursWorked)) || parseFloat(entry.hoursWorked) < 0 || parseFloat(entry.hoursWorked) > 24)
    );

    if (invalidEntries.length > 0) {
      setError("Liczba godzin musi być wartością od 0 do 24 dla wszystkich pracowników.");
      return;
    }

    try {
      setSubmitting(true);

      // Przygotuj dane do wysłania
      const reportData = {
        date: reportDate,
        project: userProject.id,
        entries: workEntries.map(entry => ({
          employee: entry.employeeId,
          hours_worked: entry.hoursWorked === '' ? 0 : parseFloat(entry.hoursWorked),
          notes: entry.notes
        }))
      };

      // Tutaj byłoby faktyczne wysłanie danych do API
      // const response = await fetch('/api/progress-reports/', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-CSRFToken': getCsrfToken(),
      //   },
      //   body: JSON.stringify(reportData),
      //   credentials: 'same-origin',
      // });

      // if (!response.ok) {
      //   throw new Error('Nie udało się zapisać raportu');
      // }

      // Na razie tylko zalogujemy dane, które zostałyby wysłane
      console.log("Wysyłanie raportu postępu:", reportData);

      // Symuluj sukces
      showNotification("Raport został zapisany", "success");

      // Reset formularza
      setWorkEntries(brigadeMembers.map(member => ({
        employeeId: member.employee,
        employeeName: member.employee_name,
        hoursWorked: '',
        notes: ''
      })));
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania raportu');
    } finally {
      setSubmitting(false);
    }
  };

  // Funkcja do wyświetlania powiadomień
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Progres Raport</h1>
        <button
          onClick={fetchData}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
          Odśwież dane
        </button>
      </div>

      {/* Powiadomienia */}
      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ?
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> :
              <AlertCircle className="mr-2" size={20} />
            }
            <p>{notification.message}</p>
          </div>
        </div>
      )}

      {/* Błędy */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Karta informacyjna o projekcie */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
          <Folder className="mr-2" size={20} />
          Informacje o projekcie
        </h2>

        {loading ? (
          <div className="flex justify-center items-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : !userProject ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="font-medium text-yellow-700">Nie masz przypisanego projektu</p>
            <p className="text-sm text-gray-600 mt-2">
              Aby złożyć raport postępu, musisz mieć przypisany projekt. Przejdź do sekcji "Brygada", aby przypisać projekt.
            </p>
            <button
              onClick={() => navigate('/dashboard/brigade')}
              className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Przejdź do zarządzania brygadą
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-700">Projekt: {userProject.name}</p>
            {userProject.status && (
              <p className="text-sm text-gray-600 mt-1">Status: {userProject.status_display || userProject.status}</p>
            )}
            {brigadeMembers.length === 0 ? (
              <div className="mt-3">
                <p className="text-yellow-700">Nie masz przypisanych pracowników do swojej brygady</p>
                <p className="text-sm text-gray-600 mt-1">
                  Aby złożyć raport postępu, musisz mieć przypisanych pracowników do swojej brygady.
                </p>
                <button
                  onClick={() => navigate('/dashboard/brigade')}
                  className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Przejdź do zarządzania brygadą
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-1">Liczba pracowników w brygadzie: {brigadeMembers.length}</p>
            )}
          </div>
        )}
      </div>

      {/* Formularz raportu */}
      {userProject && brigadeMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-700 flex items-center">
                <Calendar className="mr-2" size={20} />
                Raport za dzień
              </h2>
              <div className="flex items-center">
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]} // Maksymalna data to dzisiaj
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                <Users className="mr-2" size={18} />
                Członkowie brygady
              </h3>

              <div className="bg-gray-50 p-4 rounded-lg">
                {workEntries.length === 0 ? (
                  <p className="text-gray-500 text-center">Brak pracowników w brygadzie</p>
                ) : (
                  <div className="space-y-4">
                    {workEntries.map((entry) => (
                      <div key={entry.employeeId} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-4 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium">{entry.employeeName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Przepracowane godziny
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={entry.hoursWorked}
                              onChange={(e) => handleHoursChange(entry.employeeId, e.target.value)}
                              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0"
                            />
                            <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notatki (opcjonalnie)
                          </label>
                          <input
                            type="text"
                            value={entry.notes}
                            onChange={(e) => handleNotesChange(entry.employeeId, e.target.value)}
                            className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Dodatkowe informacje"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || workEntries.length === 0}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="mr-2" size={18} />
                )}
                Zapisz raport
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProgressReportPage;