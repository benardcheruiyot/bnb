import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { loanService } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import './LoanProcessing.css';

const readPendingApplication = (locationState) => {
  if (locationState && Object.keys(locationState).length > 0) {
    return locationState;
  }

  try {
    const saved = localStorage.getItem('pending_loan_application');
    if (saved) {
      return JSON.parse(saved);
    }

    // Fall back to last_transaction if available
    const lastTransaction = localStorage.getItem('last_transaction');
    if (lastTransaction) {
      const tx = JSON.parse(lastTransaction);
      if (tx && ['initiated', 'pending'].includes(tx.status)) {
        return {
          amount: tx.loanAmount,
          fee: tx.amount,
          days: tx.termDays || 60,
          phone: tx.phone,
          reference: tx.checkoutRequestId,
          status: tx.status,
          submittedAt: tx.createdAt,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
};

const LoanProcessing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [application, setApplication] = useState(() => readPendingApplication(location.state));
  const [loans, setLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [expandedLoanId, setExpandedLoanId] = useState(null);
  const reminderTimeoutRef = useRef(null);
  const reminderIntervalRef = useRef(null);

  useEffect(() => {
    document.title = 'Loan Processing | Tala Mkopo Extra';
  }, []);

  useEffect(() => {
    if (!application && !loadingLoans && loans.length === 0) {
      navigate('/loan', { replace: true });
    }
  }, [application, loadingLoans, loans.length, navigate]);

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const data = await loanService.getUserLoans();
        const normalizedLoans = Array.isArray(data) ? data : [];
        setLoans(normalizedLoans);
        if (normalizedLoans.length > 0) {
          setExpandedLoanId(normalizedLoans[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch user loans on processing page:', error);
        setLoans([]);
      } finally {
        setLoadingLoans(false);
      }
    };

    fetchLoans();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getElapsedTime = (dateValue) => {
    if (!dateValue) return 'Just now';
    const diffMs = Math.max(0, nowTick - new Date(dateValue).getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ago`;
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  };

  const getLoanTimeline = (loanStatus) => {
    const status = String(loanStatus || 'pending').toLowerCase();

    if (status === 'approved' || status === 'completed') {
      return [
        {
          id: 1,
          title: 'Processing fee paid',
          description: 'Your M-Pesa fee payment has been confirmed successfully.',
          status: 'done',
        },
        {
          id: 2,
          title: 'Application reviewed',
          description: 'Your loan details have been validated by our review team.',
          status: 'done',
        },
        {
          id: 3,
          title: 'Disbursement approved',
          description: 'Funds are ready or already sent to your M-Pesa account.',
          status: 'done',
        },
        {
          id: 4,
          title: 'Completion notice',
          description: 'Your application cycle is complete.',
          status: 'done',
        },
      ];
    }

    if (status === 'failed' || status === 'cancelled' || status === 'expired') {
      return [
        {
          id: 1,
          title: 'Processing fee attempt logged',
          description: 'We received your request and attempted to verify payment.',
          status: 'done',
        },
        {
          id: 2,
          title: 'Application closed',
          description: 'This application was not completed successfully.',
          status: 'active',
        },
        {
          id: 3,
          title: 'Disbursement',
          description: 'Disbursement did not happen for this application.',
          status: 'pending',
        },
        {
          id: 4,
          title: 'Completion notice',
          description: 'You can create a new application at any time.',
          status: 'pending',
        },
      ];
    }

    return [
      {
        id: 1,
        title: 'Processing fee paid',
        description: 'Your M-Pesa fee payment has been confirmed successfully.',
        status: 'done',
      },
      {
        id: 2,
        title: 'Application under review',
        description: 'Our loan team is validating your request and account details.',
        status: 'active',
      },
      {
        id: 3,
        title: 'Disbursement',
        description: 'Once approved, funds will be sent directly to your M-Pesa account within 48 hours.',
        status: 'pending',
      },
      {
        id: 4,
        title: 'Completion notice',
        description: 'You will receive an SMS confirmation once disbursement is complete.',
        status: 'pending',
      },
    ];
  };

  const currentApplication = useMemo(() => {
    if (application) {
      return {
        amount: Number(application.amount || 0),
        fee: Number(application.fee || 0),
        reference: application.reference || 'Pending',
        phone: application.phone || 'Not available',
        submittedAt: application.submittedAt || null,
      };
    }

    if (loans.length > 0) {
      const latestLoan = [...loans].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

      return {
        amount: Number(latestLoan.amount || 0),
        fee: Number(latestLoan.processingFee || 0),
        reference: latestLoan.id || 'Pending',
        phone: 'Not available',
        submittedAt: latestLoan.createdAt || null,
      };
    }

    return null;
  }, [application, loans]);

  useEffect(() => {
    const submittedAt = currentApplication?.submittedAt;
    const currentStatus = String(currentApplication?.status || application?.status || 'pending').toLowerCase();

    if (!submittedAt || ['completed', 'approved', 'failed', 'cancelled', 'expired'].includes(currentStatus)) {
      if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
      if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current);
      return undefined;
    }

    const hourMs = 60 * 60 * 1000;
    const submittedMs = new Date(submittedAt).getTime();
    const elapsedMs = Math.max(0, Date.now() - submittedMs);
    const firstDelay = elapsedMs >= hourMs ? 1000 : hourMs - elapsedMs;

    const showBrowserReminder = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;

      const reminderTitle = 'Your loan is still under review';
      const reminderBody = 'We are still processing your application. Keep your phone close for the next update.';
      const payload = {
        body: reminderBody,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'loan-processing-reminder',
        renotify: true,
        data: { url: '/loan-processing' },
      };

      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(reminderTitle, payload);
        } else {
          new Notification(reminderTitle, payload);
        }
      } catch (error) {
        console.warn('Browser reminder failed:', error.message);
      }
    };

    if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
    if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current);

    reminderTimeoutRef.current = setTimeout(() => {
      showBrowserReminder();
      reminderIntervalRef.current = setInterval(() => {
        showBrowserReminder();
      }, hourMs);
    }, firstDelay);

    return () => {
      if (reminderTimeoutRef.current) clearTimeout(reminderTimeoutRef.current);
      if (reminderIntervalRef.current) clearInterval(reminderIntervalRef.current);
    };
  }, [application?.status, currentApplication?.status, currentApplication?.submittedAt]);

  const submittedTime = useMemo(() => {
    if (!currentApplication?.submittedAt) return 'Just now';
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(currentApplication.submittedAt));
  }, [currentApplication?.submittedAt]);

  if (!currentApplication && loadingLoans) {
    return null;
  }

  const netDeposit = Math.max(Number(currentApplication?.amount || 0) - Number(currentApplication?.fee || 0), 0);
  const timelineSteps = [
    {
      id: 1,
      title: 'Processing fee paid',
      description: 'Your M-Pesa fee payment has been confirmed successfully.',
      status: 'done',
    },
    {
      id: 2,
      title: 'Application under review',
      description: 'Our loan team is validating your request and account details.',
      status: 'active',
    },
    {
      id: 3,
      title: 'Disbursement',
      description: 'Once approved, funds will be sent directly to your M-Pesa account within 48 hours.',
      status: 'pending',
    },
    {
      id: 4,
      title: 'Completion notice',
      description: 'You will receive an SMS confirmation once disbursement is complete.',
      status: 'pending',
    },
  ];

  return (
    <div className="loan-processing-page">
      <Header logoInitial="P" />

      <main className="loan-processing-shell">
        <section className="loan-processing-card-wrap">
          <div className="loan-processing-success-ring" aria-hidden="true">
            <span>✓</span>
          </div>

          <h1>APPLICATION RECEIVED!</h1>
          <p className="loan-processing-intro">
            Thank you for applying. We have confirmed your processing fee and your request is now in review.
          </p>

          <div className="loan-processing-deadline" role="status" aria-live="polite">
            <strong>Expected disbursement:</strong> within 48 hours after payment confirmation.
          </div>

          <div className="loan-processing-summary-grid">
            <div>
              <span>Requested amount</span>
              <strong>{formatCurrency(currentApplication?.amount || 0)}</strong>
            </div>
            <div>
              <span>Fee paid</span>
              <strong>{formatCurrency(currentApplication?.fee || 0)}</strong>
            </div>
            <div>
              <span>Expected deposit</span>
              <strong>{formatCurrency(netDeposit)}</strong>
            </div>
            <div>
              <span>Reference</span>
              <strong>{currentApplication?.reference || 'Pending'}</strong>
            </div>
          </div>

          <section className="loan-processing-timeline">
            {timelineSteps.map((step, index) => (
              <article key={step.id} className="loan-processing-timeline-item">
                <div className="loan-processing-timeline-track" aria-hidden="true">
                  <span className={`loan-processing-timeline-dot ${step.status}`}>
                    {step.status === 'done' ? '✓' : ''}
                  </span>
                  {index < timelineSteps.length - 1 && <span className="loan-processing-timeline-line" />}
                </div>
                <div className="loan-processing-timeline-copy">
                  <h2>{step.title}</h2>
                  <p>{step.description}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="loan-processing-note">
            <strong>Submitted:</strong> {submittedTime}
            <span>Phone: {currentApplication?.phone || 'Not available'}</span>
          </section>

          <section className="loan-processing-history">
            <div className="loan-processing-history-head">
              <h3>All your loan applications</h3>
              <span>{loans.length} total</span>
            </div>

            {loadingLoans ? (
              <p className="loan-processing-history-empty">Loading your applications...</p>
            ) : loans.length === 0 ? (
              <p className="loan-processing-history-empty">No previous applications found yet.</p>
            ) : (
              <div className="loan-processing-history-list">
                {loans.map((loan) => (
                  <article key={loan.id} className="loan-processing-history-item">
                    <button
                      type="button"
                      className="loan-processing-history-toggle"
                      onClick={() =>
                        setExpandedLoanId((prev) => (prev === loan.id ? null : loan.id))
                      }
                      aria-expanded={expandedLoanId === loan.id}
                    >
                      <div className="loan-processing-history-top">
                        <strong>{formatCurrency(loan.amount)}</strong>
                        <span className={`loan-processing-history-status ${loan.status || 'pending'}`}>
                          {(loan.status || 'pending').toUpperCase()}
                        </span>
                      </div>
                      <div className="loan-processing-history-meta">
                        <span>Fee: {formatCurrency(loan.processingFee || 0)}</span>
                        <span>Applied: {new Date(loan.createdAt).toLocaleString('en-KE')}</span>
                        <span>Elapsed: {getElapsedTime(loan.createdAt)}</span>
                      </div>
                      <span className={`loan-processing-history-chevron ${expandedLoanId === loan.id ? 'open' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {expandedLoanId === loan.id && (
                      <div className="loan-processing-history-dropdown">
                        <div className="loan-processing-history-summary-grid">
                          <div>
                            <span>Requested amount</span>
                            <strong>{formatCurrency(loan.amount || 0)}</strong>
                          </div>
                          <div>
                            <span>Fee paid</span>
                            <strong>{formatCurrency(loan.processingFee || 0)}</strong>
                          </div>
                          <div>
                            <span>Expected deposit</span>
                            <strong>{formatCurrency(Math.max(Number(loan.amount || 0) - Number(loan.processingFee || 0), 0))}</strong>
                          </div>
                          <div>
                            <span>Reference</span>
                            <strong>{loan.id}</strong>
                          </div>
                        </div>

                        <section className="loan-processing-history-timeline">
                          {getLoanTimeline(loan.status).map((step, index) => (
                            <article key={`${loan.id}-${step.id}`} className="loan-processing-timeline-item compact">
                              <div className="loan-processing-timeline-track" aria-hidden="true">
                                <span className={`loan-processing-timeline-dot ${step.status}`}>
                                  {step.status === 'done' ? '✓' : ''}
                                </span>
                                {index < 3 && <span className="loan-processing-timeline-line" />}
                              </div>
                              <div className="loan-processing-timeline-copy">
                                <h2>{step.title}</h2>
                                <p>{step.description}</p>
                              </div>
                            </article>
                          ))}
                        </section>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="loan-processing-actions">
            <Link to="/loan" className="loan-processing-back">
              Back to loan options
            </Link>
            <button
              type="button"
              className="loan-processing-clear"
              onClick={() => {
                localStorage.removeItem('pending_loan_application');
                setApplication(null);
                navigate('/loan', { replace: true });
              }}
            >
              View other amounts
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LoanProcessing;