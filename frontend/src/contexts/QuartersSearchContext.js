// frontend/src/contexts/QuartersSearchContext.js
import React, { createContext, useContext, useState, useCallback } from 'react';

// Create the context
const QuartersSearchContext = createContext({
  searchTerm: '',
  setSearchTerm: () => {},
});

// Custom hook to use the context
export const useQuartersSearch = () => useContext(QuartersSearchContext);

// Provider component
export const QuartersSearchProvider = ({ children }) => {
  const [searchTerm, setSearchTermState] = useState('');

  // Use useCallback to prevent unnecessary re-renders
  const setSearchTerm = useCallback((term) => {
    setSearchTermState(term);
  }, []);

  // Value object that will be passed to consumers
  const value = {
    searchTerm,
    setSearchTerm,
  };

  return (
    <QuartersSearchContext.Provider value={value}>
      {children}
    </QuartersSearchContext.Provider>
  );
};

export default QuartersSearchContext;