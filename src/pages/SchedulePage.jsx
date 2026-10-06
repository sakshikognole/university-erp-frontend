import { useNavigate } from 'react-router-dom';

export default function SchedulePage() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="books-page-header">
        <h1 className="page-title">Schedule Management</h1>
        <p className="books-page-sub">Manage exam schedules and class schedules</p>
      </div>

      {/* Two cards for navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
        marginTop: 32,
      }}>
        {/* Exam Schedule Card */}
        <div
          onClick={() => navigate('/exam-schedules')}
          style={{
            background: '#fff',
            border: '2px solid #e5e7eb',
            borderRadius: 12,
            padding: 32,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#fbbf24';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
          }}>
            📝
          </div>
          <h3 style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
          }}>
            Exam Schedules
          </h3>
          <p style={{
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 20,
          }}>
            Manage exam dates, timings, and classrooms
          </p>
          <button
            className="books-btn books-btn-primary"
            style={{
              width: '100%',
              background: '#fbbf24',
              color: '#111827',
              fontWeight: 700,
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/exam-schedules');
            }}
          >
            View Exam Schedules →
          </button>
        </div>

        {/* Class Schedule Card */}
        <div
          onClick={() => navigate('/class-schedules')}
          style={{
            background: '#fff',
            border: '2px solid #e5e7eb',
            borderRadius: 12,
            padding: 32,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{
            width: 80,
            height: 80,
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #dbeafe 0%, #3b82f6 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
          }}>
            🗓️
          </div>
          <h3 style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
          }}>
            Class Schedules
          </h3>
          <p style={{
            fontSize: 14,
            color: '#6b7280',
            marginBottom: 20,
          }}>
            Manage regular class schedules by department
          </p>
          <button
            className="books-btn books-btn-primary"
            style={{
              width: '100%',
              background: '#3b82f6',
              fontWeight: 700,
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/class-schedules');
            }}
          >
            View Class Schedules →
          </button>
        </div>
      </div>
    </div>
  );
}
