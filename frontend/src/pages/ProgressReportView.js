// frontend/src/pages/ProgressReportView.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart as BarChartIcon,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Filter,
  Flag,
  Image as ImageIcon,
  LineChart,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  User,
  Users,
  FileText,
  EditIcon,
  X
} from 'lucide-react';
import { getCsrfToken } from '../utils/csrfToken';
import ProgressReportBarChart from '../components/ProgressReportBarChart';

const ProgressReportView = () => {
  const navigate = useNavigate();

  // State management
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('last30');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'charts'
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [chartData, setChartData] = useState({ projects: [], timeline: [] });
  const [stats, setStats] = useState({
    totalReports: 0,
    totalHours: 0,
    avgHoursPerDay: 0,
    mostActiveEmployee: ''
  });

  // Project filter states
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');

  // Calendar view states
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);

  // Refs
  const searchInputRef = useRef(null);

  // Fetch reports on initial load
  useEffect(() => {
    fetchReports();
  }, []);

  // Update filtered reports when search term, filter period, or selected project changes
  useEffect(() => {
    if (reports.length > 0) {
      applyFilters();
      generateChartData();
      calculateStats();

      // Extract unique projects when reports change
      if (selectedProject === 'all') {
        const uniqueProjects = [...new Set(reports.map(report => {
          return {
            id: report.project,
            name: report.project_name || `Projekt ${report.project}`
          };
        }).filter(p => p.id).map(p => JSON.stringify(p)))].map(p => JSON.parse(p));

        setAvailableProjects(uniqueProjects);
      }
    }
  }, [reports, searchTerm, filterPeriod, selectedProject]);

  // Prepare calendar data when month or reports change
  useEffect(() => {
    if (reports.length > 0) {
      generateCalendarData();
    }
  }, [reports, currentMonth]);

  /**
   * Fetches all progress reports for the current user
   */
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/progress-reports/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Nie udało się pobrać raportów postępu');
      }

      const data = await response.json();
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Wystąpił problem podczas pobierania raportów. Spróbuj odświeżyć stronę.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Applies the search term, time period, and project filters to the reports
   */
  const applyFilters = () => {
    let result = [...reports];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(report =>
        (report.project_name && report.project_name.toLowerCase().includes(term)) ||
        (report.date && report.date.includes(term)) ||
        (report.created_by_name && report.created_by_name.toLowerCase().includes(term))
      );
    }

    // Apply time period filter
    const today = new Date();
    let cutoffDate;

    switch (filterPeriod) {
      case 'last7':
        cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - 7);
        break;
      case 'last30':
        cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - 30);
        break;
      case 'last90':
        cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - 90);
        break;
      case 'thisYear':
        cutoffDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        cutoffDate = null;
        break;
    }

    if (cutoffDate) {
      result = result.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= cutoffDate;
      });
    }

    // Apply project filter
    if (selectedProject !== 'all') {
      result = result.filter(report => report.project == selectedProject);
    }

    // Sort by date, newest first
    result.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredReports(result);
  };

  /**
   * Generates data for the charts
   */
  const generateChartData = () => {
    if (reports.length === 0) return;

    // Create project-based data
    const projectsMap = new Map();
    const employeesMap = new Map();

    reports.forEach(report => {
      // Skip reports without entries
      if (!report.entries || report.entries.length === 0) return;

      // Get project data
      const projectName = report.project_name || `Projekt ${report.project}`;
      if (!projectsMap.has(projectName)) {
        projectsMap.set(projectName, {
          name: projectName,
          hours: 0,
          employees: new Set(),
          reports: 0
        });
      }

      const projectData = projectsMap.get(projectName);
      projectData.reports += 1;

      // Process entries
      report.entries.forEach(entry => {
        // Add hours to project
        const hours = parseFloat(entry.hours_worked) || 0;
        projectData.hours += hours;

        // Add employee to project
        if (entry.employee) {
          projectData.employees.add(entry.employee);
        }

        // Track employee hours
        const employeeName = entry.employee_name || `Pracownik ${entry.employee}`;
        if (!employeesMap.has(employeeName)) {
          employeesMap.set(employeeName, 0);
        }
        employeesMap.set(employeeName, employeesMap.get(employeeName) + hours);
      });
    });

    // Convert Maps to arrays for charts
    const projectsData = Array.from(projectsMap.values())
      .map(project => ({
        name: project.name,
        hours: Math.round(project.hours * 10) / 10,
        employees: project.employees.size,
        reports: project.reports
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Top 10 projects

    // Generate timeline data (monthly)
    const timelineMap = new Map();
    reports.forEach(report => {
      // Skip reports without entries
      if (!report.entries || report.entries.length === 0) return;

      const date = new Date(report.date);
      const month = date.toLocaleString('pl-PL', { month: 'short', year: 'numeric' });

      if (!timelineMap.has(month)) {
        timelineMap.set(month, {
          name: month,
          hours: 0,
          reports: 0,
          date: date // Store date for sorting
        });
      }

      const monthData = timelineMap.get(month);
      monthData.reports += 1;

      // Add hours from entries
      report.entries.forEach(entry => {
        monthData.hours += parseFloat(entry.hours_worked) || 0;
      });
    });

    // Convert timeline data to array and sort by date
    const timelineData = Array.from(timelineMap.values())
      .sort((a, b) => a.date - b.date)
      .map(item => ({
        name: item.name,
        hours: Math.round(item.hours * 10) / 10,
        reports: item.reports
      }));

    setChartData({
      projects: projectsData,
      timeline: timelineData
    });
  };

  /**
   * Calculates statistics based on the filtered reports
   */
  const calculateStats = () => {
    // Use filtered reports instead of all reports to reflect current view
    const reportsToProcess = selectedProject === 'all' ? reports : filteredReports;

    if (reportsToProcess.length === 0) return;

    let totalHours = 0;
    let reportDays = new Set();
    const employeeHours = {};

    reportsToProcess.forEach(report => {
      // Skip reports without entries
      if (!report.entries || report.entries.length === 0) return;

      // Add date to set for unique days calculation
      reportDays.add(report.date);

      // Process entries
      report.entries.forEach(entry => {
        const hours = parseFloat(entry.hours_worked) || 0;
        totalHours += hours;

        // Track employee hours
        const employeeName = entry.employee_name || `Pracownik ${entry.employee}`;
        if (!employeeHours[employeeName]) {
          employeeHours[employeeName] = 0;
        }
        employeeHours[employeeName] += hours;
      });
    });

    // Find most active employee
    let mostActiveEmployee = '';
    let maxEmployeeHours = 0;
    Object.entries(employeeHours).forEach(([employee, hours]) => {
      if (hours > maxEmployeeHours) {
        maxEmployeeHours = hours;
        mostActiveEmployee = employee;
      }
    });

    setStats({
      totalReports: reportsToProcess.length,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHoursPerDay: reportDays.size ? Math.round((totalHours / reportDays.size) * 10) / 10 : 0,
      mostActiveEmployee
    });
  };

  /**
   * Generates data for the calendar view
   */
  const generateCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of month and number of days in month
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get the day of the week of the first day (0-6, 0 is Sunday)
    const firstDayOfWeek = firstDayOfMonth.getDay();

    // Create array with days from previous month to fill first row
    const prevMonthDays = firstDayOfWeek === 0 ? [] : Array(firstDayOfWeek).fill(null);

    // Create array with days of the current month
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];

      // Find reports for this day
      const dayReports = reports.filter(report => report.date === dateString);

      return {
        day,
        date: dateString,
        reports: dayReports,
        totalHours: dayReports.reduce((total, report) => {
          if (!report.entries) return total;
          return total + report.entries.reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);
        }, 0),
        isToday: dateString === new Date().toISOString().split('T')[0]
      };
    });

    // Combine arrays
    const calendarDays = [...prevMonthDays, ...currentMonthDays];

    // Add days from next month to complete the last row
    const rowsNeeded = Math.ceil(calendarDays.length / 7);
    const totalCells = rowsNeeded * 7;
    const nextMonthDays = Array(totalCells - calendarDays.length).fill(null);

    setCalendarData([...calendarDays, ...nextMonthDays]);
  };

  /**
   * Handles month navigation in calendar view
   */
  const changeMonth = (direction) => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      newMonth.setMonth(prevMonth.getMonth() + direction);
      return newMonth;
    });
  };

  /**
   * Opens the report details modal
   */
  const openReportDetails = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  /**
   * Opens the image viewer modal
   */
  const openImageViewer = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  /**
   * Formats date for display
   */
  const formatDate = (dateString, format = 'long') => {
    const date = new Date(dateString);

    if (format === 'long') {
      return date.toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } else {
      return date.toLocaleDateString('pl-PL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  /**
   * Formats time span between two dates
   */
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Dzisiaj';
    } else if (diffInDays === 1) {
      return 'Wczoraj';
    } else if (diffInDays < 7) {
      return `${diffInDays} dni temu`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'tydzień' : weeks < 5 ? 'tygodnie' : 'tygodni'} temu`;
    } else {
      return formatDate(dateString, 'short');
    }
  };

  /**
   * Determines the color for hour values
   */
  const getHoursColor = (hours) => {
    if (hours === 0) return 'text-gray-400';
    if (hours < 4) return 'text-yellow-500';
    if (hours < 8) return 'text-green-500';
    return 'text-blue-500';
  };

  /**
   * Returns a status indicator dot based on the number of reports
   */
  const getStatusIndicator = (numReports) => {
    if (numReports === 0) return null;

    const colors = {
      1: 'bg-blue-500',
      2: 'bg-green-500',
      3: 'bg-purple-500'
    };

    const color = colors[numReports] || 'bg-red-500';

    return (
      <span className={`relative flex h-3 w-3 mr-2`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-75`}></span>
        <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`}></span>
      </span>
    );
  };

  /**
   * Handles export of data to CSV
   */
  const exportReportsToCSV = () => {
    // Get visible reports based on filters
    const reportsToExport = filteredReports;
    if (reportsToExport.length === 0) return;

    // Create headers
    let csvContent = "Data,Projekt,Pracownicy,Łączne godziny,Utworzony przez\n";

    // Add report data
    reportsToExport.forEach(report => {
      const date = report.date;
      const project = report.project_name || `Projekt ${report.project}`;
      const numEmployees = report.entries ? report.entries.length : 0;
      const totalHours = report.entries
        ? report.entries.reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0)
        : 0;
      const author = report.created_by_name || '';

      // Escape fields with commas
      const escapedProject = `"${project.replace(/"/g, '""')}"`;
      const escapedAuthor = `"${author.replace(/"/g, '""')}"`;

      csvContent += `${date},${escapedProject},${numEmployees},${totalHours},${escapedAuthor}\n`;
    });

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `raporty-postepu-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get the total hours worked for a report
  const getTotalHours = (report) => {
    if (!report.entries) return 0;
    return report.entries.reduce((sum, entry) => sum + (parseFloat(entry.hours_worked) || 0), 0);
  };

  // Calendar view weekday headers
  const weekDays = useMemo(() =>
    ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'].map(day =>
      day.substring(0, 3)
    ), []);

  // Loading state
  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
        <p className="text-gray-500">Ładowanie raportów postępu...</p>
      </div>
    );
  }

  // Error state
  if (error && reports.length === 0) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-red-500">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchReports}
          className="mt-3 flex items-center text-sm text-red-700 hover:text-red-900"
        >
          <RefreshCw size={14} className="mr-1" /> Odśwież dane
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Raporty postępu prac</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-white rounded-lg shadow border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Odśwież
          </button>
          <button
            onClick={() => navigate('/dashboard/reports/create')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Nowy raport
          </button>
        </div>
      </div>

      {/* Project Selection */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center">
          <Flag className="text-gray-400 mr-2" size={20} />
          <h2 className="text-lg font-medium text-gray-900 mr-4">Projekt:</h2>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-full md:w-auto"
          >
            <option value="all">Wszystkie projekty</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Wszystkie raporty</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReports}</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="text-blue-500" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Łączny czas pracy</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalHours} godz.</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="text-green-500" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 mb-1">Najaktywniejszy pracownik</p>
              <p className="text-lg font-semibold text-gray-900 truncate max-w-[150px]">
                {stats.mostActiveEmployee || "Brak danych"}
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg">
              <User className="text-purple-500" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-4">
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Szukaj raportów, dat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm('')}
              >
                <X className="text-gray-400 hover:text-gray-600" size={18} />
              </button>
            )}
          </div>

          {/* Filter by time period */}
          <div className="flex items-center">
            <Filter className="text-gray-400 mr-2" size={18} />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="last7">Ostatnie 7 dni</option>
              <option value="last30">Ostatnie 30 dni</option>
              <option value="last90">Ostatnie 90 dni</option>
              <option value="thisYear">Ten rok</option>
              <option value="all">Wszystkie</option>
            </select>
          </div>

          {/* View selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-3 py-1.5 rounded-md flex items-center ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FileText size={16} className={`${viewMode === 'list' ? 'text-orange-500' : 'text-gray-500'}`} />
              <span className="ml-1 text-sm">Lista</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-md flex items-center ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <Calendar size={16} className={`${viewMode === 'calendar' ? 'text-orange-500' : 'text-gray-500'}`} />
              <span className="ml-1 text-sm">Kalendarz</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-md flex items-center ${viewMode === 'charts' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setViewMode('charts')}
            >
              <BarChartIcon size={16} className={`${viewMode === 'charts' ? 'text-orange-500' : 'text-gray-500'}`} />
              <span className="ml-1 text-sm">Wykresy</span>
            </button>
          </div>

          {/* Export button */}
          <button
            onClick={exportReportsToCSV}
            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
            disabled={filteredReports.length === 0}
          >
            <Download size={16} className="mr-1 text-gray-500" />
            <span className="text-sm">Eksport CSV</span>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filteredReports.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FileText size={48} />
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Brak raportów</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Nie znaleziono raportów dla podanych kryteriów wyszukiwania.'
              : 'Nie masz jeszcze żadnych raportów postępu prac.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/dashboard/reports/create')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center mx-auto"
            >
              <Plus size={16} className="mr-2" />
              Utwórz pierwszy raport
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && filteredReports.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projekt</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pracownicy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Godziny</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcje</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => {
                  const totalHours = getTotalHours(report);
                  const numEmployees = report.entries?.length || 0;
                  const isDraft = report.is_draft === true;

                  return (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{formatDate(report.date, 'short')}</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(report.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{report.project_name || `Projekt ${report.project}`}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users size={16} className="text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{numEmployees}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getHoursColor(totalHours)}`}>
                          {totalHours} godz.
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isDraft ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Wersja robocza
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Finalny
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openReportDetails(report)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/reports/edit/${report.id}`)}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                          disabled={!isDraft}
                        >
                          <EditIcon size={16} className={isDraft ? '' : 'opacity-50 cursor-not-allowed'} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {currentMonth.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex space-x-1">
              <button
                onClick={() => changeMonth(-1)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {weekDays.map(day => (
              <div key={day} className="bg-gray-50 py-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}

            {calendarData.map((dayData, index) => (
              <div
                key={index}
                className={`min-h-32 bg-white ${dayData ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                onClick={() => dayData && dayData.reports.length > 0 && openReportDetails(dayData.reports[0])}
              >
                {dayData ? (
                  <div className="p-2 h-full">
                    <div className={`text-sm font-medium ${dayData.isToday ? 'bg-blue-100 text-blue-800 rounded-full w-7 h-7 flex items-center justify-center' : 'text-gray-900'}`}>
                      {dayData.day}
                    </div>

                    {dayData.reports.length > 0 && (
                      <div className="mt-2">
                        {dayData.reports.map(report => (
                          <div
                            key={report.id}
                            className={`mb-1 p-1 text-xs rounded ${report.is_draft ? 'bg-yellow-100' : 'bg-green-100'}`}
                          >
                            <div className="font-medium truncate">{report.project_name}</div>
                            <div className="flex items-center justify-between mt-1">
                              <span>{getTotalHours(report)} godz.</span>
                              <span>{report.entries?.length || 0} os.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {dayData.totalHours > 0 && dayData.reports.length > 1 && (
                      <div className="mt-1 text-xs font-medium text-gray-500">
                        Łącznie: {dayData.totalHours} godz.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="space-y-6">
          {/* Projects Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Projekty wg przepracowanych godzin</h2>

            {chartData.projects.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Brak danych do wyświetlenia na wykresie</p>
              </div>
            ) : (
              <div className="h-80">
                <ProgressReportBarChart
                  data={chartData.projects}
                  type="byProject"
                />
              </div>
            )}
          </div>

          {/* Timeline Chart */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Godziny pracy w czasie</h2>

            {chartData.timeline.length === 0 ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-500">Brak danych do wyświetlenia na wykresie</p>
              </div>
            ) : (
              <div className="h-80">
                <ProgressReportBarChart
                  data={chartData.timeline}
                  type="byDate"
                />
              </div>
            )}
          </div>

          {/* Top Employee Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Statystyki</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Kluczowe informacje</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span className="text-gray-600">Średnia dzienna:</span>
                    <span className="font-medium">{stats.avgHoursPerDay} godz./dzień</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Najaktywniejszy pracownik:</span>
                    <span className="font-medium">{stats.mostActiveEmployee}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Najaktywniejszy pracownik:</span>
                    <span className="font-medium">{stats.mostActiveEmployee}</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-800 mb-3">Podsumowanie</h3>
                <div className="space-y-2">
                  <p className="text-blue-700">
                    Łącznie utworzono <span className="font-bold">{stats.totalReports}</span> raportów z całkowitym czasem pracy wynoszącym <span className="font-bold">{stats.totalHours}</span> godzin.
                  </p>
                  {stats.mostActiveEmployee && (
                    <p className="text-blue-700">
                      Najaktywniejszy pracownik to <span className="font-bold">{stats.mostActiveEmployee}</span>.
                    </p>
                  )}
                  {selectedProject !== 'all' && (
                    <p className="text-blue-700">
                      Wyświetlane dane dotyczą tylko wybranego projektu.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Details Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Szczegóły raportu z dnia {formatDate(selectedReport.date)}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setShowReportModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Projekt</p>
                  <p className="font-medium">{selectedReport.project_name || `Projekt ${selectedReport.project}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p>
                    {selectedReport.is_draft ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Wersja robocza
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Finalny
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Utworzony przez</p>
                  <p className="font-medium">{selectedReport.created_by_name || 'Nieznany'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data utworzenia</p>
                  <p className="font-medium">{selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : '-'}</p>
                </div>
              </div>

              <h4 className="font-medium text-gray-900 mb-3">Lista pracowników i godzin</h4>
              {(!selectedReport.entries || selectedReport.entries.length === 0) ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 text-center">Brak danych o pracownikach</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-gray-50 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pracownik</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Godziny</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notatki</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedReport.entries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {entry.employee_name || `Pracownik ${entry.employee}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {entry.hours_worked} godz.
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {entry.notes || '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-100">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          Łącznie
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {getTotalHours(selectedReport)} godz.
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Images */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Zdjęcia ({selectedReport.images.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedReport.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => openImageViewer(image)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.name || 'Zdjęcie raportu'}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <Eye size={24} className="text-white opacity-0 hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 mr-2"
              >
                Zamknij
              </button>
              {selectedReport.is_draft && (
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    navigate(`/dashboard/reports/edit/${selectedReport.id}`);
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Edytuj
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="relative">
              <button
                className="absolute top-2 right-2 p-2 rounded-full bg-white text-gray-800 hover:bg-gray-200"
                onClick={() => setShowImageModal(false)}
              >
                <X size={20} />
              </button>
              <img
                src={selectedImage.image_url}
                alt={selectedImage.name || 'Podgląd zdjęcia'}
                className="max-h-[80vh] rounded-lg"
              />
            </div>
            {selectedImage.name && (
              <div className="mt-2 text-white text-center">
                {selectedImage.name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProgressReportView;