// frontend/src/components/StableRequisitionsProvider.js
import React, { useEffect, useState, useRef, memo, useContext, createContext } from 'react';
import { useRequisitions } from '../contexts/RequisitionContext';

const RequisitionsContext = createContext({
  requisitions: [],
  loading: false,
  error: null,
  refreshRequisitions: () => {},
  updateSingleRequisition: () => {}
});

// Hook to use our context
export const useStableRequisitions = () => useContext(RequisitionsContext);

const StableRequisitionsProvider = ({ children }) => {
  // Get functions from the original context but NOT using data directly from context
  const { refreshRequisitions, updateSingleRequisition } = useRequisitions();

  // Maintain local copies of data
  const [localRequisitions, setLocalRequisitions] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastUpdateRef = useRef(Date.now());

  // Initialize data on first render
  useEffect(() => {
    if (!initialized) {
      console.log("StableRequisitionsProvider: Initializing data");

      // Call refresh function
      fetchData();

      // Mark component as initialized
      setInitialized(true);

      // Set up update listener
      setupUpdateListener();
    }
  }, [initialized]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/requisitions/', {
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.status}`);
      }

      const data = await response.json();
      setLocalRequisitions(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || 'Failed to fetch requisitions');
    } finally {
      setLoading(false);
    }
  };

  // Function to listen for changes in context and capture them
  const setupUpdateListener = () => {
    // Create custom event for update synchronization
    const updateEvent = new CustomEvent('requisition-update', {
      detail: { source: 'StableRequisitionsProvider' }
    });

    // Function to handle updates
    const handleUpdate = (e) => {
      const currentTime = Date.now();
      // Check if enough time has passed since last update (min. 1s)
      if (currentTime - lastUpdateRef.current > 1000) {
        console.log("StableRequisitionsProvider: Fetching updated data");

        // Set last update time
        lastUpdateRef.current = currentTime;

        // Fetch data from API, but do it infrequently
        fetchData();
      }
    };

    // Listen for our custom events for update synchronization
    window.addEventListener('requisition-update', handleUpdate);

    // Listen for changes inside application
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      const result = originalFetch.apply(this, arguments);

      // If this request is about requisitions and modifies data (PATCH, PUT, DELETE)
      if (typeof url === 'string' &&
          url.includes('/api/requisitions/') &&
          options &&
          ['PATCH', 'PUT', 'DELETE', 'POST'].includes(options.method)) {

        // Delay event to allow time for processing response
        setTimeout(() => {
          window.dispatchEvent(updateEvent);
        }, 500);
      }

      return result;
    };

    // Clean up listener on unmount
    return () => {
      window.removeEventListener('requisition-update', handleUpdate);
      window.fetch = originalFetch;
    };
  };

  // Create context for child components
  const stableContext = {
    requisitions: localRequisitions,
    loading: loading,
    error: error,
    refreshRequisitions: () => {
      // Trigger event for synchronization
      setLoading(true);
      window.dispatchEvent(new CustomEvent('requisition-update'));

      // Also call the original refresh function from context
      refreshRequisitions();
    },
    updateSingleRequisition: (updatedRequisition) => {
      // Locally update data
      setLocalRequisitions(prev =>
        prev.map(req => req.id === updatedRequisition.id ? updatedRequisition : req)
      );

      // Call update function from context
      updateSingleRequisition(updatedRequisition);
    }
  };

  // Render child components with our stable context
  return (
    <RequisitionsContext.Provider value={stableContext}>
      {children}
    </RequisitionsContext.Provider>
  );
};

// Export memorized component to prevent unnecessary re-renders
export default memo(StableRequisitionsProvider);