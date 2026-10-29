export default function StudentInformation({ student }) {
  if (!student) return null;

  const fields = [
    { label: 'Student Name',       value: student.studentName || '-' },
    { label: 'Gender',             value: student.gender || 'Not specified' },
    { label: 'PRN',                value: student.prn            || '-' },
    { label: 'Division',           value: student.division       || '-' },
    { label: 'Year of Enrollment', value: student.yearOfEnrollment || '-' },
    { label: 'Studying Year',      value: student.studyingYear   || '-' },
    { label: 'Degree Program',     value: student.degreeProgramName || '-' },
    { label: 'Academic Year',      value: student.academicYear   || 'Not specified' },
  ];

  return (
    <div className="stu-info-card" style={{ maxWidth: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <table className="stu-info-table" style={{ tableLayout: 'fixed', width: '100%' }}>
        <tbody>
          {fields.map(({ label, value }) => (
            <tr key={label}>
              <td className="stu-info-label" style={{ verticalAlign: 'top', boxSizing: 'border-box' }}>{label}</td>
              <td className="stu-info-sep" style={{ verticalAlign: 'top', textAlign: 'center', width: 16 }}>:</td>
              <td className="stu-info-value" style={{ verticalAlign: 'top', wordBreak: 'break-word', overflowWrap: 'anywhere', boxSizing: 'border-box' }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
