// frontend/src/pages/WarehouseQuartersPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Home,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Search,
  Edit,
  Trash2
} from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import QuarterDetail from '../components/quarters/QuarterDetail';
import QuarterForm from '../components/quarters/QuarterForm';
import QuartersList from '../components/quarters/QuartersList';
import QuartersSearchInput from '../components/quarters/QuartersSearchInput';
import QuarterDetailView from '../components/quarters/QuarterDetailView';
import { QuartersSearchProvider, useQuartersSearch } from '../contexts/QuartersSearchContext';
import { getCsrfToken } from '../utils/csrfToken';

// Main component wrapped with context provider
const WarehouseQuartersPage = () => {
  return (
    <QuartersSearchProvider>
      <WarehouseQuartersContent />
    </QuartersSearchProvider>
  );
};

// Content component that uses the search context
const WarehouseQuartersContent = () => {
  const navigate = useNavigate();
  const [quarters, setQuarters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the search term from context
  const { searchTerm } = useQuartersSearch();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch quarters
        const quartersResponse = await fetch('/api/quarters/', {
          credentials: 'same-origin',
        });

        if (!quartersResponse.ok) throw new Error('Failed to fetch quarters');
        const quartersData = await quartersResponse.json();

        // Fetch employees
        const employeesResponse = await fetch('/api/employees/', {
          credentials: 'same-origin',
        });

        if (!employeesResponse.ok) throw new Error('Failed to fetch employees');
        const employeesData = await employeesResponse.json();

        // Process the data to match the expected structure
        // Map employees to their respective quarters
        const quartersWithOccupants = quartersData.map(quarter => ({
          ...quarter,
          // Convert from snake_case to camelCase for frontend compatibility
          paymentDay: quarter.payment_day,
          maxOccupants: quarter.max_occupants,
          // Find employees assigned to this quarter
          occupants: employeesData.filter(employee => employee.quarter === quarter.id)
        }));

        setQuarters(quartersWithOccupants);
        setEmployees(employeesData);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError('Could not load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter quarters based on search term
  const filteredQuarters = quarters.filter(quarter => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();

    // Szukaj we wszystkich istotnych polach kwatery
    return (
      // Podstawowe informacje
      (quarter.name && quarter.name.toLowerCase().includes(searchLower)) ||
      (quarter.address && quarter.address.toLowerCase().includes(searchLower)) ||
      (quarter.city && quarter.city.toLowerCase().includes(searchLower)) ||
      (quarter.country && quarter.country.toLowerCase().includes(searchLower)) ||

      // Wyszukiwanie po dniu płatności (jako string)
      (quarter.paymentDay && quarter.paymentDay.toString().includes(searchLower)) ||
      (quarter.payment_day && quarter.payment_day.toString().includes(searchLower)) ||

      // Wyszukiwanie po maksymalnej liczbie osób (jako string)
      (quarter.maxOccupants && quarter.maxOccupants.toString().includes(searchLower)) ||
      (quarter.max_occupants && quarter.max_occupants.toString().includes(searchLower)) ||

      // Wyszukiwanie po nazwiskach/imionach pracowników przypisanych do kwatery
      (quarter.occupants && quarter.occupants.some(occupant =>
        (occupant.first_name && occupant.first_name.toLowerCase().includes(searchLower)) ||
        (occupant.last_name && occupant.last_name.toLowerCase().includes(searchLower)) ||
        // Pełne imię i nazwisko
        ((occupant.first_name + ' ' + occupant.last_name).toLowerCase().includes(searchLower))
      ))
    );
  });

  // Handle adding a new quarter
  const handleAddQuarter = async (newQuarter) => {
    try {
      // Convert camelCase to snake_case for backend compatibility
      const quarterData = {
        name: newQuarter.name,
        address: newQuarter.address,
        city: newQuarter.city,
        country: newQuarter.country,
        payment_day: newQuarter.paymentDay,
        max_occupants: newQuarter.maxOccupants
      };

      const response = await fetch('/api/quarters/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(quarterData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create quarter');
      }

      // Get the new quarter with server-assigned ID
      const createdQuarter = await response.json();

      // Add to local state
      const quarterWithStructure = {
        ...createdQuarter,
        paymentDay: createdQuarter.payment_day,
        maxOccupants: createdQuarter.max_occupants,
        occupants: []
      };

      setQuarters([...quarters, quarterWithStructure]);
      navigate('/dashboard/warehouse/quarters');

    } catch (err) {
      console.error('Error creating quarter:', err);
      alert(`Error: ${err.message || 'Failed to create quarter'}`);
    }
  };

  // Handle updating a quarter
  const handleUpdateQuarter = async (updatedQuarter) => {
    try {
      // Convert camelCase to snake_case for backend compatibility
      const quarterData = {
        name: updatedQuarter.name,
        address: updatedQuarter.address,
        city: updatedQuarter.city,
        country: updatedQuarter.country,
        payment_day: updatedQuarter.paymentDay,
        max_occupants: updatedQuarter.maxOccupants
      };

      const response = await fetch(`/api/quarters/${updatedQuarter.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(quarterData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update quarter');
      }

      // Get the updated quarter
      const returnedQuarter = await response.json();

      // Preserve the occupants array from the existing quarter
      const existingQuarter = quarters.find(q => q.id === updatedQuarter.id);
      const occupants = existingQuarter ? existingQuarter.occupants : [];

      // Update in local state
      setQuarters(
        quarters.map(q => {
          if (q.id === updatedQuarter.id) {
            return {
              ...returnedQuarter,
              paymentDay: returnedQuarter.payment_day,
              maxOccupants: returnedQuarter.max_occupants,
              occupants: occupants
            };
          }
          return q;
        })
      );

      navigate('/dashboard/warehouse/quarters');

    } catch (err) {
      console.error('Error updating quarter:', err);
      alert(`Error: ${err.message || 'Failed to update quarter'}`);
    }
  };

  // Handle deleting a quarter
  const handleDeleteQuarter = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę kwaterę?')) {
      try {
        // First, check if the quarter has any occupants
        const quarter = quarters.find(q => q.id === id);
        if (quarter && quarter.occupants && quarter.occupants.length > 0) {
          alert('Nie można usunąć kwatery, w której są zakwaterowani pracownicy. Najpierw usuń przypisania pracowników.');
          return;
        }

        // Make API call to delete the quarter
        const response = await fetch(`/api/quarters/${id}/`, {
          method: 'DELETE',
          headers: {
            'X-CSRFToken': getCsrfToken(),
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error('Nie udało się usunąć kwatery');
        }

        // Update local state
        setQuarters(quarters.filter(q => q.id !== id));

      } catch (err) {
        console.error('Error deleting quarter:', err);
        alert(`Błąd: ${err.message || 'Nie udało się usunąć kwatery'}`);
      }
    }
  };

  // Handle assigning employee to quarter
  const handleAssignEmployee = async (quarterId, employee) => {
    try {
      // First, check if the quarter has space
      const quarter = quarters.find(q => q.id === quarterId);
      if (!quarter) return;

      if (quarter.occupants.length >= quarter.maxOccupants) {
        alert(`Maksymalna liczba osób w kwaterze (${quarter.maxOccupants}) została osiągnięta.`);
        return;
      }

      // Make API call to assign the employee
      const response = await fetch('/api/assign-employee-to-quarter/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          employee_id: employee.id,
          quarter_id: quarterId
        }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign employee');
      }

      // If successful, update the local state
      setQuarters(quarters.map(quarter => {
        if (quarter.id === quarterId) {
          // Check if employee is already assigned to prevent duplicates
          if (!quarter.occupants.find(o => o.id === employee.id)) {
            return {
              ...quarter,
              occupants: [...quarter.occupants, employee]
            };
          }
        }
        return quarter;
      }));

      // Also update the employee data
      setEmployees(employees.map(emp => {
        if (emp.id === employee.id) {
          return {
            ...emp,
            quarter: quarterId
          };
        }
        return emp;
      }));

    } catch (err) {
      console.error('Error assigning employee:', err);
      alert(`Error: ${err.message || 'Failed to assign employee'}`);
    }
  };

  // Handle removing employee from quarter
  const handleRemoveEmployee = async (quarterId, employeeId) => {
    try {
      // Make API call to remove the employee from quarter
      const response = await fetch('/api/remove-employee-from-quarter/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          employee_id: employeeId
        }),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove employee');
      }

      // If successful, update the local state
      setQuarters(quarters.map(quarter => {
        if (quarter.id === quarterId) {
          return {
            ...quarter,
            occupants: quarter.occupants.filter(o => o.id !== employeeId)
          };
        }
        return quarter;
      }));

      // Also update the employee data
      setEmployees(employees.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            quarter: null
          };
        }
        return emp;
      }));

    } catch (err) {
      console.error('Error removing employee:', err);
      alert(`Error: ${err.message || 'Failed to remove employee'}`);
    }
  };

  // Page for displaying all quarters
  const QuartersListPage = () => (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/warehouse')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kwatery</h1>
            <p className="text-gray-600 mt-1">Zarządzanie kwaterami pracowniczymi, rezerwacje, przydziały</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/warehouse/quarters/new')}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="mr-2" size={18} />
          Nowa kwatera
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6">
        <QuartersSearchInput />
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      ) : (
        <DndProvider backend={HTML5Backend}>
          <QuartersList
            quarters={filteredQuarters}
            employees={employees}
            onAssignEmployee={handleAssignEmployee}
            onRemoveEmployee={handleRemoveEmployee}
            onDelete={handleDeleteQuarter}
            onEdit={(id) => navigate(`/dashboard/warehouse/quarters/${id}/edit`)}
            onView={(id) => navigate(`/dashboard/warehouse/quarters/${id}`)}
          />
        </DndProvider>
      )}
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<QuartersListPage />} />
      <Route path="/new" element={<QuarterForm onSave={handleAddQuarter} />} />
      <Route path="/:id" element={<QuarterDetailView />} />
      <Route path="/:id/edit" element={<QuarterForm
        quarters={quarters}
        onSave={handleUpdateQuarter}
        isEditing={true}
      />} />
    </Routes>
  );
};

export default WarehouseQuartersPage;