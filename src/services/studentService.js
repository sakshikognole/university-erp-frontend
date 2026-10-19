import { springApi } from './api';
import axios from 'axios';

// ── Node.js backend URL (where real students are stored) ──────────────────────
const _IS_PROD = window.location.hostname !== 'localhost';
const NODE_API  = _IS_PROD
  ? 'https://university-erp-node.onrender.com/api'
  : 'http://localhost:5000/api';

// ── Map Node.js student fields → Spring-compatible field names used by Certificate/Handout
function mapNodeStudent(s) {
  return {
    studentId:        s._id || s.prn,
    studentName:      s.name,
    gender:           s.gender || '',
    prn:              s.prn,
    division:         s.division || '',
    yearOfEnrollment: s.yearOfEnrollment || '',
    studyingYear:     s.class || '',
    degreeProgramName: s.degree || '',
    academicYear:     s.academicYear || '',
    // Keep original fields too
    name:   s.name,
    class:  s.class,
    degree: s.degree,
    _id:    s._id,
  };
}

// Fetch all students from Node.js backend (same source as Students feature)
export async function getAllStudents() {
  const token = localStorage.getItem('erp_token');
  const res = await fetch(`${NODE_API}/super-admin/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load students');
  const data = await res.json();
  const students = Array.isArray(data) ? data : (data.students ?? data.content ?? []);
  return students.map(mapNodeStudent);
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

export async function getCertificatePdfUrl(studentId, customContent, docType, student = {}) {
  const res = await axios.post(
    `${SPRING_BASE}/api/documents/bonafide`,
    {
      studentId,
      customContent,
      docType,
      studentName:       student.studentName       || '',
      degreeProgramName: student.degreeProgramName || '',
      studyingYear:      student.studyingYear      || '',
      academicYear:      student.academicYear      || '',
      gender:            student.gender            || '',
    },
    { responseType: 'blob' },
  );
  return window.URL.createObjectURL(
    new Blob([res.data], { type: 'application/pdf' })
  );
}

export async function downloadCertificatePdf(studentId, studentName, customContent, docType, student = {}) {
  const res = await axios.post(
    `${SPRING_BASE}/api/documents/bonafide`,
    {
      studentId,
      customContent,
      docType,
      studentName:       student.studentName       || studentName || '',
      degreeProgramName: student.degreeProgramName || '',
      studyingYear:      student.studyingYear      || '',
      academicYear:      student.academicYear      || '',
      gender:            student.gender            || '',
    },
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
