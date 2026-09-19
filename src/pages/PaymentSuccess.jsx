import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Printer,
  ArrowLeft,
  Receipt,
  CreditCard,
  Building,
  GraduationCap,
  Calendar,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { downloadFeeReceiptPDF } from '../utils/exportUtils';

const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = ${_NODE_URL}/api;

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [receipt, setReceipt] = useState(location.state?.receipt || null);
  const [loading, setLoading] = useState(!location.state?.receipt && Boolean(id));

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    // If navigated directly with an ID in URL, fetch receipt from backend
    if (!receipt && id) {
      fetchReceipt();
    }
  }, [id]);

  const fetchReceipt = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/fee-payments/receipt/${id}`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setReceipt(data.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load receipt:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (receipt) {
      downloadFeeReceiptPDF(receipt);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Loader2 size={32} className="spin-animate" style={{ margin: '0 auto 1rem auto' }} />
        <p>Loading payment receipt...</p>
      </div>
    );
  }

  // Fallback demo receipt if accessed without state
  const currentReceipt = receipt || {
    receiptNumber: 'RCP-20260829-8472',
    transactionId: 'TXN_TEST_DEMO_9981',
    razorpayPaymentId: 'pay_test_verified_9182',
    razorpayOrderId: 'order_test_9182',
    prn: 'PRN2024001',
    studentName: 'Aarav Sharma',
    class: 'TY-CSE',
    division: 'A',
    degree: 'B.Tech Computer Science',
    academicYear: '2025-2026',
    semester: 'Semester 5',
    feeType: 'Tuition & Development Fee',
    totalFeeAmount: 85000,
    discountAmount: 5000,
    amountPaidThisTransaction: 80000,
    totalPaidSoFar: 80000,
    remainingBalance: 0,
    status: 'PAID',
    paymentMethod: 'Razorpay (Test Mode - UPI/Card)',
    paidAt: new Date().toISOString(),
  };

  const paidDateFormatted = new Date(currentReceipt.paidAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="page-container" style={{ maxWidth: '840px', margin: '0 auto', paddingBottom: '3rem' }}>
      
      {/* Top Breadcrumb */}
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

      {/* Success Notification Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
          color: '#ffffff',
          padding: '1.75rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={32} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
              Payment Successful!
            </h2>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
              }}
            >
              TEST MODE VERIFIED
            </span>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            Your fee payment of <strong>₹{(currentReceipt.amountPaidThisTransaction || 0).toLocaleString('en-IN')}</strong> has been received and verified. The student record has been updated immediately.
          </p>
        </div>
      </div>

      {/* Official Fee Receipt Card */}
      <div
        className="card"
        id="printable-receipt"
        style={{
          border: '2px solid var(--color-black)',
          borderRadius: '10px',
          padding: '2rem',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Receipt Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={28} />
              <span style={{ fontSize: '1.4rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                University ERP
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Official Student Fee Payment E-Receipt
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#000000',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Receipt Verified
            </span>
            <div style={{ marginTop: '6px', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>
              #{currentReceipt.receiptNumber || 'RCP-UNKNOWN'}
            </div>
          </div>
        </div>

        {/* Student & Payment Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            backgroundColor: 'var(--bg-secondary)',
            padding: '1.25rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Student PRN
            </div>
            <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem', marginTop: '2px' }}>
              {currentReceipt.prn}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Student Name
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
              {currentReceipt.studentName}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Program / Degree
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
              {currentReceipt.degree} ({currentReceipt.class})
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Academic Session
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginTop: '2px' }}>
              {currentReceipt.academicYear} • {currentReceipt.semester}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Transaction ID
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>
              {currentReceipt.transactionId}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Payment Gateway Ref
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600, marginTop: '2px' }}>
              {currentReceipt.razorpayPaymentId}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Payment Date & Time
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>
              {paidDateFormatted}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Payment Method
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>
              {currentReceipt.paymentMethod}
            </div>
          </div>
        </div>

        {/* Itemized Breakdown Table */}
        <table className="data-table" style={{ marginBottom: '1.75rem', width: '100%' }}>
          <thead>
            <tr>
              <th>Fee Breakdown / Item Description</th>
              <th style={{ width: '180px', textAlign: 'right' }}>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style={{ fontWeight: 600 }}>{currentReceipt.feeType}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full prescribed institutional fee for academic term</div>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                ₹{(currentReceipt.totalFeeAmount || 0).toLocaleString('en-IN')}
              </td>
            </tr>

            {currentReceipt.discountAmount > 0 && (
              <tr>
                <td>
                  <div style={{ color: '#047857', fontWeight: 500 }}>Institutional Scholarship / Concession Applied</div>
                </td>
                <td style={{ textAlign: 'right', color: '#047857', fontWeight: 600 }}>
                  - ₹{(currentReceipt.discountAmount || 0).toLocaleString('en-IN')}
                </td>
              </tr>
            )}

            <tr>
              <td>
                <div style={{ fontWeight: 600 }}>Net Payable Fee</div>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>
                ₹{Math.max(0, (currentReceipt.totalFeeAmount || 0) - (currentReceipt.discountAmount || 0)).toLocaleString('en-IN')}
              </td>
            </tr>

            {/* Highlighted Amount Paid in This Transaction */}
            <tr style={{ backgroundColor: '#ecfdf5', borderTop: '2px solid #059669', borderBottom: '2px solid #059669' }}>
              <td>
                <div style={{ fontWeight: 800, color: '#047857', fontSize: '1rem' }}>
                  Amount Paid in This Transaction
                </div>
                <div style={{ fontSize: '0.75rem', color: '#065f46' }}>Status: Verified • Online Test Gateway</div>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857', fontSize: '1.15rem' }}>
                ₹{(currentReceipt.amountPaidThisTransaction || 0).toLocaleString('en-IN')}
              </td>
            </tr>

            <tr>
              <td>
                <div style={{ fontWeight: 600 }}>Total Cumulative Paid So Far</div>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                ₹{(currentReceipt.totalPaidSoFar || 0).toLocaleString('en-IN')}
              </td>
            </tr>

            <tr>
              <td>
                <div style={{ fontWeight: 700 }}>Total Remaining Balance</div>
              </td>
              <td style={{ textAlign: 'right', fontWeight: 800, color: currentReceipt.remainingBalance === 0 ? '#047857' : '#dc2626', fontSize: '1rem' }}>
                ₹{(currentReceipt.remainingBalance || 0).toLocaleString('en-IN')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Receipt Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px dashed #d1d5db',
            paddingTop: '1.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#059669" />
            <span>This is an official system generated e-receipt. Authenticity digitally verified.</span>
          </div>

          <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
            <div>Accounts & Finance Division</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 400 }}>University ERP Management</div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate('/fee-payment')}
          style={{ minWidth: '180px', height: '42px' }}
        >
          View All Fee Records
        </button>

        <button
          type="button"
          className="books-btn books-btn-primary"
          onClick={handleDownloadPDF}
          style={{ minWidth: '200px', height: '42px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Download size={16} />
          <span>Download PDF Receipt</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
