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

const IS_PROD = window.location.hostname !== 'localhost';
const API_BASE_URL = IS_PROD ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const BulkUploadStudents = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      ['PRN', 'Name', 'Class', 'Division', 'Degree', 'Year of Enrollment', 'Custom Fields'],
      ['PRN2024001', 'John Doe', 'First Year', 'A', 'B.Tech Computer Science', '2024', 'Blood Group: O+; Address: Mumbai'],
      ['PRN2024002', 'Jane Smith', 'Second Year', 'B', 'B.Tech Information Technology', '2023', 'Blood Group: A+; Emergency Contact: 9876543210'],
      ['PRN2024003', 'Robert Johnson', 'Third Year', 'C', 'B.Tech Electronics', '2022', ''],
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_students_upload.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
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

    const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const requiredHeaders = ['prn', 'name', 'class', 'division', 'degree', 'year of enrollment'];
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const data = [];
    const parseErrors = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      if (!row.prn || !row.name || !row.class || !row.degree || !row['year of enrollment']) {
        parseErrors.push(`Row ${i + 1}: Missing required fields (PRN, Name, Class, Degree, or Year are empty)`);
        continue;
      }

      const studentData = {
        prn: row.prn.trim(),
        name: row.name.trim(),
        class: row.class.trim(),
        division: row.division.trim(),
        degree: row.degree.trim(),
        yearOfEnrollment: row['year of enrollment'].trim(),
        customFields: [],
      };

      if (row['custom fields'] && row['custom fields'].trim()) {
        const customFieldsStr = row['custom fields'].trim();
        const pairs = customFieldsStr.split(';').map(p => p.trim()).filter(p => p);
        
        pairs.forEach(pair => {
          const [key, ...valueParts] = pair.split(':');
          if (key && valueParts.length > 0) {
            studentData.customFields.push({
              key: key.trim(),
              value: valueParts.join(':').trim(),
            });
          }
        });
      }

      data.push(studentData);
    }

    return { data, errors: parseErrors };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setErrors(['Please select a valid CSV file']);
      return;
    }

    setSelectedFile(file);
    setErrors([]);
    setParsedData([]);
    setPreview([]);
    setUploadResult(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const { data, errors: parseErrors } = parseCSV(text);
        
        setParsedData(data);
        setPreview(data.slice(0, 5));
        setErrors(parseErrors);
      } catch (err) {
        setErrors([err.message]);
        setParsedData([]);
        setPreview([]);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setErrors(['Failed to read file']);
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;

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
        throw new Error(result.message || 'Bulk upload failed');
      }

      setUploadResult({
        success: true,
        message: result.message,
        created: result.created || parsedData.length,
        failed: result.failed || 0,
        details: result.details || [],
      });

      setTimeout(() => {
        navigate('/students');
      }, 2000);
    } catch (err) {
      setUploadResult({
        success: false,
        message: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setParsedData([]);
    setPreview([]);
    setErrors([]);
    setUploadResult(null);
  };

  return (
    <div className="page-container">
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
              Upload multiple student records at once using CSV file
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div style={{ padding: '1.5rem' }}>
          <div className="info-banner" style={{ marginBottom: '1.5rem' }}>
            <Info size={18} />
            <div>
              <strong>CSV Format Requirements:</strong>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                <li>Required columns: PRN, Name, Class, Division, Degree, Year of Enrollment</li>
                <li>Optional column: Custom Fields (format: "Key1: Value1; Key2: Value2")</li>
                <li>First row must be headers</li>
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
                      onClick={(e) => {
                        e.preventDefault();
                        resetUpload();
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </label>
            </div>

            {loading && (
              <div className="loading-state" style={{ marginTop: '1rem' }}>
                <Loader2 size={20} className="spin-animate" />
                <span>Parsing CSV file...</span>
              </div>
            )}

            {errors.length > 0 && (
              <div className="feedback-banner feedback-error" style={{ marginTop: '1rem' }}>
                <AlertCircle size={18} />
                <div>
                  <strong>Errors found in CSV file:</strong>
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    {errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {parsedData.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div className="preview-header">
                  <h3>Data Preview</h3>
                  <span className="preview-count">
                    {parsedData.length} student{parsedData.length !== 1 ? 's' : ''} ready to upload
                  </span>
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
                            <span className="code-badge">{student.prn}</span>
                          </td>
                          <td>{student.name}</td>
                          <td>{student.class}</td>
                          <td>{student.division || 'â€”'}</td>
                          <td>{student.degree}</td>
                          <td>{student.yearOfEnrollment}</td>
                          <td>
                            {student.customFields.length > 0
                              ? student.customFields.map(cf => `${cf.key}: ${cf.value}`).join('; ')
                              : 'â€”'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <div className="preview-footer">
                      Showing first 5 of {parsedData.length} students
                    </div>
                  )}
                </div>

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
                    disabled={uploading || parsedData.length === 0}
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={16} className="spin-animate" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Upload {parsedData.length} Student{parsedData.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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
                  {uploadResult.created > 0 && (
                    <p style={{ marginTop: '0.5rem' }}>
                      Successfully created {uploadResult.created} student record{uploadResult.created !== 1 ? 's' : ''}
                      {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
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
