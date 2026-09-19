import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  Plus,
  Search,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  UserCheck,
  Truck,
  Ticket,
  MapPin,
  X,
} from 'lucide-react';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;

const Transport = () => {
  const navigate = useNavigate();

  // Active view tab (default: 'routes')
  const [activeTab, setActiveTab] = useState('routes');

  // Data states
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Search & Feedback
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [routesRes, driversRes, vehiclesRes, passesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transport/routes`, { headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/drivers`, { headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/vehicles`, { headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/passes`, { headers: authHeader() }),
      ]);

      if (routesRes.ok) setRoutes(await routesRes.json());
      if (driversRes.ok) setDrivers(await driversRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (passesRes.ok) setPasses(await passesRes.json());
    } catch (err) {
      console.warn('Transport backend unavailable:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);

    const { type, item } = deleteConfirm;

    try {
      if (type === 'route') {
        const res = await fetch(`${API_BASE_URL}/transport/routes/${item._id || item.routeId}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
        if (res.ok) {
          setFeedback({ type: 'success', message: `Route #${item.routeId} deleted successfully.` });
          setRoutes((prev) => prev.filter((r) => r._id !== item._id && r.routeId !== item.routeId));
        } else {
          const data = await res.json().catch(() => ({}));
          setFeedback({ type: 'error', message: data.message || 'Failed to delete route.' });
        }
      } else if (type === 'driver') {
        const res = await fetch(`${API_BASE_URL}/transport/drivers/${item._id || item.driverId}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
        if (res.ok) {
          setFeedback({ type: 'success', message: `Driver '${item.name}' deleted successfully.` });
          setDrivers((prev) => prev.filter((d) => d._id !== item._id && d.driverId !== item.driverId));
        } else {
          const data = await res.json().catch(() => ({}));
          setFeedback({ type: 'error', message: data.message || 'Failed to delete driver.' });
        }
      } else if (type === 'vehicle') {
        const res = await fetch(`${API_BASE_URL}/transport/vehicles/${item._id || item.vehicleId}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
        if (res.ok) {
          setFeedback({ type: 'success', message: `Vehicle '${item.name}' deleted successfully.` });
          setVehicles((prev) => prev.filter((v) => v._id !== item._id && v.vehicleId !== item.vehicleId));
        } else {
          const data = await res.json().catch(() => ({}));
          setFeedback({ type: 'error', message: data.message || 'Failed to delete vehicle.' });
        }
      } else if (type === 'pass') {
        const res = await fetch(`${API_BASE_URL}/transport/passes/${item._id || item.passId}`, {
          method: 'DELETE',
          headers: authHeader(),
        });
        if (res.ok) {
          setFeedback({ type: 'success', message: `Bus pass '${item.passId}' deleted successfully.` });
          setPasses((prev) => prev.filter((p) => p._id !== item._id && p.passId !== item.passId));
        } else {
          const data = await res.json().catch(() => ({}));
          setFeedback({ type: 'error', message: data.message || 'Failed to delete bus pass.' });
        }
      }
    } catch (err) {
      console.error('Error during deletion:', err);
      setFeedback({ type: 'error', message: 'Unable to connect to server. Please try again.' });
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  // Filter Bus Routes
  const filteredRoutes = routes.filter((r) => {
    const q = search.toLowerCase().trim();
    const routeIdStr = String(r.routeId || '');
    const nameStr = (r.routeName || '').toLowerCase();
    const driverStr = (r.driverName || '').toLowerCase();
    const vehicleStr = (r.vehicleName || '').toLowerCase();
    const stopsStr = Array.isArray(r.stops) ? r.stops.join(' ').toLowerCase() : '';
    return (
      routeIdStr.includes(q) ||
      nameStr.includes(q) ||
      driverStr.includes(q) ||
      vehicleStr.includes(q) ||
      stopsStr.includes(q)
    );
  });

  // Filter Drivers
  const filteredDrivers = drivers.filter((d) => {
    const q = search.toLowerCase().trim();
    return (
      String(d.driverId || '').includes(q) ||
      (d.name || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q)
    );
  });

  // Filter Vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const q = search.toLowerCase().trim();
    return (
      (v.vehicleId || '').toLowerCase().includes(q) ||
      (v.name || '').toLowerCase().includes(q) ||
      (v.vehicleNumber || '').toLowerCase().includes(q)
    );
  });

  // Filter Passes
  const filteredPasses = passes.filter((p) => {
    const q = search.toLowerCase().trim();
    return (
      (p.passId || '').toLowerCase().includes(q) ||
      (p.studentId || '').toLowerCase().includes(q) ||
      (p.studentName || '').toLowerCase().includes(q) ||
      String(p.routeId || '').includes(q) ||
      (p.fromStop || '').toLowerCase().includes(q)
    );
  });

  // Get current active data items
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'drivers':
        return filteredDrivers;
      case 'vehicles':
        return filteredVehicles;
      case 'passes':
        return filteredPasses;
      case 'routes':
      default:
        return filteredRoutes;
    }
  };

  const currentDataset = getCurrentItems();
  const totalPages = Math.ceil(currentDataset.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = currentDataset.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      {/* Top Header Row with Action Buttons */}
      <div className="page-header-row" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Transport</h1>
          <p className="page-subtitle">Manage campus bus routes, drivers, vehicles, and student passes</p>
        </div>

        {/* Action Buttons in the Top-Right Corner: White buttons on left with black border, full black button on top-most right */}
        <div className="header-actions-group">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/transport/add-driver')}
            title="Register a new Driver"
          >
            <UserCheck size={16} />
            <span>Add Driver</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/transport/add-vehicle')}
            title="Add a Vehicle to Fleet"
          >
            <Truck size={16} />
            <span>Add Vehicle</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/transport/add-bus-pass')}
            title="Issue a Student Bus Pass"
          >
            <Ticket size={16} />
            <span>Add Bus Pass</span>
          </button>

          {/* Top Most Right-Side Full Black Button */}
          <button
            type="button"
            className="books-btn books-btn-primary"
            onClick={() => navigate('/transport/add-route')}
            title="Add a new Bus Route"
          >
            <Plus size={16} />
            <span>Add Bus Route</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs navigation for switching between Routes and other records */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('routes'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            border: activeTab === 'routes' ? '1px solid #111827' : '1px solid transparent',
            background: activeTab === 'routes' ? '#111827' : 'transparent',
            color: activeTab === 'routes' ? '#ffffff' : 'var(--text-secondary)',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Bus size={16} />
          <span>Bus Routes ({routes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('drivers'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            border: activeTab === 'drivers' ? '1px solid #111827' : '1px solid transparent',
            background: activeTab === 'drivers' ? '#111827' : 'transparent',
            color: activeTab === 'drivers' ? '#ffffff' : 'var(--text-secondary)',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <UserCheck size={16} />
          <span>Drivers ({drivers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('vehicles'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            border: activeTab === 'vehicles' ? '1px solid #111827' : '1px solid transparent',
            background: activeTab === 'vehicles' ? '#111827' : 'transparent',
            color: activeTab === 'vehicles' ? '#ffffff' : 'var(--text-secondary)',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Truck size={16} />
          <span>Vehicles ({vehicles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('passes'); setCurrentPage(1); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.5rem 1rem',
            border: activeTab === 'passes' ? '1px solid #111827' : '1px solid transparent',
            background: activeTab === 'passes' ? '#111827' : 'transparent',
            color: activeTab === 'passes' ? '#ffffff' : 'var(--text-secondary)',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Ticket size={16} />
          <span>Bus Passes ({passes.length})</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="card table-card" style={{ marginTop: '1rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={
                activeTab === 'routes'
                  ? 'Search by Route ID, Route Name, Driver, Vehicle, or Stop...'
                  : activeTab === 'drivers'
                  ? 'Search by Driver ID, Name, Phone...'
                  : activeTab === 'vehicles'
                  ? 'Search by Vehicle ID, Name, Plate...'
                  : 'Search by Pass ID, Student ID, Route...'
              }
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{currentDataset.length}</strong>{' '}
            {activeTab === 'routes'
              ? currentDataset.length === 1
                ? 'Route'
                : 'Routes'
              : activeTab === 'drivers'
              ? currentDataset.length === 1
                ? 'Driver'
                : 'Drivers'
              : activeTab === 'vehicles'
              ? currentDataset.length === 1
                ? 'Vehicle'
                : 'Vehicles'
              : currentDataset.length === 1
              ? 'Bus Pass'
              : 'Bus Passes'}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading transport data...</p>
            </div>
          ) : currentDataset.length === 0 ? (
            <div className="table-empty-state">
              <Bus size={36} className="empty-icon" />
              <h3>No {activeTab} found</h3>
              <p>
                {search
                  ? `No records matched "${search}".`
                  : `Get started by adding your first ${
                      activeTab === 'routes'
                        ? 'bus route'
                        : activeTab === 'drivers'
                        ? 'driver'
                        : activeTab === 'vehicles'
                        ? 'vehicle'
                        : 'bus pass'
                    }.`}
              </p>
              {!search && (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => {
                    if (activeTab === 'routes') navigate('/transport/add-route');
                    else if (activeTab === 'drivers') navigate('/transport/add-driver');
                    else if (activeTab === 'vehicles') navigate('/transport/add-vehicle');
                    else navigate('/transport/add-bus-pass');
                  }}
                >
                  <Plus size={16} />
                  <span>
                    Add{' '}
                    {activeTab === 'routes'
                      ? 'Bus Route'
                      : activeTab === 'drivers'
                      ? 'Driver'
                      : activeTab === 'vehicles'
                      ? 'Vehicle'
                      : 'Bus Pass'}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* PRIMARY VIEW: BUS ROUTES TABLE */}
              {activeTab === 'routes' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '120px' }}>Route ID</th>
                      <th style={{ width: '180px' }}>Route Name</th>
                      <th style={{ width: '160px' }}>Driver Name</th>
                      <th style={{ width: '160px' }}>Vehicle Name</th>
                      <th>Stops</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((route, index) => (
                      <tr key={route._id || route.routeId}>
                        <td className="text-secondary">{startIndex + index + 1}</td>
                        <td>
                          <span className="code-badge">
                            Route #{route.routeId}
                          </span>
                        </td>
                        <td>
                          <span className="dept-name-cell">
                            {route.routeName || '—'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <UserCheck size={15} style={{ color: 'var(--text-secondary)' }} />
                            <span>{route.driverName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Truck size={15} style={{ color: 'var(--text-secondary)' }} />
                            <span>{route.vehicleName}</span>
                          </div>
                        </td>
                        <td>
                          {route.stops && route.stops.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {route.stops.map((stop, sIdx) => (
                                <span
                                  key={sIdx}
                                  style={{
                                    backgroundColor: '#eff6ff',
                                    color: '#1e40af',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.78rem',
                                    fontWeight: 500,
                                    border: '1px solid #bfdbfe',
                                  }}
                                >
                                  {stop}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              No stops defined
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              title="Edit Bus Route"
                              onClick={() => navigate(`/transport/edit-route/${route._id || route.routeId}`)}
                            >
                              <Edit size={15} />
                              <span className="action-label">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Delete Bus Route"
                              onClick={() => setDeleteConfirm({ type: 'route', item: route })}
                            >
                              <Trash2 size={15} />
                              <span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* SECONDARY VIEW: DRIVERS TABLE */}
              {activeTab === 'drivers' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '120px' }}>Driver ID</th>
                      <th>Driver Name</th>
                      <th>Phone</th>
                      <th>License Number</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((driver, index) => (
                      <tr key={driver._id || driver.driverId}>
                        <td className="text-secondary">{startIndex + index + 1}</td>
                        <td>
                          <span className="code-badge">{driver.driverId}</span>
                        </td>
                        <td>
                          <span className="dept-name-cell">
                            {driver.name}
                          </span>
                        </td>
                        <td>{driver.phone || '—'}</td>
                        <td>{driver.licenseNumber || '—'}</td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              backgroundColor: driver.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                              color: driver.status === 'ACTIVE' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {driver.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              title="Edit Driver"
                              onClick={() => navigate(`/transport/edit-driver/${driver._id || driver.driverId}`)}
                            >
                              <Edit size={15} />
                              <span className="action-label">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Delete Driver"
                              onClick={() => setDeleteConfirm({ type: 'driver', item: driver })}
                            >
                              <Trash2 size={15} />
                              <span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* SECONDARY VIEW: VEHICLES TABLE */}
              {activeTab === 'vehicles' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '130px' }}>Vehicle ID</th>
                      <th>Vehicle Name</th>
                      <th>Registration / Plate</th>
                      <th>Capacity</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((vehicle, index) => (
                      <tr key={vehicle._id || vehicle.vehicleId}>
                        <td className="text-secondary">{startIndex + index + 1}</td>
                        <td>
                          <span className="code-badge">{vehicle.vehicleId}</span>
                        </td>
                        <td>
                          <span className="dept-name-cell">
                            {vehicle.name}
                          </span>
                        </td>
                        <td>{vehicle.vehicleNumber || '—'}</td>
                        <td>{vehicle.capacity ? `${vehicle.capacity} seats` : '—'}</td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              backgroundColor: vehicle.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
                              color: vehicle.status === 'ACTIVE' ? '#15803d' : '#b45309',
                            }}
                          >
                            {vehicle.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              title="Edit Vehicle"
                              onClick={() => navigate(`/transport/edit-vehicle/${vehicle._id || vehicle.vehicleId}`)}
                            >
                              <Edit size={15} />
                              <span className="action-label">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Delete Vehicle"
                              onClick={() => setDeleteConfirm({ type: 'vehicle', item: vehicle })}
                            >
                              <Trash2 size={15} />
                              <span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* SECONDARY VIEW: BUS PASSES TABLE */}
              {activeTab === 'passes' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>#</th>
                      <th style={{ width: '120px' }}>Pass ID</th>
                      <th style={{ width: '140px' }}>Student ID</th>
                      <th>Student Name</th>
                      <th style={{ width: '110px' }}>Route ID</th>
                      <th>Stops (From → To)</th>
                      <th style={{ width: '120px' }}>Payment</th>
                      <th style={{ width: '120px' }}>Valid Till</th>
                      <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((pass, index) => (
                      <tr key={pass._id || pass.passId}>
                        <td className="text-secondary">{startIndex + index + 1}</td>
                        <td>
                          <span className="code-badge">{pass.passId}</span>
                        </td>
                        <td>{pass.studentId}</td>
                        <td>{pass.studentName || '—'}</td>
                        <td>
                          <span className="code-badge">
                            Route #{pass.routeId}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{pass.fromStop}</span>
                          <span style={{ margin: '0 6px', color: '#9ca3af' }}>→</span>
                          <span style={{ color: '#4b5563' }}>{pass.toStop}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              backgroundColor: pass.paymentStatus === 'PAID' ? '#dcfce7' : '#fee2e2',
                              color: pass.paymentStatus === 'PAID' ? '#15803d' : '#b91c1c',
                            }}
                          >
                            {pass.paymentStatus}
                          </span>
                        </td>
                        <td>
                          {pass.validTill ? new Date(pass.validTill).toLocaleDateString() : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="action-btn edit-btn"
                              title="Edit Bus Pass"
                              onClick={() => navigate(`/transport/edit-bus-pass/${pass._id || pass.passId}`)}
                            >
                              <Edit size={15} />
                              <span className="action-label">Edit</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn delete-btn"
                              title="Delete Bus Pass"
                              onClick={() => setDeleteConfirm({ type: 'pass', item: pass })}
                            >
                              <Trash2 size={15} />
                              <span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(endIndex, currentDataset.length)} of {currentDataset.length} items
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return <span key={pageNum} className="pagination-dots">...</span>;
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="items-per-page">
                    <span>Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="items-per-page-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon">
                <AlertTriangle size={22} />
              </div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">
                  Delete{' '}
                  {deleteConfirm.type === 'route'
                    ? 'Bus Route'
                    : deleteConfirm.type === 'driver'
                    ? 'Driver'
                    : deleteConfirm.type === 'vehicle'
                    ? 'Vehicle'
                    : 'Bus Pass'}
                </h3>
                <p className="delete-dialog-desc">
                  Are you sure you want to delete this{' '}
                  {deleteConfirm.type === 'route'
                    ? 'bus route'
                    : deleteConfirm.type === 'driver'
                    ? 'driver record'
                    : deleteConfirm.type === 'vehicle'
                    ? 'fleet vehicle'
                    : 'issued bus pass'}
                  ? This action will permanently remove the record.
                </p>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => !deleting && setDeleteConfirm(null)}
                disabled={deleting}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="delete-item-preview">
              <div>
                <div className="delete-item-name">
                  {deleteConfirm.type === 'route'
                    ? deleteConfirm.item.routeName || `Route #${deleteConfirm.item.routeId}`
                    : deleteConfirm.type === 'driver'
                    ? deleteConfirm.item.name
                    : deleteConfirm.type === 'vehicle'
                    ? deleteConfirm.item.name
                    : `Pass: ${deleteConfirm.item.passId}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {deleteConfirm.type === 'route'
                    ? `Driver: ${deleteConfirm.item.driverName} • Vehicle: ${deleteConfirm.item.vehicleName}`
                    : deleteConfirm.type === 'driver'
                    ? `Driver ID: ${deleteConfirm.item.driverId} ${deleteConfirm.item.phone ? `• ${deleteConfirm.item.phone}` : ''}`
                    : deleteConfirm.type === 'vehicle'
                    ? `Vehicle ID: ${deleteConfirm.item.vehicleId} ${deleteConfirm.item.vehicleNumber ? `• ${deleteConfirm.item.vehicleNumber}` : ''}`
                    : `Student: ${deleteConfirm.item.studentId} • Route #${deleteConfirm.item.routeId}`}
                </div>
              </div>
              <span className="delete-item-code">
                {deleteConfirm.type === 'route'
                  ? `Route #${deleteConfirm.item.routeId}`
                  : deleteConfirm.type === 'driver'
                  ? `ID: ${deleteConfirm.item.driverId}`
                  : deleteConfirm.type === 'vehicle'
                  ? deleteConfirm.item.vehicleId
                  : deleteConfirm.item.passId}
              </span>
            </div>

            <div className="delete-warning-note">
              <AlertCircle size={14} />
              <span>This operation cannot be undone.</span>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="books-btn books-btn-ghost"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="spin-animate" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>
                      Delete{' '}
                      {deleteConfirm.type === 'route'
                        ? 'Route'
                        : deleteConfirm.type === 'driver'
                        ? 'Driver'
                        : deleteConfirm.type === 'vehicle'
                        ? 'Vehicle'
                        : 'Pass'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transport;
