import { springApi } from './api';
import axios from 'axios';

// springApi interceptor returns res.data directly (the response body).
// Spring /api/students returns a Page object: { content: [...], totalElements: N, ... }
// We need to handle both paginated and raw array responses, and fetch ALL pages.
export async function getAllStudents() {
  // First request to get total count
  const firstRes = await springApi.get('/students', { params: { page: 0, size: 200 } });
  // Handle both paginated { content:[], totalElements:N } and raw array
  if (Array.isArray(firstRes)) return firstRes;
  if (firstRes && Array.isArray(firstRes.content)) {
    const total = firstRes.totalElements ?? firstRes.content.length;
    const pageSize = 200;
    const totalPages = Math.ceil(total / pageSize);
    if (totalPages <= 1) return firstRes.content;
    // Fetch remaining pages in parallel
    const rest = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        springApi.get('/students', { params: { page: i + 1, size: pageSize } })
          .then(r => (Array.isArray(r) ? r : r.content ?? []))
      )
    );
    return [...firstRes.content, ...rest.flat()];
  }
  return firstRes.data ?? [];
}

export async function getStudentById(studentId) {
  return springApi.get(`/students/${studentId}`);
}

// For blob responses (PDF/ZIP) we MUST use a plain axios instance —
// the springApi interceptor does res.data which breaks binary blobs.
// We call the Spring backend directly using the same runtime URL logic.
const onLocalhost = window.location.hostname === 'localhost';
const SPRING_BASE = onLocalhost
  ? 'http://localhost:9090'
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
