// frontend/src/components/quarters/QuartersList.js
import React, { useState } from 'react';
import { Edit, Trash2, Users, MapPin, Calendar, DollarSign, Home, Search } from 'lucide-react';
import { useDrop } from 'react-dnd';
import EmployeeItem from './EmployeeItem';

const QuartersList = ({
  quarters,
  employees,
  onAssignEmployee,
  onRemoveEmployee,
  onDelete,
  onEdit,
  onView
}) => {
  const [showEmployees, setShowEmployees] = useState(false);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');

  // Filter employees that are not assigned to any quarter
  const availableEmployees = employees.filter(employee =>
    !quarters.some(quarter =>
      quarter.occupants.some(occupant => occupant.id === employee.id)
    )
  );

  // Filter based on search term
  const filteredEmployees = availableEmployees.filter(employee => {
    if (!employeeSearchTerm) return true;

    const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
    return fullName.includes(employeeSearchTerm.toLowerCase()) ||
           (employee.pesel && employee.pesel.includes(employeeSearchTerm));
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quarters.map(quarter => (
          <QuarterCard
            key={quarter.id}
            quarter={quarter}
            onAssignEmployee={onAssignEmployee}
            onRemoveEmployee={onRemoveEmployee}
            onDelete={onDelete}
            onEdit={onEdit}
            onView={onView}
          />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="mr-2" size={20} />
            Dostępni pracownicy
          </h2>
          <button
            onClick={() => setShowEmployees(!showEmployees)}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {showEmployees ? 'Ukryj' : 'Pokaż'} listę
          </button>
        </div>

        {showEmployees && (
          <>
            {/* Dodajemy pole wyszukiwania pracowników */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Szukaj pracowników..."
                  className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  autoComplete="off"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              {filteredEmployees.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  {availableEmployees.length === 0
                    ? "Wszyscy pracownicy są przydzieleni do kwater"
                    : "Nie znaleziono pracowników pasujących do kryteriów wyszukiwania"}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredEmployees.map(employee => (
                    <EmployeeItem
                      key={employee.id}
                      employee={employee}
                      isDraggable={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const QuarterCard = ({
  quarter,
  onAssignEmployee,
  onRemoveEmployee,
  onDelete,
  onEdit,
  onView
}) => {
  // React DnD drop functionality
  const [{ isOver }, drop] = useDrop({
    accept: 'employee',
    drop: (item) => {
      onAssignEmployee(quarter.id, item.employee);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // Calculate occupancy percentage
  const occupancyPercentage = (quarter.occupants.length / quarter.maxOccupants) * 100;

  return (
    <div
      ref={drop}
      className={`bg-white rounded-xl shadow-md transition-all ${
        isOver ? 'ring-2 ring-indigo-500 shadow-lg transform scale-[1.02]' : ''
      }`}
    >
      {/* Card Header */}
      <div
        className="bg-indigo-600 text-white p-4 rounded-t-xl cursor-pointer"
        onClick={() => onView(quarter.id)}
      >
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">{quarter.name}</h3>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(quarter.id);
              }}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(quarter.id);
              }}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Location info */}
        <div className="mb-3 flex items-start">
          <MapPin className="text-gray-400 mr-2 mt-1 shrink-0" size={16} />
          <div>
            <p className="text-sm text-gray-600">{quarter.address}</p>
            <p className="text-sm text-gray-600">{quarter.city}, {quarter.country}</p>
          </div>
        </div>

        {/* Payment day */}
        <div className="mb-3 flex items-center">
          <Calendar className="text-gray-400 mr-2 shrink-0" size={16} />
          <p className="text-sm text-gray-600">Dzień płatności: {quarter.paymentDay}</p>
        </div>

        {/* Max occupants */}
        <div className="mb-3 flex items-center">
          <Users className="text-gray-400 mr-2 shrink-0" size={16} />
          <p className="text-sm text-gray-600">
            Pojemność: {quarter.occupants.length}/{quarter.maxOccupants} osób
          </p>
        </div>

        {/* Occupancy progress bar */}
        <div className="mt-4 mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full ${
                occupancyPercentage < 50 ? 'bg-green-500' :
                occupancyPercentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Occupants list */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Zakwaterowani pracownicy:</h4>
          {quarter.occupants.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Brak przydzielonych pracowników</p>
          ) : (
            <ul className="space-y-2">
              {quarter.occupants.map(occupant => (
                <li key={occupant.id} className="bg-gray-50 rounded-lg p-2 flex justify-between items-center">
                  <span className="text-sm">{occupant.first_name} {occupant.last_name}</span>
                  <button
                    onClick={() => onRemoveEmployee(quarter.id, occupant.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Drag & drop instruction */}
        <div className="mt-4 text-xs text-center text-gray-500 bg-gray-100 rounded-lg p-2">
          Przeciągnij i upuść pracownika tutaj, aby przydzielić do kwatery
        </div>
      </div>
    </div>
  );
};

export default QuartersList;