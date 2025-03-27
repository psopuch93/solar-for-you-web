// frontend/src/components/CoordinatesInput.js
import React, { useState, useEffect } from 'react';
import { parseDmsCoordinates, formatCoordinatesAsDms } from '../utils/coordinatesConverter';

const CoordinatesInput = ({
  latitude,
  longitude,
  onChange,
  disabled = false
}) => {
  // Stan lokalny przechowujący tekst wprowadzony przez użytkownika
  const [inputValue, setInputValue] = useState('');

  // Aktualizuj wartość pola na podstawie propsów przy pierwszym renderowaniu
  // i gdy zewnętrzne wartości latitude/longitude się zmienią
  useEffect(() => {
    if (latitude && longitude) {
      setInputValue(formatCoordinatesAsDms(latitude, longitude));
    } else {
      setInputValue('');
    }
  }, [latitude, longitude]);

  // Obsługa zmiany wartości w polu
  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
  };

  // Parsowanie i wysyłanie wartości do komponentu nadrzędnego po utracie fokusu
  const handleBlur = () => {
    if (!inputValue.trim()) {
      // Jeśli pole jest puste, wyczyść współrzędne
      onChange && onChange({ lat: null, lng: null });
      return;
    }

    // Parsuj współrzędne
    const coordinates = parseDmsCoordinates(inputValue);

    // Jeśli parsowanie się powiodło, wywołaj funkcję zwrotną z nowymi wartościami
    if (coordinates.lat !== null && coordinates.lng !== null) {
      onChange && onChange(coordinates);
    } else {
      // Próba konwersji nie powiodła się, wróć do poprzedniej wartości
      if (latitude && longitude) {
        setInputValue(formatCoordinatesAsDms(latitude, longitude));
      } else {
        setInputValue('');
      }
    }
  };

  return (
    <div>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`w-full px-4 py-2 border ${disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300'} rounded-lg focus:outline-none ${!disabled ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
        placeholder="np. 48°39'46.0&quot;N, 4°46'53.0&quot;E"
      />
      <div className="text-xs text-gray-500 mt-1">
        Format: stopnie°minuty'sekundy"kierunek, np. 48°39'46.0"N, 4°46'53.0"E
      </div>
    </div>
  );
};

export default CoordinatesInput;