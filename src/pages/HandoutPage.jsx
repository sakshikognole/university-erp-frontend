import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { springGet } from '../services/api';
import PageLoader from '../components/PageLoader';
import PageError  from '../components/PageError';
import { getAllStudents } from '../services/studentService';

const onLocalhost = window.location.hostname === 'localhost';
const SPRING_BASE = onLocalhost
  ? 'http://localhost:9090'
  : 'https://university-erp-spring.onrender.com';
const FALLBACK_SPRING_BASE = 'https://university-erp-spring.onrender.com';

function resolveContent(template, student) {
  const prefix = student.gender?.toLowerCase() === 'female' ? 'Miss'
               : student.gender?.toLowerCase() === 'male'   ? 'Mr.' : '';
  const sName = student.studentName || student.name || student.studentId || '';
  const fullName = prefix ? `${prefix} ${sName}` : sName;
  const degree = student.degreeProgramName || student.degree || '';
  const yr = student.studyingYear || student.class || '';
  const acad = student.academicYear || student.yearOfEnrollment || '';
  const prn = student.prn || '';
  const div = student.division || '';
  const enroll = student.yearOfEnrollment || student.academicYear || '';

  if (!template) {
    return (
      `        This is to certify that ${fullName} is a bonafide student of ` +
      `${degree}, currently studying in ${yr} ` +
      `during the Academic Year ${acad}.\n\n` +
      `        This certificate is issued upon the student's request for official purposes.`
    );
  }

  return template
    .replace(/\{\{name\}\}/gi,             fullName)
    .replace(/\{\{prn\}\}/gi,              prn)
    .replace(/\{\{class\}\}/gi,            yr)
    .replace(/\{\{division\}\}/gi,         div)
    .replace(/\{\{degree\}\}/gi,           degree)
    .replace(/\{\{yearOfEnrollment\}\}/gi, enroll);
}

async function fetchCertificatePdf(student, docName, template) {
  const content = resolveContent(template, student);
  const payload = {
    studentId:         student.studentId,
    docType:           docName,
    studentName:       student.studentName || student.name || '',
    degreeProgramName: student.degreeProgramName || student.degree || '',
    studyingYear:      student.studyingYear || student.class || '',
    academicYear:      student.academicYear || student.yearOfEnrollment || '',
    gender:            student.gender || '',
    customContent:     content,
  };

  const safeName = (student.studentName || student.name || student.studentId).replace(/\s+/g, '_');
  const safeDoc  = docName.replace(/\s+/g, '_');
  const fileName = `${safeName}_${safeDoc}.pdf`;

  // 1. Try primary SPRING_BASE with 3.5s timeout
  try {
    const res = await axios.post(`${SPRING_BASE}/api/documents/bonafide`, payload, {
      responseType: 'arraybuffer',
      timeout: 3500,
    });
    if (res.data && res.data.byteLength > 100) {
      return { name: fileName, data: new Uint8Array(res.data) };
    }
  } catch (primaryErr) {
    console.warn(`Primary PDF fetch failed for ${student.studentId}, trying Render fallback...`, primaryErr.message);
  }

  // 2. Fallback to Render if primary was localhost and failed
  if (SPRING_BASE !== FALLBACK_SPRING_BASE) {
    const res = await axios.post(`${FALLBACK_SPRING_BASE}/api/documents/bonafide`, payload, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    if (res.data && res.data.byteLength > 100) {
      return { name: fileName, data: new Uint8Array(res.data) };
    }
  }

  throw new Error(`Failed to generate PDF for ${student.studentName || student.studentId}`);
}

// ── Fast, dependency-free ZIP builder for browser ───────────────────────────
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  CRC_TABLE[i] = c;
}

function createZipBlob(files) {
  const encoder = new TextEncoder();
  const parts = [];
  const centralDirectory = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    const size = dataBytes.length;

    let crc = 0 ^ (-1);
    for (let i = 0; i < size; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ dataBytes[i]) & 0xFF];
    }
    crc = (crc ^ (-1)) >>> 0;

    const local = new Uint8Array(30 + nameBytes.length);
    const dvL = new DataView(local.buffer);
    dvL.setUint32(0, 0x04034b50, true);
    dvL.setUint16(4, 20, true);
    dvL.setUint16(6, 0, true);
    dvL.setUint16(8, 0, true);
    dvL.setUint16(10, 0, true);
    dvL.setUint16(12, 0, true);
    dvL.setUint32(14, crc, true);
    dvL.setUint32(18, size, true);
    dvL.setUint32(22, size, true);
    dvL.setUint16(26, nameBytes.length, true);
    dvL.setUint16(28, 0, true);
    local.set(nameBytes, 30);

    parts.push(local);
    parts.push(dataBytes);

    const cd = new Uint8Array(46 + nameBytes.length);
    const dvC = new DataView(cd.buffer);
    dvC.setUint32(0, 0x02014b50, true);
    dvC.setUint16(4, 20, true);
    dvC.setUint16(6, 20, true);
    dvC.setUint16(8, 0, true);
    dvC.setUint16(10, 0, true);
    dvC.setUint16(12, 0, true);
    dvC.setUint16(14, 0, true);
    dvC.setUint32(16, crc, true);
    dvC.setUint32(20, size, true);
    dvC.setUint32(24, size, true);
    dvC.setUint16(28, nameBytes.length, true);
    dvC.setUint16(30, 0, true);
    dvC.setUint16(32, 0, true);
    dvC.setUint16(34, 0, true);
    dvC.setUint16(36, 0, true);
    dvC.setUint32(38, 0, true);
    dvC.setUint32(42, offset, true);
    cd.set(nameBytes, 46);

    centralDirectory.push(cd);
    offset += local.length + dataBytes.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of centralDirectory) {
    parts.push(cd);
    cdSize += cd.length;
  }

  const eocd = new Uint8Array(22);
  const dvE = new DataView(eocd.buffer);
  dvE.setUint32(0, 0x06054b50, true);
  dvE.setUint16(4, 0, true);
  dvE.setUint16(6, 0, true);
  dvE.setUint16(8, files.length, true);
  dvE.setUint16(10, files.length, true);
  dvE.setUint32(12, cdSize, true);
  dvE.setUint32(16, cdOffset, true);
  dvE.setUint16(20, 0, true);
  parts.push(eocd);

  return new Blob(parts, { type: 'application/zip' });
}

export default function HandoutPage() {
  const [students,    setStudents]    = useState([]);
  const [docTypes,    setDocTypes]    = useState([]);
  const [selStudents, setSelStudents] = useState([]);
  const [selDocs,     setSelDocs]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [pageError,   setPageError]   = useState('');
  const successTimer = useRef(null);

  // Auto-dismiss success after 4 seconds
  useEffect(() => {
    if (!success) return;
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(successTimer.current);
  }, [success]);

  async function loadData() {
    setLoading(true); setPageError('');
    try {
      const [s, d] = await Promise.all([
        getAllStudents(),
        springGet('/document-types'),
      ]);
      setStudents(s);
      setDocTypes(Array.isArray(d) ? d : (d.data ?? []));
    } catch (err) {
      setPageError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const toggleStudent = (id) =>
    setSelStudents(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleDoc = (name) =>
    setSelDocs(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  const toggleAllS = () =>
    setSelStudents(selStudents.length === students.length ? [] : students.map(s => s.studentId));
  const toggleAllD = () =>
    setSelDocs(selDocs.length === docTypes.length ? [] : docTypes.map(d => d.documentName));

  const clearStudents = () => setSelStudents([]);

  async function handleGenerate() {
    if (!selStudents.length) { setError('Select at least one student.'); return; }
    if (!selDocs.length)     { setError('Select at least one certificate type.'); return; }
    setGenerating(true); setError(''); setSuccess('');

    const selectedStudentsList = students.filter(s => selStudents.includes(s.studentId));

    try {
      // Generate all certificates simultaneously in parallel
      const tasks = [];
      for (const s of selectedStudentsList) {
        for (const doc of selDocs) {
          const dtObj = docTypes.find(d => (d.documentName || d.typeName) === doc);
          tasks.push(fetchCertificatePdf(s, doc, dtObj?.defaultContent));
        }
      }

      const generatedFiles = await Promise.all(tasks);
      const zipBlob = createZipBlob(generatedFiles);

      const url  = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', 'certificates.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setSuccess(`${generatedFiles.length} PDF(s) downloaded as ZIP.`);
    } catch (err) {
      console.error('Handout generation failed:', err);
      setError('Failed to generate. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <PageLoader message="Loading students and certificate types..." />;
  if (pageError) return <PageError message={pageError} onRetry={loadData} />;

  return (
    <div className="page-container">

      {/* Header */}
      <div className="feature-page-header">
        <div className="feature-page-header-info">
          <h1 className="page-title">Handout</h1>
          <p className="page-subtitle">
            Select students and certificate types, then download all as a ZIP.
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="books-alert books-alert-error" style={{ marginBottom: 12 }}>
          <span>{error}</span>
          <button onClick={() => setError('')}>x</button>
        </div>
      )}
      {success && (
        <div className="books-alert books-alert-success" style={{ marginBottom: 12 }}>
          <span>✓ {success}</span>
          <button onClick={() => setSuccess('')}>x</button>
        </div>
      )}

      <div className="stu-handout-grid">

        {/* ── Students panel ── */}
        <div className="card stu-checklist-card">
          <div className="stu-checklist-header">
            <span className="stu-checklist-title">
              Students
              <span style={{ fontSize: 12, color: 'var(--text-secondary)',
                             fontWeight: 400, marginLeft: 6 }}>
                ({students.length} total)
              </span>
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="stu-btn stu-btn-sm stu-btn-ghost" onClick={toggleAllS}>
                {selStudents.length === students.length ? 'Deselect All' : 'Select All'}
              </button>
              {selStudents.length > 0 && (
                <button className="stu-btn stu-btn-sm stu-btn-ghost"
                        onClick={clearStudents}
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
                  Clear ({selStudents.length})
                </button>
              )}
            </div>
          </div>

          {students.length === 0 ? (
            <p className="stu-info-text">No students found.</p>
          ) : (
            <ul className="stu-checklist">
              {students.map(s => (
                <li key={s.studentId} className="stu-checklist-item">
                  <label className="stu-check-label">
                    <input
                      type="checkbox"
                      checked={selStudents.includes(s.studentId)}
                      onChange={() => toggleStudent(s.studentId)}
                    />
                    <span className="stu-check-text">
                      <strong>{s.studentName}</strong>
                      <span className="stu-check-meta">
                        {s.studentId} · {s.studyingYear} · {s.gender}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="stu-checklist-count">
            {selStudents.length} / {students.length} selected
          </div>
        </div>

        {/* ── Certificate Types panel ── */}
        <div className="card stu-checklist-card">
          <div className="stu-checklist-header">
            <span className="stu-checklist-title">Certificate Types</span>
            <button className="stu-btn stu-btn-sm stu-btn-ghost" onClick={toggleAllD}>
              {selDocs.length === docTypes.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {docTypes.length === 0 ? (
            <p className="stu-info-text">No certificate types found. Add one first.</p>
          ) : (
            <ul className="stu-checklist">
              {docTypes.map(d => (
                <li key={d.id} className="stu-checklist-item">
                  <label className="stu-check-label">
                    <input
                      type="checkbox"
                      checked={selDocs.includes(d.documentName)}
                      onChange={() => toggleDoc(d.documentName)}
                    />
                    <span className="stu-check-text">
                      <strong>{d.documentName}</strong>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="stu-checklist-count">
            {selDocs.length} / {docTypes.length} selected
          </div>

          <div style={{
            paddingTop: 12, borderTop: '1px solid var(--border-primary,#f3f4f6)',
            marginTop: 8,
          }}>
            {selStudents.length > 0 && selDocs.length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Will generate{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {selStudents.length * selDocs.length} PDF{selStudents.length * selDocs.length > 1 ? 's' : ''}
                </strong>
                {' '}({selStudents.length} student{selStudents.length > 1 ? 's' : ''}
                {' '}× {selDocs.length} type{selDocs.length > 1 ? 's' : ''})
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="books-btn books-btn-primary"
                style={{ fontSize: 13, padding: '7px 16px' }}
                onClick={handleGenerate}
                disabled={generating || !selStudents.length || !selDocs.length}
              >
                {generating ? 'Generating...' : '⬇ Generate & Download ZIP'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
