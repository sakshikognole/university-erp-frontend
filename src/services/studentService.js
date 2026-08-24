import { springApi } from './api';
import axios from 'axios';

// springApi interceptor returns res.data directly (the response body).
// For /api/students → returns List<StudentResponse> array directly.
export async function getAllStudents() {
  const res = await springApi.get('/students');
  // res is already the array (interceptor unwrapped res.data)
  return Array.isArray(res) ? res : (res.data ?? []);
}

export async function getStudentById(studentId) {
  return springApi.get(`/students/${studentId}`);
}

// For blob responses (PDF/ZIP) we MUST use a plain axios instance —
// the springApi interceptor does res.data which breaks binary blobs.
// We call the Spring backend directly using the same runtime URL logic.
const onLocalhost = window.location.hostname === 'localhost';
const SPRING_BASE = onLocalhost
  ? 'http://localhost:8080'
  : 'https://university-erp-spring.onrender.com';

export async function getCertificatePdfUrl(studentId, customContent, docType) {
  const res = await axios.post(
    `${SPRING_BASE}/api/documents/bonafide`,
    { studentId, customContent, docType },
    { responseType: 'blob' },
  );
  return window.URL.createObjectURL(
    new Blob([res.data], { type: 'application/pdf' })
  );
}

export async function downloadCertificatePdf(studentId, studentName, customContent, docType) {
  const res = await axios.post(
    `${SPRING_BASE}/api/documents/bonafide`,
    { studentId, customContent, docType },
    { responseType: 'blob' },
  );
  const url      = window.URL.createObjectURL(
    new Blob([res.data], { type: 'application/pdf' })
  );
  const safeName = (docType || 'certificate').replace(/\s+/g, '_');
  const link     = document.createElement('a');
  link.href      = url;
  link.setAttribute('download', `${safeName}_${studentName.replace(/\s+/g, '_')}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
