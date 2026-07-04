// Loan.js - Loan Application Page
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loanService } from '../services/api';
import { formatCurrency } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Loan.css';

const formatLoanReceipt = (loan, checkoutReference, user) => ({
  amount: loan.amount,
  fee: loan.fee,
  days: loan.days,
  phone: user?.phone_number || '',
  reference: checkoutReference,
  status: 'processing',
  submittedAt: new Date().toISOString(),
});

const safaricomMaskedPhoneRegex = /^0(?:7(?:[0-2]\d|4[0-3]|45|46|48|5[7-9]|6[89]|9\d)|11[0-9])\*{4}\d{2}$/;

const readPendingLoanApplication = () => {
  try {
    // First check for active pending application
    const pendingApp = localStorage.getItem('pending_loan_application');
    if (pendingApp) {
      return JSON.parse(pendingApp);
    }

    // Otherwise check for last transaction (for resume after logout)
    const lastTransaction = localStorage.getItem('last_transaction');
    if (lastTransaction) {
      const tx = JSON.parse(lastTransaction);
      // Only show last transaction if it's still pending or in progress
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

const Loan = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const paymentPollRef = useRef(null);
  const isMountedRef = useRef(true);
  const autoRetryUsedRef = useRef(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentIndex, setRecentIndex] = useState(0);
  const [pendingApplication] = useState(() => readPendingLoanApplication());
  const applyButtonRef = useRef(null);

  const recentLoans = [
    { phone: '0712****34', amount: '13,200', time: '9 mins ago' },
    { phone: '0798****87', amount: '25,600', time: '14 mins ago' },
    { phone: '0743****21', amount: '9,800', time: '21 mins ago' },
    { phone: '0725****56', amount: '48,600', time: '33 mins ago' },
    { phone: '0767****09', amount: '16,800', time: '41 mins ago' },
    { phone: '0711****72', amount: '30,000', time: '52 mins ago' },
    { phone: '0756****45', amount: '7,800', time: '1 hr ago' },
    { phone: '0700****18', amount: '44,200', time: '1 hr 10 mins ago' },
    { phone: '0714****23', amount: '21,200', time: '1 hr 15 mins ago' },
    { phone: '0789****56', amount: '35,400', time: '1 hr 22 mins ago' },
    { phone: '0745****89', amount: '11,200', time: '1 hr 30 mins ago' },
    { phone: '0722****04', amount: '39,800', time: '1 hr 38 mins ago' },
    { phone: '0768****67', amount: '5,500', time: '1 hr 45 mins ago' },
    { phone: '0717****32', amount: '25,600', time: '1 hr 52 mins ago' },
    { phone: '0751****91', amount: '48,600', time: '2 hrs ago' },
    { phone: '0703****15', amount: '16,800', time: '2 hrs 5 mins ago' },
    { phone: '0721****48', amount: '30,000', time: '2 hrs 12 mins ago' },
    { phone: '0779****73', amount: '9,800', time: '2 hrs 18 mins ago' },
    { phone: '0741****62', amount: '44,200', time: '2 hrs 25 mins ago' },
    { phone: '0713****29', amount: '21,200', time: '2 hrs 32 mins ago' },
    { phone: '0762****84', amount: '7,800', time: '2 hrs 40 mins ago' },
    { phone: '0719****17', amount: '35,400', time: '2 hrs 47 mins ago' },
    { phone: '0754****50', amount: '13,200', time: '2 hrs 54 mins ago' },
    { phone: '0707****96', amount: '39,800', time: '3 hrs ago' },
    { phone: '0726****61', amount: '25,600', time: '3 hrs 8 mins ago' },
    { phone: '0785****33', amount: '48,600', time: '3 hrs 15 mins ago' },
    { phone: '0738****78', amount: '11,200', time: '3 hrs 22 mins ago' },
    { phone: '0715****45', amount: '30,000', time: '3 hrs 30 mins ago' },
    { phone: '0773****99', amount: '16,800', time: '3 hrs 37 mins ago' },
    { phone: '0704****22', amount: '5,500', time: '3 hrs 44 mins ago' },
    { phone: '0728****66', amount: '21,200', time: '3 hrs 52 mins ago' },
    { phone: '0758****11', amount: '44,200', time: '3 hrs 59 mins ago' },
    { phone: '0711****88', amount: '9,800', time: '4 hrs ago' },
    { phone: '0765****55', amount: '35,400', time: '4 hrs 7 mins ago' },
    { phone: '0741****74', amount: '25,600', time: '4 hrs 15 mins ago' },
    { phone: '0717****39', amount: '13,200', time: '4 hrs 22 mins ago' },
    { phone: '0788****02', amount: '39,800', time: '4 hrs 30 mins ago' },
    { phone: '0722****67', amount: '48,600', time: '4 hrs 37 mins ago' },
    { phone: '0754****44', amount: '7,800', time: '4 hrs 44 mins ago' },
    { phone: '0709****31', amount: '30,000', time: '4 hrs 52 mins ago' },
    { phone: '0735****58', amount: '16,800', time: '4 hrs 59 mins ago' },
    { phone: '0776****97', amount: '21,200', time: '5 hrs ago' },
    { phone: '0712****80', amount: '11,200', time: '5 hrs 8 mins ago' },
    { phone: '0746****13', amount: '44,200', time: '5 hrs 15 mins ago' },
    { phone: '0720****86', amount: '9,800', time: '5 hrs 22 mins ago' },
    { phone: '0781****24', amount: '35,400', time: '5 hrs 30 mins ago' },
    { phone: '0753****77', amount: '25,600', time: '5 hrs 37 mins ago' },
    { phone: '0708****42', amount: '13,200', time: '5 hrs 44 mins ago' },
    { phone: '0763****65', amount: '39,800', time: '5 hrs 52 mins ago' },
    { phone: '0718****09', amount: '48,600', time: '6 hrs ago' },
    { phone: '0734****72', amount: '5,500', time: '6 hrs 7 mins ago' },
    { phone: '0790****36', amount: '30,000', time: '6 hrs 15 mins ago' },
    { phone: '0714****51', amount: '16,800', time: '6 hrs 22 mins ago' },
    { phone: '0757****18', amount: '21,200', time: '6 hrs 30 mins ago' },
    { phone: '0703****93', amount: '7,800', time: '6 hrs 37 mins ago' },
    { phone: '0771****40', amount: '44,200', time: '6 hrs 44 mins ago' },
    { phone: '0725****70', amount: '11,200', time: '6 hrs 52 mins ago' },
    { phone: '0741****35', amount: '9,800', time: '7 hrs ago' },
    { phone: '0786****82', amount: '35,400', time: '7 hrs 8 mins ago' },
    { phone: '0716****47', amount: '25,600', time: '7 hrs 15 mins ago' },
    { phone: '0750****69', amount: '13,200', time: '7 hrs 22 mins ago' },
    { phone: '0706****14', amount: '39,800', time: '7 hrs 30 mins ago' },
    { phone: '0768****53', amount: '48,600', time: '7 hrs 37 mins ago' },
    { phone: '0719****26', amount: '5,500', time: '7 hrs 44 mins ago' },
    { phone: '0744****91', amount: '30,000', time: '7 hrs 52 mins ago' },
    { phone: '0782****64', amount: '16,800', time: '8 hrs ago' },
    { phone: '0712****19', amount: '21,200', time: '8 hrs 7 mins ago' },
    { phone: '0758****41', amount: '44,200', time: '8 hrs 15 mins ago' },
    { phone: '0721****87', amount: '7,800', time: '8 hrs 22 mins ago' },
    { phone: '0773****12', amount: '11,200', time: '8 hrs 30 mins ago' },
    { phone: '0746****37', amount: '9,800', time: '8 hrs 37 mins ago' },
    { phone: '0710****75', amount: '35,400', time: '8 hrs 44 mins ago' },
    { phone: '0789****58', amount: '25,600', time: '8 hrs 52 mins ago' },
    { phone: '0735****03', amount: '13,200', time: '9 hrs ago' },
    { phone: '0764****66', amount: '39,800', time: '9 hrs 8 mins ago' },
    { phone: '0715****28', amount: '48,600', time: '9 hrs 15 mins ago' },
    { phone: '0754****34', amount: '5,500', time: '9 hrs 22 mins ago' },
    { phone: '0707****89', amount: '30,000', time: '9 hrs 30 mins ago' },
    { phone: '0761****45', amount: '16,800', time: '9 hrs 37 mins ago' },
    { phone: '0718****72', amount: '21,200', time: '9 hrs 44 mins ago' },
    { phone: '0743****11', amount: '44,200', time: '9 hrs 52 mins ago' },
    { phone: '0796****56', amount: '7,800', time: '10 hrs ago' },
    { phone: '0722****99', amount: '11,200', time: '10 hrs 8 mins ago' },
    { phone: '0750****22', amount: '9,800', time: '10 hrs 15 mins ago' },
    { phone: '0778****84', amount: '35,400', time: '10 hrs 22 mins ago' },
    { phone: '0741****17', amount: '25,600', time: '10 hrs 30 mins ago' },
    { phone: '0710****63', amount: '13,200', time: '10 hrs 37 mins ago' },
    { phone: '0767****40', amount: '39,800', time: '10 hrs 44 mins ago' },
    { phone: '0712****95', amount: '48,600', time: '10 hrs 52 mins ago' },
    { phone: '0754****21', amount: '5,500', time: '11 hrs ago' },
    { phone: '0725****68', amount: '30,000', time: '11 hrs 8 mins ago' },
    { phone: '0788****34', amount: '16,800', time: '11 hrs 15 mins ago' },
    { phone: '0719****77', amount: '21,200', time: '11 hrs 22 mins ago' },
    { phone: '0744****50', amount: '44,200', time: '11 hrs 30 mins ago' },
    { phone: '0709****92', amount: '7,800', time: '11 hrs 37 mins ago' },
    { phone: '0763****46', amount: '11,200', time: '11 hrs 44 mins ago' },
    { phone: '0716****61', amount: '9,800', time: '11 hrs 52 mins ago' },
  ];

  const [loanOptions] = useState([
    { amount: 5500, fee: 120, days: 60 },
    { amount: 10000, fee: 200, days: 60 },
    { amount: 15000, fee: 320, days: 60 },
    { amount: 25000, fee: 520, days: 60 },
    { amount: 35000, fee: 760, days: 60 },
    { amount: 50000, fee: 1100, days: 60 },
    { amount: 65000, fee: 1450, days: 60 },
    { amount: 80000, fee: 1850, days: 60 },
    { amount: 100000, fee: 2350, days: 60 },
    { amount: 120000, fee: 2800, days: 60 },
    { amount: 135000, fee: 3200, days: 60 },
    { amount: 150000, fee: 3500, days: 60 },
  ]);

  const safaricomRecentLoans = recentLoans.filter((entry) => safaricomMaskedPhoneRegex.test(entry.phone));
  const carouselLoans = safaricomRecentLoans.length
    ? safaricomRecentLoans
    : [{ phone: '0712****34', amount: '13,200', time: '9 mins ago' }];

  const hasSelectedLoan = Boolean(selectedLoan);

  useEffect(() => {
    if (!user?.phone_number) {
      navigate('/eligibility');
    }
  }, [user, navigate]);

  useEffect(() => {
    document.title = 'Loan Options | Tala Mkopo Extra';
  }, []);

  useEffect(() => {
    setRecentIndex(0);
  }, [carouselLoans.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRecentIndex(prev => (prev + 1) % carouselLoans.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [carouselLoans.length]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (paymentPollRef.current) {
        clearInterval(paymentPollRef.current);
      }
    };
  }, []);

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    setTimeout(() => {
      applyButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
  };

  const handleApply = async () => {
    if (!selectedLoan) {
      Swal.fire('Error', 'Please select a loan amount', 'error');
      return;
    }

    setLoading(true);
    autoRetryUsedRef.current = false;

    try {
      const { isConfirmed } = await Swal.fire({
        title: 'Confirm Your Loan',
        html: `
          <div class="stk-modal-content">
            <div class="stk-summary-row">
              <span>Loan Amount</span>
              <strong>${formatCurrency(selectedLoan.amount)}</strong>
            </div>
            <div class="stk-summary-row">
              <span>Processing Fee</span>
              <strong>${formatCurrency(selectedLoan.fee)}</strong>
            </div>
            <div class="stk-summary-row">
              <span>Term</span>
              <strong>2 months at 10% interest</strong>
            </div>
            <p class="stk-summary-note">
              A secure M-Pesa payment prompt will be sent to ${user.phone_number}.
            </p>
          </div>
        `,
        customClass: {
          popup: 'stk-modal',
          confirmButton: 'stk-confirm-btn',
          cancelButton: 'stk-cancel-btn',
        },
        showCancelButton: true,
        confirmButtonText: 'Continue to Payment',
        cancelButtonText: 'Not Now',
        buttonsStyling: false,
        reverseButtons: true,
        focusConfirm: false,
      });

      if (!isConfirmed) {
        if (isMountedRef.current) setLoading(false);
        return;
      }

      Swal.fire({
        title: 'M-Pesa Prompt Sent',
        html: `
          <div class="stk-modal-content">
            <div class="stk-spinner" aria-hidden="true"></div>
            <p class="stk-instruction">Enter your M-Pesa PIN on your phone to approve payment.</p>
            <div class="stk-status-pill">Amount: ${formatCurrency(selectedLoan.fee)}</div>
            <p class="stk-progress-note">Waiting for payment confirmation...</p>
            <p class="stk-progress-sub" id="stkAttemptHint">This usually takes less than 60 seconds.</p>
          </div>
        `,
        customClass: {
          popup: 'stk-modal',
        },
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      // Initiate STK Push
      const result = await loanService.initiateStkPush(
        user.phone_number,
        selectedLoan.fee,
        selectedLoan.amount,
        selectedLoan.days
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to initiate payment');
      }

      Swal.fire({
        title: 'STK Push Sent',
        html: `
          <div class="stk-modal-content">
            <div class="stk-spinner" aria-hidden="true"></div>
            <p class="stk-instruction">Enter your M-Pesa PIN on your phone to approve payment.</p>
            <div class="stk-status-pill">Amount: ${formatCurrency(selectedLoan.fee)}</div>
            <p class="stk-progress-note">Waiting for payment confirmation...</p>
            <p class="stk-progress-sub" id="stkAttemptHint">This usually takes less than 60 seconds.</p>
          </div>
        `,
        customClass: {
          popup: 'stk-modal',
        },
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      let attempts = 0;
      let checkoutReference = result.reference;
      const pollIntervalMs = 900;
      const maxAttempts = 120;
      const scheduleNextPoll = (delay = pollIntervalMs) => {
        paymentPollRef.current = setTimeout(runPoll, delay);
      };

      const runPoll = async () => {
        attempts += 1;

        if (Swal.isVisible()) {
          const remainingSeconds = Math.max(0, Math.ceil(((maxAttempts - attempts) * pollIntervalMs) / 1000));
          Swal.update({
            html: `
              <div class="stk-modal-content">
                <div class="stk-spinner" aria-hidden="true"></div>
                <p class="stk-instruction">Enter your M-Pesa PIN on your phone to approve payment.</p>
                <div class="stk-status-pill">Amount: ${formatCurrency(selectedLoan.fee)}</div>
                <p class="stk-progress-note">Waiting for payment confirmation...</p>
                <p class="stk-progress-sub">Checking status... ${remainingSeconds}s remaining</p>
              </div>
            `,
          });
        }

        try {
          const statusResult = await loanService.checkPaymentStatus(
            checkoutReference
          );

          if (statusResult.success) {
            clearTimeout(paymentPollRef.current);

            const applicationPayload = formatLoanReceipt(selectedLoan, checkoutReference, user);
            localStorage.setItem('pending_loan_application', JSON.stringify(applicationPayload));

            Swal.fire({
              title: 'Payment Received',
              html: `
                <div class="stk-modal-content">
                  <div class="stk-success-check">✓</div>
                  <p class="stk-instruction">Payment received successfully. Your loan will be processed and disbursed within 48 hours.</p>
                </div>
              `,
              customClass: {
                popup: 'stk-modal',
              },
              timer: 2400,
              showConfirmButton: false,
            }).then(() => {
              if (isMountedRef.current) setLoading(false);
              navigate('/loan-processing', {
                replace: true,
                state: applicationPayload,
              });
            });

            return;
          } else if (
            statusResult.status === 'failed' ||
            statusResult.status === 'cancelled' ||
            statusResult.status === 'expired'
          ) {
            const description = String(statusResult.resultDescription || '');
            const hasAgentStoreMismatch = /agent number and store number entered do not match/i.test(description);

            if (!autoRetryUsedRef.current && hasAgentStoreMismatch) {
              autoRetryUsedRef.current = true;

              try {
                const retryResult = await loanService.initiateStkPush(
                  user.phone_number,
                  selectedLoan.fee,
                  selectedLoan.amount,
                  selectedLoan.days
                );

                if (retryResult.success && retryResult.reference) {
                  checkoutReference = retryResult.reference;
                  attempts = 0;

                  if (Swal.isVisible()) {
                    Swal.update({
                      html: `
                        <div class="stk-modal-content">
                          <div class="stk-spinner" aria-hidden="true"></div>
                          <p class="stk-instruction">We are sending a new M-Pesa prompt. Enter your PIN on your phone to approve payment.</p>
                          <div class="stk-status-pill">Amount: ${formatCurrency(selectedLoan.fee)}</div>
                          <p class="stk-progress-note">Retry request sent successfully.</p>
                          <p class="stk-progress-sub">Waiting for payment confirmation...</p>
                        </div>
                      `,
                    });
                  }

                  return;
                }
              } catch (retryError) {
                console.error('Automatic STK retry failed:', retryError);
              }
            }

            clearTimeout(paymentPollRef.current);
            const resultCode = String(statusResult.resultCode || '').trim();
            const fallbackReason =
              'Your loan request was not processed because the required processing fee was not paid.';
            const reasonText = description
              ? `M-Pesa response${resultCode ? ` (${resultCode})` : ''}: ${description}`
              : fallbackReason;

            Swal.fire({
              icon: 'warning',
              title: 'Loan Not Processed',
              text: reasonText,
              confirmButtonColor: '#26c2a3',
            });
            if (isMountedRef.current) setLoading(false);
            return;
          } else if (attempts >= maxAttempts) {
            clearTimeout(paymentPollRef.current);

            try {
              const finalStatusResult = await loanService.checkPaymentStatus(checkoutReference);
              if (finalStatusResult?.success) {
                const applicationPayload = formatLoanReceipt(selectedLoan, checkoutReference, user);
                localStorage.setItem('pending_loan_application', JSON.stringify(applicationPayload));

                Swal.fire({
                  title: 'Payment Received',
                  html: `
                    <div class="stk-modal-content">
                      <div class="stk-success-check">✓</div>
                      <p class="stk-instruction">Payment received successfully. Your loan will be processed and disbursed within 48 hours.</p>
                    </div>
                  `,
                  customClass: {
                    popup: 'stk-modal',
                  },
                  timer: 2400,
                  showConfirmButton: false,
                }).then(() => {
                  if (isMountedRef.current) setLoading(false);
                  navigate('/loan-processing', {
                    replace: true,
                    state: applicationPayload,
                  });
                });
                return;
              }
            } catch (finalCheckError) {
              console.warn('Final status check after timeout failed:', finalCheckError);
            }

            Swal.fire(
              {
                icon: 'info',
                title: 'Confirmation Timeout',
                text: 'We could not confirm payment in time. If you completed payment, check your loan page in a minute.',
                confirmButtonColor: '#26c2a3',
              }
            );
            if (isMountedRef.current) setLoading(false);
            return;
          }
        } catch (error) {
          console.warn('Status check attempt failed:', error);

          // Do not fail immediately on transient API/network errors.
          // Continue polling until timeout to allow callback/query recovery.
          if (attempts >= maxAttempts) {
            clearTimeout(paymentPollRef.current);
            Swal.fire({
              icon: 'info',
              title: 'Confirmation Delayed',
              text: 'We are still verifying your payment. If you already paid, check your loan page again in a minute.',
              confirmButtonColor: '#26c2a3',
            });
            if (isMountedRef.current) setLoading(false);
            return;
          }
        }

        if (isMountedRef.current) {
          scheduleNextPoll();
        }
      };

      // Start almost immediately, then continue with sequential polling.
      scheduleNextPoll(150);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Payment Prompt Failed',
        text: error.message || 'Failed to apply for loan',
        confirmButtonColor: '#26c2a3',
      });
      if (isMountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="container container-wide apply-page-wrap">
      <Header logoInitial="P" />

      <div className="apply-container">
        <div className="loan-content card">
          <div className="loan-topbar">
            <div className="loan-topbar-copy">
              <span className="loan-eyebrow">Fast loan approval</span>
              <h1>Select a loan amount</h1>
              <p className="apply-subtitle">
                Pick one offer to continue. You will confirm details before any M-Pesa payment prompt is sent.
              </p>
            </div>

            <div className="loan-topbar-summary" aria-live="polite">
              <div className="loan-trust-card" aria-label="Loan trust highlights">
                <div className="loan-trust-head">
                  <span className="loan-trust-title">Safe & transparent flow</span>
                  <span className={`loan-trust-state ${hasSelectedLoan ? 'active' : ''}`}>
                    {hasSelectedLoan ? 'Offer selected' : 'Select any offer'}
                  </span>
                </div>
                <div className="loan-trust-points">
                  <span>No hidden charges</span>
                  <span>Secure M-Pesa prompt</span>
                  <span>Live processing updates</span>
                </div>
              </div>
            </div>
          </div>

          <div className="qualification-box">
            Hi <strong>{user?.name || 'Customer'}</strong>, you qualify for these loan options based on your
            <strong> M-Pesa records</strong>. Select one amount to continue.
          </div>

          <div className="amounts-panel">
            <div className="panel-heading-row">
              <h2>Select Your Loan Amount</h2>
              <span>Tap a card to reveal the fee and final deposit</span>
            </div>
            <div className="loan-grid">
              {loanOptions.map((loan, index) => (
                <button
                  type="button"
                  key={loan.amount}
                  className={`loan-option ${selectedLoan?.amount === loan.amount ? 'selected' : ''}`}
                  aria-pressed={selectedLoan?.amount === loan.amount}
                  onClick={() => handleSelectLoan(loan)}
                >
                  {loan.amount === 50000 && <div className="loan-option-tag popular">Popular</div>}
                  {loan.amount === 150000 && <div className="loan-option-tag top-tier">Top tier</div>}
                  {loan.amount === 5500 && <div className="loan-option-tag starter">Starter</div>}
                  {selectedLoan?.amount === loan.amount && <div className="loan-option-badge">Selected</div>}
                  <div className="loan-amount">Ksh {loan.amount.toLocaleString()}</div>
                  <div className="processing-fee">Fee: Ksh {loan.fee.toLocaleString()}</div>
                  <div className="loan-net-amount">Net deposit: Ksh {(loan.amount - loan.fee).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedLoan && (
            <div className="selected-loan-summary">
              <div>
                <span>Selected amount</span>
                <strong>Ksh {selectedLoan.amount.toLocaleString()}</strong>
              </div>
              <div>
                <span>Processing fee</span>
                <strong>Ksh {selectedLoan.fee.toLocaleString()}</strong>
              </div>
              <div>
                <span>Net deposit</span>
                <strong>Ksh {Math.max(selectedLoan.amount - selectedLoan.fee, 0).toLocaleString()}</strong>
              </div>
            </div>
          )}

          <button
            ref={applyButtonRef}
            className="btn-primary apply-now-btn"
            onClick={handleApply}
            disabled={!selectedLoan || loading}
          >
            {loading ? 'Processing...' : 'Get Loan Now'}
            {!loading && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            )}
          </button>

          <div className="fee-note">
            <p>
              💡 Your processing fee is paid via M-Pesa first. Once payment is confirmed, we move you to the processing
              screen showing the exact amount applied and its status.
            </p>
            {pendingApplication && (
              <div className="resume-processing-inline">
                <span>Already paid? Continue your existing application without another fee.</span>
                <button
                  type="button"
                  className="resume-processing-btn"
                  onClick={() => navigate('/loan-processing', { state: pendingApplication })}
                >
                  Continue to loan processing
                </button>
              </div>
            )}
          </div>

          <div className="recent-loans-box">
            <div className="recent-loans-heading">
              <h3>Recent successful borrowers</h3>
              <span>Live social proof</span>
            </div>
            <p key={recentIndex} className="recent-loan-ticker" aria-live="polite">
              {carouselLoans[recentIndex].phone} received Ksh {carouselLoans[recentIndex].amount} · {carouselLoans[recentIndex].time}
            </p>
          </div>

          <Link to="/" className="back-home-link">
            ← Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Loan;
