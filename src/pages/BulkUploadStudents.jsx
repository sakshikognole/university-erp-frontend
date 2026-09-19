import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { validateStudentFields } from '../utils/studentValidation';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

// ---------------------------------------------------------------------------
// BulkUploadStudents
// Flow:
//  1. User downloads the sample CSV template.
//  2. User selects a .csv file — parsed immediately in the browser.
//  3. Every row is validated with the same rules as StudentForm (Add/Edit).
//  4. If ANY row fails validation, all errors are shown; upload button is
//     disabled until the file is replaced with a corrected version.
//  5. Only when ALL rows pass does the Upload button become active.
//  6. On upload, the backend re-validates (authoritative) and only inserts
//     when the complete batch is valid.
// ---------------------------------------------------------------------------
const BulkUploadStudents = () => {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile]   = useState(null);
  const [parsedData, setParsedData]       = useState([]);   // valid rows ready for upload
  const [preview, setPreview]             = useState([]);   // first 5 rows
  const [parseErrors, setParseErrors]     = useState([]);   // header / structural errors
  const [rowErrors, setRowErrors]         = useState([]);   // per-row validation errors
  const [loading, setLoading]             = useState(false);
  const [uploading, setUploading]         = useState(false);
  const [uploadResult, setUploadResult]   = useState(null);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // ── Sample CSV download ─────────────────────────────────────────────────
  const downloadSampleCSV = () => {
    const sampleData = [
      ['PRN', 'Name', 'Class', 'Division', 'Degree', 'Year of Enrollment', 'Custom Fields'],
      ['PRN2024001', 'John Doe',      'First Year',  'A', 'B.Tech Computer Science',       '2024', 'Blood Group: O+; Address: Mumbai'],
      ['PRN2024002', 'Jane Smith',    'Second Year', 'B', 'B.Tech Information Technology', '2023', 'Blood Group: A+; Emergency Contact: 9876543210'],
      ['PRN2024003', 'Robert Johnson','Third Year',  'C', 'B.Tech Electronics',            '2022', ''],
    ];
    const csvContent = sampleData
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = 'sample_students_upload.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── CSV parser ──────────────────────────────────────────────────────────
  const parseCSVLine = (line) => {
    const result = [];
    let current  = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char     = line[i];
      const nextChar = line[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // ── Full CSV processing: parse + validate ALL rows ─────────────────────
  const processCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) {
      return {
        data: [],
        parseErrors: ['CSV file must contain at least a header row and one data row.'],
        rowErrors: [],
      };
    }

    const headers  = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
    const required = ['prn', 'name', 'class', 'division', 'degree', 'year of enrollment'];
    const missing  = required.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      return {
        data: [],
        parseErrors: [`Missing required columns: ${missing.join(', ')}`],
        rowErrors: [],
      };
    }

    const data       = [];
    const structural = []; // missing-field structural errors
    const validation = []; // per-row business-rule errors

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row    = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] !== undefined ? values[idx] : '';
      });

      const rowNum = i + 1; // +1 because row 1 is header

      // Structural check: flag empty required fields so the user knows they're missing
      const structuralMissing = required.filter((h) => !row[h] || !row[h].trim());
      if (structuralMissing.length > 0) {
        structural.push(
          `Row ${rowNum}: Missing required field(s): ${structuralMissing.join(', ')}.`
        );
        // Still continue to collect format errors for the non-empty fields
      }

      // Parse custom fields string
      const customFields = [];
      if (row['custom fields'] && row['custom fields'].trim()) {
        row['custom fields']
          .split(';')
          .map((p) => p.trim())
          .filter(Boolean)
          .forEach((pair) => {
            const [key, ...valueParts] = pair.split(':');
            if (key && valueParts.length > 0) {
              customFields.push({ key: key.trim(), value: valueParts.join(':').trim() });
            }
          });
      }

      const studentData = {
        prn:              (row['prn']                  || '').trim(),
        name:             (row['name']                 || '').trim(),
        class:            (row['class']                || '').trim(),
        division:         (row['division']             || '').trim(),
        degree:           (row['degree']               || '').trim(),
        yearOfEnrollment: (row['year of enrollment']   || '').trim(),
        customFields,
      };

      // Business-rule validation (same rules as Add/Edit Student form)
      const errors = validateStudentFields({
        name:             studentData.name,
        prn:              studentData.prn,
        class:            studentData.class,
        division:         studentData.division,
        degree:           studentData.degree,
        yearOfEnrollment: studentData.yearOfEnrollment,
      });

      const errorMessages = Object.values(errors);
      if (errorMessages.length > 0) {
        validation.push({
          row:    rowNum,
          prn:    studentData.prn || '(empty)',
          errors: errorMessages,
        });
      }

      data.push(studentData);
    }

    return { data, parseErrors: structural, rowErrors: validation };
  };

  // ── File select handler ─────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setParseErrors(['Please select a valid CSV file (.csv extension required).']);
      return;
    }

    setSelectedFile(file);
    setParseErrors([]);
    setRowErrors([]);
    setParsedData([]);
    setPreview([]);
    setUploadResult(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const { data, parseErrors: pe, rowErrors: re } = processCSV(text);

        setParseErrors(pe);
        setRowErrors(re);

        // Only populate parsedData (enabling upload) when there are NO errors
        if (pe.length === 0 && re.length === 0) {
          setParsedData(data);
          setPreview(data.slice(0, 5));
        } else {
          setParsedData([]);
          setPreview(data.slice(0, 5)); // still show preview so user can see the data
        }
      } catch (err) {
        setParseErrors([err.message]);
        setParsedData([]);
        setPreview([]);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setParseErrors(['Failed to read the file. Please try again.']);
      setLoading(false);
    };
    reader.readAsText(file);
  };

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    if (parseErrors.length > 0 || rowErrors.length > 0) return; // belt-and-suspenders guard

    setUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/super-admin/students/bulk`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ students: parsedData }),
      });

      const result = await res.json();

      if (!res.ok) {
        // Backend returned validation errors — show them (this should rarely
        // happen since we pre-validate in the browser, but the API is authoritative)
        if (result.validationFailed && result.rowErrors) {
          setRowErrors(
            result.rowErrors.map((re) => ({
              row:    re.row,
              prn:    re.prn,
              errors: re.errors,
            }))
          );
          setParsedData([]);
        }
        throw new Error(result.message || 'Bulk upload failed');
      }

      setUploadResult({
        success: true,
        message: result.message,
        created: result.created || parsedData.length,
        failed:  result.failed  || 0,
        details: result.details || [],
      });

      setTimeout(() => {
        navigate('/students');
      }, 2000);
    } catch (err) {
      setUploadResult({
        success: false,
        message: err.message || 'Bulk upload failed. Please try again.',
      });
    } finally {
      setUploading(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────
  const resetUpload = () => {
    setSelectedFile(null);
    setParsedData([]);
    setPreview([]);
    setParseErrors([]);
    setRowErrors([]);
    setUploadResult(null);
    // Reset the file input so the same file can be re-selected after fixing
    const input = document.getElementById('csvFileInput');
    if (input) input.value = '';
  };

  const hasErrors      = parseErrors.length > 0 || rowErrors.length > 0;
  const totalRows      = preview.length > 0 ? (parsedData.length || preview.length) : 0;
  const canUpload      = parsedData.length > 0 && !hasErrors && !uploading;

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate('/students')}
            title="Back to Students"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              Bulk Upload Students
            </h1>
            <p className="page-subtitle">
              Upload multiple student records at once using a CSV file
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ padding: '1.5rem' }}>

          {/* ── Instructions ── */}
          <div className="info-banner" style={{ marginBottom: '1.5rem' }}>
            <Info size={18} />
            <div>
              <strong>CSV Format Requirements:</strong>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                <li>Required columns: PRN, Name, Class, Division, Degree, Year of Enrollment</li>
                <li>Optional column: Custom Fields (format: "Key1: Value1; Key2: Value2")</li>
                <li>First row must be headers</li>
                <li>PRN format: PRN + 4-digit year + 3-digit number (e.g. PRN2024001)</li>
                <li>Name must include first and last name (e.g. John Doe)</li>
                <li>Year of Enrollment must be a 4-digit year (e.g. 2024)</li>
                <li>All fields should be properly quoted if they contain commas</li>
              </ul>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={downloadSampleCSV}
            style={{ marginBottom: '1.5rem' }}
          >
            <Download size={16} />
            <span>Download Sample CSV Template</span>
          </button>

          {/* ── File drop zone ── */}
          <div className="upload-section">
            <div className="upload-area">
              <input
                type="file"
                id="csvFileInput"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="csvFileInput" className="upload-label">
                <FileSpreadsheet size={40} className="upload-icon" />
                <h3>Choose CSV File</h3>
                <p>Click to browse or drag and drop your CSV file here</p>
                {selectedFile && (
                  <div className="selected-file-info">
                    <CheckCircle2 size={16} />
                    <span>{selectedFile.name}</span>
                    <button
                      type="button"
                      className="remove-file-btn"
                      onClick={(e) => { e.preventDefault(); resetUpload(); }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </label>
            </div>

            {/* Parsing spinner */}
            {loading && (
              <div className="loading-state" style={{ marginTop: '1rem' }}>
                <Loader2 size={20} className="spin-animate" />
                <span>Parsing and validating CSV file...</span>
              </div>
            )}

            {/* ── Structural / header errors ── */}
            {!loading && parseErrors.length > 0 && (
              <div className="feedback-banner feedback-error" style={{ marginTop: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>File structure errors:</strong>
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    {parseErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
                    Please fix these issues and re-upload the file.
                  </p>
                </div>
              </div>
            )}

            {/* ── Row-level validation errors ── */}
            {!loading && rowErrors.length > 0 && (
              <div className="feedback-banner feedback-error" style={{ marginTop: '1rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ width: '100%' }}>
                  <strong>
                    Validation errors in {rowErrors.length} row{rowErrors.length !== 1 ? 's' : ''} —
                    no records will be uploaded until all errors are fixed:
                  </strong>
                  <div style={{ marginTop: '0.75rem' }}>
                    {rowErrors.map((re, i) => (
                      <div
                        key={i}
                        className="bulk-row-error"
                      >
                        <span className="bulk-row-error-label">
                          Row {re.row}
                          {re.prn && re.prn !== '(empty)' ? ` · PRN: ${re.prn}` : ''}
                        </span>
                        <ul style={{ marginTop: '0.25rem', marginLeft: '1.25rem' }}>
                          {re.errors.map((msg, j) => (
                            <li key={j}>{msg}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }}>
                    Correct the errors in your CSV file, then re-upload.
                  </p>
                </div>
              </div>
            )}

            {/* ── Data preview ── */}
            {!loading && preview.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="preview-header">
                  <h3>
                    Data Preview
                    {hasErrors && (
                      <span style={{ color: '#b91c1c', fontWeight: 400, fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                        (errors found — upload is disabled)
                      </span>
                    )}
                  </h3>
                  {!hasErrors && (
                    <span className="preview-count">
                      {parsedData.length} student{parsedData.length !== 1 ? 's' : ''} ready to upload
                    </span>
                  )}
                </div>

                <div className="table-container" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th>PRN</th>
                        <th>Name</th>
                        <th>Class</th>
                        <th style={{ width: '100px' }}>Division</th>
                        <th>Degree</th>
                        <th style={{ width: '100px' }}>Year</th>
                        <th>Custom Fields</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((student, index) => (
                        <tr key={index}>
                          <td className="text-secondary">{index + 1}</td>
                          <td>
                            <span className="code-badge">{student.prn || '—'}</span>
                          </td>
                          <td>{student.name || '—'}</td>
                          <td>{student.class || '—'}</td>
                          <td>{student.division || '—'}</td>
                          <td>{student.degree || '—'}</td>
                          <td>{student.yearOfEnrollment || '—'}</td>
                          <td>
                            {student.customFields && student.customFields.length > 0
                              ? student.customFields
                                  .map((cf) => `${cf.key}: ${cf.value}`)
                                  .join('; ')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {totalRows > 5 && (
                    <div className="preview-footer">
                      Showing first 5 of {totalRows} rows
                    </div>
                  )}
                </div>

                {/* ── Action buttons ── */}
                <div className="form-actions-row" style={{ marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    className="books-btn books-btn-ghost"
                    onClick={resetUpload}
                    disabled={uploading}
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    className="books-btn books-btn-primary"
                    onClick={handleUpload}
                    disabled={!canUpload}
                    title={hasErrors ? 'Fix all validation errors before uploading' : ''}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="spin-animate" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>
                          Upload{' '}
                          {parsedData.length > 0
                            ? `${parsedData.length} Student${parsedData.length !== 1 ? 's' : ''}`
                            : ''}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── Upload result ── */}
            {uploadResult && (
              <div
                className={`feedback-banner ${
                  uploadResult.success ? 'feedback-success' : 'feedback-error'
                }`}
                style={{ marginTop: '1.5rem' }}
              >
                {uploadResult.success ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                <div>
                  <strong>{uploadResult.message}</strong>
                  {uploadResult.success && uploadResult.created > 0 && (
                    <p style={{ marginTop: '0.5rem' }}>
                      Successfully created {uploadResult.created} student record
                      {uploadResult.created !== 1 ? 's' : ''}.
                    </p>
                  )}
                  {uploadResult.success && (
                    <p style={{ marginTop: '0.5rem' }}>Redirecting to students list...</p>
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

export default BulkUploadStudents;
