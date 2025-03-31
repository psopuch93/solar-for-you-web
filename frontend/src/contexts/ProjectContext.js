// frontend/src/contexts/ProjectContext.js
import React, { createContext, useContext, useState } from 'react';

// Tworzenie kontekstu
const ProjectContext = createContext();

// Hook do użycia kontekstu w komponentach
export const useProjects = () => useContext(ProjectContext);

// Provider kontekstu
export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [shouldRefresh, setShouldRefresh] = useState(true);

  // Funkcja do aktualizacji projektów
  const updateProjects = (newProjects) => {
    setProjects(newProjects);
    setShouldRefresh(false);
  };

  // Funkcja do wymuszenia odświeżenia listy projektów
  const refreshProjects = () => {
    setShouldRefresh(true);
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      shouldRefresh,
      updateProjects,
      refreshProjects
    }}>
      {children}
    </ProjectContext.Provider>
  );
};