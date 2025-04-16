import React, { useState, useEffect } from 'react';
import { Clipboard, ArrowDown, Plus, Trash2, Save, AlertTriangle, HelpCircle, Check, CheckSquare as ListChecks } from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';

// Komponent do wyboru aktywności w raportach postępu
const ActivitiesSelector = ({
  projectId,
  reportId,
  isDisabled = false,
  onActivitiesChange,
  existingActivities = []
}) => {
  const [activities, setActivities] = useState(existingActivities.length > 0 ? existingActivities : []);
  const [activityConfig, setActivityConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMainActivity, setSelectedMainActivity] = useState('');
  const [selectedSubActivity, setSelectedSubActivity] = useState('');
  const [selectedZona, setSelectedZona] = useState('');
  const [selectedRow, setSelectedRow] = useState('');
  const [quantity, setQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState(null);
  const [unit, setUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [showHelp, setShowHelp] = useState(false);

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
    setQuantity('');
    setMaxQuantity(null);
    setUnit('');
  }, [selectedMainActivity]);

  // Po zmianie podaktywności, zresetuj pozostałe pola
  useEffect(() => {
    setSelectedZona('');
    setSelectedRow('');
    setQuantity('');
    setMaxQuantity(null);
    setUnit('');
  }, [selectedSubActivity]);

  // Po zmianie zony, zresetuj rząd i ilość
  useEffect(() => {
    setSelectedRow('');
    setQuantity('');
    setMaxQuantity(null);
  }, [selectedZona]);

  // Po zmianie rzędu, zresetuj ilość i ustaw jednostkę
  useEffect(() => {
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
      // Znajdź odpowiednią sekcję w konfiguracji
      let configSection;

      if (selectedMainActivity === 'Logistyka') {
        configSection = activityConfig.logistyka;
      } else if (selectedMainActivity === 'Konstrukcja') {
        if (activityConfig.konstrukcja) {
          // Sprawdź typ konstrukcji (wbijana, betonowana itp.)
          const constructionTypes = Object.keys(activityConfig.konstrukcja);
          for (const type of constructionTypes) {
            configSection = activityConfig.konstrukcja[type];
            if (configSection) break;
          }
        }
      } else if (selectedMainActivity === 'Moduły') {
        configSection = activityConfig.moduly;
      } else if (selectedMainActivity === 'Zakończenie budowy') {
        // Brak maksymalnej ilości dla zakończenia budowy
        return;
      }

      // Znajdź wpis dla wybranej zony i rzędu
      if (configSection) {
        const rowData = configSection.find(item =>
          item.zona === selectedZona && item.rzad === selectedRow
        );

        if (rowData) {
          // Sprawdź aktywność szczegółową, aby znaleźć właściwą ilość maksymalną
          if (selectedSubActivity === 'Transport słupów' && rowData.ilość) {
            setMaxQuantity(rowData.ilość);
          } else if (selectedSubActivity === 'Transport modułów' && rowData.ilość_palet) {
            setMaxQuantity(rowData.ilość_palet);
          } else if (selectedSubActivity === 'Transport kabli') {
            // Brak limitu dla kabli
            setMaxQuantity(null);
          } else if (selectedSubActivity.startsWith('Transport konstrukcji')) {
            if (rowData.przedłużki) setMaxQuantity(rowData.przedłużki);
            else if (rowData.belki_główne) setMaxQuantity(rowData.belki_główne);
            else if (rowData.stężenia_ukośne) setMaxQuantity(rowData.stężenia_ukośne);
            else if (rowData.płatwie) setMaxQuantity(rowData.płatwie);
          } else if (selectedMainActivity === 'Konstrukcja' || selectedMainActivity === 'Moduły') {
            // Dla innych aktywności konstrukcji, używamy ogólnej ilości
            if (rowData.ilość) setMaxQuantity(rowData.ilość);
            else setMaxQuantity(null);
          }
        }
      }
    }
  }, [selectedZona, selectedRow, activityConfig, selectedMainActivity, selectedSubActivity]);

  // Powiadom rodzica o zmianach w aktywnościach
  useEffect(() => {
    if (onActivitiesChange) {
      onActivitiesChange(activities);
    }
  }, [activities, onActivitiesChange]);

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
      quantity: selectedMainActivity === 'Zakończenie budowy' ? 0 : parseInt(quantity),
      unit: unit,
      notes: notes
    };

    setActivities([...activities, newActivity]);
    setError(null);

    // Zresetuj formularz
    setSelectedSubActivity('');
    setSelectedZona('');
    setSelectedRow('');
    setQuantity('');
    setNotes('');
  };

  // Usuń aktywność
  const handleRemoveActivity = (activityId) => {
    setActivities(activities.filter(activity => activity.id !== activityId));
  };

  // Zapisz aktywności do raportu
  const saveActivitiesToReport = async () => {
    if (!reportId || activities.length === 0) return;

    try {
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
            quantity: activity.quantity,
            unit: activity.unit,
            notes: activity.notes
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Nie udało się zapisać aktywności');
      }

      // Wyczyść listę aktywności po zapisie
      setActivities([]);
      setError(null);

      // Można dodać komunikat o sukcesie
      alert('Aktywności zostały zapisane pomyślnie');
    } catch (err) {
      console.error('Błąd zapisywania aktywności:', err);
      setError('Wystąpił błąd podczas zapisywania aktywności');
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

  // Renderowanie opcji dla zon
  const renderZonaOptions = () => {
    if (!activityConfig || !selectedMainActivity || !selectedSubActivity) return null;

    let zonas = [];
    let configSection;

    if (selectedMainActivity === 'Logistyka') {
      configSection = activityConfig.logistyka;
    } else if (selectedMainActivity === 'Konstrukcja') {
      if (activityConfig.konstrukcja) {
        const constructionTypes = Object.keys(activityConfig.konstrukcja);
        for (const type of constructionTypes) {
          configSection = activityConfig.konstrukcja[type];
          if (configSection) break;
        }
      }
    } else if (selectedMainActivity === 'Moduły') {
      configSection = activityConfig.moduly;
    } else if (selectedMainActivity === 'Zakończenie budowy') {
      // Dla zakończenia budowy można ręcznie stworzyć listę zon z innych aktywności
      const zonaSet = new Set();

      if (activityConfig.logistyka) {
        activityConfig.logistyka.forEach(item => zonaSet.add(item.zona));
      }

      if (activityConfig.konstrukcja) {
        Object.values(activityConfig.konstrukcja).forEach(items => {
          items.forEach(item => zonaSet.add(item.zona));
        });
      }

      if (activityConfig.moduly) {
        activityConfig.moduly.forEach(item => zonaSet.add(item.zona));
      }

      zonas = Array.from(zonaSet);
    }

    if (configSection) {
      // Zbierz unikalne zony
      const zonaSet = new Set();
      configSection.forEach(item => {
        zonaSet.add(item.zona);
      });
      zonas = Array.from(zonaSet);
    }

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

      let rows = [];
      let configSection = null;

      console.log("Debug - renderRowOptions:");
      console.log("Activity Config:", activityConfig);
      console.log("Selected Main Activity:", selectedMainActivity);
      console.log("Selected Sub Activity:", selectedSubActivity);
      console.log("Selected Zona:", selectedZona);

      // Pobierz odpowiednią sekcję z konfiguracji
      if (selectedMainActivity === 'Logistyka') {
        configSection = activityConfig.logistyka || [];
      } else if (selectedMainActivity === 'Konstrukcja') {
        if (activityConfig.konstrukcja) {
          // Pobierz pierwszy dostępny typ konstrukcji
          const constructionTypes = Object.keys(activityConfig.konstrukcja);
          if (constructionTypes.length > 0) {
            configSection = activityConfig.konstrukcja[constructionTypes[0]] || [];
          }
        }
      } else if (selectedMainActivity === 'Moduły') {
        configSection = activityConfig.moduly || [];
      }

      // Dla "Zakończenie budowy" zbierz rzędy ze wszystkich sekcji dla wybranej zony
      if (selectedMainActivity === 'Zakończenie budowy') {
        const rowSet = new Set();

        // Sprawdź sekcję logistyki
        if (activityConfig.logistyka && Array.isArray(activityConfig.logistyka)) {
          activityConfig.logistyka
            .filter(item => item.zona === selectedZona)
            .forEach(item => {
              if (item.rzad) rowSet.add(item.rzad);
            });
        }

        // Sprawdź sekcję konstrukcji
        if (activityConfig.konstrukcja) {
          Object.values(activityConfig.konstrukcja).forEach(items => {
            if (Array.isArray(items)) {
              items
                .filter(item => item.zona === selectedZona)
                .forEach(item => {
                  if (item.rzad) rowSet.add(item.rzad);
                });
            }
          });
        }

        // Sprawdź sekcję modułów
        if (activityConfig.moduly && Array.isArray(activityConfig.moduly)) {
          activityConfig.moduly
            .filter(item => item.zona === selectedZona)
            .forEach(item => {
              if (item.rzad) rowSet.add(item.rzad);
            });
        }

        rows = Array.from(rowSet);
        console.log("Rows for Zakończenie budowy:", rows);
      }
      // Dla pozostałych aktywności
      else if (configSection && Array.isArray(configSection)) {
        // Zbierz rzędy dla wybranej zony
        const rowSet = new Set();
        configSection
          .filter(item => item.zona === selectedZona)
          .forEach(item => {
            if (item.rzad) rowSet.add(item.rzad);
          });
        rows = Array.from(rowSet);
        console.log("Rows for standard activity:", rows);
      }

      // Jeśli nadal nie mamy rzędów, spróbuj pobrać je z innych sekcji
      if (rows.length === 0) {
        console.log("No rows found, trying to get from other sections");

        // Sprawdź wszystkie dostępne sekcje
        const sections = [];
        if (activityConfig.logistyka) sections.push(activityConfig.logistyka);
        if (activityConfig.moduly) sections.push(activityConfig.moduly);
        if (activityConfig.konstrukcja) {
          Object.values(activityConfig.konstrukcja).forEach(section => {
            if (Array.isArray(section)) sections.push(section);
          });
        }

        const rowSet = new Set();
        sections.forEach(section => {
          if (Array.isArray(section)) {
            section
              .filter(item => item.zona === selectedZona)
              .forEach(item => {
                if (item.rzad) rowSet.add(item.rzad);
              });
          }
        });

        rows = Array.from(rowSet);
        console.log("Rows from all sections:", rows);
      }

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

  // Renderowanie komponentu
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Clipboard className="mr-2" size={20} />
          Aktywności
        </h3>
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          className="text-blue-500 hover:text-blue-700"
        >
          <HelpCircle size={20} />
        </button>
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
          {/* Formularz wyboru aktywności */}
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
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="px-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  disabled={isDisabled || !selectedRow}
                />
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
                disabled={isDisabled || !selectedRow}
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
                        (selectedMainActivity !== 'Zakończenie budowy' && !quantity)}
            >
              <Plus size={18} className="mr-1" />
              Dodaj aktywność
            </button>
          </div>

          {/* Lista dodanych aktywności */}
          {activities.length > 0 ? (
            <>
              <h4 className="font-medium text-gray-700 mb-2">Dodane aktywności:</h4>
              <div className="space-y-3 mb-4">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id || index}
                    className="bg-gray-50 p-3 rounded-md border border-gray-200 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{activity.activity_type} - {activity.sub_activity}</p>
                      <p className="text-sm text-gray-600">
                        Zona: {activity.zona}, Rząd: {activity.row}
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
              </div>

              {reportId && !isDisabled && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveActivitiesToReport}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Save size={18} className="mr-1" />
                    Zapisz aktywności do raportu
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Clipboard className="mx-auto text-gray-400 mb-2" size={24} />
              <p className="text-gray-500">
                {isDisabled
                  ? "Brak aktywności w raporcie"
                  : "Nie dodano jeszcze żadnych aktywności"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivitiesSelector;