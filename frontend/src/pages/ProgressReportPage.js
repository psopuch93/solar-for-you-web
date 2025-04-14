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
  CheckCircle,
  PlusCircle,
  Info,
  FileText,
  Edit,
  UserPlus,
  CheckSquare,
  Square
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import ProgressReportBarChart from '../components/ProgressReportBarChart';

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

  // New state for employee selection
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

  // Stany dla obsługi zdjęć
  const [images, setImages] = useState([]);
  const [tempImages, setTempImages] = useState([]); // Nowy stan dla tymczasowych zdjęć
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const fileInputRef = useRef(null);

  // Nowe stany dla obsługi wersji roboczych
  const [reportStatus, setReportStatus] = useState(null); // null, 'draft', 'submitted'
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [reportDates, setReportDates] = useState({
    draft: [],
    submitted: []
  });

  const navigate = useNavigate();

  // Pobierz dane przy pierwszym renderowaniu
  useEffect(() => {
    fetchData();
    fetchReportDates(); // Pobierz daty wszystkich raportów dla oznaczenia w kalendarzu
  }, []);

  // Efekt do ładowania raportu i zdjęć po zmianie daty
  useEffect(() => {
    if (userProject && userProject.id && reportDate && brigadeMembers.length > 0) {
      fetchReportForDate();
    }
  }, [reportDate, userProject, brigadeMembers]);

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
      // Najpierw spróbuj pobrać istniejące ustawienia użytkownika
      let userSettingsData = null;
      try {
        const csrfToken = getCsrfToken();
        const userSettingsResponse = await fetch('/api/user-settings/me/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'same-origin',
        });

        if (userSettingsResponse.ok) {
          userSettingsData = await userSettingsResponse.json();
          console.log("Pobrano istniejące ustawienia:", userSettingsData);
          setUserSettings(userSettingsData);

          // Ustaw projekt użytkownika, jeśli istnieje
          if (userSettingsData.project) {
            let projectData;
            if (typeof userSettingsData.project === 'number') {
              const projectResponse = await fetch(`/api/projects/${userSettingsData.project}/`, {
                credentials: 'same-origin',
              });

              if (projectResponse.ok) {
                projectData = await projectResponse.json();
              }
            } else if (userSettingsData.project_details) {
              projectData = userSettingsData.project_details;
            } else {
              projectData = userSettingsData.project;
            }

            setUserProject(projectData);
          }
        } else {
          console.log("Nie znaleziono ustawień użytkownika:", userSettingsResponse.status);

          // Próba utworzenia nowych ustawień
          console.log("Próba utworzenia nowych ustawień użytkownika");
          const createResponse = await fetch('/api/user-settings/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            credentials: 'same-origin',
          });

          if (createResponse.ok) {
            userSettingsData = await createResponse.json();
            console.log("Utworzono nowe ustawienia:", userSettingsData);
            setUserSettings(userSettingsData);

            if (userSettingsData.project) {
              if (typeof userSettingsData.project === 'number') {
                const projectResponse = await fetch(`/api/projects/${userSettingsData.project}/`, {
                  credentials: 'same-origin',
                });

                if (projectResponse.ok) {
                  const projectData = await projectResponse.json();
                  setUserProject(projectData);
                }
              } else if (userSettingsData.project_details) {
                setUserProject(userSettingsData.project_details);
              } else {
                setUserProject(userSettingsData.project);
              }
            }
          } else {
            const errorText = await createResponse.text();
            console.error("Nie udało się utworzyć ustawień:", createResponse.status, errorText);
          }
        }
      } catch (settingsError) {
        console.error("Błąd przy obsłudze ustawień użytkownika:", settingsError);
      }

      // Pobierz członków brygady niezależnie od wyniku pobrania ustawień
      try {
        const brigadeResponse = await fetch('/api/brigade-members/', {
          credentials: 'same-origin',
        });

        if (brigadeResponse.ok) {
          const brigadeData = await brigadeResponse.json();
          setBrigadeMembers(brigadeData);

          if (reportData?.entries && reportData.entries.length > 0) {
            // Use only report entries instead of mapping through all brigade members
            const mappedEntries = reportData.entries.map(entry => {
              const brigadeMember = brigadeData.find(member => member.employee === entry.employee);
              const employeeName = brigadeMember ? brigadeMember.employee_name : entry.employee_name || `Employee ID: ${entry.employee}`;

              // Add this entry's employee ID to selected employees
              if (!selectedEmployeeIds.includes(entry.employee)) {
                setSelectedEmployeeIds(prev => [...prev, entry.employee]);
              }

              return {
                employeeId: entry.employee,
                employeeName: employeeName,
                hoursWorked: entry.hours_worked.toString(),
                notes: entry.notes || ''
              };
            });

            setWorkEntries(mappedEntries);
          } else {
            // Empty entries will be added only when employees are selected
            setWorkEntries([]);
          }
        } else {
          console.error("Błąd pobierania członków brygady:", brigadeResponse.status);
        }
      } catch (err) {
        console.error("Błąd pobierania brygady:", err);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Wystąpił błąd podczas ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  // Nowa funkcja: pobierz daty wszystkich raportów dla kalendarza
  const fetchReportDates = async () => {
    try {
      const response = await fetch('/api/progress-reports/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Error fetching reports');
      }

      const data = await response.json();

      // Rozdziel raporty na wersje robocze i finalne
      const draftDates = data
        .filter(report => report.is_draft)
        .map(report => report.date);

      const submittedDates = data
        .filter(report => report.is_draft === false)
        .map(report => report.date);

      setReportDates({
        draft: draftDates,
        submitted: submittedDates
      });

    } catch (err) {
      console.error('Error fetching report dates:', err);
      // Nie pokazujemy błędu użytkownikowi - to nie jest krytyczne
    }
  };

  // Nowa funkcja: Obsługa edycji istniejącej wersji roboczej
  const handleEditDraft = () => {
    if (reportData && reportStatus === 'draft') {
      setIsEditingDraft(true);
    }
  };

  // Pobierz raport dla wybranej daty
  const fetchReportForDate = async () => {
    if (!userProject || !userProject.id || !reportDate) return;

    try {
      const response = await fetch(`/api/progress-reports/?date=${reportDate}`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać raportu');
      }

      const data = await response.json();

      // Filtruj raporty tylko dla wybranej daty
      const reportsForDate = data.filter(report => report.date === reportDate);

      // Ustaw dane raportu jeśli istnieje, lub null jeśli nie ma raportu na tę datę
      if (reportsForDate && reportsForDate.length > 0) {
        const report = reportsForDate[0]; // Zakładamy, że dla danej daty jest tylko jeden raport
        setReportData(report);

        // Określ status raportu (wersja robocza czy finalna)
        setReportStatus(report.is_draft ? 'draft' : 'submitted');

        // Jeśli raport ma wpisy, załaduj je do stanu
        if (report.entries && report.entries.length > 0) {
          // Use only report entries instead of mapping through all brigade members
          const mappedEntries = report.entries.map(entry => {
            const brigadeMember = brigadeMembers.find(member => member.employee === entry.employee);
            const employeeName = brigadeMember ? brigadeMember.employee_name : entry.employee_name || `Employee ID: ${entry.employee}`;

            return {
              employeeId: entry.employee,
              employeeName: employeeName,
              hoursWorked: entry.hours_worked.toString(),
              notes: entry.notes || ''
            };
          });

          setWorkEntries(mappedEntries);

          // Set the selected employee IDs based on the entries in the report
          const employeeIds = report.entries.map(entry => entry.employee);
          setSelectedEmployeeIds(employeeIds);
        } else {
          setWorkEntries([]);
          setSelectedEmployeeIds([]);
        }
      } else {
        setReportData(null);
        setReportStatus(null);
        setIsEditingDraft(false);
        setWorkEntries([]);
        setSelectedEmployeeIds([]);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setReportData(null);
      setReportStatus(null);
      setWorkEntries([]);
      setSelectedEmployeeIds([]);
    }
  };

  // Pobierz zdjęcia dla raportu
  // Poprawiona funkcja fetchReportImages
    const fetchReportImages = async (reportId) => {
      try {
        // Upewnij się, że reportId jest zdefiniowane
        if (!reportId) {
          console.log("Brak reportId - nie można pobrać zdjęć");
          setImages([]);
          return;
        }

        // Dodajemy parametr report_id do wywołania API
        const response = await fetch(`/api/progress-report-images/?report_id=${reportId}`, {
          credentials: 'same-origin',
        });

        if (!response.ok) {
          console.error('Błąd pobierania zdjęć:', response.status);
          setImages([]);
          return;
        }

        const data = await response.json();

        // Dodajemy filtrowanie zdjęć dla tego konkretnego raportu
        const filteredImages = data.filter(image => image.report === parseInt(reportId));
        console.log(`Pobrano ${filteredImages.length} zdjęć dla raportu ${reportId}`);

        setImages(filteredImages);
      } catch (err) {
        console.error('Błąd pobierania zdjęć:', err);
        setImages([]);
      }
    };

  // Handle employee selection
  const handleEmployeeSelection = (employeeId) => {
    setSelectedEmployeeIds(prev => {
      if (prev.includes(employeeId)) {
        // Remove the employee if already selected
        const newSelection = prev.filter(id => id !== employeeId);

        // Also remove from work entries if exists
        setWorkEntries(entries => entries.filter(entry => entry.employeeId !== employeeId));

        return newSelection;
      } else {
        // Add the employee if not selected
        return [...prev, employeeId];
      }
    });
  };

  // Add selected employees to work entries
  const addSelectedEmployeesToEntries = () => {
    // Get currently selected employees that aren't in work entries yet
    const currentEmployeeIds = workEntries.map(entry => entry.employeeId);
    const employeesToAdd = selectedEmployeeIds.filter(id => !currentEmployeeIds.includes(id));

    if (employeesToAdd.length === 0) {
      showNotification("Wszyscy wybrani pracownicy są już dodani do raportu", "info");
      return;
    }

    // Create new entries for those employees
    const newEntries = employeesToAdd.map(id => {
      const employee = brigadeMembers.find(member => member.employee === id);
      return {
        employeeId: id,
        employeeName: employee ? employee.employee_name : `Pracownik ID: ${id}`,
        hoursWorked: '',
        notes: ''
      };
    });

    // Add new entries to existing ones
    setWorkEntries(prev => [...prev, ...newEntries]);

    // Close the employee selector
    setShowEmployeeSelector(false);

    showNotification(`Dodano ${newEntries.length} pracowników do raportu`, "success");
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

  // Remove an employee from work entries
  const handleRemoveEmployee = (employeeId) => {
    setWorkEntries(prev => prev.filter(entry => entry.employeeId !== employeeId));
    setSelectedEmployeeIds(prev => prev.filter(id => id !== employeeId));
  };

  // Funkcja do obsługi przesyłania zdjęć
  const handleFileSelect = (e) => {
      const files = e.target.files;
      if (files.length === 0) return;

      const file = files[0];

      // Sprawdź czy nie próbujemy dodać zdjęcia do raportu roboczego, który nie jest w trybie edycji
      if (reportStatus === 'draft' && !isEditingDraft) {
        showNotification("Najpierw kliknij 'Edytuj wersję roboczą', aby dodać zdjęcia", "error");
        return;
      }

      // Jeśli raport nie istnieje, dodaj zdjęcie do tymczasowej kolekcji
      if (!reportData || !reportData.id) {
        // Utwórz tymczasowe ID dla zdjęcia
        const tempId = `temp-${Date.now()}`;

        // Utwórz URL dla podglądu zdjęcia
        const imageUrl = URL.createObjectURL(file);

        // Dodaj zdjęcie do tymczasowej kolekcji
        setTempImages(prev => [...prev, {
          id: tempId,
          file: file,
          name: file.name,
          image_url: imageUrl
        }]);

        showNotification("Zdjęcie zostało dodane do raportu. Zapisz raport, aby trwale je zachować.", "info");
      } else {
        // Jeśli raport już istnieje, wyślij zdjęcie od razu
        handleUploadImage(file);
      }
    };

  // Zmodyfikowana funkcja handleUploadImage
  const handleUploadImage = async (file) => {
    if (!reportData || !reportData.id) {
      // Nie powinno się zdarzyć, ale na wszelki wypadek
      showNotification("Błąd podczas przesyłania zdjęcia", "error");
      return;
    }

    uploadImageToReport(file);
  };

  // Funkcja do przesyłania zdjęcia do istniejącego raportu
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

  // Funkcja do usuwania tymczasowych zdjęć
  const handleDeleteTempImage = (tempId, e) => {
    e && e.stopPropagation();

    setTempImages(prev => prev.filter(img => img.id !== tempId));
    showNotification("Tymczasowe zdjęcie zostało usunięte", "info");
  };

  // Funkcja do przesyłania wszystkich tymczasowych zdjęć po zapisaniu raportu
  const uploadTempImagesToReport = async (reportId) => {
    if (tempImages.length === 0) return;

    let uploadedCount = 0;
    let errorCount = 0;

    // Pokazujemy wskaźnik ładowania
    setUploadingImage(true);

    for (const tempImage of tempImages) {
      try {
        const formData = new FormData();
        formData.append('image', tempImage.file);
        formData.append('report', reportId);
        formData.append('name', tempImage.name);

        const response = await fetch('/api/progress-report-images/', {
          method: 'POST',
          headers: {
            'X-CSRFToken': getCsrfToken()
          },
          body: formData,
          credentials: 'same-origin',
        });

        if (response.ok) {
          uploadedCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
        console.error("Błąd przesyłania tymczasowego zdjęcia:", err);
      }
    }

    // Wyczyść tymczasowe zdjęcia po przesłaniu
    setTempImages([]);

    // Ukryj wskaźnik ładowania
    setUploadingImage(false);

    // Pokaż podsumowanie
    if (errorCount === 0) {
      showNotification(`Pomyślnie przesłano ${uploadedCount} zdjęć`, "success");
    } else {
      showNotification(`Przesłano ${uploadedCount} zdjęć, nie udało się przesłać ${errorCount} zdjęć`, "warning");
    }

    // Zaktualizuj listę zdjęć
    fetchReportImages(reportId);
  };

  const handleDeleteImage = async (imageId, e) => {
      e && e.stopPropagation(); // Zatrzymaj propagację, aby nie otwierać modalu

      // Sprawdź czy nie próbujemy usunąć zdjęcia z raportu roboczego, który nie jest w trybie edycji
      if (reportStatus === 'draft' && !isEditingDraft) {
        showNotification("Najpierw kliknij 'Edytuj wersję roboczą', aby usuwać zdjęcia", "error");
        return;
      }

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

  // Nowa funkcja: Zapisz jako wersję roboczą
  const saveAsDraft = async () => {
    await saveReport(true);
  };

  // Nowa funkcja: Zapisz jako wersję finalną (dotychczasowy handleSubmit)
  const submitFinalReport = async () => {
    await saveReport(false);
  };

  // Wspólna funkcja do zapisywania raportu
  const saveReport = async (isDraft) => {
    // Sprawdź czy użytkownik ma przypisany projekt
    if (!userProject) {
      setError("Nie możesz złożyć raportu bez przypisanego projektu. Przejdź do sekcji 'Brygada' aby przypisać projekt.");
      return;
    }

    // Sprawdź czy są wybrani pracownicy
    if (workEntries.length === 0) {
      setError("Nie wybrano żadnych pracowników do raportu. Wybierz pracowników, którzy pracowali w tym dniu.");
      return;
    }

    // Walidacja danych - tylko dla finalnego raportu
    if (!isDraft) {
      const invalidEntries = workEntries.filter(
        entry => entry.hoursWorked !== '' && (isNaN(parseFloat(entry.hoursWorked)) || parseFloat(entry.hoursWorked) < 0 || parseFloat(entry.hoursWorked) > 24)
      );

      if (invalidEntries.length > 0) {
        setError("Liczba godzin musi być wartością od 0 do 24 dla wszystkich pracowników.");
        return;
      }

      // Sprawdź czy wszystkie godziny są uzupełnione przy finalnym raporcie
      const emptyHoursEntries = workEntries.filter(entry => entry.hoursWorked === '');
      if (emptyHoursEntries.length > 0) {
        if (!window.confirm('Niektórzy pracownicy nie mają uzupełnionych godzin pracy. Czy na pewno chcesz zapisać raport jako finalny?')) {
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      // Przygotuj dane do wysłania
      const reportDataToSend = {
        date: reportDate,
        project: userProject.id,
        is_draft: isDraft, // Dodajemy flagę wersji roboczej
        entries: workEntries.map(entry => ({
          employee: entry.employeeId,
          hours_worked: entry.hoursWorked === '' ? 0 : parseFloat(entry.hoursWorked),
          notes: entry.notes
        }))
      };

      // Określ URL i metodę w zależności od tego, czy edytujemy istniejący raport
      let url = '/api/create-progress-report/';
      let method = 'POST';

      if (isEditingDraft && reportData && reportData.id) {
        url = `/api/progress-reports/${reportData.id}/`;
        method = 'PATCH';
      }

      // Wyślij dane do API
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(reportDataToSend),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(isDraft ? 'Nie udało się zapisać wersji roboczej' : 'Nie udało się zapisać raportu');
      }

      const savedReport = await response.json();
      setReportData(savedReport);
      setReportStatus(isDraft ? 'draft' : 'submitted');
      setIsEditingDraft(false);

      // Prześlij tymczasowe zdjęcia, jeśli istnieją
      if (savedReport && savedReport.id && tempImages.length > 0) {
        await uploadTempImagesToReport(savedReport.id);
      }

      // Pokaż odpowiednie powiadomienie
      showNotification(isDraft ? "Wersja robocza została zapisana" : "Raport został pomyślnie zapisany", "success");

      // Odśwież daty raportów
      fetchReportDates();

      // Załaduj zdjęcia dla nowego raportu
      if (savedReport && savedReport.id) {
        fetchReportImages(savedReport.id);
      }

    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err.message || (isDraft ? 'Wystąpił błąd podczas zapisywania wersji roboczej' : 'Wystąpił błąd podczas zapisywania raportu'));
    } finally {
      setSubmitting(false);
    }
  };

  // Oryginalna funkcja handleSubmit - modyfikujemy, aby wywołać saveReport
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    await submitFinalReport();
  };

  // Funkcja do wyświetlania powiadomień
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Funkcja do stylizacji dat w kalendarzu
  const getDateStyle = (date) => {
    const formattedDate = date instanceof Date
      ? date.toISOString().split('T')[0]
      : date;

    if (reportDates.submitted.includes(formattedDate)) {
      return 'bg-green-200';
    } else if (reportDates.draft.includes(formattedDate)) {
      return 'bg-orange-200';
    }
    return '';
  };

  // Czy formularz powinien być zablokowany
  const isFormDisabled = reportStatus === 'submitted' || (reportStatus === 'draft' && !isEditingDraft);

  // Helper function for work entries section title
  const getWorkEntriesSectionTitle = () => {
    if (workEntries.length === 0) {
      return "Brak wybranych pracowników";
    }
    return `Raportowane godziny pracy (${workEntries.length} ${
      workEntries.length === 1 ? 'pracownik' : workEntries.length < 5 ? 'pracownicy' : 'pracowników'
    })`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Progres Raport</h1>
        <div className="flex space-x-4 items-center">
          <div className="flex items-center mr-4">
            <div className="w-3 h-3 bg-orange-200 rounded-full mr-1"></div>
            <span className="text-sm text-gray-600">Wersja robocza</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-200 rounded-full mr-1"></div>
            <span className="text-sm text-gray-600">Raport finalny</span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
            Odśwież dane
          </button>
        </div>
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

      {/* Informacja o istniejącym raporcie */}
      {reportStatus && (
        <div className={`p-4 rounded-md mb-6 ${
          reportStatus === 'draft' ? 'bg-orange-50 border-l-4 border-orange-500' : 'bg-green-50 border-l-4 border-green-500'
        }`}>
          <div className="flex items-start">
            <Info className={`${reportStatus === 'draft' ? 'text-orange-500' : 'text-green-500'} mt-0.5 mr-2`} size={20} />
            <div>
              <p className={`${reportStatus === 'draft' ? 'text-orange-700' : 'text-green-700'} font-medium`}>
                {reportStatus === 'draft'
                  ? 'Dla tej daty istnieje wersja robocza raportu'
                  : 'Dla tej daty istnieje już finalny raport'}
              </p>
              <p className="text-sm mt-1">
                {reportStatus === 'draft'
                  ? 'Możesz kontynuować edycję wersji roboczej lub wybrać inną datę.'
                  : 'Zapisane raporty nie mogą być edytowane. Wybierz inną datę, aby utworzyć nowy raport.'}
              </p>

              {reportStatus === 'draft' && !isEditingDraft && (
                <button
                  onClick={handleEditDraft}
                  className="mt-2 flex items-center text-orange-600 hover:text-orange-700"
                >
                  <Edit size={16} className="mr-1" />
                  Edytuj wersję roboczą
                </button>
              )}
            </div>
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

            {/* Employee Selection Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium text-gray-700 flex items-center">
                  <Users className="mr-2" size={18} />
                  Wybierz pracowników
                </h3>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
                  disabled={isFormDisabled}
                >
                  {showEmployeeSelector ? 'Ukryj listę' : 'Pokaż listę'}
                  {showEmployeeSelector ? <X size={16} className="ml-1" /> : <UserPlus size={16} className="ml-1" />}
                </button>
              </div>

              {showEmployeeSelector && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {brigadeMembers.map(member => (
                      <div
                        key={member.employee}
                        className={`p-3 border rounded-lg flex items-center cursor-pointer ${
                          selectedEmployeeIds.includes(member.employee) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => !isFormDisabled && handleEmployeeSelection(member.employee)}
                      >
                        {selectedEmployeeIds.includes(member.employee) ?
                          <CheckSquare className="text-blue-500 mr-2" size={20} /> :
                          <Square className="text-gray-300 mr-2" size={20} />
                        }
                        <span>{member.employee_name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center"
                      onClick={addSelectedEmployeesToEntries}
                      disabled={isFormDisabled || selectedEmployeeIds.length === 0}
                    >
                      <UserPlus size={16} className="mr-2" />
                      Dodaj wybranych pracowników
                    </button>
                  </div>
                </div>
              )}

              {/* Work Entries Section */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                  <Clock className="mr-2" size={18} />
                  {getWorkEntriesSectionTitle()}
                </h3>

                <div className="bg-gray-50 p-4 rounded-lg">
                  {workEntries.length === 0 ? (
                    <div className="text-center py-8 bg-gray-100 rounded-lg">
                      <UserPlus className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-gray-500">Nie wybrano żadnych pracowników</p>
                      <button
                        type="button"
                        onClick={() => setShowEmployeeSelector(true)}
                        className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        disabled={isFormDisabled}
                      >
                        Wybierz pracowników
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {workEntries.map((entry) => (
                        <div key={entry.employeeId} className="grid grid-cols-1 md:grid-cols-10 gap-4 items-center bg-white p-4 rounded-lg border border-gray-200">
                          <div className="md:col-span-3">
                            <p className="font-medium">{entry.employeeName}</p>
                          </div>
                          <div className="md:col-span-3">
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
                                disabled={isFormDisabled}
                              />
                              <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            </div>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Notatki (opcjonalnie)
                            </label>
                            <input
                              type="text"
                              value={entry.notes}
                              onChange={(e) => handleNotesChange(entry.employeeId, e.target.value)}
                              className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Dodatkowe informacje"
                              disabled={isFormDisabled}
                            />
                          </div>
                          <div className="md:col-span-1 flex justify-end items-center">
                            {!isFormDisabled && (
                              <button
                                type="button"
                                onClick={() => handleRemoveEmployee(entry.employeeId)}
                                className="text-red-500 hover:text-red-700 p-2"
                                title="Usuń pracownika"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Przyciski do zapisywania - przeniesione na sam dół */}
            <div className="flex justify-end space-x-4">
              {reportStatus !== 'submitted' && (
                <>
                  <button
                    type="button"
                    onClick={saveAsDraft}
                    disabled={submitting || workEntries.length === 0 || isFormDisabled}
                    className="flex items-center px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FileText className="mr-2" size={18} />
                    )}
                    Zapisz roboczy
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || workEntries.length === 0 || isFormDisabled}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="mr-2" size={18} />
                    )}
                    Zapisz raport
                  </button>
                </>
              )}
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

              {/* Przycisk dodawania zdjęć - dostępny tylko gdy:
                  1. Raport nie istnieje LUB
                  2. Raport jest w trybie roboczym i w trybie edycji LUB
                  3. Raport jest w trybie roboczym, ale nie w trybie edycji (wtedy komunikat) */}
              {!reportData ? (
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
              ) : reportStatus === 'draft' && isEditingDraft ? (
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
              ) : reportStatus === 'draft' && !isEditingDraft ? (
                <div className="text-sm text-orange-600 flex items-center">
                  <Info size={16} className="mr-1" />
                  Edytuj wersję roboczą, aby dodać zdjęcia
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  Nie można dodawać zdjęć do zapisanego raportu
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={uploadingImage ||
                         reportStatus === 'submitted' ||
                         (reportStatus === 'draft' && !isEditingDraft)}
              />
            </div>

            {/* Pokaż informację o tymczasowych zdjęciach */}
            {!reportData && tempImages.length > 0 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-start">
                  <Info className="text-blue-500 mt-0.5 mr-2" size={18} />
                  <div>
                    <p className="text-blue-700 font-medium">Dodano tymczasowe zdjęcia do raportu</p>
                    <p className="text-sm mt-1">Zdjęcia zostaną trwale zapisane po utworzeniu raportu.</p>
                  </div>
                </div>
              </div>
            )}

            {images.length === 0 && tempImages.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
                <p>Brak zdjęć dla tego raportu</p>
                {reportStatus !== 'submitted' &&
                  (reportStatus !== 'draft' || isEditingDraft) && (
                  <p className="text-sm mt-2">Kliknij "Dodaj zdjęcie", aby dodać pierwsze zdjęcie</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {/* Wyświetl tymczasowe zdjęcia */}
                {tempImages.map(tempImage => (
                  <div
                    key={tempImage.id}
                    className="relative group rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => handleImageClick(tempImage)}
                  >
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                      Nowe
                    </div>
                    <img
                      src={tempImage.image_url}
                      alt={tempImage.name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/api/placeholder/400/320";
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => handleDeleteTempImage(tempImage.id, e)}
                        className="text-white bg-red-600 p-1 rounded-full hover:bg-red-700"
                        title="Usuń zdjęcie"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Wyświetl zapisane zdjęcia */}
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
                      {(reportStatus !== 'submitted' && (reportStatus !== 'draft' || isEditingDraft)) && (
                        <button
                          onClick={(e) => handleDeleteImage(image.id, e)}
                          className="text-white bg-red-600 p-1 rounded-full hover:bg-red-700"
                          title="Usuń zdjęcie"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
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