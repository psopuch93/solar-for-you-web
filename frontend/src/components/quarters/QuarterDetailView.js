// frontend/src/components/quarters/QuarterDetailView.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Home,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Edit,
  UploadCloud,
  X,
  Trash2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { getCsrfToken } from '../../utils/csrfToken';

const QuarterDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [quarter, setQuarter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  useEffect(() => {
    fetchQuarterDetails();
    fetchQuarterImages();
  }, [id]);

  const fetchQuarterDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quarters/${id}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać szczegółów kwatery');
      }

      const data = await response.json();

      // Przekształć dane z backendu do formatu frontendu
      const quarterData = {
        ...data,
        paymentDay: data.payment_day,
        maxOccupants: data.max_occupants,
        // W prawdziwej implementacji pobierzemy również informacje o pracownikach
        occupants: [] // To będzie uzupełnione w rzeczywistej implementacji
      };

      setQuarter(quarterData);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać szczegółów kwatery. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuarterImages = async () => {
    try {
      const response = await fetch(`/api/quarter-images/?quarter_id=${id}`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        // W przypadku błędu nie pokazujemy komunikatu - po prostu zostawiamy pustą listę zdjęć
        console.error('Błąd pobierania zdjęć:', response.status);
        setImages([]);
        return;
      }

      const data = await response.json();
      setImages(data);
    } catch (err) {
      console.error('Błąd pobierania zdjęć:', err);
      setImages([]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    handleUploadImage(files[0]);
  };

  const handleUploadImage = async (file) => {
    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('image', file);
      formData.append('quarter', id);
      formData.append('name', file.name);

      const response = await fetch('/api/quarter-images/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken()
        },
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się przesłać zdjęcia');
      }

      // Pobierz zaktualizowaną listę zdjęć
      fetchQuarterImages();

    } catch (error) {
      console.error('Błąd podczas przesyłania zdjęcia:', error);
      setError('Nie udało się przesłać zdjęcia. Spróbuj ponownie później.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId, e) => {
    e.stopPropagation(); // Zatrzymaj propagację, aby nie otwierać modalu

    if (!window.confirm('Czy na pewno chcesz usunąć to zdjęcie?')) return;

    try {
      const response = await fetch(`/api/quarter-images/${imageId}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się usunąć zdjęcia');
      }

      // Zaktualizuj lokalną listę zdjęć
      setImages(prev => prev.filter(img => img.id !== imageId));

    } catch (error) {
      console.error('Błąd podczas usuwania zdjęcia:', error);
      setError('Nie udało się usunąć zdjęcia. Spróbuj ponownie później.');
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/dashboard/warehouse/quarters')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Szczegóły kwatery</h1>
        </div>

        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quarter) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nie znaleziono kwatery o podanym ID.</p>
        <button
          onClick={() => navigate('/dashboard/warehouse/quarters')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Powrót do listy kwater
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/warehouse/quarters')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Szczegóły kwatery</h1>
        </div>
        <button
          onClick={() => navigate(`/dashboard/warehouse/quarters/${id}/edit`)}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Edit className="mr-2" size={18} />
          Edytuj kwaterę
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Szczegóły kwatery */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2 flex items-center">
                <Home className="mr-2" size={24} />
                {quarter.name}
              </h2>
              <div className="flex items-center text-indigo-100">
                <MapPin className="mr-1" size={16} />
                <p>{quarter.address}, {quarter.city}, {quarter.country}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Calendar className="mr-1" size={14} />
                    Dzień płatności
                  </h3>
                  <p className="text-xl font-semibold">{quarter.paymentDay}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Users className="mr-1" size={14} />
                    Maksymalna liczba osób
                  </h3>
                  <p className="text-xl font-semibold">{quarter.maxOccupants}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Wykorzystanie kwatery</h3>
                <div className="flex items-center">
                  <div className="flex-grow mr-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          (quarter.occupants ? quarter.occupants.length / quarter.maxOccupants : 0) * 100 < 50
                            ? 'bg-green-500'
                            : (quarter.occupants ? quarter.occupants.length / quarter.maxOccupants : 0) * 100 < 80
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(quarter.occupants ? quarter.occupants.length / quarter.maxOccupants : 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium">
                    {quarter.occupants ? quarter.occupants.length : 0}/{quarter.maxOccupants} ({Math.round((quarter.occupants ? quarter.occupants.length / quarter.maxOccupants : 0) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Dodatkowe informacje o kwaterze */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Informacje dodatkowe</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Data utworzenia:</p>
                    <p>{quarter.created_at ? new Date(quarter.created_at).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Utworzono przez:</p>
                    <p>{quarter.created_by_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Ostatnia aktualizacja:</p>
                    <p>{quarter.updated_at ? new Date(quarter.updated_at).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium">Zaktualizowano przez:</p>
                    <p>{quarter.updated_by_name || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel zdjęć kwatery */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700 flex items-center">
                <ImageIcon className="mr-2" size={18} />
                Zdjęcia kwatery
              </h3>
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center text-indigo-600 hover:text-indigo-800"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-600 rounded-full border-t-transparent mr-1"></div>
                ) : (
                  <UploadCloud size={16} className="mr-1" />
                )}
                Dodaj zdjęcie
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
              />
            </div>

            {images.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
                <p>Brak zdjęć dla tej kwatery</p>
                <p className="text-sm mt-2">Kliknij "Dodaj zdjęcie", aby dodać pierwsze zdjęcie</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {images.map(image => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => handleImageClick(image)}
                  >
                    <img
                      src={image.image_url || image.image}
                      alt={image.name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/api/placeholder/400/320";
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => handleDeleteImage(image.id, e)}
                        className="text-white bg-red-600 p-1 rounded-full hover:bg-red-700"
                        title="Usuń zdjęcie"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal do pokazywania zdjęć w pełnym rozmiarze */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 bg-white rounded-full p-1"
            >
              <X size={24} />
            </button>

            <div className="p-2">
              <img
                src={selectedImage.image_url || selectedImage.image}
                alt={selectedImage.name}
                className="max-h-[80vh] max-w-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/api/placeholder/800/600";
                }}
              />
            </div>

            <div className="p-4 bg-gray-100 border-t">
              <p className="font-medium text-gray-800">{selectedImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuarterDetailView;