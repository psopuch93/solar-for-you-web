// frontend/src/components/StableRequisitionsProvider.js
import React, { useEffect, useState, useRef, memo, useContext, createContext } from 'react';
import { useRequisitions } from '../contexts/RequisitionContext';

const StableRequisitionsProvider = ({ children }) => {
  // Pobieramy funkcje z kontekstu ale NIE UŻYWAMY bezpośrednio danych z kontekstu
  const { refreshRequisitions, updateSingleRequisition } = useRequisitions();

  // Utrzymujemy lokalne kopie danych
  const [localRequisitions, setLocalRequisitions] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const lastUpdateRef = useRef(Date.now());

  // Przy pierwszym renderowaniu inicjalizujemy dane
  useEffect(() => {
    if (!initialized) {
      console.log("StableRequisitionsProvider: Inicjalizacja danych");

      // Wywołujemy funkcję odświeżania danych
      refreshRequisitions();

      // Oznaczamy komponent jako zainicjalizowany
      setInitialized(true);

      // Rejestrujemy nasłuchiwanie na aktualizacje tylko raz
      setupUpdateListener();
    }
  }, [initialized, refreshRequisitions]);

  // Funkcja do nasłuchiwania zmian w kontekście i przechwytywania ich
  const setupUpdateListener = () => {
    // Tworzymy niestandardowy event dla synchronizacji aktualizacji
    const updateEvent = new CustomEvent('requisition-update', {
      detail: { source: 'StableRequisitionsProvider' }
    });

    // Funkcja do obsługi aktualizacji
    const handleUpdate = (e) => {
      const currentTime = Date.now();
      // Sprawdzamy czy od ostatniej aktualizacji minęło wystarczająco dużo czasu (min. 1s)
      if (currentTime - lastUpdateRef.current > 1000) {
        console.log("StableRequisitionsProvider: Pobieranie zaktualizowanych danych");

        // Ustawiamy ostatni czas aktualizacji
        lastUpdateRef.current = currentTime;

        // Pobieramy dane z API, ale robimy to rzadko
        fetch('/api/requisitions/', {
          credentials: 'same-origin',
        })
        .then(response => {
          if (response.ok) return response.json();
          throw new Error('Błąd pobierania danych');
        })
        .then(data => {
          setLocalRequisitions(data);
        })
        .catch(err => {
          console.error("Błąd pobierania danych:", err);
        });
      }
    };

    // Nasłuchujemy własnych eventów do synchronizacji aktualizacji
    window.addEventListener('requisition-update', handleUpdate);

    // Nasłuchiwanie na zmiany wewnątrz aplikacji
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      const result = originalFetch.apply(this, arguments);

      // Jeśli to żądanie dotyczy zapotrzebowań i modyfikuje dane (PATCH, PUT, DELETE)
      if (typeof url === 'string' &&
          url.includes('/api/requisitions/') &&
          options &&
          ['PATCH', 'PUT', 'DELETE'].includes(options.method)) {

        // Opóźniamy wywołanie eventu, aby dać czas na przetworzenie odpowiedzi
        setTimeout(() => {
          window.dispatchEvent(updateEvent);
        }, 500);
      }

      return result;
    };

    // Odpinamy nasłuchiwanie przy odmontowaniu
    return () => {
      window.removeEventListener('requisition-update', handleUpdate);
      window.fetch = originalFetch;
    };
  };

  // Tworzymy kontekst dla komponentów potomnych
  const stableContext = {
    requisitions: localRequisitions,
    loading: false, // Zawsze zwracamy false, aby uniknąć ciągłych zmian stanu
    error: null,
    refreshRequisitions: () => {
      // Wyzwalamy zdarzenie do synchronizacji
      window.dispatchEvent(new CustomEvent('requisition-update'));
    },
    updateSingleRequisition: (updatedRequisition) => {
      // Lokalnie aktualizujemy dane
      setLocalRequisitions(prev =>
        prev.map(req => req.id === updatedRequisition.id ? updatedRequisition : req)
      );

      // Wywołujemy funkcję aktualizacji z kontekstu
      updateSingleRequisition(updatedRequisition);
    }
  };

  // Renderujemy komponenty potomne z naszym stabilnym kontekstem
  return (
    <RequisitionsContext.Provider value={stableContext}>
      {children}
    </RequisitionsContext.Provider>
  );
};

// Kontekst dla komponentów potomnych
const RequisitionsContext = createContext({
  requisitions: [],
  loading: false,
  error: null,
  refreshRequisitions: () => {},
  updateSingleRequisition: () => {}
});

// Hook do korzystania z naszego kontekstu
export const useStableRequisitions = () => useContext(RequisitionsContext);

// Eksportujemy zapamiętany komponent, aby zapobiec niepotrzebnym renderowaniom
export default memo(StableRequisitionsProvider);