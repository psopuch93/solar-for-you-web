import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Save,
  ArrowLeft,
  Edit as EditIcon,
  PlusCircle,
  Trash2,
  Search,
  X,
  FileText
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import { useProjects } from '../contexts/ProjectContext';

const MaterialRequisitionForm = ({ mode = 'view' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects } = useProjects();

  const [requisition, setRequisition] = useState({
    project: '',
    deadline: '',
    requisition_type: 'material',
    status: 'to_accept',
    items: []
  });

  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'create' || mode === 'edit');

  // Stan dla modala wyboru przedmiotów
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState('');
  const [currentItemIndex, setCurrentItemIndex] = useState(null);

  // Efekt do pobierania danych zapotrzebowania, jeśli edytujemy lub wyświetlamy istniejące
  useEffect(() => {
    if (id && (mode === 'view' || mode === 'edit')) {
      fetchRequisition();
    }

    // Ładuj listę projektów i przedmiotów
    fetchProjects();
    fetchItems();
  }, [id, mode]);

  // Obserwuj listę projektów z kontekstu
  useEffect(() => {
    if (projects && projects.length > 0) {
      setAvailableProjects(projects);
    }
  }, [projects]);

  const fetchRequisition = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/requisitions/${id}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania danych zapotrzebowania');
      }

      const data = await response.json();
      setRequisition(data);
      setError(null);
    } catch (err) {
      console.error('Błąd:', err);
      setError('Nie udało się pobrać danych zapotrzebowania. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
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

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/items/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania listy przedmiotów');
      }

      const data = await response.json();
      setAvailableItems(data);
    } catch (err) {
      console.error('Błąd pobierania przedmiotów:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRequisition(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setItemQuantity(1);
    setItemPrice('');
    setCurrentItemIndex(null);
    setShowItemModal(true);
  };

  const handleEditItem = (index) => {
    const item = requisition.items[index];
    setSelectedItem(item);
    setItemQuantity(item.quantity);
    setItemPrice(item.price || '');
    setCurrentItemIndex(index);
    setShowItemModal(true);
  };

  const handleRemoveItem = (index) => {
    setRequisition(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSaveItem = () => {
    if (!selectedItem) {
      setError('Wybierz przedmiot');
      return;
    }

    // Walidacja ceny
    const finalPrice = itemPrice || selectedItem.price;
    if (!finalPrice || parseFloat(finalPrice) <= 0) {
      setError('Cena musi być dodatnia');
      return;
    }

    const newItem = {
      item: selectedItem.id,
      item_name: selectedItem.name,
      item_index: selectedItem.index,
      quantity: itemQuantity,
      price: parseFloat(finalPrice)
    };

    if (currentItemIndex !== null) {
      // Edycja istniejącego elementu
      setRequisition(prev => ({
        ...prev,
        items: prev.items.map((item, i) => i === currentItemIndex ? newItem : item)
      }));
    } else {
      // Dodanie nowego elementu
      setRequisition(prev => ({
        ...prev,
        items: [...prev.items, newItem]
      }));
    }

    setShowItemModal(false);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Walidacja na froncie
      const validationResponse = await fetch('/api/validate-requisition/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(requisition),
        credentials: 'same-origin',
      });

      const validationResult = await validationResponse.json();
      if (!validationResult.valid) {
        setError(validationResult.message);
        return;
      }

      setLoading(true);

      let response;
      const requisitionData = { ...requisition };

      if (mode === 'create') {
        // Tworzenie nowego zapotrzebowania
        response = await fetch('/api/requisitions/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(requisitionData),
          credentials: 'same-origin',
        });
      } else {
        // Aktualizacja istniejącego zapotrzebowania
        response = await fetch(`/api/requisitions/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          body: JSON.stringify(requisitionData),
          credentials: 'same-origin',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Błąd zapisu zapotrzebowania');
      }

      // Sukces - powrót do listy zapotrzebowań
      navigate('/dashboard/requests/material');

    } catch (err) {
      console.error('Błąd:', err);
      setError(err.message || 'Wystąpił błąd podczas zapisywania zapotrzebowania');
    } finally {
      setLoading(false);
    }
  };

  // Obliczanie łącznej wartości zapotrzebowania
  const calculateTotal = () => {
    return requisition.items.reduce((total, item) => {
      const price = item.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  // Filtrowane przedmioty dla modala
  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.index.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  // Generowanie tytułu formularza w zależności od trybu
  const getFormTitle = () => {
    if (mode === 'create') return 'Nowe zapotrzebowanie materiałowe';
    if (mode === 'edit') return 'Edycja zapotrzebowania materiałowego';
    return 'Szczegóły zapotrzebowania materiałowego';
  };

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
            onClick={() => navigate('/dashboard/requests/material')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">{getFormTitle()}</h1>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                Projekt
              </label>
              <select
                id="project"
                name="project"
                value={requisition.project || ''}
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

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Termin realizacji
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={requisition.deadline || ''}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
              />
            </div>

            {mode !== 'create' && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={requisition.status || 'to_accept'}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-2 border ${isEditing ? 'border-gray-300' : 'border-gray-200 bg-gray-50'} rounded-lg focus:outline-none ${isEditing ? 'focus:ring-2 focus:ring-orange-500' : ''}`}
                >
                  <option value="to_accept">Do akceptacji</option>
                  <option value="accepted">Zaakceptowano</option>
                  <option value="rejected">Odrzucono</option>
                  <option value="in_progress">W trakcie realizacji</option>
                  <option value="completed">Zrealizowano</option>
                </select>
              </div>
            )}

            {mode !== 'create' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numer zapotrzebowania
                </label>
                <div className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg">
                  {requisition.number || '-'}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-700">Przedmioty</h2>
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

            {requisition.items.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FileText className="mx-auto text-gray-400" size={48} />
                <p className="mt-2 text-gray-500">Brak przedmiotów w zapotrzebowaniu</p>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Indeks
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Przedmiot
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ilość
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cena jedn.
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wartość
                      </th>
                      {isEditing && (
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Akcje
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requisition.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.item_index}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.price ? `${item.price.toLocaleString()} zł` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.price ? `${(item.price * item.quantity).toLocaleString()} zł` : '-'}
                          </div>
                        </td>
                        {isEditing && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleEditItem(index)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edytuj"
                              >
                                <EditIcon size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                                title="Usuń"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-6 py-4 text-right font-medium">
                        Razem:
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {calculateTotal().toLocaleString()} zł
                      </td>
                      {isEditing && <td></td>}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {(mode === 'view' && !isEditing) ? (
            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Data utworzenia</p>
                <p className="mt-1">
                  {requisition.created_at ? new Date(requisition.created_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Utworzony przez</p>
                <p className="mt-1">{requisition.created_by_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Data aktualizacji</p>
                <p className="mt-1">
                  {requisition.updated_at ? new Date(requisition.updated_at).toLocaleString() : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Zaktualizowany przez</p>
                <p className="mt-1">{requisition.updated_by_name || '-'}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate('/dashboard/requests/material')}
                className="mr-4 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Anuluj
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="mr-2" size={18} />
                )}
                Zapisz
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Modal wyboru przedmiotu */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {currentItemIndex !== null ? 'Edytuj przedmiot' : 'Dodaj przedmiot'}
                    </h3>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wybierz przedmiot
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Szukaj przedmiotów..."
                          className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={itemSearchTerm}
                          onChange={(e) => setItemSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      </div>

                      <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                        {filteredItems.length === 0 ? (
                          <div className="p-3 text-center text-gray-500">
                            Nie znaleziono przedmiotów
                          </div>
                        ) : (
                          <ul className="divide-y divide-gray-200">
                            {filteredItems.map(item => (
                              <li
                                key={item.id}
                                className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedItem?.id === item.id ? 'bg-blue-50' : ''}`}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setItemPrice(item.price || '');
                                }}
                              >
                                <div className="flex justify-between">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-gray-500 text-sm">{item.index}</div>
                                </div>
                                <div className="text-sm text-gray-500">{item.area_display}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {selectedItem && (
                      <>
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ilość
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={itemQuantity}
                            onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cena jednostkowa (zł)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={itemPrice}
                            onChange={(e) => setItemPrice(e.target.value)}
                            placeholder={selectedItem.price ? `Domyślnie: ${selectedItem.price} zł` : 'Wprowadź cenę'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          {selectedItem.price && (
                            <p className="mt-1 text-xs text-gray-500">
                              Pozostaw puste, aby użyć domyślnej ceny przedmiotu
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={!selectedItem}
                  onClick={handleSaveItem}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-orange-500 text-base font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {currentItemIndex !== null ? 'Zapisz zmiany' : 'Dodaj'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialRequisitionForm;