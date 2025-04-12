import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, BarChart, ArrowRight } from 'lucide-react';

const ReportsPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Raporty</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kafelek Progress Raport */}
        <div className="bg-white rounded-xl shadow p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-orange-100 rounded-full">
              <BarChart className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="ml-3 text-xl font-medium text-gray-800">Progress Raport</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Przejrzysta analiza postępu prac z podziałem na projekty, godziny pracy i zaangażowanych pracowników.
          </p>
          <Link
            to="/dashboard/reports/progress/"
            className="flex items-center text-orange-600 font-medium hover:text-orange-700"
          >
            Zobacz raporty postępu
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>

        {/* Inne kafelki raportów... */}
      </div>
    </div>
  );
};

export default ReportsPage;