// frontend/src/contexts/RequisitionContext.js
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

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

  // Funkcja do pobierania zapotrzebowań
  const fetchRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/requisitions/?requisition_type=material', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania zapotrzebowań');
      }

      const data = await response.json();
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
      fetchRequisitions();
    }
  }, [shouldRefresh, fetchRequisitions]);

  // Funkcja do wymuszenia odświeżenia listy zapotrzebowań
  const refreshRequisitions = useCallback(() => {
    setShouldRefresh(true);
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
  }, []);

  // Wartości udostępniane przez kontekst
  const contextValue = {
    requisitions,
    shouldRefresh,
    loading,
    error,
    refreshRequisitions,
    updateRequisitions,
    addRequisition,
    fetchRequisitions
  };

  return (
    <RequisitionContext.Provider value={contextValue}>
      {children}
    </RequisitionContext.Provider>
  );
};