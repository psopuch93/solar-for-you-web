// Poprawiony moduł getCsrfToken.js

export function getCsrfToken() {
  // Sprawdź, czy funkcja jest wywoływana w środowisku przeglądarki
  if (typeof document === 'undefined') {
    console.warn('getCsrfToken został wywołany poza środowiskiem przeglądarki');
    return '';
  }

  // Znajdź wszystkie ciasteczka
  const cookies = document.cookie.split(';');

  // Znajdź nazwę tokenu CSRF - Django używa 'csrftoken'
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrftoken='));

  if (csrfCookie) {
    return csrfCookie.split('=')[1].trim();
  }

  // Alternatywnie, spróbuj znaleźć token w meta tagu (Django często go tam umieszcza)
  const metaTag = document.querySelector('meta[name="csrftoken"]');
  if (metaTag) {
    return metaTag.getAttribute('content');
  }

  console.warn('Nie znaleziono tokenu CSRF. Operacje POST, PUT, PATCH i DELETE mogą się nie powieść.');
  return '';
}

/**
 * Funkcja do wymuszenia pobrania świeżego tokenu CSRF z serwera
 * Może być używana przed wykonaniem ważnych operacji
 * @returns {Promise<string>} Promise z tokenem CSRF
 */
export async function refreshCsrfToken() {
  try {
    // Wykonaj żądanie GET do endpointu, który ustawia ciasteczko CSRF
    const response = await fetch('/api/csrf/', {
      method: 'GET',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      console.warn('Nie udało się odświeżyć tokenu CSRF');
    }

    // Po wykonaniu żądania, token powinien być dostępny w ciasteczkach
    return getCsrfToken();
  } catch (error) {
    console.error('Błąd podczas odświeżania tokenu CSRF:', error);
    return getCsrfToken(); // Zwróć aktualny token jako fallback
  }
}

export default getCsrfToken;