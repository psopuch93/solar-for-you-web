// frontend/src/components/ProjectMap.js
import React, { useEffect, useRef } from 'react';

const ProjectMap = ({ latitude, longitude, height = '300px' }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapContainerId = 'project-map-container';

  // Sprawdź, czy są poprawne współrzędne do wyświetlenia mapy
  const hasValidCoordinates = latitude &&
                              longitude &&
                              !isNaN(parseFloat(latitude)) &&
                              !isNaN(parseFloat(longitude));

  useEffect(() => {
    // Jeśli nie ma współrzędnych, nie inicjalizuj mapy
    if (!hasValidCoordinates) {
      return;
    }

    // Funkcja inicjalizująca mapę
    const initializeMap = () => {
      // Jeśli mapa jest już załadowana, aktualizuj tylko marker
      if (mapRef.current) {
        updateMarker();
        return;
      }

      // Parsuj współrzędne na liczby
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Tworzenie mapy
      const map = new window.google.maps.Map(document.getElementById(mapContainerId), {
        center: { lat, lng },
        zoom: 15,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });

      // Zapisz referencję do mapy
      mapRef.current = map;

      // Dodaj marker
      addMarker(lat, lng);
    };

    // Funkcja dodająca marker do mapy
    const addMarker = (lat, lng) => {
      if (!mapRef.current) return;

      // Usuń poprzedni marker jeśli istnieje
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // Dodaj nowy marker
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapRef.current,
        title: 'Lokalizacja projektu',
        animation: window.google.maps.Animation.DROP
      });
    };

    // Funkcja aktualizująca pozycję markera i widok mapy
    const updateMarker = () => {
      if (!mapRef.current || !hasValidCoordinates) return;

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      // Ustaw nowe centrum mapy
      mapRef.current.setCenter({ lat, lng });

      // Dodaj marker
      addMarker(lat, lng);
    };

    // Sprawdź, czy Google Maps API jest już załadowane
    if (!window.google || !window.google.maps) {
      // Załaduj Google Maps API
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBdm6MCVBGS_jAHYm-9jGtARINQlssoEbQ';
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);

      return () => {
        // Czyszczenie przy odmontowaniu
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      };
    } else {
      initializeMap();
    }

    return () => {
      // Czyszczenie markera przy zmianie props
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, hasValidCoordinates]);

  // Placeholder z informacją, jeśli nie ma współrzędnych
  if (!hasValidCoordinates) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200"
        style={{ width: '100%', height }}
      >
        <div className="text-center p-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium">Wprowadź współrzędne geograficzne</p>
          <p className="text-gray-400 mt-2">Mapa zostanie wygenerowana po podaniu współrzędnych</p>
        </div>
      </div>
    );
  }

  // Mapa, jeśli są współrzędne
  return (
    <div
      id={mapContainerId}
      style={{
        width: '100%',
        height,
        borderRadius: '0.5rem',
        border: '1px solid #ddd'
      }}
    ></div>
  );
};

export default ProjectMap;