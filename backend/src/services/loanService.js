// Loan Service
const Loan = require('../models/Loan');
const User = require('../models/User');

class LoanService {
  async createLoanApplication(userId, loanData) {
    try {
      const loan = await Loan.create({
        userId,
        amount: loanData.amount,
        processingFee: loanData.processingFee,
        interestRate: parseFloat(process.env.LOAN_INTEREST_RATE || 0.1),
        termDays: loanData.termDays || 30,
        status: 'pending',
      });

      return loan;
    } catch (error) {
      throw new Error(`Failed to create loan application: ${error.message}`);
    }
  }

  async getLoanDetails(loanId) {
    return await Loan.findById(loanId);
  }

  async getUserLoans(userId) {
    return await Loan.findByUserId(userId);
  }

  calculateRepaymentAmount(principal, interestRate) {
    return principal + principal * interestRate;
  }

  validateLoanAmount(amount) {
    const minAmount = parseInt(process.env.LOAN_MIN_AMOUNT || 5500);
    const maxAmount = parseInt(process.env.LOAN_MAX_AMOUNT || 150000);

    if (amount < minAmount || amount > maxAmount) {
      throw new Error(
        `Loan amount must be between Ksh ${minAmount} and Ksh ${maxAmount}`
      );
    }
  }

  validateProcessingFee(fee) {
    const minFee = parseInt(process.env.PROCESSING_FEE_MIN || 120);
    const maxFee = parseInt(process.env.PROCESSING_FEE_MAX || 3500);

    if (fee < minFee || fee > maxFee) {
      throw new Error(`Processing fee must be between Ksh ${minFee} and Ksh ${maxFee}`);
    }
  }

  async approveLoan(loanId, mpesaReference) {
    try {
      const loan = await Loan.updateStatus(loanId, 'approved', mpesaReference);
      return loan;
    } catch (error) {
      throw new Error(`Failed to approve loan: ${error.message}`);
    }
  }
}

module.exports = new LoanService();
