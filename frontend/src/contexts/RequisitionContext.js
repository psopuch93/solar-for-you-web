// frontend/src/contexts/RequisitionContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

// Tworzymy kontekst
const RequisitionContext = createContext();

// Użyj tego hooka, aby uzyskać dostęp do kontekstu
export const useRequisitions = () => useContext(RequisitionContext);

// Zmienna globalna dla śledzenia, kiedy należy odświeżyć dane
let globalRefreshFlag = false;
let globalRefreshTimestamp = Date.now();

// Provider komponent
export const RequisitionProvider = ({ children }) => {
  const [requisitions, setRequisitions] = useState([]);
  const [shouldRefresh, setShouldRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  // Efekt do sprawdzania globalnej flagi odświeżania
  useEffect(() => {
    // Sprawdź, czy globalna flaga odświeżania jest ustawiona
    if (globalRefreshFlag) {
      setShouldRefresh(true);
      globalRefreshFlag = false; // Zresetuj flagę
      setRefreshTimestamp(globalRefreshTimestamp); // Aktualizuj timestamp
    }

    // Sprawdzaj co 5 sekund, czy nie ma potrzeby odświeżenia danych
    const checkInterval = setInterval(() => {
      if (globalRefreshFlag) {
        setShouldRefresh(true);
        globalRefreshFlag = false; // Zresetuj flagę
        setRefreshTimestamp(globalRefreshTimestamp); // Aktualizuj timestamp
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, []);

  // Funkcja do pobierania zapotrzebowań
  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/requisitions/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania zapotrzebowań');
      }

      const data = await response.json();
      console.log("Pobrano dane zapotrzebowań:", data.length, "elementów");
      setRequisitions(data);
      setShouldRefresh(false);
    } catch (err) {
      console.error('Błąd pobierania zapotrzebowań:', err);
      setError(err.message || 'Nie udało się pobrać zapotrzebowań');
    } finally {
      setLoading(false);
    }
  }, []);

  // Efekt do automatycznego pobierania zapotrzebowań
  useEffect(() => {
    if (shouldRefresh) {
      console.log("Odświeżanie danych zapotrzebowań...");
      fetchRequisitions();
    }
  }, [shouldRefresh, fetchRequisitions, refreshTimestamp]);

  // Funkcja do wymuszenia odświeżenia listy zapotrzebowań globalnie
  const forceGlobalRefresh = useCallback(() => {
    console.log("Wymuszanie globalnego odświeżenia danych...");
    globalRefreshFlag = true;
    globalRefreshTimestamp = Date.now();
    setShouldRefresh(true);
    setRefreshTimestamp(globalRefreshTimestamp);
  }, []);

  // Funkcja do wymuszenia odświeżenia listy zapotrzebowań lokalnie
  const refreshRequisitions = useCallback(() => {
    console.log("Wymuszanie lokalnego odświeżenia danych...");
    setShouldRefresh(true);
    // Ustaw również flagę globalną, aby inne komponenty wiedziały o zmianie
    globalRefreshFlag = true;
    globalRefreshTimestamp = Date.now();
  }, []);

  // Funkcja do aktualizacji zapotrzebowań bez wywołania fetcha
  const updateRequisitions = useCallback((newRequisitions) => {
    setRequisitions(newRequisitions);
    setShouldRefresh(false);
  }, []);

  // Funkcja do dodawania nowego zapotrzebowania
  const addRequisition = useCallback((requisition) => {
    setRequisitions(prev => {
      // Sprawdź, czy zapotrzebowanie już istnieje
      const existingIndex = prev.findIndex(r => r.id === requisition.id);

      if (existingIndex >= 0) {
        // Zaktualizuj istniejące zapotrzebowanie
        const newRequisitions = [...prev];
        newRequisitions[existingIndex] = requisition;
        return newRequisitions;
      }

      // Dodaj nowe zapotrzebowanie
      return [...prev, requisition];
    });

    // Ustaw również flagę globalną, aby inne komponenty wiedziały o zmianie
    globalRefreshFlag = true;
    globalRefreshTimestamp = Date.now();
  }, []);

  // Wartości udostępniane przez kontekst
  const contextValue = {
    requisitions,
    shouldRefresh,
    loading,
    error,
    refreshRequisitions,
    forceGlobalRefresh,
    updateRequisitions,
    addRequisition,
    fetchRequisitions,
    refreshTimestamp
  };

  return (
    <RequisitionContext.Provider value={contextValue}>
      {children}
    </RequisitionContext.Provider>
  );
};