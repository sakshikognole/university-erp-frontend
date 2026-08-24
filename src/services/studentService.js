import axios from 'axios';

export async function getAllStudents() {
  const res = await axios.get('/api/students');
  return res.data;
}

export async function getStudentById(studentId) {
  const res = await axios.get(`/api/students/${studentId}`);
  return res.data;
}

export async function getCertificatePdfUrl(studentId, customContent, docType) {
  const res = await axios.post(
    '/api/documents/bonafide',
    { studentId, customContent, docType },
    { responseType: 'blob' }
  );
  return window.URL.createObjectURL(
    new Blob([res.data], { type: 'application/pdf' })
  );
}

export async function downloadCertificatePdf(studentId, studentName, customContent, docType) {
  const res = await axios.post(
    '/api/documents/bonafide',
    { studentId, customContent, docType },
    { responseType: 'blob' }
  );
  const url  = window.URL.createObjectURL(
    new Blob([res.data], { type: 'application/pdf' })
  );
  const safeName = (docType || 'certificate').replace(/\s+/g, '_');
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', `${safeName}_${studentName.replace(/\s+/g, '_')}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
