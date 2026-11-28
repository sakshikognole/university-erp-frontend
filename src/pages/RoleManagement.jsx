import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Plus, Search, Edit, Trash2, Eye, X,
  AlertTriangle, AlertCircle, CheckCircle2, Loader2, ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const _IS_PROD = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
const API_BASE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const authHeader = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('erp_token')}`,
});

// ─── Mobile accordion card ────────────────────────────────────────────────────
function RoleMobCard({ role, num, onView, onEdit, onDelete, expanded, onToggle }) {
  return (
    <div className="mob-card">
      <button type="button" className="mob-card-header" onClick={onToggle} aria-expanded={expanded}>
        <div className="mob-card-summary">
          <span className="mob-card-num">{num}</span>
          <div className="mob-card-title-wrap">
            <span className="mob-card-title">{role.name}</span>
            <span className="mob-card-sub">{role.code}</span>
          </div>
        </div>
        <span className="mob-card-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mob-card-details">
          <div className="mob-card-row"><span className="mob-card-label">Code</span><span className="mob-card-value mono">{role.code}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Category</span><span className="mob-card-value">{role.category}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Users</span><span className="mob-card-value">{role.userCount ?? 0}</span></div>
          <div className="mob-card-row"><span className="mob-card-label">Pages</span><span className="mob-card-value">{role.allowedPages?.length ? role.allowedPages.length + ' assigned' : 'All (unrestricted)'}</span></div>
          <div className="mob-card-actions">
            <button type="button" className="action-btn view-btn"   onClick={onView}><Eye size={14} /><span className="action-label">View</span></button>
            <button type="button" className="action-btn edit-btn"   onClick={onEdit}><Edit size={14} /><span className="action-label">Edit</span></button>
            {role.isSystemRole ? (
              <button
                type="button"
                className="action-btn delete-btn"
                title="System roles cannot be deleted"
                disabled
                style={{ opacity: 0.3, cursor: 'not-allowed' }}
              >
                <Trash2 size={14} /><span className="action-label">Delete</span>
              </button>
            ) : (
              <button type="button" className="action-btn delete-btn" onClick={onDelete}><Trash2 size={14} /><span className="action-label">Delete</span></button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Role Form Modal ──────────────────────────────────────────────────────────
function RoleFormModal({ isOpen, roleId, onClose, onSuccess }) {
  const isEditMode = Boolean(roleId);
  const [loading, setLoading]     = useState(false);
  const [fetching, setFetching]   = useState(false);
  const [feedback, setFeedback]   = useState({ type: '', message: '' });
  const [availablePages, setAvailablePages] = useState([]);
  const [formData, setFormData]   = useState({ name: '', code: '', description: '', category: 'STAFF', allowedPages: [] });
  const [pageSearch, setPageSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFeedback({ type: '', message: '' });
    setPageSearch('');
    fetchPages();
    if (isEditMode) {
      setFormData({ name: '', code: '', description: '', category: 'STAFF', allowedPages: [] });
      loadRole();
    } else {
      setFormData({ name: '', code: '', description: '', category: 'STAFF', allowedPages: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, roleId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen && !loading) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  const fetchPages = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/roles/pages`, { headers: authHeader() });
      if (res.ok) setAvailablePages(await res.json());
    } catch { /* non-fatal */ }
  };

  const loadRole = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/roles`, { headers: authHeader() });
      if (res.ok) {
        const roles = await res.json();
        const found = roles.find((r) => r._id === roleId);
        if (found) {
          setFormData({
            name:         found.name        || '',
            code:         found.code        || '',
            description:  found.description || '',
            category:     found.category    || 'STAFF',
            allowedPages: Array.isArray(found.allowedPages) ? found.allowedPages : [],
          });
        }
      }
    } catch { /* non-fatal */ }
    finally { setFetching(false); }
  };

  const togglePage = (path) => {
    setFormData((prev) => {
      const has = prev.allowedPages.includes(path);
      return {
        ...prev,
        allowedPages: has
          ? prev.allowedPages.filter((p) => p !== path)
          : [...prev.allowedPages, path],
      };
    });
  };

  const selectAll = () => setFormData((prev) => ({ ...prev, allowedPages: availablePages.map((p) => p.path) }));
  const clearAll  = () => setFormData((prev) => ({ ...prev, allowedPages: [] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'Role Name is required.' });
      return;
    }
    if (!isEditMode && !formData.code.trim()) {
      setFeedback({ type: 'error', message: 'Role Code is required.' });
      return;
    }
    setLoading(true);
    try {
      const url    = isEditMode ? `${API_BASE_URL}/roles/${roleId}` : `${API_BASE_URL}/roles`;
      const method = isEditMode ? 'PUT' : 'POST';
      const body   = isEditMode
        ? { name: formData.name, description: formData.description, category: formData.category, allowedPages: formData.allowedPages }
        : { ...formData };

      const res  = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save role');

      setFeedback({ type: 'success', message: data.message });
      setTimeout(() => onSuccess(), 900);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = availablePages.filter((p) =>
    p.label.toLowerCase().includes(pageSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="sf-overlay"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="sf-modal" style={{ maxWidth: '640px' }}>
        <div className="sf-header">
          <h2 className="sf-title">{isEditMode ? 'Edit Role' : 'Add New Role'}</h2>
          <button type="button" className="sf-close-btn" onClick={onClose} disabled={loading}><X size={18} /></button>
        </div>

        <div className="sf-body">
          {feedback.message && (
            <div className={`sf-feedback ${feedback.type === 'success' ? 'sf-feedback-success' : 'sf-feedback-error'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} style={{ flexShrink: 0 }} /> : <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              <span>{feedback.message}</span>
            </div>
          )}

          {fetching ? (
            <div className="sf-loading"><Loader2 size={26} className="spin-animate" /><p>Loading role…</p></div>
          ) : (
            <form id="role-form" onSubmit={handleSubmit} className="sf-form" noValidate>
              {/* Name + Code */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label">Role Name <span className="sf-required">*</span></label>
                  <input
                    type="text" className="sf-input"
                    placeholder="e.g. Lab Instructor"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="sf-group">
                  <label className="sf-label">Role Code {!isEditMode && <span className="sf-required">*</span>}</label>
                  <input
                    type="text" className={`sf-input${isEditMode ? ' sf-input-readonly' : ''}`}
                    placeholder="e.g. LAB_INSTRUCTOR"
                    value={formData.code}
                    onChange={(e) => !isEditMode && setFormData((p) => ({ ...p, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                    readOnly={isEditMode} disabled={isEditMode}
                  />
                  {isEditMode && <small className="sf-field-hint">Role code cannot be changed.</small>}
                </div>
              </div>

              {/* Description + Category */}
              <div className="sf-row">
                <div className="sf-group">
                  <label className="sf-label">Description</label>
                  <input
                    type="text" className="sf-input"
                    placeholder="Brief description of this role"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
                <div className="sf-group">
                  <label className="sf-label">Category</label>
                  <select
                    className="sf-input"
                    value={formData.category}
                    onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="STAFF">Staff</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </div>
              </div>

              {/* Page Permissions */}
              <div className="sf-group" style={{ marginTop: '0.5rem' }}>
                <label className="sf-label">
                  Page Permissions
                  <span style={{ fontWeight: 400, color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.78rem' }}>
                    ({formData.allowedPages.length} selected — leave empty for unrestricted access)
                  </span>
                </label>

                {/* Search within pages */}
                <div className="search-box-wrapper" style={{ marginBottom: '0.5rem' }}>
                  <Search size={14} className="search-icon" />
                  <input
                    type="text" className="search-input"
                    placeholder="Search pages..."
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                  />
                  {pageSearch && <button type="button" className="search-clear-btn" onClick={() => setPageSearch('')}>Clear</button>}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <button type="button" className="books-btn books-btn-ghost" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }} onClick={selectAll}>Select All</button>
                  <button type="button" className="books-btn books-btn-ghost" style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }} onClick={clearAll}>Clear All</button>
                </div>

                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  padding: '0.25rem',
                }}>
                  {filteredPages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', fontSize: '0.85rem' }}>No pages found</p>
                  ) : (
                    filteredPages.map((page) => {
                      const checked = formData.allowedPages.includes(page.path);
                      return (
                        <label
                          key={page.path}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            padding: '0.4rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer',
                            background: checked ? 'var(--primary-bg, #eff6ff)' : 'transparent',
                            transition: 'background 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePage(page.path)}
                            style={{ width: '15px', height: '15px', accentColor: 'var(--primary-color, #2563eb)', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '0.875rem', flex: 1 }}>{page.label}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{page.path}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="role-form" className="sf-btn-save" disabled={loading || fetching}>
            {loading
              ? <><Loader2 size={15} className="spin-animate" /><span>Saving…</span></>
              : <><ShieldCheck size={15} /><span>{isEditMode ? 'Update Role' : 'Add Role'}</span></>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Detail Modal ────────────────────────────────────────────────────────
function ViewRoleModal({ role, onClose }) {
  if (!role) return null;
  return (
    <div className="sf-overlay" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sf-modal" style={{ maxWidth: '520px' }}>
        <div className="sf-header">
          <h2 className="sf-title">Role Details</h2>
          <button type="button" className="sf-close-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="sf-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Role Name',  value: role.name },
              { label: 'Role Code',  value: role.code },
              { label: 'Category',   value: role.category },
              { label: 'Description', value: role.description || '—' },
              { label: 'User Count', value: (role.userCount ?? 0).toString() },
              { label: 'System Role', value: role.isSystemRole ? 'Yes' : 'No' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                <span style={{ minWidth: '130px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '0.875rem', fontWeight: label === 'Role Code' ? 600 : 400, fontFamily: label === 'Role Code' ? 'monospace' : undefined }}>{value}</span>
              </div>
            ))}
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>Allowed Pages</span>
              {role.allowedPages && role.allowedPages.length > 0 ? (
                <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {role.allowedPages.map((p) => (
                    <span key={p} style={{ background: 'var(--primary-bg, #eff6ff)', color: 'var(--primary-color, #2563eb)', borderRadius: '0.3rem', padding: '0.2rem 0.5rem', fontSize: '0.78rem', fontFamily: 'monospace' }}>{p}</span>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>All pages (unrestricted)</p>
              )}
            </div>
          </div>
        </div>
        <div className="sf-footer">
          <button type="button" className="sf-btn-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const RoleManagement = () => {
  const { user, authLoading } = useAuth();
  const isSuperAdmin = !authLoading && user?.adminType === 'SUPER_ADMIN';

  const [roles, setRoles]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [search, setSearch]             = useState('');
  const [feedback, setFeedback]         = useState({ type: '', message: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewRole, setViewRole]         = useState(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editRoleId, setEditRoleId]     = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const feedbackTimerRef = useRef(null);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/roles`, { headers: authHeader() });
      if (!res.ok) throw new Error('Failed to fetch roles');
      setRoles(await res.json());
    } catch (err) {
      showFeedback('error', err.message || 'Error fetching roles');
    } finally {
      setLoading(false);
    }
  }, [showFeedback]);

  useEffect(() => {
    if (!authLoading && isSuperAdmin) fetchRoles();
  }, [authLoading, isSuperAdmin, fetchRoles]);

  useEffect(() => () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); }, []);

  const handleDelete = async (role) => {
    setDeleting(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/roles/${role._id}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete role');
      setRoles((prev) => prev.filter((r) => r._id !== role._id));
      showFeedback('success', data.message || `Role '${role.name}' deleted.`);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to delete role.');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const openAdd  = ()    => { setEditRoleId(null); setModalOpen(true); };
  const openEdit = (id)  => { setEditRoleId(id);   setModalOpen(true); };
  const closeModal = ()  => { setModalOpen(false);  setEditRoleId(null); };

  const handleSuccess = useCallback(() => {
    closeModal();
    fetchRoles();
    showFeedback('success', editRoleId ? 'Role updated successfully.' : 'Role created successfully.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editRoleId, fetchRoles, showFeedback]);

  const filtered = roles.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q);
  });

  if (authLoading) {
    return (
      <div className="page-container">
        <div className="page-header-row"><div><h1 className="page-title">Role Management</h1><p className="page-subtitle">Manage roles and page access permissions.</p></div></div>
        <div className="card table-card" style={{ marginTop: '1.25rem' }}>
          <div className="table-loading-state"><Loader2 size={24} className="spin-animate" /><p>Loading...</p></div>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="page-container">
        <div className="page-header-row"><div><h1 className="page-title">Role Management</h1></div></div>
        <div className="card" style={{ padding: '2rem', textAlign: 'center', marginTop: '1.25rem' }}>
          <ShieldCheck size={36} style={{ opacity: 0.3, margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Only Super Administrators can manage roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container departments-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Role Management</h1>
          <p className="page-subtitle">Create roles and assign page access permissions for each role.</p>
        </div>
        <div className="header-actions-group">
          <button type="button" className="books-btn books-btn-primary" onClick={openAdd}>
            <Plus size={16} /><span>Add Role</span>
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div className={`feedback-banner ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`} style={{ margin: '1rem 0' }} role="alert">
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
          <button type="button" style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }} onClick={() => setFeedback({ type: '', message: '' })}><X size={15} /></button>
        </div>
      )}

      {/* Table card */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        <div className="table-controls-bar">
          <div className="search-box-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text" className="search-input"
              placeholder="Search by name, code, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button type="button" className="search-clear-btn" onClick={() => setSearch('')}>Clear</button>}
          </div>
          <div className="table-stats-badge">Total: <strong>{filtered.length}</strong> {filtered.length === 1 ? 'Role' : 'Roles'}</div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="table-loading-state"><Loader2 size={24} className="spin-animate" /><p>Loading roles...</p></div>
          ) : filtered.length === 0 ? (
            <div className="table-empty-state">
              <ShieldCheck size={36} className="empty-icon" />
              <h3>No roles found</h3>
              <p>{search ? `No roles matched "${search}".` : 'Get started by creating your first role.'}</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="dpt-desk-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48px' }}>#</th>
                      <th>Role Name</th>
                      <th style={{ width: '160px' }}>Code</th>
                      <th style={{ width: '110px' }}>Category</th>
                      <th style={{ width: '80px', textAlign: 'center' }}>Users</th>
                      <th style={{ width: '130px' }}>Pages</th>
                      <th style={{ width: '220px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((role, index) => (
                      <tr key={role._id}>
                        <td className="text-secondary">{index + 1}</td>
                        <td>
                          <span className="dept-name-cell">{role.name}</span>
                          {role.isSystemRole && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: 'var(--primary-bg,#eff6ff)', color: 'var(--primary-color,#2563eb)', borderRadius: '0.25rem', padding: '0.1rem 0.4rem', fontWeight: 600 }}>System</span>}
                        </td>
                        <td><span className="code-badge">{role.code}</span></td>
                        <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{role.category}</span></td>
                        <td style={{ textAlign: 'center' }}>{role.userCount ?? 0}</td>
                        <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{role.allowedPages?.length ? `${role.allowedPages.length} pages` : 'All'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="action-btn view-btn"   title="View" onClick={() => setViewRole(role)}><Eye size={14} /><span className="action-label">View</span></button>
                            <button type="button" className="action-btn edit-btn"   title="Edit" onClick={() => openEdit(role._id)}><Edit size={14} /><span className="action-label">Edit</span></button>
                            {role.isSystemRole ? (
                              <button
                                type="button"
                                className="action-btn delete-btn"
                                title="System roles cannot be deleted"
                                disabled
                                style={{ opacity: 0.3, cursor: 'not-allowed' }}
                              >
                                <Trash2 size={14} /><span className="action-label">Delete</span>
                              </button>
                            ) : (
                              <button type="button" className="action-btn delete-btn" title="Delete" onClick={() => setDeleteConfirm(role)}><Trash2 size={14} /><span className="action-label">Delete</span></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="dpt-mob-list">
                {filtered.map((role, index) => (
                  <RoleMobCard
                    key={role._id}
                    role={role}
                    num={index + 1}
                    onView={() => setViewRole(role)}
                    onEdit={() => openEdit(role._id)}
                    onDelete={() => setDeleteConfirm(role)}
                    expanded={expanded === role._id}
                    onToggle={() => setExpanded((p) => (p === role._id ? null : role._id))}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => !deleting && setDeleteConfirm(null)}>
          <div className="modal-content delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-header">
              <div className="delete-dialog-icon"><AlertTriangle size={22} /></div>
              <div className="delete-dialog-title-box">
                <h3 className="delete-dialog-title">Delete Role</h3>
                <p className="delete-dialog-desc">Are you sure you want to delete this role? This cannot be undone.</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => !deleting && setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="delete-item-preview">
              <div>
                <div className="delete-item-name">{deleteConfirm.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Role Record</div>
              </div>
              <span className="delete-item-code">{deleteConfirm.code}</span>
            </div>
            <div className="delete-warning-note"><AlertCircle size={14} /><span>This operation cannot be undone.</span></div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
                {deleting ? <><Loader2 size={16} className="spin-animate" /><span>Deleting...</span></> : <><Trash2 size={16} /><span>Delete</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      <RoleFormModal isOpen={modalOpen} roleId={editRoleId} onClose={closeModal} onSuccess={handleSuccess} />
      <ViewRoleModal role={viewRole} onClose={() => setViewRole(null)} />
    </div>
  );
};

export default RoleManagement;
