import { useState, useEffect } from 'react';

const EMPTY = {
  examId:          '',
  subject:         '',
  academicYear:    '',
  description:     '',
  displayMode:     'PERCENTAGE',
  percentageScale: '100',   // custom max for PERCENTAGE (e.g. 50 means show out of 50%)
  fractionScale:   '10',    // custom denominator for FRACTION (e.g. 5 means /5)
};

export default function ExamModal({
  isOpen, mode, exam, onSave, onClose, loading, dupError, onDupOk,
}) {
  const [form,   setForm]   = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && exam) {
      setForm({
        examId:          exam.examId          ?? '',
        subject:         exam.subject         ?? '',
        academicYear:    exam.academicYear    ?? '',
        description:     exam.description     ?? '',
        displayMode:     exam.displayMode     ?? 'PERCENTAGE',
        percentageScale: exam.percentageScale != null ? String(exam.percentageScale) : '100',
        fractionScale:   exam.fractionScale   != null ? String(exam.fractionScale)   : '10',
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [isOpen, mode, exam]);

  if (!isOpen) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.examId.trim()) {
      e.examId = 'Exam ID is required';
    } else if (/[^A-Za-z0-9\-]/.test(form.examId.trim())) {
      e.examId = 'Exam ID must not contain special characters.';
    } else if (!/[A-Za-z]/.test(form.examId.trim())) {
      e.examId = 'Exam ID must contain at least one letter (e.g. EX001).';
    } else if (!/[0-9]/.test(form.examId.trim())) {
      e.examId = 'Exam ID must contain at least one number (e.g. EX001).';
    }
    if (!form.subject.trim()) e.subject = 'Subject is required';
    return e;
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      ...form,
      percentageScale: Number(form.percentageScale) || 100,
      fractionScale:   Number(form.fractionScale)   || 10,
    });
  };

  return (
    <div className="books-overlay">
      <div className="books-modal" style={{ maxWidth: 480 }}>
        <div className="books-modal-head">
          <h3>{mode === 'add' ? 'Add Exam' : 'Edit Exam'}</h3>
          <button className="books-modal-close" onClick={onClose}>x</button>
        </div>

        <form onSubmit={submit}>
          <div className="books-modal-body">

            {/* Duplicate error popup */}
            {dupError && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fca5a5',
                borderRadius: 8, padding: '12px 16px', marginBottom: 16,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                  <p style={{ color: '#dc2626', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    {dupError}
                  </p>
                </div>
                <button type="button" onClick={onDupOk} style={{
                  alignSelf: 'flex-end', padding: '6px 24px',
                  background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
                }}>OK</button>
              </div>
            )}

            {/* Exam ID */}
            <div className="books-form-group">
              <label className="books-form-label">Exam ID *</label>
              <input
                className={`books-form-control ${errors.examId ? 'err' : ''}`}
                name="examId" value={form.examId} onChange={change}
                placeholder="e.g. EX001"
                disabled={mode === 'edit'}
                autoFocus
              />
              {errors.examId && <p className="books-form-err">{errors.examId}</p>}
            </div>

            {/* Subject */}
            <div className="books-form-group">
              <label className="books-form-label">Subject *</label>
              <input
                className={`books-form-control ${errors.subject ? 'err' : ''}`}
                name="subject" value={form.subject} onChange={change}
                placeholder="e.g. Data Structures and Algorithms"
              />
              {errors.subject && <p className="books-form-err">{errors.subject}</p>}
            </div>

            {/* Academic Year */}
            <div className="books-form-group">
              <label className="books-form-label">Academic Year</label>
              <input
                className="books-form-control"
                name="academicYear" value={form.academicYear} onChange={change}
                placeholder="e.g. 2026-27"
              />
            </div>

            {/* Display Mode toggle — only one selectable at a time */}
            <div className="books-form-group">
              <label className="books-form-label">Display Marks As</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                {[
                  { value: 'PERCENTAGE', label: '% Percentage', example: 'e.g. 75%' },
                  { value: 'FRACTION',   label: '⅟ Fraction',   example: 'e.g. 7.5 / scale' },
                ].map((opt) => {
                  const isSelected = form.displayMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, displayMode: opt.value }))}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        border: `2px solid ${isSelected ? '#111827' : '#e5e7eb'}`,
                        borderRadius: 8,
                        background: isSelected ? '#111827' : '#fff',
                        color: isSelected ? '#fff' : '#374151',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{opt.label}</span>
                      <span style={{
                        fontSize: '0.75rem', opacity: 0.7,
                        color: isSelected ? '#d1d5db' : '#9ca3af',
                      }}>{opt.example}</span>
                    </button>
                  );
                })}
              </div>

              {/* Percentage scale input — shown when PERCENTAGE selected */}
              {form.displayMode === 'PERCENTAGE' && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    Convert to percentage out of
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="books-form-control"
                    name="percentageScale"
                    value={form.percentageScale}
                    onChange={change}
                    style={{ width: 80, padding: '6px 10px' }}
                    placeholder="100"
                  />
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    e.g. 50 → shows as 40% out of 50
                  </span>
                </div>
              )}

              {/* Fraction scale input — shown when FRACTION selected */}
              {form.displayMode === 'FRACTION' && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    Convert marks to scale of
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="books-form-control"
                    name="fractionScale"
                    value={form.fractionScale}
                    onChange={change}
                    style={{ width: 80, padding: '6px 10px' }}
                    placeholder="10"
                  />
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    e.g. scale = 5 → 20 marks become /5
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="books-form-group">
              <label className="books-form-label">Description</label>
              <textarea
                className="books-form-control"
                name="description" value={form.description} onChange={change}
                placeholder="Optional notes about this exam..."
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Info banner */}
            <div style={{
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 6, padding: '8px 12px',
              fontSize: '0.83rem', color: '#1d4ed8', display: 'flex', gap: 6,
            }}>
              <span>ℹ️</span>
              <span>
                T1/T2 max = <strong>20</strong> marks. SEE max = <strong>50</strong> marks.
                {form.displayMode === 'PERCENTAGE'
                  ? ` Marks shown as % out of ${form.percentageScale || 100} (e.g. 15/20 → ${((15/20)*(Number(form.percentageScale)||100)).toFixed(0)}%).`
                  : ` Marks shown as fractions out of ${form.fractionScale || 10} (e.g. 15/20 → ${((15/20)*(Number(form.fractionScale)||10)).toFixed(2)}/${form.fractionScale || 10}).`}
              </span>
            </div>

          </div>

          <div className="books-modal-foot">
            <button type="button" className="books-btn books-btn-ghost"
              onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="books-btn books-btn-primary" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Exam' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
