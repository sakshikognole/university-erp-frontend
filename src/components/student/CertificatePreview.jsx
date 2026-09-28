import { useState, useEffect } from 'react';
import { getCertificatePdfUrl, downloadCertificatePdf } from '../../services/studentService';

// Detect mobile — PDF iframe doesn't work on most mobile browsers
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || window.innerWidth <= 768;

export default function CertificatePreview({ student, customContent, docType }) {
  const [pdfUrl,      setPdfUrl]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [downloading, setDownloading] = useState(false);
  const [mobile,      setMobile]      = useState(false);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  useEffect(() => {
    if (!student?.studentId) return;
    let objectUrl = '';
    setLoading(true); setError(''); setPdfUrl('');

    getCertificatePdfUrl(student.studentId, customContent, docType)
      .then((url) => { objectUrl = url; setPdfUrl(url); })
      .catch(() => setError('Failed to generate certificate. Please try again.'))
      .finally(() => setLoading(false));

    return () => { if (objectUrl) window.URL.revokeObjectURL(objectUrl); };
  }, [student, customContent, docType]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadCertificatePdf(
        student.studentId, student.studentName, customContent, docType
      );
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  // D8: on mobile open PDF in a new tab (iframe doesn't work on iOS/Android)
  function handleOpenInTab() {
    if (pdfUrl) window.open(pdfUrl, '_blank');
  }

  function handlePrint() {
    if (!pdfUrl) return;
    const win = window.open(pdfUrl, '_blank');
    if (win) {
      win.addEventListener('load', () => { win.focus(); win.print(); });
    }
  }

  return (
    <div className="stu-cert-wrapper">
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p className="stu-info-text">Generating certificate...</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
            This may take a moment if the server is waking up.
          </p>
        </div>
      )}
      {error && <p className="stu-error-text">{error}</p>}

      {!loading && !error && pdfUrl && (
        <>
          {mobile ? (
            // D8: Mobile — show open button instead of broken iframe
            <div style={{
              textAlign: 'center', padding: '2.5rem 1rem',
              background: 'var(--bg-secondary, #f9fafb)',
              borderRadius: 12, border: '1px dashed #d1d5db',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
              <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>
                Certificate Ready
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Tap the button below to open your certificate PDF.
              </p>
              <button
                className="stu-btn stu-btn-primary"
                onClick={handleOpenInTab}
                style={{ marginBottom: 10 }}
              >
                Open Certificate PDF
              </button>
            </div>
          ) : (
            // Desktop — show iframe inline preview
            <div className="stu-pdf-container">
              <iframe
                src={pdfUrl}
                title="Certificate Preview"
                className="stu-pdf-iframe"
              />
            </div>
          )}

          <div className="stu-button-row">
            {!mobile && (
              <button className="stu-btn stu-btn-ghost" onClick={handlePrint}>
                Print
              </button>
            )}
            <button
              className="stu-btn stu-btn-primary"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
