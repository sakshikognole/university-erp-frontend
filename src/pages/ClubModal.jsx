import { useState, useEffect } from 'react';

const EMPTY = {
    clubId: '',
    clubName: '',
    clubCategory: '',
    parentClubId: '',
    description: '',
    facultyCoordinator: '',
    studentLeadName: '',
    studentLeadId: '',
    studentLeadRole: '',
    activeMembers: '',
    status: 'Active',
};

export default function ClubModal({ isOpen, mode, club, parentClubs, onSave, onClose, loading }) {
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!isOpen) return;
        if (mode === 'edit' && club) {
            setForm({
                clubId: club.clubId ?? '',
                clubName: club.clubName ?? '',
                clubCategory: club.clubCategory ?? '',
                parentClubId: club.parentClubId ?? '',
                description: club.description ?? '',
                facultyCoordinator: club.facultyCoordinator ?? '',
                studentLeadName: club.studentLeadName ?? '',
                studentLeadId: club.studentLeadId ?? '',
                studentLeadRole: club.studentLeadRole ?? '',
                activeMembers: club.activeMembers ?? '',
                status: club.status ?? 'Active',
            });
        } else {
            setForm(EMPTY);
        }
        setErrors({});
    }, [isOpen, mode, club]);

    if (!isOpen) return null;

    const change = (e) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        setErrors((er) => ({ ...er, [name]: '' }));
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const val = value.trim();
        if (name === 'clubId') {
            if (!val) {
                setErrors((er) => ({ ...er, clubId: 'Club ID is required' }));
            } else if (!/^[A-Za-z0-9]+$/.test(val)) {
                setErrors((er) => ({ ...er, clubId: 'Invalid ID. Please enter a valid ID.' }));
            }
        } else if (name === 'clubName') {
            if (!val) {
                setErrors((er) => ({ ...er, clubName: 'Club Name is required' }));
            } else if (!/^[A-Za-z0-9\s]+$/.test(val)) {
                setErrors((er) => ({ ...er, clubName: 'Invalid Club Name. Please enter a valid club name.' }));
            }
        } else if (name === 'clubCategory') {
            if (val && !/^[A-Za-z0-9\s]+$/.test(val)) {
                setErrors((er) => ({ ...er, clubCategory: 'Invalid Category. Please enter a valid category.' }));
            }
        } else if (name === 'facultyCoordinator') {
            if (val && !/^[A-Za-z0-9\s.]+$/.test(val)) {
                setErrors((er) => ({ ...er, facultyCoordinator: 'Invalid Coordinator Name. Please enter a valid name.' }));
            }
        } else if (name === 'studentLeadName') {
            if (val && !/^[A-Za-z0-9\s.]+$/.test(val)) {
                setErrors((er) => ({ ...er, studentLeadName: 'Invalid Name. Please enter a valid name.' }));
            }
        } else if (name === 'studentLeadId') {
            if (val && !/^[A-Za-z0-9]+$/.test(val)) {
                setErrors((er) => ({ ...er, studentLeadId: 'Invalid ID. Please enter a valid ID.' }));
            }
        } else if (name === 'studentLeadRole') {
            if (val && !/^[A-Za-z0-9\s]+$/.test(val)) {
                setErrors((er) => ({ ...er, studentLeadRole: 'Invalid Role. Please enter a valid role.' }));
            }
        }
    };

    const validate = () => {
        const e = {};

        // Club ID validation — upper and lower letters and numbers only
        if (!form.clubId.trim()) {
            e.clubId = 'Club ID is required';
        } else if (!/^[A-Za-z0-9]+$/.test(form.clubId.trim())) {
            e.clubId = 'Invalid ID. Please enter a valid ID.';
        }

        // Club Name validation — upper and lower letters and numbers only
        if (!form.clubName.trim()) {
            e.clubName = 'Club Name is required';
        } else if (!/^[A-Za-z0-9\s]+$/.test(form.clubName.trim())) {
            e.clubName = 'Invalid Club Name. Please enter a valid club name.';
        }

        // Club Category validation — upper and lower letters and numbers only
        if (form.clubCategory.trim() && !/^[A-Za-z0-9\s]+$/.test(form.clubCategory.trim())) {
            e.clubCategory = 'Invalid Category. Please enter a valid category.';
        }

        if (!form.status) e.status = 'Required';

        // Faculty Coordinator validation
        if (form.facultyCoordinator.trim() && !/^[A-Za-z0-9\s.]+$/.test(form.facultyCoordinator.trim())) {
            e.facultyCoordinator = 'Invalid Coordinator Name. Please enter a valid name.';
        }

        // Student Lead Name validation
        if (form.studentLeadName.trim() && !/^[A-Za-z0-9\s.]+$/.test(form.studentLeadName.trim())) {
            e.studentLeadName = 'Invalid Name. Please enter a valid name.';
        }

        // Student Lead ID validation
        if (form.studentLeadId.trim() && !/^[A-Za-z0-9]+$/.test(form.studentLeadId.trim())) {
            e.studentLeadId = 'Invalid ID. Please enter a valid ID.';
        }

        // Student Lead Role validation
        if (form.studentLeadRole.trim() && !/^[A-Za-z0-9\s]+$/.test(form.studentLeadRole.trim())) {
            e.studentLeadRole = 'Invalid Role. Please enter a valid role.';
        }

        return e;
    };

    const submit = (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        onSave({
            ...form,
            activeMembers: form.activeMembers === '' ? null : Number(form.activeMembers),
            parentClubId: form.parentClubId.trim() || null,
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            submit(e);
        }
    };

    return (
        <div className="books-overlay">
            <div className="books-modal" style={{ maxWidth: 540 }}>

                <div className="books-modal-head">
                    <h3>{mode === 'add' ? 'Add Club' : 'Edit Club'}</h3>
                    <button className="books-modal-close" onClick={onClose}>x</button>
                </div>

                <form onSubmit={submit} onKeyDown={handleKeyDown}>
                    <div className="books-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>

                        {/* Row 1 — Club ID + Club Name */}
                        <div className="club-form-row">
                            <div className="books-form-group">
                                <label className="books-form-label">Club ID *</label>
                                <input
                                    className={`books-form-control ${errors.clubId ? 'err' : ''}`}
                                    name="clubId" value={form.clubId} onChange={change} onBlur={handleBlur}
                                    placeholder="e.g. CLB001"
                                    disabled={mode === 'edit'}
                                />
                                {errors.clubId && <p className="books-form-err">{errors.clubId}</p>}
                            </div>
                            <div className="books-form-group">
                                <label className="books-form-label">Club Name *</label>
                                <input
                                    className={`books-form-control ${errors.clubName ? 'err' : ''}`}
                                    name="clubName" value={form.clubName} onChange={change} onBlur={handleBlur}
                                    placeholder="e.g. Coding Club"
                                />
                                {errors.clubName && <p className="books-form-err">{errors.clubName}</p>}
                            </div>
                        </div>

                        {/* Row 2 — Category + Status */}
                        <div className="club-form-row">
                            <div className="books-form-group">
                                <label className="books-form-label">Club Category</label>
                                <input
                                    className={`books-form-control ${errors.clubCategory ? 'err' : ''}`}
                                    name="clubCategory" value={form.clubCategory} onChange={change} onBlur={handleBlur}
                                    placeholder="e.g. Technical, Sports"
                                />
                                {errors.clubCategory && <p className="books-form-err">{errors.clubCategory}</p>}
                            </div>
                            <div className="books-form-group">
                                <label className="books-form-label">Status *</label>
                                <select
                                    className={`books-form-control ${errors.status ? 'err' : ''}`}
                                    name="status" value={form.status} onChange={change}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                {errors.status && <p className="books-form-err">{errors.status}</p>}
                            </div>
                        </div>

                        {/* Parent Club — optional, only for sub-clubs */}
                        <div className="books-form-group">
                            <label className="books-form-label">
                                Parent Club
                                <span className="club-optional-tag">optional — leave empty for independent club</span>
                            </label>
                            <select
                                className="books-form-control"
                                name="parentClubId" value={form.parentClubId} onChange={change}
                            >
                                <option value="">-- Independent Club (no parent) --</option>
                                {parentClubs
                                    .filter((c) => c.clubId !== form.clubId)
                                    .map((c) => (
                                        <option key={c.clubId} value={c.clubId}>
                                            {c.clubName} ({c.clubId})
                                        </option>
                                    ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="books-form-group">
                            <label className="books-form-label">Description</label>
                            <textarea
                                className="books-form-control"
                                name="description" value={form.description} onChange={change}
                                placeholder="Brief description of the club..."
                                rows={3}
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                            />
                        </div>

                        {/* Faculty Coordinator + Active Members */}
                        <div className="club-form-row">
                            <div className="books-form-group">
                                <label className="books-form-label">Faculty Coordinator</label>
                                <input
                                    className={`books-form-control ${errors.facultyCoordinator ? 'err' : ''}`}
                                    name="facultyCoordinator" value={form.facultyCoordinator} onChange={change} onBlur={handleBlur}
                                    placeholder="e.g. Prof. A. Sharma"
                                />
                                {errors.facultyCoordinator && <p className="books-form-err">{errors.facultyCoordinator}</p>}
                            </div>
                            <div className="books-form-group">
                                <label className="books-form-label">Active Members</label>
                                <input
                                    className="books-form-control"
                                    name="activeMembers" type="number" min="0"
                                    value={form.activeMembers} onChange={change}
                                    placeholder="e.g. 25"
                                />
                            </div>
                        </div>

                        {/* Student Lead */}
                        <p className="club-section-label">Student Lead</p>
                        <div className="club-form-row">
                            <div className="books-form-group">
                                <label className="books-form-label">Name</label>
                                <input
                                    className={`books-form-control ${errors.studentLeadName ? 'err' : ''}`}
                                    name="studentLeadName" value={form.studentLeadName} onChange={change} onBlur={handleBlur}
                                    placeholder="e.g. Rahul Patil"
                                />
                                {errors.studentLeadName && <p className="books-form-err">{errors.studentLeadName}</p>}
                            </div>
                            <div className="books-form-group">
                                <label className="books-form-label">Student ID</label>
                                <input
                                    className={`books-form-control ${errors.studentLeadId ? 'err' : ''}`}
                                    name="studentLeadId" value={form.studentLeadId} onChange={change} onBlur={handleBlur}
                                    placeholder="e.g. STU001"
                                />
                                {errors.studentLeadId && <p className="books-form-err">{errors.studentLeadId}</p>}
                            </div>
                        </div>
                        <div className="books-form-group">
                            <label className="books-form-label">Role</label>
                            <input
                                className={`books-form-control ${errors.studentLeadRole ? 'err' : ''}`}
                                name="studentLeadRole" value={form.studentLeadRole} onChange={change} onBlur={handleBlur}
                                placeholder="e.g. President"
                            />
                            {errors.studentLeadRole && <p className="books-form-err">{errors.studentLeadRole}</p>}
                        </div>

                    </div>

                    <div className="books-modal-foot">
                        <button type="button" className="books-btn books-btn-ghost"
                            onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : mode === 'add' ? 'Add Club' : 'Save Changes'}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}