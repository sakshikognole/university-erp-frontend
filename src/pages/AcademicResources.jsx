
import React, { useEffect, useState } from 'react';

const _IS_PROD_AR = window.location.hostname !== 'localhost';
const NODE_URL = _IS_PROD_AR ? 'https://university-erp-node.onrender.com/api' : 'http://localhost:5000/api';

const AcademicResources = () => {
  const [showForm, setShowForm] = useState(false);

  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const [resources, setResources] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch resources from backend
  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setFetching(true);

      const response = await fetch(
        `${NODE_URL}/resources`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to fetch resources'
        );
      }

      setResources(data.resources || []);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  // Upload resource
  const handleUpload = async () => {
    setMessage('');
    setError('');

    if (!subject || !title || !file) {
      setError('Please select a subject, enter a title and choose a file.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append('subject', subject);
      formData.append('title', title);
      formData.append('file', file);

      const response = await fetch(
        `${NODE_URL}/resources`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to upload resource'
        );
      }

      // Add newly uploaded resource to the list
      setResources((prev) => [
        data.resource,
        ...prev,
      ]);

      // Clear form
      setSubject('');
      setTitle('');
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        'academic-resource-file'
      );

      if (fileInput) {
        fileInput.value = '';
      }

      setMessage('Academic resource uploaded successfully!');
      setShowForm(false);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete resource
  const handleDelete = async (id) => {
    setMessage('');
    setError('');

    const confirmed = window.confirm(
      'Are you sure you want to delete this resource?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${NODE_URL}/resources/${id}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete resource'
        );
      }

      setResources((prev) =>
        prev.filter((resource) => resource._id !== id)
      );

      setMessage('Academic resource deleted successfully!');

    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return '';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header academic-resource-header">

        <div>
          <h1 className="page-title">
            Academic Resources
          </h1>

          <p className="academic-resource-subtitle">
            Upload and manage study materials for your subjects.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setMessage('');
            setError('');
          }}
        >
          + Upload Resource
        </button>

      </div>

      {/* Success Message */}
      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Upload Form */}
      {showForm && (
        <div className="card academic-resource-form">

          <h2>Upload Academic Resource</h2>

          {/* Subject */}
          <div className="form-group">
            <label>Subject</label>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">
                Select Subject
              </option>

              <option value="Database Management System">
                Database Management System
              </option>

              <option value="Operating System">
                Operating System
              </option>

              <option value="Computer Networks">
                Computer Networks
              </option>

              <option value="Data Structures">
                Data Structures
              </option>

              <option value="Artificial Intelligence">
                Artificial Intelligence
              </option>
            </select>
          </div>

          {/* Title */}
          <div className="form-group">
            <label>Resource Title</label>

            <input
              type="text"
              placeholder="Enter resource title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* File */}
          <div className="form-group">
            <label>Upload File</label>

            <input
              id="academic-resource-file"
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => {
                const selectedFile = e.target.files[0];

                if (selectedFile) {
                  setFile(selectedFile);
                  setError('');
                }
              }}
            />

            {file && (
              <div className="selected-file">

                <p>
                  Selected file:{' '}
                  <strong>{file.name}</strong>
                </p>

                <p>
                  Size:{' '}
                  <strong>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </strong>
                </p>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setFile(null);

                    const fileInput =
                      document.getElementById(
                        'academic-resource-file'
                      );

                    if (fileInput) {
                      fileInput.value = '';
                    }
                  }}
                >
                  Remove
                </button>

              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="form-actions">

            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setSubject('');
                setTitle('');
                setFile(null);
                setError('');
              }}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading
                ? 'Uploading...'
                : 'Upload Resource'}
            </button>

          </div>

        </div>
      )}

      {/* Resources */}
      <div className="academic-resource-list">

        {fetching ? (
          <div className="card academic-resource-empty">
            <p>Loading academic resources...</p>
          </div>
        ) : resources.length === 0 ? (

          <div className="card academic-resource-empty">

            <div className="academic-resource-empty-icon">
              📚
            </div>

            <h2>No Academic Resources Yet</h2>

            <p>
              Upload study materials, notes, presentations
              and other resources for your subjects.
            </p>

            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              + Upload First Resource
            </button>

          </div>

        ) : (

          resources.map((resource) => (

            <div
              className="card academic-resource-card"
              key={resource._id}
            >

              <div className="academic-resource-card-header">

                <div className="academic-resource-title-section">

                  <div className="academic-resource-icon">
                    📄
                  </div>

                  <div>
                    <h2>{resource.title}</h2>

                    <p className="subject-name">
                      {resource.subject}
                    </p>
                  </div>

                </div>

                <span className="academic-resource-date">
                  {formatDate(resource.createdAt)}
                </span>

              </div>

              <div className="academic-resource-card-footer">

                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Open Resource
                </a>

                <button
                  className="btn btn-danger"
                  onClick={() =>
                    handleDelete(resource._id)
                  }
                >
                  Delete
                </button>

              </div>

            </div>

          ))

        )}

      </div>

    </div>
  );
};

export default AcademicResources;
