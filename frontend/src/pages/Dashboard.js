// Dashboard.js - User Dashboard
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveTimer from '../components/LiveTimer';
import { useAuth } from '../hooks/useAuth';
import { loanService } from '../services/api';
import { formatCurrency, formatPhoneNumber, calculateRepayment } from '../utils/helpers';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    try {
      const data = await loanService.getUserLoans();
      setLoans(data);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  useEffect(() => {
    document.title = 'Dashboard | Tala Mkopo Extra';
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNewLoan = () => {
    navigate('/loan');
  };

  return (
    <div className="container">
      <Header showHelp={false} />

      <div className="dashboard-content">
        <div className="dashboard-welcome card">
          <div className="welcome-header">
            <div>
              <h2>Welcome, {user?.name || 'Customer'}!</h2>
              <p className="welcome-subtitle">Your Tala Mkopo Extra Dashboard</p>
            </div>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="info-card card">
            <h3>Account Info</h3>
            <p>
              <strong>Phone:</strong> {formatPhoneNumber(user?.phone_number)}
            </p>
            <p>
              <strong>Name:</strong> {user?.name || 'N/A'}
            </p>
          </div>

          <div className="info-card card">
            <h3>Quick Stats</h3>
            <p>
              <strong>Total Loans:</strong> {loans.length}
            </p>
            <p>
              <strong>Active Loans:</strong>{' '}
              {loans.filter((l) => l.status === 'approved').length}
            </p>
          </div>
        </div>

        <div className="loans-section">
          <div className="loans-header">
            <h3>Recent Loans</h3>
            <button type="button" className="btn-new-loan" onClick={handleNewLoan}>
              + Apply New Loan
            </button>
          </div>

          {loading ? (
            <p className="text-center text-muted">Loading loans...</p>
          ) : loans.length === 0 ? (
            <div className="empty-state card">
              <div className="empty-state-icon">✓</div>
              <h4>Your account is ready</h4>
              <p>You don't have any loans yet.</p>
              <button type="button" className="btn-primary" onClick={handleNewLoan}>
                Apply for Your First Loan
              </button>
            </div>
          ) : (
            <div className="loans-list">
              {loans.map((loan) => (
                <div key={loan.id} className="loan-card card">
                  <div className="loan-card-header">
                    <div>
                      <h4>{loan.id}</h4>
                      <p className="loan-status" data-status={loan.status}>
                        {loan.status === 'pending' ? 'BEING PROCESSED' : loan.status.toUpperCase()}
                      </p>
                    </div>
                    <div className="loan-amount">{formatCurrency(loan.amount)}</div>
                  </div>

                  <div className="loan-card-details">
                    <div className="detail">
                      <span>Processing Fee:</span>
                      <strong>{formatCurrency(loan.processingFee)}</strong>
                    </div>
                    <div className="detail">
                      <span>Interest:</span>
                      <strong>
                        {formatCurrency(loan.amount * loan.interestRate)}
                      </strong>
                    </div>
                    <div className="detail">
                      <span>Total Repayment:</span>
                      <strong>
                        {formatCurrency(calculateRepayment(loan.amount))}
                      </strong>
                    </div>
                    {loan.repaymentDueDate && (
                      <div className="detail">
                        <span>Due Date:</span>
                        <strong>
                          {new Date(loan.repaymentDueDate).toLocaleDateString()}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="loan-card-timer">
                    <LiveTimer 
                      startTime={loan.createdAt} 
                      label="Application submitted" 
                    />
                  </div>

                  <div className="loan-card-footer">
                    <small>
                      Applied: {new Date(loan.createdAt).toLocaleDateString()}
                    </small>
                    {loan.status === 'approved' && (
                      <span className="status-badge approved">Approved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
