// frontend/src/utils/coordinatesConverter.js

/**
 * Konwertuje współrzędne z formatu DMS (stopnie, minuty, sekundy) na format dziesiętny
 * Obsługuje formaty: "48°39'46.0"N" lub "4°46'53.0"E"
 */
export const dmsToDecimal = (dmsString) => {
  if (!dmsString) return null;

  // Sprawdź, czy string jest już w formacie dziesiętnym
  if (/^-?\d+(\.\d+)?$/.test(dmsString.trim())) {
    return parseFloat(dmsString);
  }

  // Regex dla formatu DMS
  const dmsRegex = /^\s*(\d+)[°⁰º\s]\s*(\d+)['′\s]\s*(\d+(?:\.\d+)?)["″\s]\s*([NSEWnsew])\s*$/i;
  const match = dmsString.match(dmsRegex);

  if (!match) return null;

  const degrees = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10) / 60;
  const seconds = parseFloat(match[3]) / 3600;
  const direction = match[4].toUpperCase();

  // Oblicz wartość dziesiętną
  let decimal = degrees + minutes + seconds;

  // Dostosuj znak w zależności od kierunku
  if (direction === 'S' || direction === 'W') {
    decimal = -decimal;
  }

  return decimal;
};

/**
 * Konwertuje parę współrzędnych w formacie DMS rozdzielonych przecinkiem
 * Np. "48°39'46.0"N, 4°46'53.0"E" -> { lat: 48.662778, lng: 4.781389 }
 */
export const parseDmsCoordinates = (coordinatesString) => {
  if (!coordinatesString) return { lat: null, lng: null };

  // Rozdziel string na części
  const parts = coordinatesString.split(',').map(part => part.trim());

  if (parts.length !== 2) return { lat: null, lng: null };

  const latitude = dmsToDecimal(parts[0]);
  const longitude = dmsToDecimal(parts[1]);

  return { lat: latitude, lng: longitude };
};

/**
 * Konwertuje współrzędne z formatu dziesiętnego na format DMS
 * Np. 48.662778 -> "48°39'46.0\"N"
 */
export const decimalToDms = (decimal, isLatitude = true) => {
  if (decimal === null || decimal === undefined || isNaN(decimal)) return '';

  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);

  // Określ kierunek
  let direction = '';
  if (isLatitude) {
    direction = decimal >= 0 ? 'N' : 'S';
  } else {
    direction = decimal >= 0 ? 'E' : 'W';
  }

  return `${degrees}°${minutes}'${seconds}"${direction}`;
};

/**
 * Formatuje parę współrzędnych w formacie dziesiętnym na format DMS
 * Np. { lat: 48.662778, lng: 4.781389 } -> "48°39'46.0"N, 4°46'53.0"E"
 */
export const formatCoordinatesAsDms = (lat, lng) => {
  if (lat === null || lng === null || lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return '';

  const latDms = decimalToDms(lat, true);
  const lngDms = decimalToDms(lng, false);

  return `${latDms}, ${lngDms}`;
};