/**
 * BulkUploadAlumni.jsx
 *
 * Defects fixed:
 *   D4   Download Sample CSV Template fits inside the card on mobile
 *        (alumni-bulk-card + alumni-bulk-template-btn CSS classes)
 *   D12  Name validated with shared validateName (rejects numbers-only, etc.)
 *   D13  Email validated with shared validateEmail
 *   D14  Phone validated with shared validatePhone
 *   Imp-B At least one contact method required per row
 *
 * Upload behavior:
 *   All rows are validated before any upload request is made.
 *   If ANY row is invalid the upload is blocked and all errors are shown.
 *   No partial import occurs when validation fails.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2,
  Loader2, X, ArrowLeft, Info,
} from 'lucide-react';
import {
  validateName,
  validateEmail,
  validatePhone,
  validateContactRequired,
  validateGraduationYear,
} from '../utils/alumniValidation';

const API_BASE_URL = 'http://localhost:5000/api';

const BulkUploadAlumni = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData,   setParsedData]   = useState([]);
  const [preview,      setPreview]      = useState([]);
  const [errors,       setErrors]       = useState([]);   // parse + validation errors
  const [loading,      setLoading]      = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  };

  // ── Sample CSV download ───────────────────────────────────────────────────

  const downloadSampleCSV = () => {
    const rows = [
      ['Alumni ID', 'Name', 'Graduation Year', 'Job Title', 'Current Company', 'Email', 'Phone',
       'LinkedIn', 'Instagram', 'Twitter', 'GitHub', 'Portfolio', 'Other'],
      ['ALM0001', 'Priya Sharma', '2020', 'Software Engineer', 'Google',
       'priya@example.com', '9876543210', 'https://linkedin.com/in/priya', '', '', 'https://github.com/priya', '', ''],
      ['ALM0002', 'Rahul Mehta', '2019', 'Product Manager', 'Microsoft',
       'rahul@example.com', '9123456789', 'https://linkedin.com/in/rahul', '', 'https://twitter.com/rahul', '', 'https://rahulmehta.com', ''],
      ['', 'Sneha Patil', '2021', 'Data Analyst', 'Infosys',
       'sneha@example.com', '', '', '', '', '', '', ''],
    ];
    const csv  = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'sample_alumni_upload.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 150);
  };

  // ── CSV parsing ───────────────────────────────────────────────────────────

  const parseCSVLine = (line) => {
    const result = []; let current = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if      (c === '"' && inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else if (c === '"')                                     { inQuotes = !inQuotes; }
      else if (c === ',' && !inQuotes)                        { result.push(current.trim()); current = ''; }
      else                                                    { current += c; }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2)
      throw new Error('CSV must have a header row and at least one data row.');

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const required = ['name', 'graduation year'];
    const missing  = required.filter(h => !headers.includes(h));
    if (missing.length)
      throw new Error(`Missing required columns: ${missing.join(', ')}`);

    const data = []; const errs = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      const row  = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });

      const rowNum = i + 1;

      // ── D12: Name ──────────────────────────────────────────────────────────
      const nameErr = validateName(row['name']);
      if (nameErr) { errs.push(`Row ${rowNum} (Name): ${nameErr}`); }

      // ── Graduation Year ────────────────────────────────────────────────────
      const yearErr = validateGraduationYear(row['graduation year']);
      if (yearErr) { errs.push(`Row ${rowNum} (Graduation Year): ${yearErr}`); }

      // ── D13: Email ─────────────────────────────────────────────────────────
      const emailErr = validateEmail(row['email']);
      if (emailErr) { errs.push(`Row ${rowNum} (Email): ${emailErr}`); }

      // ── D14: Phone ─────────────────────────────────────────────────────────
      const phoneErr = validatePhone(row['phone']);
      if (phoneErr) { errs.push(`Row ${rowNum} (Phone): ${phoneErr}`); }

      // ── Improvement B: contact required ────────────────────────────────────
      if (!emailErr && !phoneErr) {
        const contactErr = validateContactRequired(row['email'], row['phone']);
        if (contactErr) { errs.push(`Row ${rowNum}: ${contactErr}`); }
      }

      // Only if this row had no errors, add it to the data set.
      // We still collect ALL errors first so we can show them all at once.
      if (!nameErr && !yearErr && !emailErr && !phoneErr) {
        // Contact error does not prevent the row from being queued — it's
        // shown as a warning but does not block rows that have at least one contact.
        const hasContact = (row['email']||'').trim() || (row['phone']||'').trim();
        if (!hasContact) {
          // Row already flagged via contactErr above — skip adding to data
        } else {
          data.push({
            alumniId:       row['alumni id']?.trim().toUpperCase() || '',
            name:           row['name'].trim(),
            graduationYear: Number(row['graduation year']),
            jobTitle:       row['job title']?.trim()       || '',
            currentCompany: row['current company']?.trim() || '',
            email:          row['email']?.trim()           || '',
            phone:          row['phone']?.trim()           || '',
            linkedin:       row['linkedin']?.trim()        || '',
            instagram:      row['instagram']?.trim()       || '',
            twitter:        row['twitter']?.trim()         || '',
            github:         row['github']?.trim()          || '',
            portfolio:      row['portfolio']?.trim()       || '',
            other:          row['other']?.trim()           || '',
          });
        }
      }
    }

    return { data, errors: errs };
  };

  // ── File selection ────────────────────────────────────────────────────────

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { setErrors(['Please select a valid CSV file.']); return; }

    setSelectedFile(file);
    setErrors([]); setParsedData([]); setPreview([]); setUploadResult(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { data, errors: errs } = parseCSV(ev.target.result);
        setParsedData(data);
        setPreview(data.slice(0, 5));
        setErrors(errs);
      } catch (err) {
        setErrors([err.message]);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => { setErrors(['Failed to read file.']); setLoading(false); };
    reader.readAsText(file);
  };

  // ── Upload (blocked if any validation errors exist) ───────────────────────

  const handleUpload = async () => {
    // D12/D13/D14: do not upload if validation errors were found during parse
    if (errors.length > 0) {
      setUploadResult({ success: false, message: 'Fix all validation errors before uploading.' });
      return;
    }
    if (!parsedData.length) return;

    setUploading(true); setUploadResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/alumni/bulk`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ alumni: parsedData }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Bulk upload failed');
      setUploadResult({
        success: true,
        message: result.message,
        created: result.created,
        failed:  result.failed,
      });
      setTimeout(() => navigate('/alumni'), 2000);
    } catch (err) {
      setUploadResult({ success: false, message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null); setParsedData([]); setPreview([]);
    setErrors([]); setUploadResult(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn-back" onClick={() => navigate('/alumni')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Bulk Upload Alumni</h1>
            <p className="page-subtitle">Upload multiple alumni profiles at once using a CSV file</p>
          </div>
        </div>
      </div>

      {/* D4: alumni-bulk-card scopes the responsive fix */}
      <div className="card alumni-bulk-card" style={{ marginTop: '1.5rem' }}>
        <div style={{ padding: '1.5rem' }}>

          <div className="info-banner" style={{ marginBottom: '1.5rem' }}>
            <Info size={18} />
            <div>
              <strong>CSV Format Requirements:</strong>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                <li>Required columns: <strong>Name</strong> (first + last), <strong>Graduation Year</strong></li>
                <li>At least one contact: <strong>Email</strong> or <strong>Phone</strong> (10 digits)</li>
                <li>Optional: Alumni ID (auto-generated if blank), Job Title, Current Company, social links</li>
                <li>All rows are validated before any records are imported.</li>
              </ul>
            </div>
          </div>

          {/* D4: alumni-bulk-template-btn prevents overflow on mobile */}
          <div className="alumni-bulk-template-btn" style={{ marginBottom: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={downloadSampleCSV}>
              <Download size={16} /><span>Download Sample CSV Template</span>
            </button>
          </div>

          <div className="upload-section">
            <div className="upload-area">
              <input type="file" id="csvAlumniInput" accept=".csv"
                onChange={handleFileSelect} style={{ display: 'none' }} />
              <label htmlFor="csvAlumniInput" className="upload-label">
                <FileSpreadsheet size={40} className="upload-icon" />
                <h3>Choose CSV File</h3>
                <p>Click to browse or drag and drop your CSV file here</p>
                {selectedFile && (
                  <div className="selected-file-info">
                    <CheckCircle2 size={16} /><span>{selectedFile.name}</span>
                    <button type="button" className="remove-file-btn"
                      onClick={(e) => { e.preventDefault(); reset(); }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </label>
            </div>

            {loading && (
              <div className="loading-state" style={{ marginTop: '1rem' }}>
                <Loader2 size={20} className="spin-animate" /><span>Parsing CSV file…</span>
              </div>
            )}

            {errors.length > 0 && (
              <div className="feedback-banner feedback-error" style={{ marginTop: '1rem' }}>
                <AlertCircle size={18} />
                <div>
                  <strong>Validation errors — fix these before uploading:</strong>
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {parsedData.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="preview-header">
                  <h3>Data Preview</h3>
                  <span className="preview-count">
                    {parsedData.length} alumni record{parsedData.length !== 1 ? 's' : ''} ready to upload
                  </span>
                </div>
                <div className="table-container" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th>Alumni ID</th>
                        <th>Name</th>
                        <th>Year</th>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((a, i) => (
                        <tr key={i}>
                          <td className="text-secondary">{i + 1}</td>
                          <td><span className="code-badge">{a.alumniId || '(auto)'}</span></td>
                          <td>{a.name}</td>
                          <td>{a.graduationYear}</td>
                          <td>{a.jobTitle  || '—'}</td>
                          <td>{a.currentCompany || '—'}</td>
                          <td>{a.email || '—'}</td>
                          <td>{a.phone || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <div className="preview-footer">
                      Showing first 5 of {parsedData.length} records
                    </div>
                  )}
                </div>

                <div className="form-actions-row" style={{ marginTop: '1.5rem' }}>
                  <button type="button" className="books-btn books-btn-ghost"
                    onClick={reset} disabled={uploading}>
                    <X size={16} /><span>Cancel</span>
                  </button>
                  <button type="button" className="books-btn books-btn-primary"
                    onClick={handleUpload}
                    disabled={uploading || !parsedData.length || errors.length > 0}>
                    {uploading
                      ? <><Loader2 size={16} className="spin-animate" /><span>Uploading…</span></>
                      : <><Upload size={16} /><span>Upload {parsedData.length} Alumni</span></>}
                  </button>
                </div>
              </div>
            )}

            {uploadResult && (
              <div className={`feedback-banner ${uploadResult.success ? 'feedback-success' : 'feedback-error'}`}
                style={{ marginTop: '1.5rem' }}>
                {uploadResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <div>
                  <strong>{uploadResult.message}</strong>
                  {uploadResult.success && (
                    <p style={{ marginTop: '0.5rem' }}>Redirecting to alumni list…</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadAlumni;
