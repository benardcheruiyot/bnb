import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Processing.css';

const messages = [
  'Initializing secure connection...',
  'Verifying your details...',
  'Checking credit profile...',
  'Contacting verification services...',
  'Calculating loan offer...',
  'Finalizing approval...',
];

const Processing = () => {
  const navigate = useNavigate();
  const progressIntervalRef = useRef(null);
  const messageIntervalRef = useRef(null);
  const initialDelayRef = useRef(null);
  const successDelayRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showMessage, setShowMessage] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    document.title = 'Processing Eligibility | Tala Mkopo Extra';
  }, []);

  useEffect(() => {
    initialDelayRef.current = setTimeout(() => {
      setShowProgress(true);

      messageIntervalRef.current = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 2800);

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 1;
          if (next >= 100) {
            clearInterval(progressIntervalRef.current);
            clearInterval(messageIntervalRef.current);
            setShowProgress(false);
            setShowMessage(false);
            setShowResult(true);
            successDelayRef.current = setTimeout(() => {
              localStorage.setItem('loanapproval_shown', '1');
              navigate('/apply');
            }, 2000);
            return 100;
          }
          return next;
        });
      }, 170);
    }, 2000);

    return () => {
      clearTimeout(initialDelayRef.current);
      clearTimeout(successDelayRef.current);
      clearInterval(progressIntervalRef.current);
      clearInterval(messageIntervalRef.current);
    };
  }, [navigate]);

  return (
    <div className="processing-page">
      <div className="processing-container">
        <div className="processing-trust-seal">🔒 Secure Processing</div>

        <h1>Processing Your Application</h1>

        <div className="processing-security-badge">✓ 256-bit SSL Encryption</div>

        <div className="processing-dots" aria-hidden="true">
          <div className="processing-dot"></div>
          <div className="processing-dot"></div>
          <div className="processing-dot"></div>
        </div>

        {showMessage && (
          <div className="processing-message" aria-live="polite">
            {messages[messageIndex]}
          </div>
        )}

        <div className="processing-progress-container">
          <div className="processing-progress-text" aria-live="polite">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          {showProgress && (
            <div className="processing-progress-bar">
              <div className="processing-progress" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>

        <div className="processing-trust-grid">
          <div className="processing-trust-item">🏦 CBK Licensed</div>
          <div className="processing-trust-item">⏱️ Instant Approval</div>
          <div className="processing-trust-item">🔐 Data Protected</div>
          <div className="processing-trust-item">💳 No Hidden Fees</div>
        </div>

        {showResult && (
          <div className="processing-success">
            <div className="processing-success-check">✔</div>
            <p>Eligibility successful. You qualify for a loan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Processing;
