import { useEffect, useState } from 'react';
import { getAllStudents } from '../../services/studentService';

export default function StudentSelector({ onSelect }) {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    getAllStudents()
      .then(setStudents)
      .catch(() => setError('Failed to load students. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e) {
    const studentId = e.target.value;
    setSelected(studentId);
    onSelect(students.find((s) => s.studentId === studentId) || null);
  }

  if (loading) return <p className="stu-info-text">Loading students...</p>;
  if (error)   return <p className="stu-error-text">{error}</p>;

  return (
    <select
      className="stu-select"
      value={selected}
      onChange={handleChange}
      aria-label="Select a student"
    >
      <option value="">-- Select Student --</option>
      {students.map((s) => (
        <option key={s.studentId} value={s.studentId}>
          {s.studentName} ({s.studentId})
        </option>
      ))}
    </select>
  );
}
