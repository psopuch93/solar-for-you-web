// frontend/src/components/quarters/QuarterDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  User,
  AlertCircle
} from 'lucide-react';
import { useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import EmployeeItem from './EmployeeItem';

const QuarterDetail = ({ quarters, employees, onAssignEmployee, onRemoveEmployee }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quarter, setQuarter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Find the quarter from the quarters array
  useEffect(() => {
    const quarterId = parseInt(id);
    const foundQuarter = quarters.find(q => q.id === quarterId);

    if (foundQuarter) {
      setQuarter(foundQuarter);
      setError(null);
    } else {
      setError('Kwatera nie została znaleziona');
    }

    setLoading(false);
  }, [id, quarters]);

  // Filter employees that are not assigned to any quarter
  const getUnassignedEmployees = () => {
    return employees.filter(employee =>
      !quarters.some(quarter =>
        quarter.occupants.some(occupant => occupant.id === employee.id)
      )
    );
  };

  // Calculate occupancy percentage
  const getOccupancyPercentage = () => {
    if (!quarter) return 0;
    return (quarter.occupants.length / quarter.maxOccupants) * 100;
  };

  // React DnD drop functionality
  const [{ isOver }, drop] = useDrop({
    accept: 'employee',
    drop: (item) => {
      if (quarter) {
        onAssignEmployee(quarter.id, item.employee);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard/warehouse/quarters')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Szczegóły kwatery</h1>
        </div>

        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quarter) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard/warehouse/quarters')}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Szczegóły kwatery</h1>
          </div>
          <button
            onClick={() => navigate(`/dashboard/warehouse/quarters/${id}/edit`)}
            className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Edit className="mr-2" size={18} />
            Edytuj kwaterę
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quarter details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-indigo-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2 flex items-center">
                  <Home className="mr-2" size={24} />
                  {quarter.name}
                </h2>
                <div className="flex items-center text-indigo-100">
                  <MapPin className="mr-1" size={16} />
                  <p>{quarter.address}, {quarter.city}, {quarter.country}</p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Calendar className="mr-1" size={14} />
                      Dzień płatności
                    </h3>
                    <p className="text-xl font-semibold">{quarter.paymentDay}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Users className="mr-1" size={14} />
                      Maksymalna liczba osób
                    </h3>
                    <p className="text-xl font-semibold">{quarter.maxOccupants}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Wykorzystanie kwatery</h3>
                  <div className="flex items-center">
                    <div className="flex-grow mr-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            getOccupancyPercentage() < 50 ? 'bg-green-500' :
                            getOccupancyPercentage() < 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${getOccupancyPercentage()}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {quarter.occupants.length}/{quarter.maxOccupants} ({Math.round(getOccupancyPercentage())}%)
                    </span>
                  </div>
                </div>

                {/* Occupants section with drop area */}
                <div
                  ref={drop}
                  className={`rounded-lg border-2 p-4 transition-all ${
                    isOver ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'
                  }`}
                >
                  <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                    <Users className="mr-2" size={18} />
                    Zakwaterowani pracownicy
                  </h3>

                  {quarter.occupants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <User className="mx-auto mb-2 text-gray-400" size={32} />
                      <p>Brak przydzielonych pracowników</p>
                      <p className="text-sm mt-2">Przeciągnij pracownika z listy, aby przypisać do tej kwatery</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {quarter.occupants.map(occupant => (
                        <div
                          key={occupant.id}
                          className="flex justify-between items-center bg-white border rounded-lg p-3"
                        >
                          <div className="flex items-center">
                            <div className="bg-indigo-100 p-2 rounded-full mr-3">
                              <User size={18} className="text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-medium">{occupant.first_name} {occupant.last_name}</p>
                              {occupant.pesel && (
                                <p className="text-xs text-gray-500">PESEL: {occupant.pesel}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => onRemoveEmployee(quarter.id, occupant.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-center text-gray-500 mt-4">
                    Przeciągnij i upuść pracownika tutaj, aby przydzielić do kwatery
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Available employees card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 h-full">
              <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                <Users className="mr-2" size={18} />
                Dostępni pracownicy
              </h3>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {getUnassignedEmployees().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Brak dostępnych pracowników</p>
                    <p className="text-sm mt-2">Wszyscy pracownicy są już zakwaterowani</p>
                  </div>
                ) : (
                  getUnassignedEmployees().map(employee => (
                    <EmployeeItem
                      key={employee.id}
                      employee={employee}
                      isDraggable={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default QuarterDetail;