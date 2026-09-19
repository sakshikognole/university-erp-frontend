---import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  X,
  FileText,
  User,
  GraduationCap,
  CalendarDays,
  IndianRupee,
  BadgePercent,
  Clock,
  CircleDollarSign,
} from 'lucide-react';

// Node/Express backend -----" auth, create-order, verify
const _IS_PROD = window.location.hostname !== 'localhost';
const _NODE_URL = _IS_PROD ? 'https://university-erp-node.onrender.com' : 'http://localhost:5000';
const API_BASE_URL = `${_NODE_URL}/api`;
// Spring Boot backend -----" fee payment combinations
const SPRING_API_URL = 'http://localhost:8080/api';

/**
 * Map a PaymentCombination + its resolved titles to the fee record shape
 * the existing UI and Razorpay flow expect.
 *
 * PaymentCombination fields:
 *   id, paymentId, paymentTitles (string[] -----" title names), totalAmount, createdAt
 *
 * allTitles: PaymentTitle[] fetched from /api/payment-titles (all pages)
 *
 * Mapped to:
 *   _id              -----" MongoDB id of the combination (used as feeRecordId in Razorpay)
 *   feeType          -----" joined title names (e.g. "Bus Fee + Hostel Fee")
 *   totalFeeAmount   -----" gross sum of title.amount (before discount)
 *   discountAmount   -----" total discount = grossAmount - totalAmount
 *   paidAmount       -----" starts at 0; updated locally after successful payment
 *   remainingAmount  -----" net payable = totalAmount (already discount-applied)
 *   status           -----" PENDING / PAID / PARTIAL
 */
const mapCombinationToFeeRecord = (combo, allTitles = []) => {
  const titleNames = Array.isArray(combo.paymentTitles) ? combo.paymentTitles : [];

  const feeType =
    titleNames.length > 0
      ? titleNames.join(' + ')
      : combo.paymentId || 'Academic Fee';

  // Calculate gross amount by summing each matched title's full amount
  const grossAmount = titleNames.reduce((sum, name) => {
    const t = allTitles.find((x) => x.title === name);
    return sum + (t ? t.amount : 0);
  }, 0);

  // If we couldn't resolve titles (e.g. backend unavailable), fall back gracefully
  const resolvedGross = grossAmount > 0 ? grossAmount : combo.totalAmount;
  const discountAmount = Math.max(0, resolvedGross - combo.totalAmount);

  return {
    _id:             combo.id || combo.paymentId,
    paymentId:       combo.paymentId,
    feeType,
    totalFeeAmount:  resolvedGross,   // gross -----" shown in "Total Fee Amount" column
    discountAmount,                   // real discount -----" shown in "Discount" column
    paidAmount:      0,
    remainingAmount: combo.totalAmount, // net payable -----" what Razorpay charges
    status:          'PENDING',
  };
};

// Helper to dynamically load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const FeePayment = () => {
  const navigate = useNavigate();
  const [feeRecords, setFeeRecords] = useState(() => {
    // Restore any locally-persisted payment progress (paid/remaining amounts)
    // so the UI isn't blank while the backend fetch is in flight.
    const saved = localStorage.getItem('university_erp_fee_records_simple');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const detailRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const authHeader = () => {
    const token = localStorage.getItem('erp_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    fetchFeeRecords();
  }, []);
  useEffect(() => {
    if (selectedRecord && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRecord]);

  const fetchFeeRecords = async () => {
    setLoading(true);
    try {
      // Fetch combinations AND all titles in parallel so we can compute
      // gross amount and discount per combination for display.
      const [combosRes, titlesRes] = await Promise.all([
        fetch(`${SPRING_API_URL}/payment-combinations`),
        fetch(`${SPRING_API_URL}/payment-titles?page=0&size=1000`),
      ]);

      if (combosRes.ok) {
        const combinations = await combosRes.json();

        // Resolve flat list of all titles (for gross-amount lookup)
        let allTitles = [];
        if (titlesRes.ok) {
          const titlesData = await titlesRes.json();
          allTitles = Array.isArray(titlesData.content) ? titlesData.content : [];
        }

        if (Array.isArray(combinations) && combinations.length > 0) {
          // Map each combination to the fee record shape, including real discount
          const freshRecords = combinations.map((c) =>
            mapCombinationToFeeRecord(c, allTitles)
          );

          // Merge with locally-persisted paid/remaining so payment progress
          // survives a page refresh.
          const saved = localStorage.getItem('university_erp_fee_records_simple');
          let localRecords = [];
          try { localRecords = saved ? JSON.parse(saved) : []; } catch { localRecords = []; }

          const merged = freshRecords.map((fresh) => {
            const local = localRecords.find((l) => l._id === fresh._id);
            if (local && (local.paidAmount > 0 || local.status !== 'PENDING')) {
              return {
                ...fresh,
                paidAmount:      local.paidAmount      ?? fresh.paidAmount,
                remainingAmount: local.remainingAmount  ?? fresh.remainingAmount,
                status:          local.status           ?? fresh.status,
              };
            }
            return fresh;
          });

          setFeeRecords(merged);
          localStorage.setItem('university_erp_fee_records_simple', JSON.stringify(merged));
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Spring Boot payment API unavailable:', err.message);
    }

    // Fallback: try legacy Node backend
    try {
      const res = await fetch(`${API_BASE_URL}/payment?page=1&limit=50`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setFeeRecords(data.data);
          localStorage.setItem('university_erp_fee_records_simple', JSON.stringify(data.data));
        }
      }
    } catch (err) {
      console.warn('Node backend also unavailable, using local cache:', err.message);
    }

    setLoading(false);
  };

  // Direct Pay execution: Create Order -> Open Razorpay -> Verify Signature -> Update DB
  const handlePay = async (record) => {
    const payAmountInRupees = Number(record.remainingAmount);

    if (isNaN(payAmountInRupees) || payAmountInRupees <= 0) {
      alert('No remaining balance to pay for this record.');
      return;
    }

    setProcessingId(record._id);

    try {
      // 1. Create Order on Backend (amount in Rupees, backend converts to paise)
      const orderRes = await fetch(`${API_BASE_URL}/payment/create-order`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          feeRecordId: record._id,
          amount: payAmountInRupees,
        }),
      });

      const orderData = await orderRes.json();
      console.log('[FeePayment] create-order response:', orderData); // debug
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || `Server error ${orderRes.status}: Failed to create Razorpay order`);
      }

      const { order, keyId } = orderData;

      // 2. Load Razorpay Checkout Script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Razorpay Checkout SDK failed to load. Please check your internet connection.');
      }

      // 3. Open Razorpay Checkout Window
      const options = {
        key: keyId || 'rzp_test_TMtc5YUuUTabBs',
        amount: order?.amount || Math.round(payAmountInRupees * 100), // in paise
        currency: order?.currency || 'INR',
        name: 'University ERP',
        description: `Fee Payment - -------${payAmountInRupees.toLocaleString('en-IN')}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2997/2997322.png',
        ...(order?.id && !order.id.startsWith('order_test_') ? { order_id: order.id } : {}),
        handler: async function (response) {
          // 4. Send razorpay_order_id, razorpay_payment_id, razorpay_signature to /api/payment/verify
          try {
            const verifyRes = await fetch(`${API_BASE_URL}/payment/verify`, {
              method: 'POST',
              headers: authHeader(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                feeRecordId: record._id,
                amount: payAmountInRupees,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              // Immediate local state synchronization
              const newPaid = (record.paidAmount || 0) + payAmountInRupees;
              const netPayable = Math.max(0, record.totalFeeAmount - (record.discountAmount || 0));
              const newRemaining = Math.max(0, netPayable - newPaid);

              const updatedList = feeRecords.map((item) => {
                if (item._id === record._id) {
                  return {
                    ...item,
                    paidAmount: newPaid,
                    remainingAmount: newRemaining,
                    status: newRemaining === 0 ? 'PAID' : 'PARTIAL',
                  };
                }
                return item;
              });

              setFeeRecords(updatedList);
              localStorage.setItem('university_erp_fee_records_simple', JSON.stringify(updatedList));

              // Navigate to dedicated Success Page
              navigate('/fee-payment/success', {
                state: {
                  receipt: verifyData.data?.receipt || {
                    receiptNumber: `RCP-${Date.now()}`,
                    transactionId: `TXN_${Date.now()}`,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    totalFeeAmount: record.totalFeeAmount,
                    discountAmount: record.discountAmount || 0,
                    amountPaidThisTransaction: payAmountInRupees,
                    totalPaidSoFar: newPaid,
                    remainingBalance: newRemaining,
                    status: newRemaining === 0 ? 'PAID' : 'PARTIAL',
                    paymentMethod: 'Razorpay',
                    paidAt: new Date().toISOString(),
                  },
                },
              });
            } else {
              // Signature verification failed
              navigate('/fee-payment/failure', {
                state: {
                  feeRecordId: record._id,
                  attemptedAmount: payAmountInRupees,
                  razorpayOrderId: response.razorpay_order_id,
                  failureReason: verifyData.message || 'HMAC-SHA256 signature verification failed',
                  errorCode: 'SIGNATURE_VERIFICATION_FAILED',
                  timestamp: new Date().toISOString(),
                },
              });
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            navigate('/fee-payment/failure', {
              state: {
                feeRecordId: record._id,
                attemptedAmount: payAmountInRupees,
                razorpayOrderId: response.razorpay_order_id,
                failureReason: verifyErr.message || 'Payment verification request failed',
                errorCode: 'VERIFICATION_NETWORK_ERROR',
                timestamp: new Date().toISOString(),
              },
            });
          }
        },
        prefill: {
          name: 'Student User',
          email: 'student@university.edu',
          contact: '9999999999',
        },
        theme: {
          color: '#111827',
        },
        modal: {
          ondismiss: function () {
            setProcessingId(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failResponse) {
        setProcessingId(null);
        navigate('/fee-payment/failure', {
          state: {
            feeRecordId: record._id,
            attemptedAmount: payAmountInRupees,
            razorpayOrderId: order.id,
            failureReason: failResponse.error?.description || 'Transaction declined in Razorpay checkout',
            errorCode: failResponse.error?.code || 'PAYMENT_FAILED',
            timestamp: new Date().toISOString(),
          },
        });
      });

      rzp.open();
      // NOTE: setProcessingId(null) is handled inside modal.ondismiss and payment.failed
    } catch (err) {
      console.error('Payment launch error:', err);
      setProcessingId(null);
      setFeedback({ type: 'error', message: `Payment failed: ${err.message}` });
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(feeRecords.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = feeRecords.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Fee Payment</h1>
          <p className="page-subtitle">View fee structures and process online fee payments</p>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`feedback-banner ${
            feedback.type === 'success' ? 'feedback-success' : 'feedback-error'
          }`}
          style={{ margin: '1rem 0' }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Table Card */}
      <div className="card table-card" style={{ marginTop: '1.25rem' }}>
        <div className="table-container">
          {loading ? (
            <div className="table-loading-state">
              <Loader2 size={24} className="spin-animate" />
              <p>Loading fee payment records...</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Payment Title</th>
                    <th>Total Fee Amount</th>
                    <th>Discount</th>
                    <th>Paid Amount</th>
                    <th>Remaining Amount</th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record, index) => {
                    const isFullyPaid = record.remainingAmount === 0 && (record.paidAmount || 0) > 0;
                    const isRowProcessing = processingId === record._id;
                    const isSelected = selectedRecord && selectedRecord._id === record._id;

                    return (
                      <tr
                        key={record._id || index}
                        onClick={() => setSelectedRecord(isSelected ? null : record)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0f4ff' : undefined,
                          transition: 'background-color 0.15s ease',
                        }}
                        title="Click to view details"
                      >
                        <td className="text-secondary">{startIndex + index + 1}</td>
                        <td>
                          <span className="dept-name-cell" style={{ fontWeight: 600 }}>
                            {record.feeType || 'Academic Fee'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          -------{(record.totalFeeAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ color: '#047857', fontWeight: 600, fontSize: '0.95rem' }}>
                          {(record.discountAmount || 0) > 0
                            ? `- -------${(record.discountAmount || 0).toLocaleString('en-IN')}`
                            : '-------0'}
                        </td>
                        <td style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.95rem' }}>
                          -------{(record.paidAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td
                          style={{
                            fontWeight: 700,
                            color: record.remainingAmount === 0 ? '#047857' : '#dc2626',
                            fontSize: '1rem',
                          }}
                        >
                          -------{(record.remainingAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '2px 10px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              backgroundColor:
                                record.status === 'PAID'
                                  ? '#dcfce7'
                                  : record.status === 'PARTIAL'
                                  ? '#fef3c7'
                                  : '#fee2e2',
                              color:
                                record.status === 'PAID'
                                  ? '#15803d'
                                  : record.status === 'PARTIAL'
                                  ? '#b45309'
                                  : '#b91c1c',
                            }}
                          >
                            {record.status || 'PENDING'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="action-buttons-cell" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                            {record.remainingAmount > 0 ? (
                              <button
                                type="button"
                                className="books-btn books-btn-primary"
                                style={{
                                  padding: '0.4rem 1rem',
                                  fontSize: '0.85rem',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                                onClick={(e) => { e.stopPropagation(); handlePay(record); }}
                                disabled={isRowProcessing}
                                title="Pay fee online via Razorpay"
                              >
                                {isRowProcessing ? (
                                  <Loader2 size={14} className="spin-animate" />
                                ) : (
                                  <>
                                    <CreditCard size={15} />
                                    <span>Pay</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{
                                  padding: '0.4rem 0.8rem',
                                  fontSize: '0.85rem',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/fee-payment/success', {
                                    state: {
                                      receipt: {
                                        receiptNumber: 'RCP-PAID-COMPLETED',
                                        transactionId: 'TXN_VERIFIED_ONLINE',
                                        razorpayPaymentId: 'pay_verified_razorpay',
                                        feeType: record.feeType || 'Tuition & Academic Fee',
                                        totalFeeAmount: record.totalFeeAmount,
                                        discountAmount: record.discountAmount || 0,
                                        amountPaidThisTransaction: record.paidAmount,
                                        totalPaidSoFar: record.paidAmount,
                                        remainingBalance: 0,
                                        status: 'PAID',
                                        paymentMethod: 'Razorpay',
                                        paidAt: new Date().toISOString(),
                                      },
                                    },
                                  });
                                }}
                                title="View Receipt"
                              >
                                <Receipt size={15} />
                                <span>Receipt</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="pagination-controls">
                  <div className="pagination-info">
                    Showing {feeRecords.length === 0 ? 0 : startIndex + 1} to{' '}
                    {Math.min(endIndex, feeRecords.length)} of {feeRecords.length} records
                  </div>

                  <div className="pagination-buttons">
                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span key={pageNum} className="pagination-dots">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}

                    <button
                      type="button"
                      className="pagination-btn"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="items-per-page">
                    <span>Items per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="items-per-page-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* --"-----"--- Selected Record Detail Card --"-----"--- */}
      {selectedRecord && (
        <div
          ref={detailRef}
          className="card"
          style={{
            marginTop: '1.5rem',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            overflow: 'hidden',
            animation: 'fadeInUp 0.25s ease',
          }}
        >
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: '#f9fafb',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={20} style={{ color: '#111827' }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                {selectedRecord.feeType || 'Fee Payment Details'}
              </h3>
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor:
                    selectedRecord.status === 'PAID'
                      ? '#dcfce7'
                      : selectedRecord.status === 'PARTIAL'
                      ? '#fef3c7'
                      : '#fee2e2',
                  color:
                    selectedRecord.status === 'PAID'
                      ? '#15803d'
                      : selectedRecord.status === 'PARTIAL'
                      ? '#b45309'
                      : '#b91c1c',
                }}
              >
                {selectedRecord.status || 'PENDING'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedRecord(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close details"
            >
              <X size={20} />
            </button>
          </div>

          {/* Card Body */}
          <div style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {/* Student Info */}
              {selectedRecord.prn && (
                <div style={detailItemStyle}>
                  <div style={detailLabelStyle}>
                    <User size={14} style={{ color: '#6b7280' }} />
                    <span>Student PRN</span>
                  </div>
                  <div style={detailValueStyle}>{selectedRecord.prn}</div>
                </div>
              )}
              {selectedRecord.studentName && (
                <div style={detailItemStyle}>
                  <div style={detailLabelStyle}>
                    <User size={14} style={{ color: '#6b7280' }} />
                    <span>Student Name</span>
                  </div>
                  <div style={detailValueStyle}>{selectedRecord.studentName}</div>
                </div>
              )}
              {selectedRecord.degree && (
                <div style={detailItemStyle}>
                  <div style={detailLabelStyle}>
                    <GraduationCap size={14} style={{ color: '#6b7280' }} />
                    <span>Degree / Class</span>
                  </div>
                  <div style={detailValueStyle}>
                    {selectedRecord.degree}
                    {selectedRecord.class ? ` -----" ${selectedRecord.class}` : ''}
                    {selectedRecord.division ? ` (${selectedRecord.division})` : ''}
                  </div>
                </div>
              )}
              {selectedRecord.academicYear && (
                <div style={detailItemStyle}>
                  <div style={detailLabelStyle}>
                    <CalendarDays size={14} style={{ color: '#6b7280' }} />
                    <span>Academic Year</span>
                  </div>
                  <div style={detailValueStyle}>
                    {selectedRecord.academicYear}
                    {selectedRecord.semester ? ` ------- ${selectedRecord.semester}` : ''}
                  </div>
                </div>
              )}

              {/* Fee Breakdown */}
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>
                  <IndianRupee size={14} style={{ color: '#6b7280' }} />
                  <span>Total Fee Amount</span>
                </div>
                <div style={{ ...detailValueStyle, fontWeight: 700 }}>
                  -------{(selectedRecord.totalFeeAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>
                  <BadgePercent size={14} style={{ color: '#6b7280' }} />
                  <span>Discount</span>
                </div>
                <div style={{ ...detailValueStyle, color: '#047857' }}>
                  {(selectedRecord.discountAmount || 0) > 0
                    ? `- -------${(selectedRecord.discountAmount || 0).toLocaleString('en-IN')}`
                    : '-------0'}
                </div>
              </div>
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>
                  <CircleDollarSign size={14} style={{ color: '#6b7280' }} />
                  <span>Net Payable</span>
                </div>
                <div style={{ ...detailValueStyle, fontWeight: 700 }}>
                  -------{Math.max(
                    0,
                    (selectedRecord.totalFeeAmount || 0) - (selectedRecord.discountAmount || 0)
                  ).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>
                  <CheckCircle2 size={14} style={{ color: '#2563eb' }} />
                  <span>Paid Amount</span>
                </div>
                <div style={{ ...detailValueStyle, color: '#2563eb', fontWeight: 700 }}>
                  -------{(selectedRecord.paidAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>
                  <AlertCircle size={14} style={{ color: selectedRecord.remainingAmount > 0 ? '#dc2626' : '#047857' }} />
                  <span>Remaining Balance</span>
                </div>
                <div
                  style={{
                    ...detailValueStyle,
                    fontWeight: 700,
                    color: selectedRecord.remainingAmount > 0 ? '#dc2626' : '#047857',
                  }}
                >
                  -------{(selectedRecord.remainingAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              {selectedRecord.dueDate && (
                <div style={detailItemStyle}>
                  <div style={detailLabelStyle}>
                    <Clock size={14} style={{ color: '#6b7280' }} />
                    <span>Due Date</span>
                  </div>
                  <div style={detailValueStyle}>
                    {new Date(selectedRecord.dueDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              )}
              <div style={detailItemStyle}>
                <div style={detailLabelStyle}>
                  <FileText size={14} style={{ color: '#6b7280' }} />
                  <span>Payment Title</span>
                </div>
                <div style={detailValueStyle}>{selectedRecord.feeType || 'Academic Fee'}</div>
              </div>
            </div>

            {/* Transaction History */}
            {selectedRecord.transactions && selectedRecord.transactions.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem' }}>
                  Transaction History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedRecord.transactions.map((txn, idx) => (
                    <div
                      key={txn._id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #f3f4f6',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Receipt size={14} style={{ color: '#6b7280' }} />
                        <span style={{ fontWeight: 500 }}>{txn.receiptNumber || txn.transactionId}</span>
                        <span style={{ color: '#9ca3af' }}>
                          {txn.paidAt
                            ? new Date(txn.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            : ''}
                        </span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#111827' }}>
                        -------{(txn.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pay / Receipt Action */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.88rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
              {selectedRecord.remainingAmount > 0 ? (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onClick={() => handlePay(selectedRecord)}
                  disabled={processingId === selectedRecord._id}
                  title="Pay remaining balance online via Razorpay"
                >
                  {processingId === selectedRecord._id ? (
                    <Loader2 size={16} className="spin-animate" />
                  ) : (
                    <>
                      <CreditCard size={17} />
                      <span>
                        Pay -------{(selectedRecord.remainingAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="books-btn books-btn-primary"
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#047857',
                  }}
                  onClick={() =>
                    navigate('/fee-payment/success', {
                      state: {
                        receipt: {
                          receiptNumber: 'RCP-PAID-COMPLETED',
                          transactionId: 'TXN_VERIFIED_ONLINE',
                          razorpayPaymentId: 'pay_verified_razorpay',
                          feeType: selectedRecord.feeType || 'Tuition & Academic Fee',
                          totalFeeAmount: selectedRecord.totalFeeAmount,
                          discountAmount: selectedRecord.discountAmount || 0,
                          amountPaidThisTransaction: selectedRecord.paidAmount,
                          totalPaidSoFar: selectedRecord.paidAmount,
                          remainingBalance: 0,
                          status: 'PAID',
                          paymentMethod: 'Razorpay',
                          paidAt: new Date().toISOString(),
                        },
                      },
                    })
                  }
                  title="View payment receipt"
                >
                  <Receipt size={17} />
                  <span>View Receipt</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Detail card inline styles
const detailItemStyle = {
  padding: '10px 12px',
  borderRadius: '8px',
  backgroundColor: '#f9fafb',
  border: '1px solid #f3f4f6',
};

const detailLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.78rem',
  color: '#6b7280',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  marginBottom: '4px',
};

const detailValueStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#111827',
};

export default FeePayment;
