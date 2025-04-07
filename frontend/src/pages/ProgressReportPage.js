// frontend/src/pages/ProgressReportPage.js
import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Image as ImageIcon,
  X,
  UploadCloud,
  CheckCircle
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
  const [reportData, setReportData] = useState(null);

  // Stany dla obsługi zdjęć
  const [images, setImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null);

  const navigate = useNavigate();

  // Pobierz dane przy pierwszym renderowaniu
  useEffect(() => {
    fetchData();
  }, []);

  // Efekt do ładowania raportu i zdjęć po zmianie daty
  useEffect(() => {
    if (userProject && userProject.id) {
      fetchReportForDate();
    }
  }, [reportDate, userProject]);

  // Efekt do ładowania zdjęć po załadowaniu raportu
  useEffect(() => {
    if (reportData && reportData.id) {
      fetchReportImages(reportData.id);
    } else {
      setImages([]);
    }
  }, [reportData]);

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

          // Sprawdź, czy projekt istnieje
          if (userSettingsData.project) {
            // Jeśli projekt to tylko ID, pobierz pełne dane projektu
            if (typeof userSettingsData.project === 'number') {
              const projectResponse = await fetch(`/api/projects/${userSettingsData.project}/`, {
                credentials: 'same-origin',
              });

              if (projectResponse.ok) {
                const projectData = await projectResponse.json();
                setUserProject(projectData);
              }
            } else if (userSettingsData.project_details) {
              // Jeśli mamy project_details, użyj ich
              setUserProject(userSettingsData.project_details);
            } else {
              // Jeśli projekt to pełny obiekt, użyj go bezpośrednio
              setUserProject(userSettingsData.project);
            }
          }
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

  // Pobierz raport dla wybranej daty
  const fetchReportForDate = async () => {
    if (!userProject || !userProject.id || !reportDate) return;

    try {
      const response = await fetch(`/api/progress-reports-for-date/?date=${reportDate}`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać raportu');
      }

      const data = await response.json();

      // Ustaw dane raportu jeśli istnieje, lub null jeśli nie ma raportu na tę datę
      if (data && data.length > 0) {
        const report = data[0]; // Zakładamy, że dla danej daty jest tylko jeden raport
        setReportData(report);

        // Jeśli raport ma wpisy, załaduj je do stanu
        if (report.entries && report.entries.length > 0) {
          // Mapowanie wpisów z raportu do formatu używanego w komponencie
          const mappedEntries = brigadeMembers.map(member => {
            const entry = report.entries.find(e => e.employee === member.employee);
            return {
              employeeId: member.employee,
              employeeName: member.employee_name,
              hoursWorked: entry ? entry.hours_worked.toString() : '',
              notes: entry ? entry.notes || '' : ''
            };
          });

          setWorkEntries(mappedEntries);
        }
      } else {
        setReportData(null);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setReportData(null);
    }
  };

  // Pobierz zdjęcia dla raportu
  const fetchReportImages = async (reportId) => {
    try {
      const response = await fetch(`/api/progress-report-images/?report_id=${reportId}`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        // W przypadku błędu, nie pokazujemy komunikatu - po prostu zostawiamy pustą listę zdjęć
        console.error('Błąd pobierania zdjęć:', response.status);
        setImages([]);
        return;
      }

      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Błąd pobierania zdjęć:', err);
      setImages([]);
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

  // Funkcja do obsługi przesyłania zdjęć
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    handleUploadImage(files[0]);
  };

  const handleUploadImage = async (file) => {
    // Sprawdź, czy mamy raport do którego można dodać zdjęcie
    if (!reportData || !reportData.id) {
      // Jeśli nie ma raportu, najpierw utworzymy raport
      try {
        await handleSubmit(null, true); // true oznacza, że wywołujemy tylko w celu utworzenia raportu

        // Po utworzeniu raportu czekamy chwilę, aby upewnić się, że mamy już ID raportu
        setTimeout(() => {
          uploadImageToReport(file);
        }, 500);
      } catch (err) {
        showNotification("Najpierw musisz zapisać raport, aby dodać zdjęcia", "error");
      }
    } else {
      // Jeśli mamy już raport, od razu przesyłamy zdjęcie
      uploadImageToReport(file);
    }
  };

  const uploadImageToReport = async (file) => {
    if (!reportData || !reportData.id) {
      showNotification("Nie można dodać zdjęcia - brak raportu", "error");
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('report', reportData.id);
      formData.append('name', file.name);

      const response = await fetch('/api/progress-report-images/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken()
        },
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się przesłać zdjęcia');
      }

      // Pobierz zaktualizowaną listę zdjęć
      fetchReportImages(reportData.id);

      showNotification("Zdjęcie zostało dodane", "success");
    } catch (error) {
      console.error('Błąd podczas przesyłania zdjęcia:', error);
      showNotification("Nie udało się przesłać zdjęcia", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId, e) => {
    e && e.stopPropagation(); // Zatrzymaj propagację, aby nie otwierać modalu

    if (!window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;

    try {
      const response = await fetch(`/api/progress-report-images/${imageId}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć zdjęcia');
      }

      // Zaktualizuj lokalną listę zdjęć
      setImages(prev => prev.filter(img => img.id !== imageId));
      showNotification("Zdjęcie zostało usunięte", "success");
    } catch (error) {
      console.error('Błąd podczas usuwania zdjęcia:', error);
      showNotification("Nie udało się usunąć zdjęcia", "error");
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  // Wysyłanie raportu
  const handleSubmit = async (e, skipValidation = false) => {
    if (e) e.preventDefault();

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

    // Walidacja danych - tylko jeśli nie pomijamy walidacji
    if (!skipValidation) {
      const invalidEntries = workEntries.filter(
        entry => entry.hoursWorked !== '' && (isNaN(parseFloat(entry.hoursWorked)) || parseFloat(entry.hoursWorked) < 0 || parseFloat(entry.hoursWorked) > 24)
      );

      if (invalidEntries.length > 0) {
        setError("Liczba godzin musi być wartością od 0 do 24 dla wszystkich pracowników.");
        return;
      }
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

      // Wyślij dane do API
      const response = await fetch('/api/create-progress-report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(reportData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się zapisać raportu');
      }

      const savedReport = await response.json();
      setReportData(savedReport);

      // Pokaż powiadomienie o sukcesie, ale tylko jeśli nie pomijamy walidacji
      if (!skipValidation) {
        showNotification("Raport został zapisany", "success");
      }

      // Załaduj zdjęcia dla nowego raportu
      if (savedReport && savedReport.id) {
        fetchReportImages(savedReport.id);
      }

    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania raportu');
      throw err; // Re-throw, aby wywołujący mógł obsłużyć błąd
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
              <CheckCircle className="mr-2" size={20} /> :
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

      {/* Sekcja zdjęć */}
      {userProject && brigadeMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-700 flex items-center">
              <ImageIcon className="mr-2" size={18} />
              Zdjęcia z postępu prac
            </h3>
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <div className="animate-spin h-4 w-4 border-2 border-indigo-600 rounded-full border-t-transparent mr-1"></div>
              ) : (
                <UploadCloud size={16} className="mr-1" />
              )}
              Dodaj zdjęcie
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
              disabled={uploadingImage}
            />
          </div>

          {images.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
              <p>Brak zdjęć dla tego raportu</p>
              <p className="text-sm mt-2">Kliknij "Dodaj zdjęcie", aby dodać pierwsze zdjęcie</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map(image => (
                <div
                  key={image.id}
                  className="relative group rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => handleImageClick(image)}
                >
                  <img
                    src={image.image_url || image.image}
                    alt={image.name}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/api/placeholder/400/320";
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={(e) => handleDeleteImage(image.id, e)}
                      className="text-white bg-red-600 p-1 rounded-full hover:bg-red-700"
                      title="Usuń zdjęcie"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal do pokazywania zdjęć w pełnym rozmiarze */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 bg-white rounded-full p-1"
            >
              <X size={24} />
            </button>

            <div className="p-2">
              <img
                src={selectedImage.image_url || selectedImage.image}
                alt={selectedImage.name}
                className="max-h-[80vh] max-w-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/api/placeholder/800/600";
                }}
              />
            </div>

            <div className="p-4 bg-gray-100 border-t">
              <p className="font-medium text-gray-800">{selectedImage.name}</p>
              {selectedImage.description && (
                <p className="text-gray-600 mt-1">{selectedImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressReportPage;