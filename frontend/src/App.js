import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // Sprawdź status autentykacji użytkownika
    const checkAuth = async () => {
      try {
        const response = await fetch('/', {
          method: 'GET',
          credentials: 'same-origin'  // Ważne, aby wysłać ciasteczka sesji
        });

        // Jeśli serwer zwraca 200 OK, oznacza to, że użytkownik jest już zalogowany
        setIsAuthenticated(response.status === 200);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Pokaż ładowanie dopóki nie sprawdzimy statusu autentykacji
  if (isAuthenticated === null) {
    return <div className="loading">Ładowanie...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/dashboard/*"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;