import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ClubModal from './ClubModal';
import ViewClubModal from './ViewClubModal';

const _IS_PROD_SP = window.location.hostname !== 'localhost';
const _SPRING_URL = _IS_PROD_SP ? 'https://university-erp-spring.onrender.com' : 'http://localhost:9090';
const SPRING_API = `${_SPRING_URL}/api`;

export default function ClubsPage() {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selClub, setSelClub] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewClub, setViewClub] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await axios.get(`${SPRING_API}/clubs`);
            setClubs(Array.isArray(res.data) ? res.data : (res.data?.content ?? []));
        } catch {
            setError('Failed to load clubs.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!success && !error) return;
        const t = setTimeout(() => { setSuccess(''); setError(''); }, 4000);
        return () => clearTimeout(t);
    }, [success, error]);

    const openAdd = () => { setSelClub(null); setModalMode('add'); setModalOpen(true); };
    const openEdit = (club) => { setSelClub(club); setModalMode('edit'); setModalOpen(true); };
    const openView = (club) => { setViewClub(club); setViewOpen(true); };

    const handleSave = async (form) => {
        setSaving(true);
        try {
            if (modalMode === 'add') {
                await axios.post(`${SPRING_API}/clubs`, form);
                setSuccess('Club added successfully.');
            } else {
                await axios.put(`${SPRING_API}/clubs/${selClub.id}`, form);
                setSuccess('Club updated successfully.');
            }
            setModalOpen(false);
            load(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to save club.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (club) => {
        if (!window.confirm(`Delete "${club.clubName}"?`)) return;
        setDeleting(club.id);
        try {
            await axios.delete(`${SPRING_API}/clubs/${club.id}`);
            setSuccess('Club deleted successfully.');
            load(true);
        } catch {
            setError('Failed to delete club.');
        } finally {
            setDeleting(null);
        }
    };

    // Only independent clubs shown in parent dropdown
    const parentClubs = clubs.filter((c) => !c.parentClubId);

    // Group: parent clubs first, then sub-clubs under their parent
    const parentList = clubs.filter((c) => !c.parentClubId);
    const subMap = clubs
        .filter((c) => c.parentClubId)
        .reduce((acc, c) => {
            if (!acc[c.parentClubId]) acc[c.parentClubId] = [];
            acc[c.parentClubId].push(c);
            return acc;
        }, {});

    // Final ordered list: parent + its sub-clubs, then next parent...
    const ordered = [];
    parentList.forEach((p) => {
        ordered.push(p);
        (subMap[p.clubId] || []).forEach((s) => ordered.push(s));
    });
    // Any sub-club whose parent doesn't exist yet — show at end
    clubs
        .filter((c) => c.parentClubId && !parentList.find((p) => p.clubId === c.parentClubId))
        .forEach((c) => ordered.push(c));

    const getParentName = (parentClubId) => {
        const p = clubs.find((c) => c.clubId === parentClubId);
        return p ? p.clubName : parentClubId;
    };

    return (
        <div className="page-container">

            {/* Page header */}
            <div className="books-page-header">
                <div>
                    <h1 className="page-title">Clubs</h1>
                    <p className="page-subtitle">Manage clubs and sub-clubs</p>
                </div>
                <button className="books-btn books-btn-primary" onClick={openAdd}>
                    + Add Club
                </button>
            </div>

            {/* Notifications */}
            {success && (
                <div className="books-alert books-alert-success">
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')}>x</button>
                </div>
            )}
            {error && (
                <div className="books-alert books-alert-error">
                    <span>{error}</span>
                    <button onClick={() => setError('')}>x</button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <p className="books-loading">Loading clubs...</p>
            ) : ordered.length === 0 ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
                    <p className="stu-info-text">No clubs added yet. Click "+ Add Club" to get started.</p>
                </div>
            ) : (
                <div className="club-grid">
                    {ordered.map((club) => (
                        <div
                            key={club.id}
                            className={`club-card ${club.parentClubId ? 'club-card-sub' : ''}`}
                            onClick={() => openView(club)}
                            style={{ cursor: 'pointer' }}
                        >
                        {/* Card top strip removed */}

                            <div className="club-card-body">

                                {/* Header row */}
                                <div className="club-card-header">
                                    <div>
                                        <p className="club-card-id">{club.clubId}</p>
                                        <h3 className="club-card-name">{club.clubName}</h3>
                                    </div>
                                    <span className={`club-status-badge ${club.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>
                                        {club.status}
                                    </span>
                                </div>

                                {/* Sub-club tag */}
                                {club.parentClubId && (
                                    <p className="club-parent-tag">
                                        Sub-club of: {getParentName(club.parentClubId)}
                                    </p>
                                )}

                                {/* Category */}
                                {club.clubCategory && (
                                    <p className="club-category">{club.clubCategory}</p>
                                )}

                                {/* Description — truncated to 100 chars on card */}
                                {club.description && (
                                    <p className="club-description">
                                        {club.description.length > 100
                                            ? club.description.slice(0, 100) + '...'
                                            : club.description}
                                    </p>
                                )}

                                <div className="club-divider" />

                                {/* Details grid */}
                                <div className="club-details-grid">
                                    {club.facultyCoordinator && (
                                        <div className="club-detail-item">
                                            <span className="club-detail-label">Faculty</span>
                                            <span className="club-detail-value">{club.facultyCoordinator}</span>
                                        </div>
                                    )}
                                    {club.activeMembers != null && (
                                        <div className="club-detail-item">
                                            <span className="club-detail-label">Members</span>
                                            <span className="club-detail-value">{club.activeMembers}</span>
                                        </div>
                                    )}
                                    {club.studentLeadName && (
                                        <div className="club-detail-item">
                                            <span className="club-detail-label">Student Lead</span>
                                            <span className="club-detail-value">
                                                {club.studentLeadName}
                                                {club.studentLeadRole && ` — ${club.studentLeadRole}`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Card actions */}
                            <div className="club-card-footer" onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="books-btn books-btn-sm books-btn-ghost"
                                    onClick={() => openEdit(club)}
                                ><span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</span></button>
                                <button
                                    className="books-btn books-btn-sm books-btn-danger"
                                    onClick={() => handleDelete(club)}
                                    disabled={deleting === club.id}
                                >
                                    {deleting === club.id ? 'Deleting...' : <span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>Delete</span>}
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            <ClubModal
                isOpen={modalOpen}
                mode={modalMode}
                club={selClub}
                parentClubs={parentClubs}
                existingClubs={clubs}
                onSave={handleSave}
                onClose={() => setModalOpen(false)}
                loading={saving}
            />

            <ViewClubModal
                isOpen={viewOpen}
                club={viewClub}
                parentClubs={clubs}
                onClose={() => setViewOpen(false)}
            />
        </div>
    );
}