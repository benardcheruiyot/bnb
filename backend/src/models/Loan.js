// Loan Model
const loans = new Map();

class Loan {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.amount = data.amount;
    this.processingFee = data.processingFee;
    this.interestRate = data.interestRate;
    this.termDays = data.termDays;
    this.status = data.status || 'pending';
    this.paymentStatus = data.paymentStatus || 'unpaid';
    this.mpesaReference = data.mpesaReference || null;
    this.disbursedAt = null;
    this.repaymentDueDate = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async create(data) {
    const loan = new Loan({
      ...data,
      id: `LOAN-${Date.now()}`,
    });
    loans.set(loan.id, loan);
    return loan;
  }

  static async findById(id) {
    return loans.get(id) || null;
  }

  static async findByUserId(userId) {
    const userLoans = [];
    for (let loan of loans.values()) {
      if (loan.userId === userId) userLoans.push(loan);
    }
    return userLoans;
  }

  static async updateStatus(loanId, status, paymentReference) {
    const loan = loans.get(loanId);
    if (loan) {
      loan.status = status;
      loan.paymentStatus = 'completed';
      loan.mpesaReference = paymentReference;
      loan.updatedAt = new Date();
      if (status === 'approved') {
        loan.disbursedAt = new Date();
        loan.repaymentDueDate = new Date(
          Date.now() + loan.termDays * 24 * 60 * 60 * 1000
        );
      }
    }
    return loan;
  }
}

module.exports = Loan;
