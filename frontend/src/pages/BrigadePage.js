// frontend/src/pages/BrigadePage.js
import React, { useState, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Users,
  Search,
  AlertCircle,
  UserPlus,
  UserX,
  User,
  RefreshCw,
  CheckCircle,
  Folder,
  Save
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';

// Komponent dla pojedynczego pracownika (używany w Drag & Drop)
const EmployeeCard = ({ employee, type, onRemove = null }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'employee',
    item: { employee },
    canDrag: type === 'available',
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }));

  const bgColor = type === 'brigade'
    ? 'bg-blue-50 border-blue-200'
    : 'bg-gray-50 border-gray-200';

  return (
    <div
      ref={type === 'available' ? drag : null}
      className={`flex justify-between items-center p-3 rounded-lg border ${bgColor} mb-2 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${type === 'available' ? 'cursor-grab' : ''}`}
    >
      <div className="flex items-center">
        <div className="bg-gray-200 p-2 rounded-full mr-3">
          <User size={20} className="text-gray-600" />
        </div>
        <div>
          <p className="font-medium text-gray-800">{employee.first_name} {employee.last_name}</p>
          {employee.pesel && <p className="text-xs text-gray-500">PESEL: {employee.pesel}</p>}
        </div>
      </div>

      {type === 'brigade' && onRemove && (
        <button
          onClick={() => onRemove(employee.id)}
          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
          title="Usuń z brygady"
        >
          <UserX size={18} />
        </button>
      )}
    </div>
  );
};

// Główny komponent zarządzania brygadą
const BrigadePage = () => {
  const [brigadeMembers, setBrigadeMembers] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [userProject, setUserProject] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [editingProject, setEditingProject] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [savingProject, setSavingProject] = useState(false);

  // Pobierz dane przy pierwszym renderowaniu
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all required data
  const fetchData = async () => {
      setLoading(true);
      try {
        // Pobierz listę wszystkich projektów
        const projectsResponse = await fetch('/api/projects/', {
          credentials: 'same-origin',
        });

        if (!projectsResponse.ok) {
          throw new Error('Nie udało się pobrać listy projektów');
        }

        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Spróbuj pobrać ustawienia
        let userSettingsData = null;
        try {
          const userSettingsResponse = await fetch('/api/user-settings/me/', {
            credentials: 'same-origin',
          });

          if (userSettingsResponse.ok) {
            userSettingsData = await userSettingsResponse.json();
            console.log("Pobrano istniejące ustawienia:", userSettingsData);
          } else {
            console.log("Nie znaleziono ustawień użytkownika");
          }
        } catch (settingsError) {
          console.error("Błąd przy pobieraniu ustawień:", settingsError);
        }

        // Jeśli nie udało się pobrać ustawień, spróbuj je utworzyć
        if (!userSettingsData) {
          try {
            console.log("Próba utworzenia nowych ustawień użytkownika");
            const createResponse = await fetch('/api/user-settings/me/', {
              method: 'GET',  // Zmiana na GET, który powinien utworzyć ustawienia jeśli nie istnieją
              credentials: 'same-origin',
            });

            if (createResponse.ok) {
              userSettingsData = await createResponse.json();
              console.log("Utworzono nowe ustawienia:", userSettingsData);
            } else {
              console.error("Nie udało się utworzyć ustawień:", createResponse.status);
            }
          } catch (createError) {
            console.error("Błąd przy tworzeniu ustawień:", createError);
          }
        }

        // Ustawienie danych projektu i ustawień użytkownika
        if (userSettingsData) {
          setUserSettings(userSettingsData);
          setUserProject(userSettingsData.project);
          setSelectedProjectId(userSettingsData.project ? userSettingsData.project.id : '');
        }

        // Pobierz członków brygady
        const brigadeResponse = await fetch('/api/brigade-members/', {
          credentials: 'same-origin',
        });

        if (!brigadeResponse.ok) {
          throw new Error('Nie udało się pobrać członków brygady');
        }

        const brigadeData = await brigadeResponse.json();
        setBrigadeMembers(brigadeData);

        // Pobierz dostępnych pracowników
        const employeesResponse = await fetch('/api/available-employees/', {
          credentials: 'same-origin',
        });

        if (!employeesResponse.ok) {
          throw new Error('Nie udało się pobrać dostępnych pracowników');
        }

        const employeesData = await employeesResponse.json();
        setAvailableEmployees(employeesData);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Wystąpił błąd podczas ładowania danych');
      } finally {
        setLoading(false);
      }
    };

    // Utworzenie ustawień użytkownika, jeśli nie istnieją
    const createUserSettings = async () => {
      try {
        console.log("Próba utworzenia ustawień użytkownika...");

        const response = await fetch('/api/user-settings/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify({}),
          credentials: 'same-origin',
        });

        // Debugowanie - sprawdzenie co zawiera odpowiedź
        const responseText = await response.text();
        console.log("Odpowiedź serwera:", responseText);

        if (!response.ok) {
          throw new Error(`Błąd serwera: ${response.status} - ${responseText}`);
        }

        // Próbuj sparsować JSON tylko jeśli odpowiedź jest poprawna
        let userSettingsData;
        try {
          userSettingsData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Błąd parsowania JSON:", jsonError);
          throw new Error("Otrzymano nieprawidłową odpowiedź JSON od serwera");
        }

        setUserSettings(userSettingsData);
        setUserProject(userSettingsData.project);
        setSelectedProjectId(userSettingsData.project ? userSettingsData.project.id : '');
      } catch (err) {
        console.error('Error creating user settings:', err);
        setError(`Nie udało się utworzyć ustawień użytkownika: ${err.message}`);
      }
    };

  // Aktualizacja projektu użytkownika
  const updateUserProject = async () => {
    if (!userSettings) return;

    try {
      setSavingProject(true);

      const response = await fetch(`/api/user-settings/${userSettings.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          project: selectedProjectId || null
        }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się zaktualizować projektu');
      }

      const updatedSettings = await response.json();
      setUserSettings(updatedSettings);
      setUserProject(updatedSettings.project);
      setEditingProject(false);

      // Jeśli zmieniono projekt i są już pracownicy w brygadzie,
      // zaktualizuj projekt dla wszystkich członków brygady
      if (brigadeMembers.length > 0 && updatedSettings.project) {
        try {
          const updateBrigadeMembersResponse = await fetch('/api/brigade-members/update-project/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify({
              project: updatedSettings.project.id
            }),
            credentials: 'same-origin',
          });

          if (!updateBrigadeMembersResponse.ok) {
            console.warn('Nie udało się zaktualizować projektu dla wszystkich członków brygady');
          }
        } catch (error) {
          console.error('Error updating brigade members projects:', error);
        }
      }

      // Pokaż powiadomienie o sukcesie
      showNotification('Projekt został zaktualizowany', 'success');

      // Odśwież dane brygady, aby zastosować zmiany projektu
      fetchData();
    } catch (err) {
      console.error('Error updating user project:', err);
      showNotification('Nie udało się zaktualizować projektu: ' + err.message, 'error');
    } finally {
      setSavingProject(false);
    }
  };

  // Dodawanie pracownika do brygady
  const addToBrigade = async (employee) => {
    try {
      // Dodaj pracownika do brygady
      const response = await fetch('/api/brigade-members/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          employee: employee.id
        }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się dodać pracownika do brygady');
      }

      const newMember = await response.json();

      // Jeśli brygada ma przypisany projekt, przypisz ten projekt do pracownika
      if (userProject) {
        const projectAssignResponse = await fetch(`/api/employees/${employee.id}/assign-project/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify({
            project: userProject.id
          }),
          credentials: 'same-origin',
        });

        if (!projectAssignResponse.ok) {
          console.warn('Nie udało się przypisać projektu do pracownika, ale został dodany do brygady');
        }
      }

      // Odśwież dane
      setBrigadeMembers([...brigadeMembers, newMember]);
      setAvailableEmployees(availableEmployees.filter(e => e.id !== employee.id));

      // Pokaż powiadomienie o sukcesie
      showNotification('Pracownik dodany do brygady', 'success');
    } catch (err) {
      console.error('Error adding employee to brigade:', err);
      showNotification('Nie udało się dodać pracownika: ' + err.message, 'error');
    }
  };

  // Usuwanie pracownika z brygady
  const removeFromBrigade = async (memberId) => {
    try {
      // Najpierw znajdź obiekt członka brygady
      const member = brigadeMembers.find(m => m.employee === memberId);

      if (!member) {
        throw new Error('Nie znaleziono członka brygady');
      }

      const response = await fetch(`/api/brigade-members/${member.id}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken(),
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć pracownika z brygady');
      }

      // Wyczyść przypisanie projektu dla pracownika
      try {
        const projectClearResponse = await fetch(`/api/employees/${memberId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify({
            current_project: null
          }),
          credentials: 'same-origin',
        });

        if (!projectClearResponse.ok) {
          console.warn('Nie udało się wyczyścić projektu pracownika po usunięciu z brygady');
        }
      } catch (clearError) {
        console.error('Error clearing employee project:', clearError);
      }

      // Zaktualizuj stan
      const removedEmployee = availableEmployees.find(e => e.id === memberId) ||
                             brigadeMembers.find(m => m.employee === memberId)?.employee_data;

      setBrigadeMembers(brigadeMembers.filter(m => m.employee !== memberId));

      if (removedEmployee) {
        setAvailableEmployees([...availableEmployees, removedEmployee]);
      }

      // Pokaż powiadomienie o sukcesie
      showNotification('Pracownik usunięty z brygady', 'success');
    } catch (err) {
      console.error('Error removing employee from brigade:', err);
      showNotification('Nie udało się usunąć pracownika: ' + err.message, 'error');
    }
  };

  // Funkcja do wyświetlania powiadomień
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtrowanie pracowników na podstawie wyszukiwania
  const filteredEmployees = availableEmployees.filter(employee => {
    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           (employee.pesel && employee.pesel.includes(searchTerm));
  });

  // Komponent do upuszczania pracowników (Droppable)
  const BrigadeDropZone = () => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'employee',
      drop: (item) => addToBrigade(item.employee),
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));

    return (
      <div
        ref={drop}
        className={`border-2 rounded-lg p-4 h-full min-h-[400px] ${
          isOver ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'
        }`}
      >
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Users className="mr-2" size={20} />
          Twoja brygada
        </h3>

        {brigadeMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Users size={48} className="mb-2 text-gray-400" />
            <p className="text-center">Twoja brygada jest pusta</p>
            <p className="text-center text-sm mt-2">
              Przeciągnij i upuść pracowników z listy po prawej stronie
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {brigadeMembers.map((member) => (
              <EmployeeCard
                key={member.id}
                employee={member.employee_data || {
                  id: member.employee,
                  first_name: member.employee_name.split(' ')[0],
                  last_name: member.employee_name.split(' ')[1] || '',
                }}
                type="brigade"
                onRemove={removeFromBrigade}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Zarządzanie brygadą</h1>
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
            Odśwież
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
              {notification.type === 'success' ? <CheckCircle className="mr-2" size={20} /> :
               notification.type === 'error' ? <AlertCircle className="mr-2" size={20} /> :
               <AlertCircle className="mr-2" size={20} />}
              <p>{notification.message}</p>
            </div>
          </div>
        )}

        {/* Informacja o przypisanym projekcie */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-medium text-gray-700">Twój projekt</h2>
            {!editingProject ? (
              <button
                onClick={() => setEditingProject(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Zmień projekt
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingProject(false);
                  setSelectedProjectId(userProject?.id || '');
                }}
                className="text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Anuluj
              </button>
            )}
          </div>

          {!editingProject ? (
            userProject ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Folder className="text-green-600 mr-2" size={18} />
                  <p className="font-medium text-green-700">{userProject.name || userProject.project_name}</p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Pracownicy w twojej brygadzie będą automatycznie przypisani do tego projektu
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="font-medium text-yellow-700">Nie masz przypisanego projektu</p>
                <p className="text-sm text-gray-600">
                  Kliknij "Zmień projekt", aby przypisać sobie projekt
                </p>
              </div>
            )
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="mb-3">
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Wybierz projekt:
                </label>
                <select
                  id="project-select"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">-- Brak projektu --</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={updateUserProject}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={savingProject}
                >
                  {savingProject ? (
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="mr-2" size={16} />
                  )}
                  Zapisz projekt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Główny panel zarządzania brygadą */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel brygady */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <BrigadeDropZone />
          </div>

          {/* Panel dostępnych pracowników */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <UserPlus className="mr-2" size={20} />
              Dostępni pracownicy
            </h3>

            {/* Wyszukiwarka pracowników */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Szukaj pracowników..."
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="mr-2" size={20} />
                  <p>{error}</p>
                </div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                {availableEmployees.length === 0 ? (
                  <>
                    <User size={48} className="mb-2 text-gray-400" />
                    <p className="text-center">Brak dostępnych pracowników</p>
                    <p className="text-center text-sm mt-2">
                      Wszyscy pracownicy są już przypisani do brygad
                    </p>
                  </>
                ) : (
                  <>
                    <Search size={48} className="mb-2 text-gray-400" />
                    <p className="text-center">Nie znaleziono pracowników</p>
                    <p className="text-center text-sm mt-2">
                      Spróbuj zmienić kryteria wyszukiwania
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {filteredEmployees.map((employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    type="available"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default BrigadePage;