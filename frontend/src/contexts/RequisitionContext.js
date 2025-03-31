// frontend/src/contexts/RequisitionContext.js
import React, { createContext, useState, useContext, useCallback } from 'react';

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

  // Funkcja do odświeżania listy zapotrzebowań
  const refreshRequisitions = useCallback(() => {
    setShouldRefresh(true);
  }, []);

  // Funkcja do aktualizacji listy zapotrzebowań
  const updateRequisitions = useCallback((newRequisitions) => {
    setRequisitions(newRequisitions);
    setShouldRefresh(false);
  }, []);

  // Funkcja do dodawania nowego zapotrzebowania do listy bez pobierania z API
  const addRequisition = useCallback((requisition) => {
    setRequisitions(prevRequisitions => {
      // Upewnij się, że nie dublujemy zapotrzebowań
      const existingIndex = prevRequisitions.findIndex(r => r.id === requisition.id);
      if (existingIndex >= 0) {
        // Aktualizuj istniejące
        const newRequisitions = [...prevRequisitions];
        newRequisitions[existingIndex] = requisition;
        return newRequisitions;
      }
      // Dodaj nowe
      return [...prevRequisitions, requisition];
    });
  }, []);

  // Wartości i funkcje udostępniane przez kontekst
  const value = {
    requisitions,
    shouldRefresh,
    loading,
    error,
    refreshRequisitions,
    updateRequisitions,
    addRequisition
  };

  return (
    <RequisitionContext.Provider value={value}>
      {children}
    </RequisitionContext.Provider>
  );
};