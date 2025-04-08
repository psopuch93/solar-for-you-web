// frontend/src/components/HRDashboard.js
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  UserPlus,
  Users,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  RefreshCw
} from 'lucide-react';

const HRDashboard = () => {
  const [hrData, setHrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr-requisitions/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych HR');
      }

      const data = await response.json();
      processHRData(data);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych HR');
    } finally {
      setLoading(false);
    }
  };

  const processHRData = (data) => {
    if (!data || !Array.isArray(data)) {
      setHrData(null);
      return;
    }

    // Przygotuj dane do analizy
    const positionCounts = {};
    const experienceCounts = {
      'konstrukcja': 0,
      'panele': 0,
      'elektryka': 0,
      'operator': 0,
      'brak': 0
    };
    const statusCounts = {
      'to_accept': 0,
      'accepted': 0,
      'in_progress': 0,
      'completed': 0,
      'rejected': 0
    };
    let totalPeople = 0;
    let openRequisitions = 0;
    let closedRequisitions = 0;

    // Analizuj dane
    data.forEach(req => {
      // Zliczanie statusów
      if (statusCounts.hasOwnProperty(req.status)) {
        statusCounts[req.status]++;
      }

      // Zliczanie zapotrzebowań otwartych/zamkniętych
      if (['to_accept', 'accepted', 'in_progress'].includes(req.status)) {
        openRequisitions++;
      } else {
        closedRequisitions++;
      }

      // Zliczanie doświadczeń
      if (experienceCounts.hasOwnProperty(req.experience)) {
        experienceCounts[req.experience]++;
      }

      // Zliczanie stanowisk
      if (req.positions && Array.isArray(req.positions)) {
        req.positions.forEach(pos => {
          const positionName = pos.position_display || pos.position;
          if (!positionCounts[positionName]) {
            positionCounts[positionName] = 0;
          }
          positionCounts[positionName] += (pos.quantity || 0);
          totalPeople += (pos.quantity || 0);
        });
      }
    });

    // Dane dla wykresu stanowisk
    const positionData = Object.entries(positionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Dane dla wykresu doświadczeń
    const experienceData = Object.entries(experienceCounts)
      .map(([key, value]) => ({
        name: getExperienceName(key),
        value
      }))
      .filter(item => item.value > 0);

    // Dane dla wykresu statusów
    const statusData = Object.entries(statusCounts)
      .map(([key, value]) => ({
        name: getStatusName(key),
        value
      }))
      .filter(item => item.value > 0);

    // Zapisz przetworzone dane
    setHrData({
      totalRequisitions: data.length,
      openRequisitions,
      closedRequisitions,
      totalPeople,
      positionData,
      experienceData,
      statusData
    });
  };

  const getExperienceName = (code) => {
    const map = {
      'konstrukcja': 'Na konstrukcji',
      'panele': 'Na panelach',
      'elektryka': 'Elektryka',
      'operator': 'Operator',
      'brak': 'Brak'
    };
    return map[code] || code;
  };

  const getStatusName = (code) => {
    const map = {
      'to_accept': 'Do akceptacji',
      'accepted': 'Zaakceptowano',
      'rejected': 'Odrzucono',
      'in_progress': 'W realizacji',
      'completed': 'Zrealizowano'
    };
    return map[code] || code;
  };

  // Kolory dla wykresów
  const POSITION_COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57'];
  const EXPERIENCE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A4A4A4'];
  const STATUS_COLORS = {
    'Do akceptacji': '#FFBB28',
    'Zaakceptowano': '#0088FE',
    'W realizacji': '#FF8042',
    'Zrealizowano': '#00C49F',
    'Odrzucono': '#FF0000'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <p>{error}</p>
        <button
          onClick={fetchHRData}
          className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw size={14} className="mr-1" /> Odśwież dane
        </button>
      </div>
    );
  }

  if (!hrData) {
    return (
      <div className="text-center text-gray-500 p-6">
        <p>Brak danych HR do wyświetlenia</p>
        <button
          onClick={fetchHRData}
          className="mt-2 flex items-center mx-auto text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw size={14} className="mr-1" /> Odśwież dane
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Karty z podsumowaniem */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Łączna liczba zapotrzebowań</p>
              <p className="text-2xl font-bold">{hrData.totalRequisitions}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <UserPlus className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aktywne zapotrzebowania</p>
              <p className="text-2xl font-bold">{hrData.openRequisitions}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Zamknięte zapotrzebowania</p>
              <p className="text-2xl font-bold">{hrData.closedRequisitions}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Łącznie poszukiwanych osób</p>
              <p className="text-2xl font-bold">{hrData.totalPeople}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="text-purple-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Wykresy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wykres stanowisk */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Briefcase className="mr-2" size={20} />
            Zapotrzebowanie na stanowiska
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hrData.positionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Liczba osób">
                  {hrData.positionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={POSITION_COLORS[index % POSITION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wykres kołowy doświadczeń */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Briefcase className="mr-2" size={20} />
            Wymagane doświadczenie
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hrData.experienceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {hrData.experienceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={EXPERIENCE_COLORS[index % EXPERIENCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} zapotrzebowań`, 'Ilość']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Wykres kołowy statusów */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
            <Clock className="mr-2" size={20} />
            Status zapotrzebowań
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hrData.statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {hrData.statusData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={STATUS_COLORS[entry.name] || '#A4A4A4'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} zapotrzebowań`, 'Ilość']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Informacje o ostatnich zapotrzebowaniach */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-800 flex items-center">
              <Calendar className="mr-2" size={20} />
              Podsumowanie
            </h3>
            <button
              onClick={fetchHRData}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <RefreshCw size={14} className="mr-1" /> Odśwież dane
            </button>
          </div>
          <div className="space-y-4">
            <div className="p-4 border border-blue-100 bg-blue-50 rounded-lg">
              <p className="font-medium">Najpopularniejsze stanowiska:</p>
              <ul className="mt-2 space-y-1">
                {hrData.positionData.slice(0, 3).map((pos, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{pos.name}</span>
                    <span className="font-medium">{pos.count} osób</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border border-yellow-100 bg-yellow-50 rounded-lg">
              <p className="font-medium">Status zapotrzebowań:</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {hrData.statusData.map((status, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{status.name}</span>
                    <span className="font-medium">{status.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border border-green-100 bg-green-50 rounded-lg">
              <p className="font-medium">Wskaźnik ukończenia:</p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${(hrData.closedRequisitions / hrData.totalRequisitions) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-sm">
                  <span>{hrData.closedRequisitions} ukończonych</span>
                  <span>{hrData.openRequisitions} w trakcie</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;