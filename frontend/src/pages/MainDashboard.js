// frontend/src/pages/MainDashboard.js
import React from 'react';
import EnergyChart from '../components/EnergyChart';

const MainDashboard = () => {
  const statCards = [
    { title: 'Aktywne projekty', value: '24', change: '+12%', changeType: 'positive' },
    { title: 'Nowi klienci', value: '16', change: '+8%', changeType: 'positive' },
    { title: 'Ukończone instalacje', value: '42', change: '+5%', changeType: 'positive' },
    { title: 'Średni przychód', value: '18 540 zł', change: '-3%', changeType: 'negative' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Ostatnia aktualizacja: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">{card.title}</h3>
            <div className="flex items-end mt-2">
              <div className="text-2xl font-bold">{card.value}</div>
              <div className={`ml-2 text-sm ${
                card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
              }`}>
                {card.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EnergyChart />

        <div className="bg-white rounded-lg shadow p-6 h-80">
          <h3 className="text-lg font-medium mb-4">Projekty według statusu</h3>
          <div className="grid grid-cols-2 gap-4 h-64">
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                  <span>Nowe</span>
                </div>
                <span className="font-semibold">8</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '33%' }}></div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                  <span>W trakcie</span>
                </div>
                <span className="font-semibold">10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '42%' }}></div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  <span>Zakończone</span>
                </div>
                <span className="font-semibold">42</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span>Anulowane</span>
                </div>
                <span className="font-semibold">3</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                  <span>Wstrzymane</span>
                </div>
                <span className="font-semibold">6</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dodatkowe informacje */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Najnowsze projekty</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nazwa projektu
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Klient
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data rozpoczęcia
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Instalacja PV 10kW - Kraków</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">Jan Kowalski</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Nowy
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  2025-03-15
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Magazyn energii 5kWh - Warszawa</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">Anna Nowak</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                    W trakcie
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  2025-03-10
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Farma solarna 50kW - Gdańsk</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">Firma XYZ Sp. z o.o.</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Zakończony
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  2025-02-28
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">Instalacja PV 15kW - Wrocław</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">Tomasz Wiśniewski</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                    W trakcie
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  2025-03-05
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">System PV z magazynem - Poznań</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-gray-500">Małgorzata Kwiatkowska</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Nowy
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  2025-03-20
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard;