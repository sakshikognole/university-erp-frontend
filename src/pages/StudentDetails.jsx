import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { springApi } from '../services/api';
import StudentInformation from '../components/student/StudentInformation';

export default function StudentDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const student  = location.state?.student;

  const [docTypes,    setDocTypes]    = useState([]);
  const [docType,     setDocType]     = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // All hooks MUST be called before any conditional return (React rules of hooks)
  useEffect(() => {
    // If no student in state, navigate away immediately
    if (!student) {
      navigate('/select-student');
      return;
    }

    springApi.get('/document-types')
      .then((res) => {
        // springApi interceptor unwraps res.data — res IS the array directly
        const list = Array.isArray(res) ? res : (res.data ?? []);
        setDocTypes(list);
        if (list.length > 0) setDocType(list[0].documentName);
      })
      .catch(() => {
        setDocTypes([]);
      })
      .finally(() => setLoadingDocs(false));
  }, [student, navigate]);

  // Guard render — student will be null only on the very first render before
  // the effect above fires navigate(); return null prevents a crash meanwhile.
  if (!student) return null;

  function handleGenerate() {
    if (!docType) return;
    const selected = docTypes.find((d) => d.documentName === docType);
    navigate('/certificate-preview', {
      state: {
        student,
        docType,
        contentTemplate: selected?.defaultContent ?? '',
      },
    });
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Student Details</h1>
      <p className="stu-page-sub">Review student information and select a certificate type.</p>

      <div className="card stu-form-card">
        <StudentInformation student={student} />
      </div>

      <div className="card stu-form-card">
        <p className="stu-form-label" style={{ marginBottom: '0.75rem' }}>
          Select Certificate Type
        </p>

        {loadingDocs ? (
          <p className="stu-info-text">Loading certificate types...</p>
        ) : docTypes.length === 0 ? (
          <p className="stu-error-text">
            No certificate types found. Go to Add Document and add at least one.
          </p>
        ) : (
          <div className="stu-doctype-grid">
            {docTypes.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`stu-doctype-card${docType === d.documentName ? ' selected' : ''}`}
                onClick={() => setDocType(d.documentName)}
              >
                <span className="stu-doctype-name">{d.documentName}</span>
                {d.defaultContent && (
                  <span className="stu-doctype-desc">
                    {d.defaultContent.slice(0, 60)}
                    {d.defaultContent.length > 60 ? '...' : ''}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="stu-button-row">
          <button
            className="stu-btn stu-btn-ghost"
            onClick={() => navigate('/select-student')}
          >
            Back
          </button>
          <button
            className="stu-btn stu-btn-primary"
            onClick={handleGenerate}
            disabled={!docType || loadingDocs}
          >
            Generate Certificate
          </button>
        </div>
      </div>
    </div>
  );
}
