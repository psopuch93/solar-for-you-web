// frontend/src/pages/ProgressReportPage.js
import React, { useState, useEffect } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Calendar,
  BarChart as BarChartIcon,
  Users,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Eye,
  Package
} from 'lucide-react';

const ProgressReportView = () => {
  const navigate = useNavigate();
  const { projects } = useProjects();

  // State variables
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeProject, setActiveProject] = useState('all');
  const [timeRange, setTimeRange] = useState('lastMonth');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeView, setActiveView] = useState('work-summary');

  // Chart data
  const [chartData, setChartData] = useState([]);

  // Stats data
  const [stats, setStats] = useState({
    totalReports: 0,
    totalHours: 0,
    totalEmployees: 0,
    avgHoursPerDay: 0,
    projectWithMostHours: '',
    employeeWithMostHours: ''
  });

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Process data when reports change
  useEffect(() => {
    if (reports.length > 0) {
      processReportData();
      calculateStats();
    }
  }, [reports, activeProject, timeRange]);

  // Fetch reports data
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/progress-reports/', {
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error('Błąd pobierania raportów');
      }

      const data = await response.json();
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Nie udało się pobrać raportów postępu. Spróbuj ponownie później.');
    } finally {
      setLoading(false);
    }
  };

  // Get total hours from a report
  const getTotalHours = (report) => {
    if (!report || !report.entries || !Array.isArray(report.entries)) return 0;
    return report.entries.reduce((total, entry) => total + (entry.hours_worked || 0), 0);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Process report data for chart
  const processReportData = () => {
    // Filter reports based on active project and time range
    let filteredReports = [...reports];

    // Filter by project
    if (activeProject !== 'all') {
      filteredReports = filteredReports.filter(report => report.project === activeProject);
    }

    // Filter by time range
    const now = new Date();
    if (timeRange === 'lastWeek') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredReports = filteredReports.filter(report => new Date(report.date) >= oneWeekAgo);
    } else if (timeRange === 'lastMonth') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredReports = filteredReports.filter(report => new Date(report.date) >= oneMonthAgo);
    } else if (timeRange === 'lastQuarter') {
      const oneQuarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      filteredReports = filteredReports.filter(report => new Date(report.date) >= oneQuarterAgo);
    }

    // Group by project or date based on view
    if (activeView === 'work-summary') {
      // Group by project
      const projectData = {};

      filteredReports.forEach(report => {
        const projectId = report.project;
        const projectName = report.project_name || `Projekt ${projectId}`;
        const totalHours = getTotalHours(report);

        if (projectData[projectId]) {
          projectData[projectId].hours += totalHours;
        } else {
          projectData[projectId] = {
            name: projectName,
            hours: totalHours,
            employees: new Set()
          };
        }

        // Count unique employees
        if (report.entries) {
          report.entries.forEach(entry => {
            if (entry.employee) {
              projectData[projectId].employees.add(entry.employee);
            }
          });
        }
      });

      // Convert to array for chart
      const data = Object.values(projectData).map(project => ({
        name: project.name,
        hours: Math.round(project.hours * 10) / 10,
        employees: project.employees.size
      }));

      // Sort by hours
      data.sort((a, b) => b.hours - a.hours);

      setChartData(data);
    } else {
      // Group by date
      const dateData = {};

      filteredReports.forEach(report => {
        const reportDate = report.date;
        const totalHours = getTotalHours(report);

        if (dateData[reportDate]) {
          dateData[reportDate].hours += totalHours;
          dateData[reportDate].count += 1;
        } else {
          dateData[reportDate] = {
            date: reportDate,
            hours: totalHours,
            count: 1
          };
        }
      });

      // Convert to array for chart
      const data = Object.values(dateData).map(item => ({
        name: new Date(item.date).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' }),
        hours: Math.round(item.hours * 10) / 10,
        reports: item.count,
        fullDate: item.date
      }));

      // Sort by date
      data.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

      setChartData(data);
    }
  };

  // Calculate stats
  const calculateStats = () => {
    // Filter reports based on active project and time range
    let filteredReports = [...reports];

    // Filter by project
    if (activeProject !== 'all') {
      filteredReports = filteredReports.filter(report => report.project === activeProject);
    }

    // Filter by time range
    const now = new Date();
    if (timeRange === 'lastWeek') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredReports = filteredReports.filter(report => new Date(report.date) >= oneWeekAgo);
    } else if (timeRange === 'lastMonth') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredReports = filteredReports.filter(report => new Date(report.date) >= oneMonthAgo);
    } else if (timeRange === 'lastQuarter') {
      const oneQuarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      filteredReports = filteredReports.filter(report => new Date(report.date) >= oneQuarterAgo);
    }

    // Calculate total reports
    const totalReports = filteredReports.length;

    // Calculate total hours
    let totalHours = 0;
    filteredReports.forEach(report => {
      totalHours += getTotalHours(report);
    });

    // Calculate unique employees
    const employeeSet = new Set();
    filteredReports.forEach(report => {
      if (report.entries) {
        report.entries.forEach(entry => {
          if (entry.employee) {
            employeeSet.add(entry.employee);
          }
        });
      }
    });
    const totalEmployees = employeeSet.size;

    // Calculate average hours per day
    const uniqueDays = new Set(filteredReports.map(report => report.date));
    const avgHoursPerDay = uniqueDays.size > 0 ? totalHours / uniqueDays.size : 0;

    // Find project with most hours
    const projectHours = {};
    filteredReports.forEach(report => {
      const projectId = report.project;
      const hours = getTotalHours(report);

      if (projectHours[projectId]) {
        projectHours[projectId].hours += hours;
      } else {
        projectHours[projectId] = {
          projectName: report.project_name || `Projekt ${projectId}`,
          hours: hours
        };
      }
    });

    let projectWithMostHours = '';
    let maxProjectHours = 0;

    Object.entries(projectHours).forEach(([_, data]) => {
      if (data.hours > maxProjectHours) {
        maxProjectHours = data.hours;
        projectWithMostHours = data.projectName;
      }
    });

    // Find employee with most hours
    const employeeHours = {};
    filteredReports.forEach(report => {
      if (report.entries) {
        report.entries.forEach(entry => {
          const employeeId = entry.employee;
          const employeeName = entry.employee_name || `Pracownik ${employeeId}`;
          const hours = entry.hours_worked || 0;

          if (employeeHours[employeeId]) {
            employeeHours[employeeId].hours += hours;
          } else {
            employeeHours[employeeId] = {
              employeeName: employeeName,
              hours: hours
            };
          }
        });
      }
    });

    let employeeWithMostHours = '';
    let maxEmployeeHours = 0;

    Object.entries(employeeHours).forEach(([_, data]) => {
      if (data.hours > maxEmployeeHours) {
        maxEmployeeHours = data.hours;
        employeeWithMostHours = data.employeeName;
      }
    });

    setStats({
      totalReports,
      totalHours: Math.round(totalHours * 10) / 10,
      totalEmployees,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      projectWithMostHours,
      employeeWithMostHours
    });
  };

  // Toggle sort order
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown size={16} />;
    return sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };

  // Get filtered and sorted reports
  const getFilteredReports = () => {
    let result = [...reports];

    // Filter by project
    if (activeProject !== 'all') {
      result = result.filter(report => report.project === activeProject);
    }

    // Filter by time range
    const now = new Date();
    if (timeRange === 'lastWeek') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(report => new Date(report.date) >= oneWeekAgo);
    } else if (timeRange === 'lastMonth') {
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      result = result.filter(report => new Date(report.date) >= oneMonthAgo);
    } else if (timeRange === 'lastQuarter') {
      const oneQuarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      result = result.filter(report => new Date(report.date) >= oneQuarterAgo);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(report =>
        (report.project_name && report.project_name.toLowerCase().includes(term)) ||
        (report.created_by_name && report.created_by_name.toLowerCase().includes(term))
      );
    }

    // Sort reports
    result.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'date':
          valueA = new Date(a.date);
          valueB = new Date(b.date);
          break;
        case 'project':
          valueA = a.project_name || '';
          valueB = b.project_name || '';
          break;
        case 'hours':
          valueA = getTotalHours(a);
          valueB = getTotalHours(b);
          break;
        case 'employees':
          valueA = a.entries ? a.entries.length : 0;
          valueB = b.entries ? b.entries.length : 0;
          break;
        default:
          valueA = new Date(a.date);
          valueB = new Date(b.date);
      }

      if (sortOrder === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    return result;
  };

  const filteredReports = getFilteredReports();

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Raporty Postępu Prac</h1>
          <p className="text-gray-500 mt-1">Analiza efektywności zespołu i projektów</p>
        </div>
        <button
          onClick={fetchReports}
          className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200"
        >
          <RefreshCw size={20} className="text-gray-600 mr-2" />
          Odśwież dane
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Wyszukaj projekty, pracowników..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center px-4 py-2.5 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <Filter className="mr-2" size={18} />
              Filtry
              {filterOpen ? <ChevronUp size={18} className="ml-1" /> : <ChevronDown size={18} className="ml-1" />}
            </button>

            <div className="flex bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setActiveView('work-summary')}
                className={`px-4 py-2 text-sm rounded-xl transition-colors ${
                  activeView === 'work-summary' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Projekty
              </button>
              <button
                onClick={() => setActiveView('time-chart')}
                className={`px-4 py-2 text-sm rounded-xl transition-colors ${
                  activeView === 'time-chart' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500'
                }`}
              >
                Oś czasu
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {filterOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Projekt</label>
                <select
                  value={activeProject}
                  onChange={(e) => setActiveProject(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">Wszystkie projekty</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Zakres czasowy</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="allTime">Cały okres</option>
                  <option value="lastWeek">Ostatni tydzień</option>
                  <option value="lastMonth">Ostatni miesiąc</option>
                  <option value="lastQuarter">Ostatni kwartał</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sortowanie</label>
                <div className="flex gap-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-l-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="date">Data</option>
                    <option value="project">Projekt</option>
                    <option value="hours">Godziny</option>
                    <option value="employees">Pracownicy</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-4 bg-gray-50 border border-gray-200 rounded-r-xl hover:bg-gray-100"
                  >
                    {sortOrder === 'asc' ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Clock className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Łączny czas pracy</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalHours} godz.</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-orange-100">
            <p className="text-sm text-gray-500">
              Średnio <span className="font-semibold">{stats.avgHoursPerDay} godz/dzień</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Aktywne projekty</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{chartData.length}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {stats.projectWithMostHours && `Lider: ${stats.projectWithMostHours}`}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Zaangażowani pracownicy</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              {stats.employeeWithMostHours && `Najaktywniejszy: ${stats.employeeWithMostHours}`}
            </p>
          </div>
        </div>
      </div>

      {/* Data Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {activeView === 'work-summary' ? 'Rozkład godzin w projektach' : 'Historia czasowa'}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Godziny pracy</span>
            </div>
            {activeView === 'work-summary' && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Liczba pracowników</span>
              </div>
            )}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <BarChartIcon size={48} className="mb-4" />
            <p>Brak danych do wyświetlenia</p>
          </div>
        ) : (
          <div className="h-96">
            {/* Tutaj należy zintegrować bibliotekę wykresów np. Recharts */}
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-xl">
              <span className="text-gray-400">Przykładowy wykres (wymaga implementacji)</span>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Ostatnie wpisy</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Data', 'Projekt', 'Godziny', 'Pracownicy', 'Zdjęcia', 'Autor', ''].map((header, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredReports.slice(0, 8).map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(report.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.project_name || 'Nieznany'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getTotalHours(report)} godz.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.entries?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.images?.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        {report.images.length}
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.created_by_name || 'Nieznany'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => navigate(`/dashboard/reports/${report.id}`)}
                      className="text-orange-600 hover:text-orange-800 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Szczegóły</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReports.length > 8 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <button
              className="text-sm text-orange-600 hover:text-orange-800"
              onClick={() => navigate('/dashboard/reports')}
            >
              Pokaż wszystkie ({filteredReports.length}) →
            </button>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Podsumowanie efektywności</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                Średnia wydajność zespołu: <strong>{stats.avgHoursPerDay} godz/dzień</strong>
              </p>
            </div>
            {stats.projectWithMostHours && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Najaktywniejszy projekt: <strong>{stats.projectWithMostHours}</strong>
                </p>
              </div>
            )}
            {stats.employeeWithMostHours && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  Najaktywniejszy pracownik: <strong>{stats.employeeWithMostHours}</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressReportView;