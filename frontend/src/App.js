// frontend/src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import { DialogProvider } from './contexts/DialogContext';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sprawdź status autentykacji użytkownika
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me/', {
          method: 'GET',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        // Jeśli status 200 to użytkownik jest zalogowany
        setIsAuthenticated(response.status === 200);
      } catch (error) {
        console.error('Błąd sprawdzania autentykacji:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Pokaż ładowanie dopóki nie sprawdzimy statusu autentykacji
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
    </div>;
  }

  return (
    <DialogProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/dashboard/*"
            element={isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />}
          />
          {/* Każdy inny URL, dla którego nie ma dopasowania przekierowuje na /dashboard */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} />}
          />
        </Routes>
      </Router>
    </DialogProvider>
  );
}

export default App;