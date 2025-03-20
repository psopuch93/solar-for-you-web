import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EnergyChart = () => {
  const data = [
    { name: 'Sty', produkcja: 120 },
    { name: 'Lut', produkcja: 150 },
    { name: 'Mar', produkcja: 210 },
    { name: 'Kwi', produkcja: 240 },
    { name: 'Maj', produkcja: 300 },
    { name: 'Cze', produkcja: 320 },
    { name: 'Lip', produkcja: 350 },
    { name: 'Sie', produkcja: 340 },
    { name: 'Wrz', produkcja: 280 },
    { name: 'Paź', produkcja: 220 },
    { name: 'Lis', produkcja: 160 },
    { name: 'Gru', produkcja: 130 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 h-80">
      <h3 className="text-lg font-medium mb-4">Produkcja energii (kWh)</h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="produkcja" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EnergyChart;