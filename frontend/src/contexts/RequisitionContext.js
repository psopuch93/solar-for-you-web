// frontend/src/contexts/RequisitionContext.js
import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';

// Tworzymy kontekst
const RequisitionContext = createContext();

// Użyj tego hooka, aby uzyskać dostęp do kontekstu
export const useRequisitions = () => useContext(RequisitionContext);

// Provider komponent
export const RequisitionProvider = ({ children }) => {
  const [requisitions, setRequisitions] = useState([]);
  const [shouldRefresh, setShouldRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dodajemy referencję do ostatniego stanu, by śledzić faktyczne zmiany
  const lastDataRef = useRef({ timestamp: Date.now(), hash: '' });

  // Referencja do timera debounce
  const debounceTimerRef = useRef(null);

  // Funkcja do wyliczania prostego hasha stanu danych
  const calculateDataHash = (data) => {
    return data
      .map(item => `${item.id}:${item.status}:${item.updated_at}`)
      .sort()
      .join('|');
  };

  // Funkcja do pobierania zapotrzebowań z debouncing
  const fetchRequisitions = useCallback(async (force = false) => {
    // Anuluj poprzedni timer debounce jeśli istnieje
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Ustaw nowy timer debounce (300ms)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const currentTime = Date.now();
        // Jeśli od ostatniego odświeżenia minęło mniej niż 2 sekundy i to nie jest wymuszone odświeżenie
        if (!force && currentTime - lastDataRef.current.timestamp < 2000) {
          console.log("Pomijam odświeżenie - zbyt krótki czas od ostatniego odświeżenia");
          setShouldRefresh(false);
          return;
        }

        setLoading(true);
        setError(null);

        const response = await fetch('/api/requisitions/', {
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Błąd pobierania zapotrzebowań');
        }

        const data = await response.json();

        // Oblicz hash danych do porównania
        const newHash = calculateDataHash(data);

        // Sprawdź czy dane faktycznie się zmieniły
        if (!force && newHash === lastDataRef.current.hash) {
          console.log("Dane są identyczne, pomijam aktualizację state");
          setLoading(false);
          setShouldRefresh(false);
          return;
        }

        console.log("Pobrano dane zapotrzebowań:", data.length, "elementów");
        setRequisitions(data);
        setShouldRefresh(false);

        // Zapisz informacje o aktualnym stanie danych
        lastDataRef.current = {
          timestamp: currentTime,
          hash: newHash
        };

      } catch (err) {
        console.error('Błąd pobierania zapotrzebowań:', err);
        setError(err.message || 'Nie udało się pobrać zapotrzebowań');
      } finally {
        setLoading(false);
      }
    }, 300); // Debounce 300ms
  }, []);

  // Efekt do automatycznego pobierania zapotrzebowań
  useEffect(() => {
    if (shouldRefresh) {
      console.log("Odświeżanie danych zapotrzebowań...");
      fetchRequisitions();
    }
  }, [shouldRefresh, fetchRequisitions]);

  // Funkcja do wymuszenia odświeżenia listy zapotrzebowań
  const refreshRequisitions = useCallback(() => {
    console.log("Wymuszanie odświeżenia danych...");
    setShouldRefresh(true);
  }, []);

  // Funkcja do wymuszenia natychmiastowego odświeżenia danych
  const forceRefresh = useCallback(() => {
    console.log("Wymuszanie natychmiastowego odświeżenia danych...");
    fetchRequisitions(true);
  }, [fetchRequisitions]);

  // Funkcja do aktualizacji zapotrzebowań bez wywołania fetcha
  const updateRequisitions = useCallback((newRequisitions) => {
    setRequisitions(newRequisitions);
    const newHash = calculateDataHash(newRequisitions);
    lastDataRef.current = {
      timestamp: Date.now(),
      hash: newHash
    };
    setShouldRefresh(false);
  }, []);

  // Funkcja do aktualizacji pojedynczego zapotrzebowania
  const updateSingleRequisition = useCallback((updatedRequisition) => {
    setRequisitions(prevState => {
      const newState = prevState.map(req =>
        req.id === updatedRequisition.id ? { ...req, ...updatedRequisition } : req
      );

      // Aktualizuj hash i timestamp
      const newHash = calculateDataHash(newState);
      lastDataRef.current = {
        timestamp: Date.now(),
        hash: newHash
      };

      return newState;
    });
  }, []);

  // Wartości udostępniane przez kontekst
  const contextValue = {
    requisitions,
    shouldRefresh,
    loading,
    error,
    refreshRequisitions,
    forceRefresh,
    updateRequisitions,
    updateSingleRequisition,
    fetchRequisitions
  };

  return (
    <RequisitionContext.Provider value={contextValue}>
      {children}
    </RequisitionContext.Provider>
  );
};