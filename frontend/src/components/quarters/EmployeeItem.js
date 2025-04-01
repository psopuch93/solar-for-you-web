// frontend/src/components/quarters/EmployeeItem.js
import React from 'react';
import { useDrag } from 'react-dnd';
import { User } from 'lucide-react';

const EmployeeItem = ({ employee, isDraggable }) => {
  // Setup drag functionality
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'employee',
    item: { employee },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    canDrag: isDraggable
  }));

  return (
    <div
      ref={isDraggable ? drag : null}
      className={`${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      } flex items-center p-3 bg-white border rounded-lg ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${
        isDraggable ? 'hover:bg-indigo-50 hover:border-indigo-200' : ''
      }`}
    >
      <div className="bg-indigo-100 p-2 rounded-full mr-3">
        <User size={18} className="text-indigo-600" />
      </div>
      <div>
        <p className="font-medium text-sm">
          {employee.first_name} {employee.last_name}
        </p>
        {employee.pesel && (
          <p className="text-xs text-gray-500">PESEL: {employee.pesel}</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeItem;