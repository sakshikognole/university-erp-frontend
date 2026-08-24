import { useState, useEffect } from 'react';
import { getCertificatePdfUrl, downloadCertificatePdf } from '../../services/studentService';

export default function CertificatePreview({ student, customContent, docType }) {
  const [pdfUrl,      setPdfUrl]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [downloading, setDownloading] = useState(false);

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
      await downloadCertificatePdf(student.studentId, student.studentName, customContent, docType);
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  function handlePrint() {
    if (!pdfUrl) return;
    const win = window.open(pdfUrl, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        win.focus();
        win.print();
      });
    }
  }

  return (
    <div className="stu-cert-wrapper">
      {loading && <p className="stu-info-text">Generating certificate...</p>}
      {error   && <p className="stu-error-text">{error}</p>}

      {!loading && !error && pdfUrl && (
        <>
          <div className="stu-pdf-container">
            <iframe
              src={pdfUrl}
              title="Certificate Preview"
              className="stu-pdf-iframe"
            />
          </div>
          <div className="stu-button-row">
            <button className="stu-btn stu-btn-ghost" onClick={handlePrint}>
              Print
            </button>
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
