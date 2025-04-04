// frontend/src/components/quarters/QuartersSearchInput.js
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useQuartersSearch } from '../../contexts/QuartersSearchContext';

const QuartersSearchInput = () => {
  const { searchTerm, setSearchTerm } = useQuartersSearch();
  // Local state to maintain input value
  const [inputValue, setInputValue] = useState(searchTerm);
  // Debounce timer reference
  const debounceTimerRef = useRef(null);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;

    // Update local state immediately to keep the cursor position
    setInputValue(newValue);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to update the context after a delay
    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(newValue);
    }, 600); // 300ms debounce time
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update local input value if the context value changes from elsewhere
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Szukaj po nazwie, adresie, mieście, pracownikach..."
        className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={inputValue}
        onChange={handleChange}
        autoComplete="off"
      />
      <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
    </div>
  );
};

export default QuartersSearchInput;