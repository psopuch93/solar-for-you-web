// frontend/src/pages/HRRequisitionsPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const HRRequisitionsPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/dashboard/requests')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zapotrzebowania HR</h1>
          <p className="text-gray-600 mt-1">Zarządzaj zapotrzebowaniami kadrowymi, szkoleniami i rekrutacjami</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <FileText className="mx-auto text-gray-400 mb-4" size={64} />
        <h2 className="text-2xl font-medium text-gray-700 mb-2">Moduł w przygotowaniu</h2>
        <p className="text-gray-500 max-w-md mx-auto">
          Funkcjonalność zapotrzebowań HR jest w trakcie rozwoju i będzie dostępna wkrótce.
        </p>
      </div>
    </div>
  );
};

export default HRRequisitionsPage;