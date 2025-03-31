// frontend/src/contexts/ClientContext.js
import React, { createContext, useContext, useState } from 'react';

// Tworzenie kontekstu
const ClientContext = createContext();

// Hook do użycia kontekstu w komponentach
export const useClients = () => useContext(ClientContext);

// Provider kontekstu
export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [shouldRefresh, setShouldRefresh] = useState(true);

  // Funkcja do aktualizacji klientów
  const updateClients = (newClients) => {
    setClients(newClients);
    setShouldRefresh(false);
  };

  // Funkcja do wymuszenia odświeżenia listy klientów
  const refreshClients = () => {
    setShouldRefresh(true);
  };

  return (
    <ClientContext.Provider value={{
      clients,
      shouldRefresh,
      updateClients,
      refreshClients
    }}>
      {children}
    </ClientContext.Provider>
  );
};