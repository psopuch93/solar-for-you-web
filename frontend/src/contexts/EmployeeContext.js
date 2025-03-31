// frontend/src/contexts/EmployeeContext.js
import React, { createContext, useState, useContext } from 'react';

const EmployeeContext = createContext();

export const useEmployees = () => useContext(EmployeeContext);

export const EmployeeProvider = ({ children }) => {
  const [employees, setEmployees] = useState([]);
  const [shouldRefresh, setShouldRefresh] = useState(true);

  const refreshEmployees = () => {
    setShouldRefresh(true);
  };

  const updateEmployees = (newEmployees) => {
    setEmployees(newEmployees);
    setShouldRefresh(false);
  };

  return (
    <EmployeeContext.Provider value={{ employees, shouldRefresh, refreshEmployees, updateEmployees }}>
      {children}
    </EmployeeContext.Provider>
  );
};