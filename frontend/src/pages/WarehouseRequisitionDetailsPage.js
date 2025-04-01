// frontend/src/pages/WarehouseRequisitionDetailsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Loader
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import { useRequisitions } from '../contexts/RequisitionContext';
import { useDialog } from '../contexts/DialogContext';

const WarehouseRequisitionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { confirmDialog } = useDialog();
  const { updateSingleRequisition } = useRequisitions();

  const [requisition, setRequisition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchRequisition();
  }, [id]);

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

  const handleStatusChange = async (newStatus) => {
    const statusLabels = {
      'to_accept': 'Do akceptacji',
      'accepted': 'Zaakceptowano',
      'rejected': 'Odrzucono',
      'in_progress': 'W trakcie realizacji',
      'completed': 'Zrealizowano'
    };

    // Zapamiętaj obecny status przed zmianą
    const currentStatus = requisition.status;

    // Natychmiast aktualizuj UI, aby uniknąć opóźnień
    setRequisition(prev => ({
      ...prev,
      status: newStatus
    }));

    confirmDialog(
      `Czy chcesz zmienić status zapotrzebowania na "${statusLabels[newStatus]}"?`,
      async () => {
        try {
          setStatusLoading(true);

          // Pobierz token CSRF przed wysłaniem żądania
          const csrfToken = getCsrfToken();

          const response = await fetch(`/api/requisitions/${id}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'same-origin',
          });

          let responseData;
          try {
            responseData = await response.json();
          } catch (jsonError) {
            console.error('Błąd parsowania odpowiedzi JSON:', jsonError);
            responseData = {};
          }

          if (!response.ok) {
            throw new Error(`Błąd aktualizacji statusu: ${response.status} ${JSON.stringify(responseData)}`);
          }

          // Aktualizuj lokalny stan
          setRequisition(prev => ({
            ...prev,
            status: newStatus
          }));

          // Aktualizuj globalną listę zapotrzebowań, ale tylko to konkretne zapotrzebowanie
          updateSingleRequisition({
            ...requisition,
            status: newStatus
          });

        } catch (err) {
          console.error('Błąd:', err);
          setError('Nie udało się zaktualizować statusu. Spróbuj ponownie później.');

          // Przywróć poprzedni status w UI w przypadku błędu
          setRequisition(prev => ({
            ...prev,
            status: currentStatus
          }));
        } finally {
          setStatusLoading(false);
        }
      },
      // Callback w przypadku kliknięcia "Anuluj" - przywróć poprzedni status
      () => {
        setRequisition(prev => ({
          ...prev,
          status: currentStatus
        }));
      }
    );
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'to_accept':
        return <Clock className="text-yellow-500" size={20} />;
      case 'accepted':
        return <CheckCircle className="text-blue-500" size={20} />;
      case 'in_progress':
        return <Loader className="text-orange-500" size={20} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      'to_accept': 'Do akceptacji',
      'accepted': 'Zaakceptowano',
      'rejected': 'Odrzucono',
      'in_progress': 'W trakcie realizacji',
      'completed': 'Zrealizowano'
    };
    return statusMap[status] || status;
  };

  if (loading && !requisition) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
        <div className="flex items-center">
          <AlertCircle className="mr-2" size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-medium text-gray-700">Zapotrzebowanie nie zostało znalezione</h2>
        <button
          onClick={() => navigate('/dashboard/warehouse/requisitions')}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Wróć do listy zapotrzebowań
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/dashboard/warehouse/requisitions')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Szczegóły zapotrzebowania</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        {/* Nagłówek zapotrzebowania */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div>
            <h2 className="text-sm font-medium text-gray-500">Numer zapotrzebowania</h2>
            <p className="mt-1 text-lg font-semibold">{requisition.number}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Projekt</h2>
            <p className="mt-1 text-lg">{requisition.project_name || '-'}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Status</h2>
            <div className="mt-1 flex items-center">
              {getStatusIcon(requisition.status)}
              <span className="ml-2 text-lg">{getStatusText(requisition.status)}</span>
              {statusLoading && (
                <div className="ml-2 animate-spin h-4 w-4 border-2 border-orange-500 rounded-full border-t-transparent"></div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Termin realizacji</h2>
            <p className="mt-1 text-lg">
              {requisition.deadline ? new Date(requisition.deadline).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Data utworzenia</h2>
            <p className="mt-1 text-lg">
              {requisition.created_at ? new Date(requisition.created_at).toLocaleDateString() : '-'}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Utworzony przez</h2>
            <p className="mt-1 text-lg">{requisition.created_by_name || '-'}</p>
          </div>
        </div>

        {/* Zmiana statusu */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Zmiana statusu</h2>
          <div className="flex items-center space-x-4">
            <label htmlFor="status" className="text-gray-700">Nowy status:</label>
            <select
              id="status"
              value={requisition.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusLoading}
              className={`border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${statusLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="to_accept">Do akceptacji</option>
              <option value="accepted">Zaakceptowano</option>
              <option value="in_progress">W trakcie realizacji</option>
              <option value="completed">Zrealizowano</option>
              <option value="rejected">Odrzucono</option>
            </select>
          </div>
        </div>

        {/* Komentarz */}
        {requisition.comment && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Komentarz</h2>
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-gray-700">{requisition.comment}</p>
            </div>
          </div>
        )}

        {/* Lista przedmiotów */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Przedmioty</h2>
          {requisition.items && requisition.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Indeks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nazwa przedmiotu
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
                          {item.price ? `${parseFloat(item.price).toLocaleString()} zł` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {item.price ? `${(parseFloat(item.price) * item.quantity).toLocaleString()} zł` : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td colSpan="4" className="px-6 py-4 text-right font-medium">
                      Razem:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {requisition.total_price !== undefined ? `${parseFloat(requisition.total_price).toLocaleString()} zł` : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 p-4 border rounded-lg">
              Brak przedmiotów w zapotrzebowaniu
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WarehouseRequisitionDetailsPage;