export default function StudentInformation({ student }) {
  if (!student) return null;

  const fields = [
    { label: 'Student Name',       value: student.studentName },
    { label: 'Gender',             value: student.gender },
    { label: 'PRN',                value: student.prn            || '-' },
    { label: 'Division',           value: student.division       || '-' },
    { label: 'Year of Enrollment', value: student.yearOfEnrollment || '-' },
    { label: 'Studying Year',      value: student.studyingYear },
    { label: 'Degree Program',     value: student.degreeProgramName },
    { label: 'Academic Year',      value: student.academicYear },
  ];

  return (
    <div className="stu-info-card">
      <table className="stu-info-table">
        <tbody>
          {fields.map(({ label, value }) => (
            <tr key={label}>
              <td className="stu-info-label">{label}</td>
              <td className="stu-info-sep">:</td>
              <td className="stu-info-value">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
