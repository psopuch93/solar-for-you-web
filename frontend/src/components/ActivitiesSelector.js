// frontend/src/components/ActivitiesSelector.js
import React, { useState, useEffect, useCallback } from 'react';
import { Clipboard, ArrowDown, Plus, Trash2, Save, AlertTriangle, HelpCircle, Check, CheckSquare as ListChecks } from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';

// Komponent do wyboru aktywności w raportach postępu
const ActivitiesSelector = ({
  projectId,
  reportId,
  isDisabled = false,
  onActivitiesChange,
  existingActivities = [],
  onSaveComplete  // Callback po zapisaniu aktywności
}) => {
  const [activities, setActivities] = useState([]);
  const [activityConfig, setActivityConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMainActivity, setSelectedMainActivity] = useState('');
  const [selectedSubActivity, setSelectedSubActivity] = useState('');
  const [selectedZona, setSelectedZona] = useState('');
  const [selectedRow, setSelectedRow] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [quantity, setQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState(null);
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  // Określa czy pokazujemy formularz dodawania czy listę aktywności
  const [showAddForm, setShowAddForm] = useState(false);
  // Stan do śledzenia procesu zapisu
  const [saving, setSaving] = useState(false);
  // Dodajemy nowy stan dla śledzenia inicjalizacji
  const [isInitialized, setIsInitialized] = useState(false);

  // Poprawa: Używamy useCallback dla aktualizacji stanów, by uniknąć niepotrzebnych re-renderów
  const updateActivities = useCallback((newActivities) => {
    setActivities(newActivities);
    if (onActivitiesChange) {
      onActivitiesChange(newActivities);
    }
  }, [onActivitiesChange]);

  // Poprawa: Inicjalizacja aktywności z existingActivities tylko raz przy montowaniu lub zmianie reportId
  useEffect(() => {
    // Tylko jeśli nie jest jeszcze zainicjalizowane lub zmienił się reportId
    if (!isInitialized || existingActivities.length > 0) {
      console.log("Inicjalizacja aktywności:", existingActivities);
      updateActivities(existingActivities);
      setIsInitialized(true);
    }
  }, [existingActivities, isInitialized, reportId, updateActivities]);

  // Pobranie konfiguracji aktywności dla projektu
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }

    const fetchActivityConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/project-activities-config/?project_id=${projectId}`, {
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Nie udało się pobrać konfiguracji aktywności');
        }

        const data = await response.json();
        if (data.config_data) {
          setActivityConfig(data.config_data);
        } else {
          setError('Brak konfiguracji aktywności dla tego projektu');
        }
      } catch (err) {
        console.error('Błąd pobierania konfiguracji aktywności:', err);
        setError('Wystąpił błąd podczas ładowania konfiguracji aktywności');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityConfig();
  }, [projectId]);

  // Po zmianie głównej aktywności, zresetuj pozostałe pola
  useEffect(() => {
    setSelectedSubActivity('');
    setSelectedZona('');
    setSelectedRow('');
    setSelectedTable('');
    setQuantity('');
    setMaxQuantity(null);
    setUnit('');
  }, [selectedMainActivity]);

  // Po zmianie podaktywności, zresetuj pozostałe pola
  useEffect(() => {
    setSelectedZona('');
    setSelectedRow('');
    setSelectedTable('');
    setQuantity('');
    setMaxQuantity(null);
    setUnit('');
  }, [selectedSubActivity]);

  // Po zmianie zony, zresetuj rząd i ilość
  useEffect(() => {
    setSelectedRow('');
    setSelectedTable('');
    setQuantity('');
    setMaxQuantity(null);
  }, [selectedZona]);

  // Po zmianie rzędu, zresetuj ilość i ustaw jednostkę
  useEffect(() => {
    setSelectedTable('');
    setQuantity('');

    // Znajdź jednostkę dla wybranej aktywności
    if (activityConfig && selectedMainActivity && selectedSubActivity) {
      if (selectedMainActivity === 'Logistyka') {
        if (selectedSubActivity === 'Transport słupów') {
          setUnit('sztuki');
        } else if (selectedSubActivity === 'Transport modułów') {
          setUnit('palety');
        } else if (selectedSubActivity === 'Transport kabli') {
          setUnit('metry');
        } else if (selectedSubActivity.includes('Transport konstrukcji')) {
          setUnit('sztuki');
        }
      } else if (selectedMainActivity === 'Konstrukcja') {
        setUnit('sztuki');
      } else if (selectedMainActivity === 'Moduły') {
        setUnit('sztuki');
      } else if (selectedMainActivity === 'Zakończenie budowy') {
        setUnit('');
      }
    }

    // Znajdź maksymalną ilość dla wybranego rzędu
    if (activityConfig && selectedMainActivity && selectedSubActivity && selectedZona && selectedRow) {
      // Znajdź odpowiednią sekcję konfiguracji
      let configItems = [];

      if (selectedMainActivity === 'Logistyka' && activityConfig.logistyka) {
        configItems = activityConfig.logistyka;
      } else if (selectedMainActivity === 'Konstrukcja' && activityConfig.konstrukcja) {
        // Połącz wszystkie typy konstrukcji
        Object.values(activityConfig.konstrukcja).forEach(items => {
          if (Array.isArray(items)) {
            configItems = [...configItems, ...items];
          }
        });
      } else if (selectedMainActivity === 'Moduły' && activityConfig.moduly) {
        configItems = activityConfig.moduly;
      }

      // Znajdź konkretny wiersz dla zony i rzędu
      const rowData = configItems.find(item =>
        item.zona === selectedZona && item.rzad === selectedRow
      );

      if (rowData) {
        if (selectedMainActivity === 'Logistyka') {
          if (selectedSubActivity === 'Transport słupów') {
            setMaxQuantity(rowData.ilość);
          } else if (selectedSubActivity === 'Transport modułów') {
            setMaxQuantity(rowData.ilość_palet);
          } else if (selectedSubActivity === 'Transport kabli') {
            // Brak limitu dla kabli
            setMaxQuantity(null);
          } else if (selectedSubActivity.includes('Transport konstrukcji')) {
            if (selectedSubActivity.includes('Przedłużki') && rowData.przedłużki !== undefined) {
              setMaxQuantity(rowData.przedłużki);
            } else if (selectedSubActivity.includes('Belki główne') && rowData.belki_główne !== undefined) {
              setMaxQuantity(rowData.belki_główne);
            } else if (selectedSubActivity.includes('Stężenia ukośne') && rowData.stężenia_ukośne !== undefined) {
              setMaxQuantity(rowData.stężenia_ukośne);
            } else if (selectedSubActivity.includes('Płatwie') && rowData.płatwie !== undefined) {
              setMaxQuantity(rowData.płatwie);
            } else {
              setMaxQuantity(null);
            }
          }
        } else if (selectedMainActivity === 'Konstrukcja') {
          // Dla podaktywności związanych ze strukturą
          if (selectedSubActivity.includes('Struktura')) {
            if (selectedSubActivity.includes('Przedłużki') && rowData.przedłużki !== undefined) {
              setMaxQuantity(rowData.przedłużki);
            } else if (selectedSubActivity.includes('Belki główne') && rowData.belki_główne !== undefined) {
              setMaxQuantity(rowData.belki_główne);
            } else if (selectedSubActivity.includes('Stężenia ukośne') && rowData.stężenia_ukośne !== undefined) {
              setMaxQuantity(rowData.stężenia_ukośne);
            } else if (selectedSubActivity.includes('Płatwie') && rowData.płatwie !== undefined) {
              setMaxQuantity(rowData.płatwie);
            } else {
              setMaxQuantity(rowData.ilość);
            }
          } else {
            // Dla innych podaktywności konstrukcji
            setMaxQuantity(rowData.ilość);
          }
        } else if (selectedMainActivity === 'Moduły') {
          // Dla modułów ustawimy maxQuantity po wybraniu numeru stołu
          setMaxQuantity(null);
        }
      } else {
        setMaxQuantity(null);
      }
    } else {
      setMaxQuantity(null);
    }
  }, [selectedZona, selectedRow, activityConfig, selectedMainActivity, selectedSubActivity]);

  // Obsługa zmiany numeru stołu dla modułów
  useEffect(() => {
    // Dodaj kod do ustawienia maxQuantity dla stołów, jeśli selectedTable istnieje
    if (selectedMainActivity === 'Moduły' && selectedTable && activityConfig?.moduly) {
      const rowData = activityConfig.moduly.find(item =>
        (item.zona === parseInt(selectedZona) || item.zona === selectedZona) &&
        (item.rzad === parseInt(selectedRow) || item.rzad === selectedRow)
      );

      if (rowData && rowData.stoly) {
        const tableData = rowData.stoly.find(stol =>
          stol.numer === parseInt(selectedTable) || stol.numer === selectedTable
        );

        if (tableData && tableData.ilosc_modulow !== undefined) {
          setMaxQuantity(tableData.ilosc_modulow);
          return; // Wyjdź z useEffect, bo znaleźliśmy właściwe dane
        }
      }
    }
  }, [selectedTable, selectedMainActivity, selectedZona, selectedRow, activityConfig]);

  // Funkcja sprawdzająca czy wprowadzona ilość jest prawidłowa
  const isQuantityValid = () => {
    if (!quantity) return true;
    const numQuantity = parseInt(quantity);
    return maxQuantity === null || numQuantity <= maxQuantity;
  };

  // Dodaj nową aktywność
  const handleAddActivity = () => {
    // Walidacja danych
    if (!selectedMainActivity) {
      setError('Wybierz główną aktywność');
      return;
    }

    if (!selectedSubActivity) {
      setError('Wybierz podaktywność');
      return;
    }

    if (!selectedZona) {
      setError('Wybierz zonę');
      return;
    }

    if (!selectedRow) {
      setError('Wybierz rząd');
      return;
    }

    // Dodaj walidację numeru stołu dla modułów
    if (selectedMainActivity === 'Moduły' && !selectedTable) {
      setError('Wybierz numer stołu');
      return;
    }

    // Dla zakończenia budowy nie wymagamy ilości
    if (selectedMainActivity !== 'Zakończenie budowy' && !quantity) {
      setError('Podaj ilość');
      return;
    }

    // Sprawdź, czy ilość nie przekracza maksymalnej
    if (maxQuantity !== null && parseInt(quantity) > maxQuantity) {
      setError(`Maksymalna ilość dla tej aktywności to ${maxQuantity}`);
      return;
    }

    // Dodaj nową aktywność
    const newActivity = {
      id: `activity_${Date.now()}`,
      activity_type: selectedMainActivity,
      sub_activity: selectedSubActivity,
      zona: selectedZona,
      row: selectedRow,
      table: selectedMainActivity === 'Moduły' ? selectedTable : undefined,
      quantity: selectedMainActivity === 'Zakończenie budowy' ? 0 : parseInt(quantity),
      unit: unit,
      notes: notes
    };

    // POPRAWA: Użyj funkcji callback do aktualizacji stanu, aby mieć gwarancję aktualnych danych
    const updatedActivities = [...activities, newActivity];
    updateActivities(updatedActivities);
    setError(null);

    // Zresetuj formularz
    setSelectedMainActivity('');
    setSelectedSubActivity('');
    setSelectedZona('');
    setSelectedRow('');
    setSelectedTable('');
    setQuantity('');
    setNotes('');

    // Ukryj formularz dodawania po dodaniu aktywności
    setShowAddForm(false);
  };

  // Usuń aktywność
  const handleRemoveActivity = (activityId) => {
    const updatedActivities = activities.filter(activity => activity.id !== activityId);
    updateActivities(updatedActivities);
  };

  // Zapisz aktywności do raportu
  const saveActivitiesToReport = async () => {
    if (!reportId || activities.length === 0) return;

    try {
      setSaving(true);
      setError(null);

      console.log('Zapisuję aktywności:', activities);
      console.log('Do raportu o ID:', reportId);

      const response = await fetch('/api/add-activities-to-report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          report_id: reportId,
          activities: activities.map(activity => ({
            activity_type: activity.activity_type,
            sub_activity: activity.sub_activity,
            zona: activity.zona,
            row: activity.row,
            table: activity.table,
            quantity: activity.quantity,
            unit: activity.unit,
            notes: activity.notes
          }))
        }),
      });

      const data = await response.json();
      console.log('Odpowiedź z serwera:', data);

      if (!response.ok) {
        throw new Error(data.detail || 'Nie udało się zapisać aktywności');
      }

      // Sukces - uruchom callback odświeżania jeśli został przekazany
      if (typeof onSaveComplete === 'function') {
        console.log('Wywołuję callback onSaveComplete z reportId:', reportId);
        onSaveComplete(reportId);
      } else {
        console.log('Brak callbacku onSaveComplete, zmieniam tylko lokalny stan');
      }

      // Pokaż komunikat o sukcesie
      alert('Aktywności zostały zapisane pomyślnie');
    } catch (err) {
      console.error('Błąd zapisywania aktywności:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania aktywności');
    } finally {
      setSaving(false);
    }
  };

  // Renderowanie opcji dla głównych aktywności
  const renderMainActivityOptions = () => {
    if (!activityConfig) return null;

    const mainActivities = [];

    if (activityConfig.logistyka && activityConfig.logistyka.length > 0) {
      mainActivities.push('Logistyka');
    }

    if (activityConfig.konstrukcja && Object.keys(activityConfig.konstrukcja).length > 0) {
      mainActivities.push('Konstrukcja');
    }

    if (activityConfig.moduly && activityConfig.moduly.length > 0) {
      mainActivities.push('Moduły');
    }

    // Zawsze dodaj "Zakończenie budowy", nawet jeśli nie ma w konfiguracji
    mainActivities.push('Zakończenie budowy');

    return (
      <select
        value={selectedMainActivity}
        onChange={(e) => setSelectedMainActivity(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        disabled={isDisabled}
      >
        <option value="">Wybierz aktywność</option>
        {mainActivities.map(activity => (
          <option key={activity} value={activity}>{activity}</option>
        ))}
      </select>
    );
  };

  // Renderowanie opcji dla podaktywności
  const renderSubActivityOptions = () => {
    if (!activityConfig || !selectedMainActivity) return null;

    let subActivities = [];

    if (selectedMainActivity === 'Logistyka') {
      subActivities = [
        'Transport słupów',
        'Transport modułów',
        'Transport kabli',
        'Transport konstrukcji - Przedłużki',
        'Transport konstrukcji - Belki główne',
        'Transport konstrukcji - Stężenia ukośne',
        'Transport konstrukcji - Płatwie'
      ];
    } else if (selectedMainActivity === 'Konstrukcja') {
      if (activityConfig.konstrukcja) {
        const constructionType = Object.keys(activityConfig.konstrukcja)[0];

        if (constructionType === 'betonowana') {
          subActivities = [
            'Tyczenie punktów',
            'Wiercenie',
            'Pozycjonowanie słupów - koromysła',
            'Betonowanie otworów z nogami'
          ];
        } else if (constructionType === 'betonowana_z_wbijaniem_slupow') {
          subActivities = [
            'Tyczenie punktów zabicia słupów',
            'Wiercenie',
            'Betonowanie otworów',
            'Wbijanie słupów w beton'
          ];
        } else if (constructionType === 'massivy') {
          subActivities = [
            'Tyczenie punktów',
            'Zalewanie szalunków',
            'Wiercenie dziur pod kotwy',
            'Zalania massivu'
          ];
        } else if (constructionType === 'wbijana') {
          subActivities = [
            'Tyczenie punktów',
            'Wbijanie nóg',
            'Uszkodzony słup',
            'Wiercenie',
            'Wylewanie betonowego bloku'
          ];
        } else if (constructionType === 'wbijana_z_wierceniem') {
          subActivities = [
            'Tyczenie punktów',
            'Przedwiercenie',
            'Wbijanie nóg'
          ];
        } else if (constructionType === 'wkrecana') {
          subActivities = [
            'Tyczenie punktów',
            'Przedwiercenie',
            'Wkręcanie nóg'
          ];
        } else if (constructionType === 'kruszywo_i_wbijanie') {
          subActivities = [
            'Tyczenie punktów',
            'Wiercenie',
            'Wypełnienie otworów kruszywem',
            'Wbicie słupów'
          ];
        }

        // Dodaj także aktywności dla struktury
        subActivities = [
          ...subActivities,
          'Struktura - Przedłużki',
          'Struktura - Belki główne',
          'Struktura - Stężenia ukośne',
          'Struktura - Płatwie'
        ];
      }
    } else if (selectedMainActivity === 'Moduły') {
      subActivities = ['Montaż modułów'];
    } else if (selectedMainActivity === 'Zakończenie budowy') {
      subActivities = [
        'Kontrola jakości',
        'Markerowanie',
        'Sprzątanie'
      ];
    }

    return (
      <select
        value={selectedSubActivity}
        onChange={(e) => setSelectedSubActivity(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        disabled={isDisabled || !selectedMainActivity}
      >
        <option value="">Wybierz podaktywność</option>
        {subActivities.map(activity => (
          <option key={activity} value={activity}>{activity}</option>
        ))}
      </select>
    );
  };

  const renderZonaOptions = () => {
    if (!activityConfig || !selectedMainActivity || !selectedSubActivity) return null;

    let zonas = [];

    // Funkcja pomocnicza do zbierania unikalnych zon z sekcji
    const collectZonasFromSection = (section) => {
      if (!Array.isArray(section)) return [];
      const zonaSet = new Set();
      section.forEach(item => {
        if (item.zona) zonaSet.add(item.zona);
      });
      return Array.from(zonaSet);
    };

    // Pobierz odpowiednią sekcję z konfiguracji
    if (selectedMainActivity === 'Logistyka') {
      // Dla transportu może być potrzebne dodatkowe filtrowanie
      if (selectedSubActivity.includes('Transport konstrukcji')) {
        // Filtrowanie zon dla transportu elementów konstrukcji
        const specificKey = selectedSubActivity.includes('Przedłużki') ? 'przedłużki' :
                          selectedSubActivity.includes('Belki główne') ? 'belki_główne' :
                          selectedSubActivity.includes('Stężenia ukośne') ? 'stężenia_ukośne' :
                          selectedSubActivity.includes('Płatwie') ? 'płatwie' : null;

        if (specificKey && Array.isArray(activityConfig.logistyka)) {
          const filteredSection = activityConfig.logistyka.filter(item => item[specificKey] !== undefined);
          zonas = collectZonasFromSection(filteredSection);
        } else {
          zonas = collectZonasFromSection(activityConfig.logistyka);
        }
      }
      // Dla transportu słupów i modułów
      else if (selectedSubActivity === 'Transport słupów') {
        const filteredSection = Array.isArray(activityConfig.logistyka) ?
          activityConfig.logistyka.filter(item => item.ilość !== undefined) : [];
        zonas = collectZonasFromSection(filteredSection);
      }
      else if (selectedSubActivity === 'Transport modułów') {
        const filteredSection = Array.isArray(activityConfig.logistyka) ?
          activityConfig.logistyka.filter(item => item.ilość_palet !== undefined) : [];
        zonas = collectZonasFromSection(filteredSection);
      }
      // Dla pozostałych podaktywności logistyki
      else {
        zonas = collectZonasFromSection(activityConfig.logistyka);
      }
    }
    // Dla konstrukcji
    else if (selectedMainActivity === 'Konstrukcja') {
      // Znajdź wszystkie zony dla wszystkich typów konstrukcji
      const zonaSet = new Set();

      if (activityConfig.konstrukcja) {
        Object.keys(activityConfig.konstrukcja).forEach(type => {
          const sectionData = activityConfig.konstrukcja[type];

          // Jeśli podaktywność związana ze strukturą, możemy filtrować
          if (selectedSubActivity.includes('Struktura')) {
            const specificKey = selectedSubActivity.includes('Przedłużki') ? 'przedłużki' :
                              selectedSubActivity.includes('Belki główne') ? 'belki_główne' :
                              selectedSubActivity.includes('Stężenia ukośne') ? 'stężenia_ukośne' :
                              selectedSubActivity.includes('Płatwie') ? 'płatwie' : null;

            if (specificKey && Array.isArray(sectionData)) {
              const filteredItems = sectionData.filter(item => item[specificKey] !== undefined);
              filteredItems.forEach(item => {
                if (item.zona) zonaSet.add(item.zona);
              });
            } else if (Array.isArray(sectionData)) {
              sectionData.forEach(item => {
                if (item.zona) zonaSet.add(item.zona);
              });
            }
          }
          // Dla innych podaktywności konstrukcji
          else if (Array.isArray(sectionData)) {
            sectionData.forEach(item => {
              if (item.zona) zonaSet.add(item.zona);
            });
          }
        });
      }

      zonas = Array.from(zonaSet);
    }
    // Dla modułów
    else if (selectedMainActivity === 'Moduły') {
      zonas = collectZonasFromSection(activityConfig.moduly);
    }
    // Dla zakończenia budowy - zbierz zony ze wszystkich sekcji
    else if (selectedMainActivity === 'Zakończenie budowy') {
      const zonaSet = new Set();

      if (activityConfig.logistyka && Array.isArray(activityConfig.logistyka)) {
        activityConfig.logistyka.forEach(item => {
          if (item.zona) zonaSet.add(item.zona);
        });
      }

      if (activityConfig.konstrukcja) {
        Object.values(activityConfig.konstrukcja).forEach(items => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.zona) zonaSet.add(item.zona);
            });
          }
        });
      }

      if (activityConfig.moduly && Array.isArray(activityConfig.moduly)) {
        activityConfig.moduly.forEach(item => {
          if (item.zona) zonaSet.add(item.zona);
        });
      }

      zonas = Array.from(zonaSet);
    }

    // Jeśli nie znaleziono żadnych zon, spróbuj pobrać je ze wszystkich sekcji
    if (zonas.length === 0) {
      const zonaSet = new Set();

      if (activityConfig.logistyka && Array.isArray(activityConfig.logistyka)) {
        activityConfig.logistyka.forEach(item => {
          if (item.zona) zonaSet.add(item.zona);
        });
      }

      if (activityConfig.konstrukcja) {
        Object.values(activityConfig.konstrukcja).forEach(items => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.zona) zonaSet.add(item.zona);
            });
          }
        });
      }

      if (activityConfig.moduly && Array.isArray(activityConfig.moduly)) {
        activityConfig.moduly.forEach(item => {
          if (item.zona) zonaSet.add(item.zona);
        });
      }

      zonas = Array.from(zonaSet);
    }

    // Sortowanie zon
    zonas.sort();

    return (
      <select
        value={selectedZona}
        onChange={(e) => setSelectedZona(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        disabled={isDisabled || !selectedSubActivity}
      >
        <option value="">Wybierz zonę</option>
        {zonas.map(zona => (
          <option key={zona} value={zona}>{zona}</option>
        ))}
      </select>
    );
  };

  // Renderowanie opcji dla rzędów
  const renderRowOptions = () => {
    if (!activityConfig || !selectedMainActivity || !selectedSubActivity || !selectedZona) return null;

    // Zbieramy wszystkie rzędy dla wybranej zony i podaktywności
    const rowSet = new Set();

    // Znajdź i przetwórz dane dla wybranej kombinacji
    if (selectedMainActivity === 'Logistyka') {
      const logistykaData = activityConfig.logistyka;

      if (Array.isArray(logistykaData)) {
        // Filtruj elementy dla wybranej zony
        logistykaData.forEach(item => {
          // Sprawdź, czy item zawiera zonę i czy jest to nasza wybrana zona
          if (item.zona === parseInt(selectedZona) || item.zona === selectedZona) {
            // Element ma zonę, sprawdź czy ma rzad
            if (item.rzad !== undefined) {
              // Dodaj rzad do zbioru
              rowSet.add(item.rzad.toString());
            }
          }
        });
      }
    } else if (selectedMainActivity === 'Konstrukcja') {
      // Podobna logika dla konstrukcji
      } else if (selectedMainActivity === 'Konstrukcja') {
      // Podobna logika dla konstrukcji
      if (activityConfig.konstrukcja) {
        Object.values(activityConfig.konstrukcja).forEach(items => {
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.zona === parseInt(selectedZona) || item.zona === selectedZona) {
                if (item.rzad !== undefined) {
                  rowSet.add(item.rzad.toString());
                }
              }
            });
          }
        });
      }
    } else if (selectedMainActivity === 'Moduły') {
      // Podobna logika dla modułów
      if (Array.isArray(activityConfig.moduly)) {
        activityConfig.moduly.forEach(item => {
          if (item.zona === parseInt(selectedZona) || item.zona === selectedZona) {
            if (item.rzad !== undefined) {
              rowSet.add(item.rzad.toString());
            }
          }
        });
      }
    }

    // Konwertuj Set na tablicę i sortuj
    let rows = Array.from(rowSet);

    // Sortowanie rzędów
    rows.sort((a, b) => {
      // Spróbuj przekonwertować na liczby, jeśli możliwe
      const numA = parseInt(a);
      const numB = parseInt(b);

      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      // Jeśli nie da się przekonwertować, sortuj alfabetycznie
      return a.localeCompare(b);
    });

    return (
      <select
        value={selectedRow}
        onChange={(e) => setSelectedRow(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        disabled={isDisabled || !selectedZona}
      >
        <option value="">Wybierz rząd</option>
        {rows.map(row => (
          <option key={row} value={row}>{row}</option>
        ))}
      </select>
    );
  };

  // Renderowanie opcji dla numerów stołów
  const renderTableOptions = () => {
    if (!activityConfig || !selectedMainActivity || !selectedSubActivity ||
        !selectedZona || !selectedRow || selectedMainActivity !== 'Moduły') {
      return null;
    }

    // Pobierz dane dla wybranej zony i rzędu
    let tableNumbers = [];
    if (Array.isArray(activityConfig.moduly)) {
      // Znajdź odpowiedni rząd i zonę
      const rowData = activityConfig.moduly.find(item =>
        (item.zona === parseInt(selectedZona) || item.zona === selectedZona) &&
        (item.rzad === parseInt(selectedRow) || item.rzad === selectedRow)
      );

      if (rowData && rowData.stoly && Array.isArray(rowData.stoly)) {
        // Pobierz numery stołów
        tableNumbers = rowData.stoly.map(stol => stol.numer);
      }
    }

    return (
      <select
        value={selectedTable}
        onChange={(e) => setSelectedTable(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        disabled={isDisabled || tableNumbers.length === 0}
      >
        <option value="">Wybierz numer stołu</option>
        {tableNumbers.map(number => (
          <option key={number} value={number}>{number}</option>
        ))}
      </select>
    );
  };

  // Renderowanie komponentu
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Clipboard className="mr-2" size={20} />
          Aktywności
        </h3>
        <div className="flex space-x-2">
          {!isDisabled && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className={`text-blue-500 hover:text-blue-700 flex items-center ${showAddForm ? 'bg-blue-50 p-1 rounded' : ''}`}
            >
              {showAddForm ? <Trash2 size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
              {showAddForm ? "Anuluj dodawanie" : "Dodaj aktywność"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-500 hover:text-blue-700"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="bg-blue-50 p-4 mb-4 rounded-md">
          <p className="text-sm text-blue-800">
            W tej sekcji możesz wybrać aktywności wykonane w ramach raportu.
            Najpierw wybierz główną aktywność, następnie podaktywność, zonę i rząd.
            Podaj ilość wykonanych prac (o ile dotyczy) i dodaj aktywność do listy.
            Możesz dodać wiele aktywności do jednego raportu.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 mb-4 rounded-md flex items-start">
          <AlertTriangle className="text-red-500 mr-2 mt-0.5" size={18} />
          <div>
            <p className="text-red-800">{error}</p>
            {error === 'Brak konfiguracji aktywności dla tego projektu' && (
              <p className="text-sm text-red-600 mt-1">
                Administrator musi najpierw wgrać plik konfiguracyjny aktywności dla tego projektu.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Formularz wyboru aktywności - pokazujemy tylko jeśli showAddForm=true */}
          {showAddForm && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Główna aktywność
                  </label>
                  {renderMainActivityOptions()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Podaktywność
                  </label>
                  {renderSubActivityOptions()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona
                  </label>
                  {renderZonaOptions()}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rząd
                  </label>
                  {renderRowOptions()}
                </div>
              </div>

              {/* Dodaj pole numeru stołu jeśli wybrano Moduły */}
              {selectedMainActivity === 'Moduły' && selectedSubActivity === 'Montaż modułów' && selectedZona && selectedRow && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numer stołu
                  </label>
                  {renderTableOptions()}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {selectedMainActivity !== 'Zakończenie budowy' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ilość {unit && `(${unit})`}
                      {maxQuantity !== null && (
                        <span className="text-xs text-gray-500 ml-1">
                          max: {maxQuantity}
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={maxQuantity || undefined}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className={`px-3 py-2 w-full border rounded-md focus:outline-none focus:ring-2 ${
                        !isQuantityValid()
                          ? 'border-red-500 bg-red-50 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      } disabled:bg-gray-100 disabled:text-gray-500`}
                      disabled={isDisabled || !selectedRow || (selectedMainActivity === 'Moduły' && !selectedTable)}
                      placeholder={maxQuantity !== null ? `Max: ${maxQuantity}` : "Ilość"}
                    />
                    {!isQuantityValid() && (
                      <p className="mt-1 text-xs text-red-600">
                        Maksymalna dozwolona ilość to {maxQuantity}
                      </p>
                    )}
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Uwagi (opcjonalnie)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={isDisabled || !selectedRow || (selectedMainActivity === 'Moduły' && !selectedTable)}
                    placeholder="Dodatkowe informacje..."
                  />
                </div>
              </div>

              <div className="flex justify-end mb-6">
                <button
                  type="button"
                  onClick={handleAddActivity}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled ||
                            !selectedMainActivity ||
                            !selectedSubActivity ||
                            !selectedZona ||
                            !selectedRow ||
                            (selectedMainActivity === 'Moduły' && !selectedTable) ||
                            (selectedMainActivity !== 'Zakończenie budowy' && !quantity) ||
                            !isQuantityValid()}
                >
                  <Plus size={18} className="mr-1" />
                  Dodaj aktywność
                </button>
              </div>
            </>
          )}

          {/* Lista dodanych aktywności */}
          {activities.length > 0 ? (
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Aktywności w raporcie:</h4>
              {activities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="bg-gray-50 p-3 rounded-md border border-gray-200 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{activity.activity_type} - {activity.sub_activity}</p>
                    <p className="text-sm text-gray-600">
                      Zona: {activity.zona}, Rząd: {activity.row}
                      {activity.table && <>, Stół: {activity.table}</>}
                      {activity.activity_type !== 'Zakończenie budowy' && (
                        <>, Ilość: {activity.quantity} {activity.unit}</>
                      )}
                    </p>
                    {activity.notes && <p className="text-sm text-gray-500 italic">Uwagi: {activity.notes}</p>}
                  </div>
                  {!isDisabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(activity.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Usuń aktywność"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}

              {reportId && !isDisabled && (
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={saveActivitiesToReport}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <Save size={18} className="mr-1" />
                        Zapisz aktywności do raportu
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Clipboard className="mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-gray-500">
                {isDisabled
                  ? "Brak aktywności w raporcie"
                  : "Nie dodano jeszcze żadnych aktywności"}
              </p>
              {!isDisabled && !showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus size={16} className="inline mr-1" />
                  Dodaj pierwszą aktywność
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivitiesSelector;