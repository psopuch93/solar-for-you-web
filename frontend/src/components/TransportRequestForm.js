// frontend/src/components/TransportRequestForm.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Edit as EditIcon,
  PlusCircle,
  Trash2,
  MapPin,
  Calendar,
  Phone,
  Truck,
  Package
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import { useProjects } from '../contexts/ProjectContext';
import { useDialog } from '../contexts/DialogContext';

const TransportRequestForm = ({ mode = 'view' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const { showInfo } = useDialog();

  const [transportRequest, setTransportRequest] = useState({
    pickup_project: '',
    pickup_address: '',
    pickup_date: '',
    delivery_project: '',
    delivery_address: '',
    delivery_date: '',
    loading_method: 'external',
    cost_project: '',
    requester_phone: '',
    notes: '',
    items: []
  });

  const [availableProjects, setAvailableProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Stan dla modala dodawania przedmiotu
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    description: '',
    length: '',
    width: '',
    height: '',
    weight: '',
    value: ''
  });
  const [currentItemIndex, setCurrentItemIndex] = useState(null);

  // Lokalizacja załadunku i rozładunku
  const [pickupLocationType, setPickupLocationType] = useState('project');
  const [deliveryLocationType, setDeliveryLocationType] = useState('project');

  // Efekt do aktualizacji projektu kosztowego, gdy zmieniamy projekty
  useEffect(() => {
    if (mode === 'create' || (mode === 'edit' && !transportRequest.cost_project)) {
      // Jeśli jest to nowy transport lub edytujemy istniejący bez projektu kosztowego
      // Domyślnie ustawiamy projekt załadunku lub rozładunku jako projekt kosztowy
      if (pickupLocationType === 'project' && transportRequest.pickup_project) {
        setTransportRequest(prev => ({ ...prev, cost_project: transportRequest.pickup_project }));
      } else if (deliveryLocationType === 'project' && transportRequest.delivery_project) {
        setTransportRequest(prev => ({ ...prev, cost_project: transportRequest.delivery_project }));
      }
    }
  }, [transportRequest.pickup_project, transportRequest.delivery_project, pickupLocationType, deliveryLocationType, mode]);

  // Efekty do ładowania danych
  useEffect(() => {
    // Ustaw domyślny typ lokalizacji na podstawie aktualnych wartości
    setPickupLocationType(transportRequest.pickup_project ? 'project' : 'address');
    setDeliveryLocationType(transportRequest.delivery_project ? 'project' : 'address');
  }, [transportRequest.pickup_project, transportRequest.delivery_project]);

  useEffect(() => {
    if (id && (mode === 'view' || mode === 'edit')) {
      fetchTransportRequest();
    } else {
      setLoading(false);
    }

    // Ładuj dostępne projekty
    fetchProjects();
  }, [id, mode]);

  // Obserwuj listę projektów z kontekstu
  useEffect(() => {
    if (projects && projects.length > 0) {
      setAvailableProjects(projects);
    }
  }, [projects]);

  const fetchTransportRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transport-requests/${id}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych transportu');
      }

      const data = await response.json();
      setTransportRequest(data);

      // Ustaw odpowiednie typy lokalizacji
      setPickupLocationType(data.pickup_project ? 'project' : 'address');
      setDeliveryLocationType(data.delivery_project ? 'project' : 'address');

      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych transportu. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  // Zmiana trybu z podglądu na edycję
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const fetchProjects = async () => {
    try {
      if (projects && projects.length > 0) {
        setAvailableProjects(projects);
        return;
      }

      const response = await fetch('/api/projects/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania listy projektów');
      }

      const data = await response.json();
      setAvailableProjects(data);
    } catch (err) {
      console.error('Błąd pobierania projektów:', err);
    }
  };

  // Generowanie tytułu formularza
  const getFormTitle = () => {
    if (mode === 'create') return 'Nowe zapotrzebowanie transportowe';
    if (mode === 'edit') return 'Edycja zapotrzebowania transportowego';
    return 'Szczegóły zapotrzebowania transportowego';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransportRequest(prev => ({ ...prev, [name]: value }));

    // Jeśli zmieniamy projekt załadunku, a projekt kosztowy nie jest ustawiony,
    // automatycznie ustaw projekt kosztowy na projekt załadunku
    if (name === 'pickup_project' && value && !transportRequest.cost_project) {
      setTransportRequest(prev => ({ ...prev, cost_project: value }));
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    setCurrentItem({
      description: '',
      length: '',
      width: '',
      height: '',
      weight: '',
      value: ''
    });
    setCurrentItemIndex(null);
    setShowItemModal(true);
  };

  const handleEditItem = (index) => {
    setCurrentItem({ ...transportRequest.items[index] });
    setCurrentItemIndex(index);
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
    // Walidacja
    if (!currentItem.description) {
      setError('Opis przedmiotu jest wymagany');
      return;
    }

    const newItem = { ...currentItem };

    // Konwersja pustych stringów na null
    Object.keys(newItem).forEach(key => {
      if (newItem[key] === '') {
        newItem[key] = null;
      }
    });

    // Konwersja wartości numerycznych
    if (newItem.length) newItem.length = parseFloat(newItem.length);
    if (newItem.width) newItem.width = parseFloat(newItem.width);
    if (newItem.height) newItem.height = parseFloat(newItem.height);
    if (newItem.weight) newItem.weight = parseFloat(newItem.weight);
    if (newItem.value) newItem.value = parseFloat(newItem.value);

    if (currentItemIndex !== null) {
      // Edycja istniejącego przedmiotu
      const updatedItems = [...transportRequest.items];
      updatedItems[currentItemIndex] = newItem;
      setTransportRequest(prev => ({ ...prev, items: updatedItems }));
    } else {
      // Dodanie nowego przedmiotu
      setTransportRequest(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }

    setShowItemModal(false);
    setError(null);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...transportRequest.items];
    updatedItems.splice(index, 1);
    setTransportRequest(prev => ({ ...prev, items: updatedItems }));
  };

  const validateForm = () => {
    // Sprawdź, czy wybrano lokalizację załadunku
    if (pickupLocationType === 'project' && !transportRequest.pickup_project) {
      setError('Wybierz projekt załadunku');
      return false;
    }
    if (pickupLocationType === 'address' && !transportRequest.pickup_address) {
      setError('Wprowadź adres załadunku');
      return false;
    }

    // Sprawdź, czy wybrano lokalizację rozładunku
    if (deliveryLocationType === 'project' && !transportRequest.delivery_project) {
      setError('Wybierz projekt rozładunku');
      return false;
    }
    if (deliveryLocationType === 'address' && !transportRequest.delivery_address) {
      setError('Wprowadź adres rozładunku');
      return false;
    }

    // Sprawdź daty
    if (!transportRequest.pickup_date) {
      setError('Wprowadź datę załadunku');
      return false;
    }
    if (!transportRequest.delivery_date) {
      setError('Wprowadź datę rozładunku');
      return false;
    }

    // Sprawdź, czy wybrano projekt kosztowy
    if (!transportRequest.cost_project) {
      setError('Wybierz projekt kosztowy');
      return false;
    }

    // Sprawdź, czy dodano przynajmniej jeden przedmiot
    if (transportRequest.items.length === 0) {
      setError('Dodaj co najmniej jeden przedmiot do transportu');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      // Walidacja
      if (!validateForm()) {
        setSubmitting(false);
        return;
      }

      // Przygotuj dane do wysłania
      const transportData = { ...transportRequest };

      // Wyczyść projekty i adresy w zależności od wybranego typu lokalizacji
      if (pickupLocationType === 'project') {
        transportData.pickup_address = '';
      } else {
        transportData.pickup_project = null;
      }

      if (deliveryLocationType === 'project') {
        transportData.delivery_address = '';
      } else {
        transportData.delivery_project = null;
      }

      // Określ ścieżkę i metodę zależnie od trybu
      let url = '/api/transport-requests/';
      let method = 'POST';

      if (mode === 'edit') {
        url = `/api/transport-requests/${id}/`;
        method = 'PATCH';
      }

      // Wyślij zapytanie
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(transportData),
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Błąd zapisywania zapotrzebowania transportowego');
      }

      // Powodzenie - pokaż komunikat i przekieruj do listy
      showInfo(mode === 'create'
        ? "Zapotrzebowanie transportowe zostało utworzone"
        : "Zapotrzebowanie transportowe zostało zaktualizowane");

      navigate('/dashboard/requests/transport');
    } catch (err) {
      console.error('Błąd:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania zapotrzebowania transportowego');
    } finally {
      setSubmitting(false);
    }
  };

  // Renderowanie formularza
  if (loading && mode !== 'create') {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/requests/transport')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{getFormTitle()}</h1>
        </div>

        {mode === 'view' && !isEditing && (
          <button
            onClick={handleEditClick}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <EditIcon className="mr-2" size={18} />
            Edytuj
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <div className="flex items-center">
            <AlertCircle className="mr-2" size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {/* Lokalizacja załadunku */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Lokalizacja załadunku</h2>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="inline-flex items-center mr-6">
                  <input
                    type="radio"
                    name="pickupLocationType"
                    value="project"
                    checked={pickupLocationType === 'project'}
                    onChange={() => setPickupLocationType('project')}
                    disabled={!isEditing}
                    className="form-radio text-orange-500"
                  />
                  <span className="ml-2">Wybierz projekt</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="pickupLocationType"
                    value="address"
                    checked={pickupLocationType === 'address'}
                    onChange={() => setPickupLocationType('address')}
                    disabled={!isEditing}
                    className="form-radio text-orange-500"
                  />
                  <span className="ml-2">Inny adres</span>
                </label>
              </div>

              {pickupLocationType === 'project' ? (
                <div>
                  <label htmlFor="pickup_project" className="block text-sm font-medium text-gray-700 mb-1">
                    Projekt załadunku <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="pickup_project"
                    name="pickup_project"
                    value={transportRequest.pickup_project || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                  >
                    <option value="">-- Wybierz projekt --</option>
                    {availableProjects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="pickup_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Adres załadunku <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="pickup_address"
                    name="pickup_address"
                    value={transportRequest.pickup_address || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="3"
                    className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                    placeholder="Wprowadź pełny adres załadunku"
                  ></textarea>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="pickup_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data załadunku <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-gray-400" size={16} />
                </div>
                <input
                  type="date"
                  id="pickup_date"
                  name="pickup_date"
                  value={transportRequest.pickup_date || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Lokalizacja rozładunku */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Lokalizacja rozładunku</h2>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <label className="inline-flex items-center mr-6">
                  <input
                    type="radio"
                    name="deliveryLocationType"
                    value="project"
                    checked={deliveryLocationType === 'project'}
                    onChange={() => setDeliveryLocationType('project')}
                    disabled={!isEditing}
                    className="form-radio text-orange-500"
                  />
                  <span className="ml-2">Wybierz projekt</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="deliveryLocationType"
                    value="address"
                    checked={deliveryLocationType === 'address'}
                    onChange={() => setDeliveryLocationType('address')}
                    disabled={!isEditing}
                    className="form-radio text-orange-500"
                  />
                  <span className="ml-2">Inny adres</span>
                </label>
              </div>

              {deliveryLocationType === 'project' ? (
                <div>
                  <label htmlFor="delivery_project" className="block text-sm font-medium text-gray-700 mb-1">
                    Projekt rozładunku <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="delivery_project"
                    name="delivery_project"
                    value={transportRequest.delivery_project || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                  >
                    <option value="">-- Wybierz projekt --</option>
                    {availableProjects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="delivery_address" className="block text-sm font-medium text-gray-700 mb-1">
                    Adres rozładunku <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="delivery_address"
                    name="delivery_address"
                    value={transportRequest.delivery_address || ''}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows="3"
                    className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                    placeholder="Wprowadź pełny adres rozładunku"
                  ></textarea>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="delivery_date" className="block text-sm font-medium text-gray-700 mb-1">
                Data rozładunku <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="text-gray-400" size={16} />
                </div>
                <input
                  type="date"
                  id="delivery_date"
                  name="delivery_date"
                  value={transportRequest.delivery_date || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Informacje dodatkowe */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-4 border-b pb-2">Informacje dodatkowe</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="loading_method" className="block text-sm font-medium text-gray-700 mb-1">
                  Sposób załadunku i rozładunku <span className="text-red-500">*</span>
                </label>
                <select
                  id="loading_method"
                  name="loading_method"
                  value={transportRequest.loading_method || 'external'}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                >
                  <option value="external">Firma zewnętrzna</option>
                  <option value="internal">Nasz wewnętrzny</option>
                </select>
              </div>
              <div>
                <label htmlFor="cost_project" className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt kosztowy <span className="text-red-500">*</span>
                </label>
                <select
                  id="cost_project"
                  name="cost_project"
                  value={transportRequest.cost_project || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                >
                  <option value="">-- Wybierz projekt --</option>
                  {availableProjects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="requester_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Numer telefonu zamawiającego
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-gray-400" size={16} />
                </div>
                <input
                  type="text"
                  id="requester_phone"
                  name="requester_phone"
                  value={transportRequest.requester_phone || ''}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full pl-10 pr-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                  placeholder="Podaj numer telefonu"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Uwagi dodatkowe
              </label>
              <textarea
                id="notes"
                name="notes"
                value={transportRequest.notes || ''}
                onChange={handleChange}
                disabled={!isEditing}
                rows="3"
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                placeholder="Wprowadź dodatkowe uwagi dotyczące transportu"
              ></textarea>
            </div>
          </div>

          {/* Lista przedmiotów/przesyłek */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-700">Przedmioty do transportu</h2>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <PlusCircle className="mr-1" size={16} />
                  Dodaj przedmiot
                </button>
              )}
            </div>

            {transportRequest.items.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Package className="mx-auto text-gray-400" size={32} />
                <p className="mt-2 text-gray-500">Brak dodanych przedmiotów</p>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Dodaj przedmiot
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wymiary (cm)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Waga (kg)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wartość (PLN)
                      </th>
                      {isEditing && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transportRequest.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.length ? `${item.length} × ` : ''}
                            {item.width ? `${item.width} × ` : ''}
                            {item.height ? `${item.height}` : ''}
                            {(!item.length && !item.width && !item.height) ? '-' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.weight ? `${item.weight}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {item.value ? `${item.value} zł` : '-'}
                          </div>
                        </td>
                        {isEditing && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => handleEditItem(index)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <EditIcon size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Przyciski formularza */}
          {isEditing && (
            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/requests/transport')}
                className="mr-4 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={submitting}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    Zapisz
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Modal dodawania przedmiotu */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {currentItemIndex !== null ? 'Edytuj przedmiot' : 'Dodaj nowy przedmiot'}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Opis przedmiotu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={currentItem.description}
                  onChange={handleItemChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Np. Paleta z modułami PV"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="length" className="block text-sm font-medium text-gray-700 mb-1">
                    Długość (cm)
                  </label>
                  <input
                    type="number"
                    id="length"
                    name="length"
                    min="0"
                    step="0.1"
                    value={currentItem.length || ''}
                    onChange={handleItemChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                    Szerokość (cm)
                  </label>
                  <input
                    type="number"
                    id="width"
                    name="width"
                    min="0"
                    step="0.1"
                    value={currentItem.width || ''}
                    onChange={handleItemChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                    Wysokość (cm)
                  </label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    min="0"
                    step="0.1"
                    value={currentItem.height || ''}
                    onChange={handleItemChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                    Waga (kg)
                  </label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    min="0"
                    step="0.1"
                    value={currentItem.weight || ''}
                    onChange={handleItemChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                    Wartość (PLN)
                  </label>
                  <input
                    type="number"
                    id="value"
                    name="value"
                    min="0"
                    step="0.01"
                    value={currentItem.value || ''}
                    onChange={handleItemChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="mr-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Zapisz
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportRequestForm;