// frontend/src/pages/WarehouseRequisitionsPage.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Loader,
  Eye,
  Filter,
  Download,
  Printer,
  CalendarRange,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import { useRequisitions } from '../contexts/RequisitionContext';
import { useDialog } from '../contexts/DialogContext';
import WarehouseRequisitionDetailsPage from './WarehouseRequisitionDetailsPage';
import * as XLSX from 'xlsx';

const WarehouseRequisitionsPage = () => {
  const navigate = useNavigate();
  const { confirm, showInfo, showWarning } = useDialog();
  const {
    requisitions,
    loading,
    error,
    refreshRequisitions,
    updateSingleRequisition
  } = useRequisitions();

  const printFrameRef = useRef(null);

  // Stan dla podstawowego wyszukiwania
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  // Stan dla zaawansowanych filtrów
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    createdBy: '',
    minPrice: '',
    maxPrice: '',
  });

  // Filtr po typie zapotrzebowania (tylko materiałowe)
  const [requisitionType] = useState('material');

  // Stan dla rozwijanych zapotrzebowań
  const [expandedRequisition, setExpandedRequisition] = useState(null);
  const [requisitionDetails, setRequisitionDetails] = useState({});
  const [localStatuses, setLocalStatuses] = useState({});
  const [statusUpdating, setStatusUpdating] = useState({});

  // Efekt do inicjalizacji lokalnych statusów
  useEffect(() => {
    const newLocalStatuses = {};
    requisitions.forEach(req => {
      newLocalStatuses[req.id] = req.status;
    });
    setLocalStatuses(newLocalStatuses);
  }, [requisitions]);

  // Efekt pobierający szczegóły konkretnego zapotrzebowania po rozwinięciu
  useEffect(() => {
    if (expandedRequisition && !requisitionDetails[expandedRequisition]) {
      fetchRequisitionDetails(expandedRequisition);
    }
  }, [expandedRequisition]);

  const fetchRequisitionDetails = async (requisitionId) => {
    try {
      const response = await fetch(`/api/requisitions/${requisitionId}/`, {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania szczegółów zapotrzebowania');
      }

      const data = await response.json();
      setRequisitionDetails(prev => ({
        ...prev,
        [requisitionId]: data
      }));
    } catch (err) {
      console.error('Błąd pobierania szczegółów:', err);
    }
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = (requisitionId, newStatus) => {
    const statusLabels = {
      'to_accept': 'Do akceptacji',
      'accepted': 'Zaakceptowano',
      'rejected': 'Odrzucono',
      'in_progress': 'W trakcie realizacji',
      'completed': 'Zrealizowano'
    };

    // Znajdź pełen obiekt zapotrzebowania
    const requisition = requisitions.find(req => req.id === requisitionId);
    if (!requisition) return;

    // Zapamiętaj obecny status przed zmianą
    const previousStatus = requisition.status;

    // Natychmiast aktualizuj wyświetlany status w kolumnie Status i dropdown
    setLocalStatuses(prev => ({
      ...prev,
      [requisitionId]: newStatus
    }));

    // Użyj metody confirm z kontekstu dialogowego
    confirm(
      `Czy chcesz zmienić status zapotrzebowania na "${statusLabels[newStatus]}"?`,
      async () => {
        try {
          // Pokaż wskaźnik ładowania dla tego konkretnego wiersza
          setStatusUpdating(prev => ({ ...prev, [requisitionId]: true }));

          const csrfToken = getCsrfToken();
          const response = await fetch(`/api/requisitions/${requisitionId}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({ status: newStatus }),
            credentials: 'same-origin',
          });

          if (!response.ok) {
            throw new Error(`Błąd serwera: ${response.status}`);
          }

          // Pobierz zaktualizowane dane
          const responseData = await response.json();

          // Aktualizuj pojedyncze zapotrzebowanie w kontekście
          updateSingleRequisition({
            ...requisition,
            status: newStatus
          });

          // Pokaż komunikat o sukcesie
          showInfo("Status został pomyślnie zaktualizowany");
        } catch (err) {
          console.error('Błąd podczas zmiany statusu:', err);

          // Przywróć poprzedni status w UI
          setLocalStatuses(prev => ({
            ...prev,
            [requisitionId]: previousStatus
          }));

          // Pokaż komunikat o błędzie
          showWarning(err.message || 'Wystąpił błąd podczas zmiany statusu');
        } finally {
          // Usuń wskaźnik ładowania
          setStatusUpdating(prev => ({ ...prev, [requisitionId]: false }));
        }
      },
      // W przypadku anulowania dialogu, przywróć poprzedni status
      () => {
        setLocalStatuses(prev => ({
          ...prev,
          [requisitionId]: previousStatus
        }));
      }
    );
  };

  // Filtrowanie zapotrzebowań
  const filteredRequisitions = (() => {
    // Filtruj najpierw po typie materiałowym
    let filtered = requisitions.filter(req => req.requisition_type === requisitionType);

    // Filtruj po statusie
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filtruj po podstawowym wyszukiwaniu
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        (req.number && req.number.toLowerCase().includes(searchLower)) ||
        (req.project_name && req.project_name.toLowerCase().includes(searchLower)) ||
        (req.comment && req.comment.toLowerCase().includes(searchLower))
      );
    }

    // Zastosuj zaawansowane filtry
    if (showAdvancedFilters) {
      // Filtruj po dacie od
      if (advancedFilters.dateFrom) {
        const fromDate = new Date(advancedFilters.dateFrom);
        filtered = filtered.filter(req => {
          const createdDate = new Date(req.created_at);
          return createdDate >= fromDate;
        });
      }

      // Filtruj po dacie do
      if (advancedFilters.dateTo) {
        const toDate = new Date(advancedFilters.dateTo);
        // Ustaw koniec dnia dla daty końcowej
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(req => {
          const createdDate = new Date(req.created_at);
          return createdDate <= toDate;
        });
      }

      // Filtruj po projektach
      if (advancedFilters.project) {
        filtered = filtered.filter(req =>
          req.project_name && req.project_name.toLowerCase().includes(advancedFilters.project.toLowerCase())
        );
      }

      // Filtruj po osobie tworzącej
      if (advancedFilters.createdBy) {
        filtered = filtered.filter(req =>
          req.created_by_name && req.created_by_name.toLowerCase().includes(advancedFilters.createdBy.toLowerCase())
        );
      }

      // Filtruj po cenie minimalnej
      if (advancedFilters.minPrice && !isNaN(advancedFilters.minPrice)) {
        const minPrice = parseFloat(advancedFilters.minPrice);
        filtered = filtered.filter(req => req.total_price >= minPrice);
      }

      // Filtruj po cenie maksymalnej
      if (advancedFilters.maxPrice && !isNaN(advancedFilters.maxPrice)) {
        const maxPrice = parseFloat(advancedFilters.maxPrice);
        filtered = filtered.filter(req => req.total_price <= maxPrice);
      }
    }

    // Sortowanie
    return [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Obsługa pól zagnieżdżonych
      if (sortField === 'project_name') {
        aValue = a.project_name || '';
        bValue = b.project_name || '';
      }

      // Obsługa dat
      if (sortField === 'created_at' || sortField === 'deadline') {
        aValue = aValue ? new Date(aValue) : null;
        bValue = bValue ? new Date(bValue) : null;

        if (!aValue && !bValue) return 0;
        if (!aValue) return 1;
        if (!bValue) return -1;
      }

      // Obsługa tekstu
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Obsługa innych typów
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      return sortDirection === 'asc'
        ? aValue < bValue ? -1 : 1
        : aValue < bValue ? 1 : -1;
    });
  })();

  // Resetowanie filtrów
  const resetFilters = () => {
    setAdvancedFilters({
      dateFrom: '',
      dateTo: '',
      project: '',
      createdBy: '',
      minPrice: '',
      maxPrice: '',
    });
    setSearchTerm('');
    setStatusFilter('all');
  };

  // Eksport do XLSX
  const exportToXLSX = () => {
    // Przygotowanie danych do eksportu
    const worksheetData = filteredRequisitions.map(req => ({
      'Numer': req.number,
      'Projekt': req.project_name || '',
      'Status': getStatusText(req.status),
      'Termin realizacji': req.deadline ? new Date(req.deadline).toLocaleDateString() : '',
      'Data utworzenia': req.created_at ? new Date(req.created_at).toLocaleDateString() : '',
      'Utworzony przez': req.created_by_name || '',
      'Wartość': req.total_price ? req.total_price.toFixed(2) + ' zł' : '0.00 zł',
      'Komentarz': req.comment || ''
    }));

    // Tworzenie arkusza
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Tworzenie skoroszytu
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Zapotrzebowania');

    // Ustawienie szerokości kolumn
    const columnWidths = [
      { wch: 15 }, // Numer
      { wch: 25 }, // Projekt
      { wch: 15 }, // Status
      { wch: 15 }, // Termin realizacji
      { wch: 15 }, // Data utworzenia
      { wch: 20 }, // Utworzony przez
      { wch: 15 }, // Wartość
      { wch: 40 }, // Komentarz
    ];
    worksheet['!cols'] = columnWidths;

    // Zapisanie i pobranie pliku
    const filename = `zapotrzebowania_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);

    showInfo(`Wyeksportowano ${worksheetData.length} zapotrzebowań do pliku ${filename}`);
  };

  // Generowanie wydruku
  const generatePrint = () => {
    // Tworzymy nowe okno do wydruku
    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      showWarning('Blokada wyskakujących okienek! Proszę zezwolić na wyskakujące okienka dla tej strony.');
      return;
    }

    // Generujemy zawartość HTML do wydruku
    const printContent = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wydruk zapotrzebowań - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; }
          .info { text-align: center; margin-bottom: 20px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f2f2f2; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
            h1 { margin-top: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="padding: 10px; background: #f0f0f0; margin-bottom: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; cursor: pointer;">
            Drukuj
          </button>
          <button onclick="window.close()" style="padding: 8px 16px; background: #f44336; color: white; border: none; margin-left: 10px; cursor: pointer;">
            Zamknij
          </button>
        </div>

        <h1>Lista zapotrzebowań materiałowych</h1>
        <div class="info">Wygenerowano: ${new Date().toLocaleString()} | Liczba zapotrzebowań: ${filteredRequisitions.length}</div>

        <table>
          <thead>
            <tr>
              <th>Numer</th>
              <th>Projekt</th>
              <th>Status</th>
              <th>Termin</th>
              <th>Data utworzenia</th>
              <th>Utworzony przez</th>
              <th>Wartość</th>
            </tr>
          </thead>
          <tbody>
            ${filteredRequisitions.map(req => `
              <tr>
                <td>${req.number}</td>
                <td>${req.project_name || '-'}</td>
                <td>${getStatusText(req.status)}</td>
                <td>${req.deadline ? new Date(req.deadline).toLocaleDateString() : '-'}</td>
                <td>${req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</td>
                <td>${req.created_by_name || '-'}</td>
                <td>${req.total_price ? req.total_price.toFixed(2) + ' zł' : '0.00 zł'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Solar For You - System Zarządzania | &copy; ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `;

    // Wpisujemy zawartość do nowego okna
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const MainContent = () => (
    <div>
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate('/dashboard/warehouse')}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Zapotrzebowania</h1>
          <p className="text-gray-600 mt-1">Zarządzanie zapotrzebowaniami magazynowymi</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        {/* Górny pasek narzędzi z opcjami exportu i filtrami */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Szukaj zapotrzebowań..."
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center px-3 py-2 rounded-lg ${
                showAdvancedFilters
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Zaawansowane filtry"
            >
              <SlidersHorizontal size={16} className="mr-1" />
              Filtry {showAdvancedFilters && <X size={14} className="ml-1" />}
            </button>

            <button
              onClick={exportToXLSX}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              title="Eksportuj do Excel"
            >
              <Download size={16} className="mr-1" />
              Excel
            </button>

            <button
              onClick={generatePrint}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="Wersja do druku"
            >
              <Printer size={16} className="mr-1" />
              Drukuj
            </button>
          </div>
        </div>

        {/* Panel zaawansowanych filtrów */}
        {showAdvancedFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-700">Zaawansowane filtry</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Resetuj filtry
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Okres utworzenia</label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Od"
                      value={advancedFilters.dateFrom}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, dateFrom: e.target.value})}
                    />
                  </div>
                  <span>-</span>
                  <div className="relative flex-1">
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Do"
                      value={advancedFilters.dateTo}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, dateTo: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projekt</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Nazwa projektu"
                  value={advancedFilters.project}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, project: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utworzone przez</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Osoba tworząca"
                  value={advancedFilters.createdBy}
                  onChange={(e) => setAdvancedFilters({...advancedFilters, createdBy: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wartość (zł)</label>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Od"
                      value={advancedFilters.minPrice}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, minPrice: e.target.value})}
                    />
                  </div>
                  <span>-</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Do"
                      value={advancedFilters.maxPrice}
                      onChange={(e) => setAdvancedFilters({...advancedFilters, maxPrice: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Przyciski filtra statusów */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              statusFilter === 'all'
                ? 'bg-gray-200 text-gray-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Wszystkie
          </button>
          <button
            onClick={() => setStatusFilter('to_accept')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              statusFilter === 'to_accept'
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
            }`}
          >
            Do akceptacji
          </button>
          <button
            onClick={() => setStatusFilter('accepted')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              statusFilter === 'accepted'
                ? 'bg-blue-200 text-blue-800'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            Zaakceptowane
          </button>
          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              statusFilter === 'in_progress'
                ? 'bg-orange-200 text-orange-800'
                : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
            }`}
          >
            W realizacji
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              statusFilter === 'completed'
                ? 'bg-green-200 text-green-800'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            Zrealizowane
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              statusFilter === 'rejected'
                ? 'bg-red-200 text-red-800'
                : 'bg-red-100 text-red-600 hover:bg-red-200'
            }`}
          >
            Odrzucone
          </button>
        </div>

        {/* Informacja o liczbie wyników */}
        <div className="mb-4 text-sm text-gray-500">
          Znaleziono {filteredRequisitions.length} zapotrzebowań spełniających kryteria
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <div className="flex items-center">
              <AlertCircle className="mr-2" size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading && requisitions.length === 0 ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            Nie znaleziono zapotrzebowań spełniających kryteria wyszukiwania
            <button
              onClick={() => refreshRequisitions()}
              className="mt-4 px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Odśwież dane
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('number')}>
                    <div className="flex items-center">
                      Numer
                      {sortField === 'number' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('project_name')}>
                    <div className="flex items-center">
                      Projekt
                      {sortField === 'project_name' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('deadline')}>
                    <div className="flex items-center">
                      Termin
                      {sortField === 'deadline' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Data utworzenia
                      {sortField === 'created_at' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('total_price')}>
                    <div className="flex items-center">
                      Wartość
                      {sortField === 'total_price' && <ArrowUpDown className="ml-1" size={14} />}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequisitions.map((requisition) => (
                  <React.Fragment key={requisition.id}>
                    <tr className={`hover:bg-gray-50 ${expandedRequisition === requisition.id ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{requisition.number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{requisition.project_name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {requisition.deadline ? new Date(requisition.deadline).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(localStatuses[requisition.id] || requisition.status)}
                          <span className="ml-2">
                            {getStatusText(localStatuses[requisition.id] || requisition.status)}
                          </span>
                          {statusUpdating[requisition.id] && (
                            <div className="ml-2 animate-spin h-4 w-4 border-2 border-orange-500 rounded-full border-t-transparent"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">
                          {requisition.created_at ? new Date(requisition.created_at).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500 font-medium">
                          {requisition.total_price ? `${requisition.total_price.toFixed(2)} zł` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => setExpandedRequisition(expandedRequisition === requisition.id ? null : requisition.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Pokaż/ukryj przedmioty"
                          >
                            {expandedRequisition === requisition.id ?
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 15l-6-6-6 6"></path>
                              </svg> :
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9l6 6 6-6"></path>
                              </svg>
                            }
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/warehouse/requisitions/${requisition.id}`)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Zobacz szczegóły"
                            disabled={statusUpdating[requisition.id]}
                          >
                            <Eye size={18} />
                          </button>
                          <select
                            value={localStatuses[requisition.id] || requisition.status}
                            onChange={(e) => handleStatusChange(requisition.id, e.target.value)}
                            className={`text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                              statusUpdating[requisition.id] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={statusUpdating[requisition.id]}
                          >
                            <option value="to_accept">Do akceptacji</option>
                            <option value="accepted">Zaakceptowano</option>
                            <option value="in_progress">W trakcie realizacji</option>
                            <option value="completed">Zrealizowano</option>
                            <option value="rejected">Odrzucono</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                    {expandedRequisition === requisition.id && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          {requisitionDetails[requisition.id] ? (
                            <div>
                              <h3 className="font-medium text-gray-900 mb-2">Przedmioty w zapotrzebowaniu:</h3>
                              {requisitionDetails[requisition.id].items && requisitionDetails[requisition.id].items.length > 0 ? (
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Indeks
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Nazwa przedmiotu
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Ilość
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Cena jedn.
                                        </th>
                                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                          Wartość
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {requisitionDetails[requisition.id].items.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-gray-50">
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.item_index}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                            {item.item_name}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.quantity}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.price ? `${parseFloat(item.price).toLocaleString()} zł` : '-'}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            {item.price ? `${(parseFloat(item.price) * item.quantity).toLocaleString()} zł` : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                      <tr className="bg-gray-50 font-medium">
                                        <td colSpan="4" className="px-4 py-2 text-right">
                                          Razem:
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          {requisitionDetails[requisition.id].total_price !== undefined ?
                                            `${parseFloat(requisitionDetails[requisition.id].total_price).toLocaleString()} zł` : '-'}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-gray-500">Brak przedmiotów w zapotrzebowaniu</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex justify-center p-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Loading indicator only when actually loading */}
        {loading && (
          <div className="fixed bottom-4 right-4 bg-white p-2 rounded-full shadow-lg z-10">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}
      </div>

      {/* Ukryta ramka do drukowania - alternatywna metoda */}
      <iframe
        ref={printFrameRef}
        style={{display: 'none'}}
        title="Print Frame"
      />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<MainContent />} />
      <Route path="/:id" element={<WarehouseRequisitionDetailsPage />} />
    </Routes>
  );
};

export default WarehouseRequisitionsPage;