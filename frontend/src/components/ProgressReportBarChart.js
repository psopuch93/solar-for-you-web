import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ProgressReportBarChart = ({ data, type }) => {
  const [hoveredBar, setHoveredBar] = useState(null);

  // Handle bar hover
  const handleMouseEnter = (data, index) => {
    setHoveredBar(index);
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.name === 'Godziny' ? 'godz.' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <svg className="w-12 h-12 mb-2 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p>Brak danych do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          barSize={type === 'byProject' ? 30 : 20}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            height={50}
            tickMargin={10}
            interval={0}
            angle={-45}
            textAnchor="end"
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value} h`}
            label={{
              value: 'Godziny pracy',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
            }}
          />
          {type === 'byProject' && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              label={{
                value: 'Liczba pracowników',
                angle: 90,
                position: 'insideRight',
                style: { textAnchor: 'middle', fontSize: 12, fill: '#666' }
              }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="hours"
            name="Godziny"
            fill="#f97316"
            radius={[4, 4, 0, 0]}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            animationDuration={1500}
          />
          {type === 'byProject' ? (
            <Bar
              yAxisId="right"
              dataKey="employees"
              name="Pracownicy"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          ) : (
            <Bar
              yAxisId="left"
              dataKey="reports"
              name="Raporty"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressReportBarChart;