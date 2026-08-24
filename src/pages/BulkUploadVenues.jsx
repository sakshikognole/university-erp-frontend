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

const BulkUploadVenues = () => {
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
      ['Venue ID', 'Name', 'Capacity', 'Status', 'Facilities'],
      ['HALL-101', 'Main Auditorium', '500', 'ACTIVE', 'Projector: 4K Resolution; AC: Central AC System; Sound System: Dolby 5.1'],
      ['LAB-CS-01', 'Computer Lab A', '60', 'ACTIVE', 'Computers: 60 Desktops with i7 processors; Projector: HD; AC: Split AC'],
      ['ROOM-201', 'Lecture Room 201', '80', 'MAINTENANCE', 'Projector: Full HD; Whiteboard: Digital Smart Board'],
      ['HALL-MINI', 'Mini Auditorium', '200', 'ACTIVE', 'Projector: 4K; AC: Central; Seating: Cushioned Chairs'],
    ];

    const csvContent = sampleData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_venues_upload.csv';
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
    const requiredHeaders = ['venue id', 'name', 'capacity', 'status'];
    
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

      if (!row['venue id'] || !row.name || !row.capacity || !row.status) {
        parseErrors.push(`Row ${i + 1}: Missing required fields (Venue ID, Name, Capacity, or Status are empty)`);
        continue;
      }

      const capacity = Number(row.capacity);
      if (isNaN(capacity) || capacity < 1) {
        parseErrors.push(`Row ${i + 1}: Capacity must be a number greater than 0`);
        continue;
      }

      const validStatuses = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'RESERVED'];
      const status = row.status.trim().toUpperCase();
      if (!validStatuses.includes(status)) {
        parseErrors.push(`Row ${i + 1}: Status must be one of: ${validStatuses.join(', ')}`);
        continue;
      }

      const venueData = {
        venueId: row['venue id'].trim(),
        name: row.name.trim(),
        capacity: capacity,
        status: status,
        facilities: [],
      };

      if (row.facilities && row.facilities.trim()) {
        const facilitiesStr = row.facilities.trim();
        const pairs = facilitiesStr.split(';').map(p => p.trim()).filter(p => p);
        
        pairs.forEach(pair => {
          const [name, ...detailsParts] = pair.split(':');
          if (name && name.trim()) {
            venueData.facilities.push({
              name: name.trim(),
              details: detailsParts.length > 0 ? detailsParts.join(':').trim() : '',
            });
          }
        });
      }

      data.push(venueData);
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
      console.log('Sending request to:', `${API_BASE_URL}/super-admin/venues/bulk`);
      console.log('Token exists:', !!localStorage.getItem('erp_token'));
      
      const res = await fetch(`${API_BASE_URL}/super-admin/venues/bulk`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ venues: parsedData }),
      });

      console.log('Response status:', res.status);
      const result = await res.json();
      console.log('Response data:', result);

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
        navigate('/venues');
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
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
            onClick={() => navigate('/venues')}
            title="Back to Venues"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
              Bulk Upload Venues
            </h1>
            <p className="page-subtitle">
              Upload multiple venue records at once using CSV file
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
                <li>Required columns: Venue ID, Name, Capacity, Status</li>
                <li>Optional column: Facilities (format: "Name1: Details1; Name2: Details2")</li>
                <li>Status must be one of: ACTIVE, INACTIVE, MAINTENANCE, RESERVED</li>
                <li>Capacity must be a number greater than 0</li>
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
                    {parsedData.length} venue{parsedData.length !== 1 ? 's' : ''} ready to upload
                  </span>
                </div>

                <div className="table-container" style={{ marginTop: '1rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th style={{ width: '140px' }}>Venue ID</th>
                        <th>Name</th>
                        <th style={{ width: '100px' }}>Capacity</th>
                        <th style={{ width: '120px' }}>Status</th>
                        <th>Facilities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((venue, index) => (
                        <tr key={index}>
                          <td className="text-secondary">{index + 1}</td>
                          <td>
                            <span className="code-badge">{venue.venueId}</span>
                          </td>
                          <td>{venue.name}</td>
                          <td>{venue.capacity}</td>
                          <td>
                            <span className="status-badge">{venue.status}</span>
                          </td>
                          <td>
                            {venue.facilities.length > 0
                              ? venue.facilities.map(f => f.name).join(', ')
                              : 'â€”'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <div className="preview-footer">
                      Showing first 5 of {parsedData.length} venues
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
                        <span>Upload {parsedData.length} Venue{parsedData.length !== 1 ? 's' : ''}</span>
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
                      Successfully created {uploadResult.created} venue record{uploadResult.created !== 1 ? 's' : ''}
                      {uploadResult.failed > 0 && `, ${uploadResult.failed} failed`}
                    </p>
                  )}
                  {uploadResult.success && (
                    <p style={{ marginTop: '0.5rem' }}>Redirecting to venues list...</p>
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

export default BulkUploadVenues;
