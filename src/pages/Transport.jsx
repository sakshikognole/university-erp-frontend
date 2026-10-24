/**
 * Transport.jsx
 *
 * Defects fixed:
 *   D1  Bus Route table headings center-aligned (transport-table class + CSS)
 *   D3  Success notifications auto-dismiss after 2 s (useRef timer)
 *   D4  Vehicle table headings center-aligned (same class)
 *   D5  Action-row buttons right-aligned on mobile (transport-form-actions CSS class)
 *   D6  Header action buttons compact, one row on mobile (transport-header-actions CSS)
 *   D7  Tabs horizontally scrollable on narrow screens (transport-tabs CSS)
 *   Imp-22  Delete confirmation dialog already present — preserved
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AddBusRouteModal from './AddBusRoute';
import AddDriverModal from './AddDriver';
import AddVehicleModal from './AddVehicle';
import AddBusPassModal from './AddBusPass';
import {
  Bus, Plus, Search, AlertCircle, AlertTriangle, CheckCircle2, Loader2,
  ChevronLeft, ChevronRight, Edit, Trash2, UserCheck, Truck, Ticket, X,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Transport = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('routes');
  const [routes,   setRoutes]   = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [passes,   setPasses]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Modal state — one modal open at a time, type = 'route'|'driver'|'vehicle'|'pass'
  const [modalType,   setModalType]   = useState(null);
  const [modalItemId, setModalItemId] = useState(null);
  const openModal  = (type, id = null) => { setModalType(type);  setModalItemId(id);   };
  const closeModal = ()               => { setModalType(null);   setModalItemId(null); };
  const handleModalSuccess = () => { closeModal(); fetchAllData(); };

  const [search,   setSearch]   = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [currentPage,  setCurrentPage]  = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // D3: timer ref so stale timers never dismiss a newer notification
  const feedbackTimerRef = useRef(null);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  // D3: set feedback and schedule auto-dismiss for success messages only
  const showFeedback = (type, message) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback({ type, message });
    if (type === 'success') {
      feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), 2000);
    }
  };

  useEffect(() => {
    fetchAllData();
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [routesRes, driversRes, vehiclesRes, passesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/transport/routes`,  { headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/drivers`, { headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/vehicles`,{ headers: authHeader() }),
        fetch(`${API_BASE_URL}/transport/passes`,  { headers: authHeader() }),
      ]);
      if (routesRes.ok)   setRoutes(await routesRes.json());
      if (driversRes.ok)  setDrivers(await driversRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (passesRes.ok)   setPasses(await passesRes.json());
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
    const endpoints = {
      route:   `${API_BASE_URL}/transport/routes/${item._id   || item.routeId}`,
      driver:  `${API_BASE_URL}/transport/drivers/${item._id  || item.driverId}`,
      vehicle: `${API_BASE_URL}/transport/vehicles/${item._id || item.vehicleId}`,
      pass:    `${API_BASE_URL}/transport/passes/${item._id   || item.passId}`,
    };
    const successMessages = {
      route:   `Route #${item.routeId} deleted successfully.`,
      driver:  `Driver '${item.name}' deleted successfully.`,
      vehicle: `Vehicle '${item.name}' deleted successfully.`,
      pass:    `Bus pass '${item.passId}' deleted successfully.`,
    };
    const stateSetters = {
      route:   (prev) => prev.filter(r => r._id !== item._id && r.routeId   !== item.routeId),
      driver:  (prev) => prev.filter(d => d._id !== item._id && d.driverId  !== item.driverId),
      vehicle: (prev) => prev.filter(v => v._id !== item._id && v.vehicleId !== item.vehicleId),
      pass:    (prev) => prev.filter(p => p._id !== item._id && p.passId    !== item.passId),
    };
    try {
      const res = await fetch(endpoints[type], { method: 'DELETE', headers: authHeader() });
      if (res.ok) {
        showFeedback('success', successMessages[type]);
        if (type === 'route')   setRoutes(stateSetters.route);
        if (type === 'driver')  setDrivers(stateSetters.driver);
        if (type === 'vehicle') setVehicles(stateSetters.vehicle);
        if (type === 'pass')    setPasses(stateSetters.pass);
      } else {
        const data = await res.json().catch(() => ({}));
        showFeedback('error', data.message || `Failed to delete ${type}.`);
      }
    } catch {
      showFeedback('error', 'Unable to connect to server. Please try again.');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const filteredRoutes = routes.filter(r => {
    const q = search.toLowerCase().trim();
    return !q ||
      String(r.routeId || '').includes(q) ||
      (r.routeName || '').toLowerCase().includes(q) ||
      (r.driverName || '').toLowerCase().includes(q) ||
      (r.vehicleName || '').toLowerCase().includes(q) ||
      (Array.isArray(r.stops) ? r.stops.join(' ').toLowerCase() : '').includes(q);
  });

  const filteredDrivers = drivers.filter(d => {
    const q = search.toLowerCase().trim();
    return !q ||
      String(d.driverId || '').includes(q) ||
      (d.name  || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q);
  });

  const filteredVehicles = vehicles.filter(v => {
    const q = search.toLowerCase().trim();
    return !q ||
      (v.vehicleId || '').toLowerCase().includes(q) ||
      (v.name      || '').toLowerCase().includes(q) ||
      (v.vehicleNumber || '').toLowerCase().includes(q);
  });

  const filteredPasses = passes.filter(p => {
    const q = search.toLowerCase().trim();
    return !q ||
      (p.passId      || '').toLowerCase().includes(q) ||
      (p.studentId   || '').toLowerCase().includes(q) ||
      (p.studentName || '').toLowerCase().includes(q) ||
      String(p.routeId || '').includes(q) ||
      (p.fromStop    || '').toLowerCase().includes(q);
  });

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'drivers':  return filteredDrivers;
      case 'vehicles': return filteredVehicles;
      case 'passes':   return filteredPasses;
      default:         return filteredRoutes;
    }
  };

  const currentDataset = getCurrentItems();
  const totalPages  = Math.ceil(currentDataset.length / itemsPerPage) || 1;
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const paginatedData = currentDataset.slice(startIndex, startIndex + itemsPerPage);

  // D7: tab button style (active vs inactive) — used inline to keep logic clear
  const tabStyle = (tab) => ({
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.5rem 0.875rem',
    border: activeTab === tab ? '1px solid #111827' : '1px solid transparent',
    background: activeTab === tab ? '#111827' : 'transparent',
    color: activeTab === tab ? '#ffffff' : 'var(--text-secondary)',
    borderRadius: '6px', fontWeight: 600, fontSize: '0.875rem',
    cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap', flexShrink: 0,
  });

  return (
    <div className="page-container">
      {/* D6: transport-header-actions keeps buttons compact + one row on mobile */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Transport</h1>
          <p className="page-subtitle">Manage campus bus routes, drivers, vehicles, and student passes</p>
        </div>
        <div className="header-actions-group transport-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => openModal('driver')}>
            <UserCheck size={15} /><span>Add Driver</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => openModal('vehicle')}>
            <Truck size={15} /><span>Add Vehicle</span>
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => openModal('pass')}>
            <Ticket size={15} /><span>Add Bus Pass</span>
          </button>
          <button type="button" className="books-btn books-btn-primary" onClick={() => openModal('route')}>
            <Plus size={15} /><span>Add Bus Route</span>
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}
          style={{ margin: '1rem 0' }}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* D7: transport-tabs enables horizontal scrolling on narrow screens */}
      <div className="transport-tabs">
        <button type="button" style={tabStyle('routes')}
          onClick={() => { setActiveTab('routes');   setCurrentPage(1); }}>
          <Bus size={15} /><span>Bus Routes ({routes.length})</span>
        </button>
        <button type="button" style={tabStyle('drivers')}
          onClick={() => { setActiveTab('drivers');  setCurrentPage(1); }}>
          <UserCheck size={15} /><span>Drivers ({drivers.length})</span>
        </button>
        <button type="button" style={tabStyle('vehicles')}
          onClick={() => { setActiveTab('vehicles'); setCurrentPage(1); }}>
          <Truck size={15} /><span>Vehicles ({vehicles.length})</span>
        </button>
        <button type="button" style={tabStyle('passes')}
          onClick={() => { setActiveTab('passes');   setCurrentPage(1); }}>
          <Ticket size={15} /><span>Bus Passes ({passes.length})</span>
        </button>
      </div>

      <div className="card table-card" style={{ marginTop: '1rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input"
              placeholder={
                activeTab === 'routes'  ? 'Search by Route ID, Name, Driver, Vehicle, or Stop...' :
                activeTab === 'drivers' ? 'Search by Driver ID, Name, Phone...' :
                activeTab === 'vehicles'? 'Search by Vehicle ID, Name, Plate...' :
                                          'Search by Pass ID, Student ID, Route...'
              }
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            {search && <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>}
          </div>
          <div className="table-stats-badge">
            Total: <strong>{currentDataset.length}</strong>{' '}
            {activeTab === 'routes' ? 'Routes' : activeTab === 'drivers' ? 'Drivers' : activeTab === 'vehicles' ? 'Vehicles' : 'Bus Passes'}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" /><p>Loading transport data...</p>
            </div>
          ) : currentDataset.length === 0 ? (
            <div className="table-empty-state">
              <Bus size={36} className="empty-icon" />
              <h3>No {activeTab} found</h3>
              <p>{search ? `No records matched "${search}".` : `Get started by adding your first ${activeTab === 'routes' ? 'bus route' : activeTab === 'drivers' ? 'driver' : activeTab === 'vehicles' ? 'vehicle' : 'bus pass'}.`}</p>
              {!search && (
                <button type="button" className="books-btn books-btn-primary" style={{ marginTop: '1rem' }}
                  onClick={() => {
                    if (activeTab === 'routes')        openModal('route');
                    else if (activeTab === 'drivers')  openModal('driver');
                    else if (activeTab === 'vehicles') openModal('vehicle');
                    else openModal('pass');
                  }}>
                  <Plus size={16} />
                  <span>Add {activeTab === 'routes' ? 'Bus Route' : activeTab === 'drivers' ? 'Driver' : activeTab === 'vehicles' ? 'Vehicle' : 'Bus Pass'}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* D1: transport-table gives centered <th> to route + vehicle tables */}
              {activeTab === 'routes' && (
                <table className="data-table transport-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th style={{ width: '110px' }}>Route ID</th>
                      <th style={{ width: '170px' }}>Route Name</th>
                      <th style={{ width: '155px' }}>Driver Name</th>
                      <th style={{ width: '155px' }}>Vehicle Name</th>
                      <th>Stops</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((route, i) => (
                      <tr key={route._id || route.routeId}>
                        <td className="text-secondary">{startIndex + i + 1}</td>
                        <td><span className="code-badge">Route #{route.routeId}</span></td>
                        <td><span className="dept-name-cell">{route.routeName || '—'}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <UserCheck size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span>{route.driverName}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Truck size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span>{route.vehicleName}</span>
                          </div>
                        </td>
                        <td>
                          {route.stops && route.stops.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {route.stops.map((stop, sIdx) => (
                                <span key={sIdx} style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 500, border: '1px solid #bfdbfe' }}>{stop}</span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No stops defined</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="action-btn edit-btn" title="Edit" onClick={() => openModal('route', route._id || route.routeId)}>
                              <Edit size={14} /><span className="action-label">Edit</span>
                            </button>
                            <button type="button" className="action-btn delete-btn" title="Delete" onClick={() => setDeleteConfirm({ type: 'route', item: route })}>
                              <Trash2 size={14} /><span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'drivers' && (
                <table className="data-table transport-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th style={{ width: '110px' }}>Driver ID</th>
                      <th>Driver Name</th>
                      <th>Phone</th>
                      <th>License Number</th>
                      <th style={{ width: '110px' }}>Status</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((driver, i) => (
                      <tr key={driver._id || driver.driverId}>
                        <td className="text-secondary">{startIndex + i + 1}</td>
                        <td><span className="code-badge">{driver.driverId}</span></td>
                        <td><span className="dept-name-cell">{driver.name}</span></td>
                        <td>{driver.phone || '—'}</td>
                        <td>{driver.licenseNumber || '—'}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: driver.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', color: driver.status === 'ACTIVE' ? '#15803d' : '#b91c1c' }}>
                            {driver.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="action-btn edit-btn" title="Edit" onClick={() => openModal('driver', driver._id || driver.driverId)}>
                              <Edit size={14} /><span className="action-label">Edit</span>
                            </button>
                            <button type="button" className="action-btn delete-btn" title="Delete" onClick={() => setDeleteConfirm({ type: 'driver', item: driver })}>
                              <Trash2 size={14} /><span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* D4: transport-table gives centered <th> */}
              {activeTab === 'vehicles' && (
                <table className="data-table transport-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th style={{ width: '120px' }}>Vehicle ID</th>
                      <th>Vehicle Name</th>
                      <th>Registration / Plate</th>
                      <th style={{ width: '90px' }}>Capacity</th>
                      <th style={{ width: '110px' }}>Status</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((vehicle, i) => (
                      <tr key={vehicle._id || vehicle.vehicleId}>
                        <td className="text-secondary">{startIndex + i + 1}</td>
                        <td><span className="code-badge">{vehicle.vehicleId}</span></td>
                        <td><span className="dept-name-cell">{vehicle.name}</span></td>
                        <td>{vehicle.vehicleNumber || '—'}</td>
                        <td>{vehicle.capacity ? `${vehicle.capacity}` : '—'}</td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: vehicle.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7', color: vehicle.status === 'ACTIVE' ? '#15803d' : '#b45309' }}>
                            {vehicle.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="action-btn edit-btn" title="Edit" onClick={() => openModal('vehicle', vehicle._id || vehicle.vehicleId)}>
                              <Edit size={14} /><span className="action-label">Edit</span>
                            </button>
                            <button type="button" className="action-btn delete-btn" title="Delete" onClick={() => setDeleteConfirm({ type: 'vehicle', item: vehicle })}>
                              <Trash2 size={14} /><span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'passes' && (
                <table className="data-table transport-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th style={{ width: '110px' }}>Pass ID</th>
                      <th style={{ width: '120px' }}>Student ID</th>
                      <th>Student Name</th>
                      <th style={{ width: '100px' }}>Route ID</th>
                      <th>Stops (From → To)</th>
                      <th style={{ width: '110px' }}>Payment</th>
                      <th style={{ width: '110px' }}>Valid Till</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((pass, i) => (
                      <tr key={pass._id || pass.passId}>
                        <td className="text-secondary">{startIndex + i + 1}</td>
                        <td><span className="code-badge">{pass.passId}</span></td>
                        <td>{pass.studentId}</td>
                        <td>{pass.studentName || '—'}</td>
                        <td><span className="code-badge">Route #{pass.routeId}</span></td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{pass.fromStop}</span>
                          <span style={{ margin: '0 6px', color: '#9ca3af' }}>→</span>
                          <span style={{ color: '#4b5563' }}>{pass.toStop}</span>
                        </td>
                        <td>
                          <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: pass.paymentStatus === 'PAID' ? '#dcfce7' : '#fee2e2', color: pass.paymentStatus === 'PAID' ? '#15803d' : '#b91c1c' }}>
                            {pass.paymentStatus}
                          </span>
                        </td>
                        <td>{pass.validTill ? new Date(pass.validTill).toLocaleDateString() : '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="action-btn edit-btn" title="Edit" onClick={() => openModal('pass', pass._id || pass.passId)}>
                              <Edit size={14} /><span className="action-label">Edit</span>
                            </button>
                            <button type="button" className="action-btn delete-btn" title="Delete" onClick={() => setDeleteConfirm({ type: 'pass', item: pass })}>
                              <Trash2 size={14} /><span className="action-label">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {totalPages > 1 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, currentDataset.length)} of {currentDataset.length} items
                  </div>
                  <div className="pagination-buttons">
                    <button type="button" className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(totalPages)].map((_, i) => {
                      const p = i + 1;
                      if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                        return <button key={p} type="button" className={`pagination-btn ${p === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>;
                      if (p === currentPage - 2 || p === currentPage + 2)
                        return <span key={p} className="pagination-dots">…</span>;
                      return null;
                    })}
                    <button type="button" className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="items-per-page">
                    <span>Items per page:</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="items-per-page-select">
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

      {/* Delete confirmation dialog — Imp-22 pattern already exists; preserved */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon"><AlertTriangle size={22} /></div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">
                  Delete {deleteConfirm.type === 'route' ? 'Bus Route' : deleteConfirm.type === 'driver' ? 'Driver' : deleteConfirm.type === 'vehicle' ? 'Vehicle' : 'Bus Pass'}
                </h3>
                <p className="delete-dialog-desc">This will permanently remove the record.</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => !deleting && setDeleteConfirm(null)} disabled={deleting}><X size={18} /></button>
            </div>
            <div className="delete-item-preview">
              <div>
                <div className="delete-item-name">
                  {deleteConfirm.type === 'route'   ? (deleteConfirm.item.routeName || `Route #${deleteConfirm.item.routeId}`) :
                   deleteConfirm.type === 'driver'  ? deleteConfirm.item.name :
                   deleteConfirm.type === 'vehicle' ? deleteConfirm.item.name :
                   `Pass: ${deleteConfirm.item.passId}`}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {deleteConfirm.type === 'route'   ? `Driver: ${deleteConfirm.item.driverName} • Vehicle: ${deleteConfirm.item.vehicleName}` :
                   deleteConfirm.type === 'driver'  ? `Driver ID: ${deleteConfirm.item.driverId}${deleteConfirm.item.phone ? ` • ${deleteConfirm.item.phone}` : ''}` :
                   deleteConfirm.type === 'vehicle' ? `Vehicle ID: ${deleteConfirm.item.vehicleId}${deleteConfirm.item.vehicleNumber ? ` • ${deleteConfirm.item.vehicleNumber}` : ''}` :
                   `Student: ${deleteConfirm.item.studentId} • Route #${deleteConfirm.item.routeId}`}
                </div>
              </div>
              <span className="delete-item-code">
                {deleteConfirm.type === 'route'   ? `Route #${deleteConfirm.item.routeId}` :
                 deleteConfirm.type === 'driver'  ? `ID: ${deleteConfirm.item.driverId}` :
                 deleteConfirm.type === 'vehicle' ? deleteConfirm.item.vehicleId :
                 deleteConfirm.item.passId}
              </span>
            </div>
            <div className="delete-warning-note"><AlertCircle size={14} /><span>This action cannot be undone.</span></div>
            <div className="modal-actions">
              <button type="button" className="books-btn books-btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? <><Loader2 size={16} className="spin-animate" /><span>Deleting...</span></> : <><Trash2 size={16} /><span>Delete</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddBusRouteModal isOpen={modalType === 'route'}   routeId={modalItemId}   onClose={closeModal} onSuccess={handleModalSuccess} />
      <AddDriverModal   isOpen={modalType === 'driver'}  driverId={modalItemId}  onClose={closeModal} onSuccess={handleModalSuccess} />
      <AddVehicleModal  isOpen={modalType === 'vehicle'} vehicleId={modalItemId} onClose={closeModal} onSuccess={handleModalSuccess} />
      <AddBusPassModal  isOpen={modalType === 'pass'}    passId={modalItemId}    onClose={closeModal} onSuccess={handleModalSuccess} />
    </div>
  );
};

export default Transport;
