import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  CreditCard,
  PhoneCall,
  Mail,
} from 'lucide-react';

const PaymentFailure = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const failureData = location.state || {
    prn: 'PRN2024001',
    studentName: 'Aarav Sharma',
    feeType: 'Tuition & Development Fee',
    attemptedAmount: 80000,
    razorpayOrderId: 'order_test_failed_demo',
    failureReason: 'Transaction declined by test issuer. Check your payment credentials or try again.',
    errorCode: 'PAYMENT_FAILED',
    timestamp: new Date().toISOString(),
  };

  const formattedDate = new Date(failureData.timestamp || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="page-container" style={{ maxWidth: '720px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Back navigation */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/fee-payment')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Fee Payments</span>
        </button>
      </div>

      {/* Failure Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
          color: '#ffffff',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.25)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
          }}
        >
          <AlertOctagon size={36} color="#ffffff" />
        </div>

        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
          Payment Unsuccessful
        </h2>
        <p style={{ margin: '0.5rem auto 0 auto', maxWidth: '480px', opacity: 0.9, fontSize: '0.95rem' }}>
          We could not complete your fee transaction. No funds were permanently deducted.
        </p>
      </div>

      {/* Transaction Attempt Details Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          Transaction Attempt Details
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Attempted Amount
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
              ₹{(failureData.attemptedAmount || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Student PRN
            </div>
            <div style={{ fontWeight: 600, fontFamily: 'monospace', marginTop: '2px' }}>
              {failureData.prn || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Student Name
            </div>
            <div style={{ fontWeight: 600, marginTop: '2px' }}>
              {failureData.studentName || 'N/A'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Fee Head
            </div>
            <div style={{ fontWeight: 500, marginTop: '2px' }}>
              {failureData.feeType || 'Tuition & Academic Fee'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Gateway Order ID
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>
              {failureData.razorpayOrderId || 'order_test_failed'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Timestamp
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, marginTop: '2px' }}>
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Reason box */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
            Reason for Failure ({failureData.errorCode || 'GATEWAY_ERROR'})
          </div>
          <div style={{ fontSize: '0.9rem', color: '#b91c1c', marginTop: '4px' }}>
            {failureData.failureReason || 'Transaction was declined by test bank simulator.'}
          </div>
        </div>
      </div>

      {/* Troubleshooting and Guidance */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
          <HelpCircle size={18} />
          <span>Recommended Next Steps:</span>
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <li>Check that you have selected a valid payment method in test mode.</li>
          <li>Ensure your test payment amount does not exceed the remaining balance.</li>
          <li>If the issue persists, please retry the payment using another test mode option (UPI/Card).</li>
          <li>For administrative queries, contact the University Accounts Office.</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/fee-payment')}
          style={{ minWidth: '180px', height: '42px' }}
        >
          Back to Fee Payments
        </button>

        <button
          type="button"
          className="books-btn books-btn-primary"
          onClick={() => navigate('/fee-payment')}
          style={{ minWidth: '180px', height: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <RefreshCw size={16} />
          <span>Retry Payment</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentFailure;
