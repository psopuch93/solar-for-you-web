// frontend/src/components/quarters/QuarterForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Home,
  MapPin,
  Globe,
  Building,
  Calendar,
  Users
} from 'lucide-react';

const QuarterForm = ({ quarters, onSave, isEditing = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quarter, setQuarter] = useState({
    name: '',
    address: '',
    city: '',
    country: 'Polska',
    paymentDay: 1,
    maxOccupants: 1
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // If editing, load quarter data
  useEffect(() => {
    if (isEditing && id && quarters) {
      const quarterId = parseInt(id);
      const foundQuarter = quarters.find(q => q.id === quarterId);

      if (foundQuarter) {
        setQuarter(foundQuarter);
      } else {
        setFormError('Kwatera nie została znaleziona');
      }
    }
  }, [id, quarters, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // For numeric fields
    if (name === 'paymentDay' || name === 'maxOccupants') {
      const numValue = parseInt(value);
      // Validate limits
      if (name === 'paymentDay' && (numValue < 1 || numValue > 31)) {
        return;
      }
      if (name === 'maxOccupants' && (numValue < 1 || numValue > 20)) {
        return;
      }
      setQuarter(prev => ({ ...prev, [name]: numValue }));
    } else {
      setQuarter(prev => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!quarter.name.trim()) {
      newErrors.name = 'Nazwa kwatery jest wymagana';
    }

    if (!quarter.address.trim()) {
      newErrors.address = 'Adres jest wymagany';
    }

    if (!quarter.city.trim()) {
      newErrors.city = 'Miasto jest wymagane';
    }

    if (!quarter.country.trim()) {
      newErrors.country = 'Kraj jest wymagany';
    }

    // Payment day validation
    if (!quarter.paymentDay || quarter.paymentDay < 1 || quarter.paymentDay > 31) {
      newErrors.paymentDay = 'Dzień płatności musi być liczbą od 1 do 31';
    }

    // Max occupants validation
    if (!quarter.maxOccupants || quarter.maxOccupants < 1) {
      newErrors.maxOccupants = 'Maksymalna liczba osób musi być liczbą dodatnią';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setFormError(null);

      // If we're editing, ensure we pass the id
      const quarterToSave = isEditing
        ? quarter
        : { ...quarter };

      // Call the save handler passed from parent
      onSave(quarterToSave);

    } catch (err) {
      console.error('Error saving quarter:', err);
      setFormError('Wystąpił błąd podczas zapisywania kwatery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/dashboard/warehouse/quarters')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">
          {isEditing ? 'Edycja kwatery' : 'Nowa kwatera'}
        </h1>
      </div>

      {formError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{formError}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic information */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-medium text-gray-700 mb-4 flex items-center">
                <Home className="mr-2" size={18} />
                Informacje podstawowe
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nazwa kwatery <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={quarter.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                  }`}
                  placeholder="Wprowadź nazwę kwatery"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Adres <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={quarter.address}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 ${
                      errors.address ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                    }`}
                    placeholder="ul. Przykładowa 12/3"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Miasto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={quarter.city}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 ${
                      errors.city ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                    }`}
                    placeholder="Warszawa"
                  />
                </div>
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Kraj <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="text-gray-400" size={16} />
                  </div>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={quarter.country}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border ${
                      errors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 ${
                      errors.country ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                    }`}
                    placeholder="Polska"
                  />
                </div>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>
            </div>

            {/* Additional information */}
            <div className="lg:col-span-2 mt-4">
              <h2 className="text-lg font-medium text-gray-700 mb-4 border-t pt-4">Dodatkowe informacje</h2>
            </div>

            <div>
              <label htmlFor="paymentDay" className="block text-sm font-medium text-gray-700 mb-1">
                Dzień płatności (1-31) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-gray-400" size={16} />
                </div>
                <input
                  type="number"
                  id="paymentDay"
                  name="paymentDay"
                  min="1"
                  max="31"
                  value={quarter.paymentDay}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border ${
                    errors.paymentDay ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    errors.paymentDay ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                  }`}
                />
              </div>
              {errors.paymentDay && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentDay}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Dzień miesiąca, w którym należy opłacić czynsz za kwaterę
              </p>
            </div>

            <div>
              <label htmlFor="maxOccupants" className="block text-sm font-medium text-gray-700 mb-1">
                Maksymalna liczba osób <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="text-gray-400" size={16} />
                </div>
                <input
                  type="number"
                  id="maxOccupants"
                  name="maxOccupants"
                  min="1"
                  max="20"
                  value={quarter.maxOccupants}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border ${
                    errors.maxOccupants ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 ${
                    errors.maxOccupants ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                  }`}
                />
              </div>
              {errors.maxOccupants && (
                <p className="mt-1 text-sm text-red-600">{errors.maxOccupants}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Maksymalna liczba pracowników mogących zamieszkać w kwaterze
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard/warehouse/quarters')}
              className="mr-4 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="mr-2" size={18} />
              )}
              {isEditing ? 'Zapisz zmiany' : 'Utwórz kwaterę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuarterForm;