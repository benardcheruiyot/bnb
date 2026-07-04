// Home.js - Landing Page
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    document.title = 'Tala Mkopo Extra';
  }, []);

  const handleApplyNow = async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      await Swal.fire({
        html: '<div class="home-popup-spinner" role="status" aria-label="Loading"></div>',
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        timer: 1700,
        customClass: {
          popup: 'spinner-only-popup',
        },
      });

      navigate('/eligibility');
    } finally {
      setIsNavigating(false);
    }
  };

  return (
    <div className="container">
      <Header />

      <div className="hero-sections">
        <div className="hero">
          <div className="offer-badge">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Special Offer
          </div>
          <h1>Get Up To Ksh 150,000</h1>
          <p>Low 7.5% interest rate for qualified borrowers</p>
        </div>

        <div className="progress-steps">
          <div className="step active">
            <div className="step-number">1</div>
            <div className="step-label">Apply</div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-label">Approve</div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-label">Receive</div>
          </div>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleApplyNow}
          disabled={isNavigating}
          aria-busy={isNavigating}
        >
          <span>Apply Now</span>
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
        </button>

        <div className="card">
          <div className="card-title">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            Quick Approval
          </div>
          <p>Get pre-approved in minutes with our streamlined digital process.</p>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            Flexible Terms
          </div>
          <p>Choose loan terms from 30 to 90 days that fit your budget.</p>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            No Hidden Fees
          </div>
          <p>Transparent pricing with no surprises. Know exactly what you'll pay.</p>
        </div>

        <div className="trust-badges">
          <div className="trust-badge">
            <div className="trust-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="trust-text">Secure</div>
          </div>
          <div className="trust-badge">
            <div className="trust-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div className="trust-text">Licensed</div>
          </div>
          <div className="trust-badge">
            <div className="trust-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div className="trust-text">Encrypted</div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
