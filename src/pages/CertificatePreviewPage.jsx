import { useLocation, useNavigate } from 'react-router-dom';
import CertificatePreview from '../components/student/CertificatePreview';

function resolveContent(template, student) {
  if (!template) return buildFallback(student);
  const prefix   = student.gender?.toLowerCase() === 'female' ? 'Miss'
                 : student.gender?.toLowerCase() === 'male'   ? 'Mr.' : '';
  const fullName = prefix ? `${prefix} ${student.studentName}` : student.studentName;
  return template
    .replace(/\{\{name\}\}/gi,             fullName)
    .replace(/\{\{prn\}\}/gi,              student.prn               ?? '')
    .replace(/\{\{class\}\}/gi,            student.studyingYear      ?? '')
    .replace(/\{\{division\}\}/gi,         student.division          ?? '')
    .replace(/\{\{degree\}\}/gi,           student.degreeProgramName ?? '')
    .replace(/\{\{yearOfEnrollment\}\}/gi, student.yearOfEnrollment  ?? '');
}

function buildFallback(student) {
  const prefix   = student.gender?.toLowerCase() === 'female' ? 'Miss'
                 : student.gender?.toLowerCase() === 'male'   ? 'Mr.' : '';
  const fullName = prefix ? `${prefix} ${student.studentName}` : student.studentName;
  return (
    `        This is to certify that ${fullName} is a bonafide student of ` +
    `${student.degreeProgramName}, currently studying in ${student.studyingYear} ` +
    `during the Academic Year ${student.academicYear}.\n\n` +
    `        This certificate is issued upon the student's request for official purposes.`
  );
}

export default function CertificatePreviewPage() {
  const location        = useLocation();
  const navigate        = useNavigate();
  const student         = location.state?.student;
  const docType         = location.state?.docType         ?? '';
  const contentTemplate = location.state?.contentTemplate ?? '';

  if (!student) { navigate('/select-student'); return null; }

  const customContent = resolveContent(contentTemplate, student);

  return (
    <div className="page-container">
      <h1 className="page-title">Certificate Preview</h1>
      <p className="stu-page-sub">
        {student.studentName}{docType ? ` — ${docType}` : ''}
      </p>

      <div className="card stu-form-card" style={{ maxWidth: 800 }}>
        <CertificatePreview student={student} customContent={customContent} docType={docType} />

        <div className="stu-button-row" style={{ marginTop: '0.5rem' }}>
          <button
            className="stu-btn stu-btn-ghost"
            onClick={() => navigate('/student-details', { state: { student } })}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
