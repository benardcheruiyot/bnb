const transactions = new Map();
const PENDING_EXPIRY_MS = 5 * 60 * 1000;
const TERMINAL_RETENTION_MS = 30 * 60 * 1000;

class MpesaTransaction {
  constructor(data) {
    this.id = data.id;
    this.checkoutRequestId = data.checkoutRequestId || null;
    this.merchantRequestId = data.merchantRequestId || null;
    this.phone = data.phone || null;
    this.userId = data.userId || null;
    this.loanAmount = data.loanAmount || null;
    this.termDays = data.termDays || 60;
    this.amount = data.amount || null;
    this.accountReference = data.accountReference || null;
    this.status = data.status || 'initiated';
    this.resultCode = data.resultCode || null;
    this.resultDescription = data.resultDescription || null;
    this.mpesaReceiptNumber = data.mpesaReceiptNumber || null;
    this.callbackData = data.callbackData || null;
    this.loanId = data.loanId || null;
    this.loanCreatedAt = data.loanCreatedAt || null;
    this.rawRequest = data.rawRequest || null;
    this.rawResponse = data.rawResponse || null;
    this.lastStatusQueryAt = data.lastStatusQueryAt || null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.completedAt = null;
    this.expiresAt = new Date(this.createdAt.getTime() + PENDING_EXPIRY_MS);
  }

  static purgeStaleTransactions() {
    const now = Date.now();

    for (const [checkoutRequestId, transaction] of transactions.entries()) {
      if (!transaction) {
        transactions.delete(checkoutRequestId);
        continue;
      }

      const terminal = ['completed', 'failed', 'cancelled', 'expired'].includes(transaction.status);
      if (terminal) {
        const terminalAt = transaction.completedAt
          ? new Date(transaction.completedAt).getTime()
          : new Date(transaction.updatedAt || transaction.createdAt).getTime();

        if (now - terminalAt > TERMINAL_RETENTION_MS) {
          transactions.delete(checkoutRequestId);
        }
      }
    }
  }

  static expireIfPending(transaction) {
    if (!transaction) return null;

    if (['completed', 'failed', 'cancelled', 'expired'].includes(transaction.status)) {
      return transaction;
    }

    const createdAtMs = new Date(transaction.createdAt).getTime();
    if (Date.now() - createdAtMs >= PENDING_EXPIRY_MS) {
      transaction.status = 'expired';
      transaction.resultCode = transaction.resultCode || 'TIMEOUT';
      transaction.resultDescription =
        transaction.resultDescription || 'Transaction expired after 5 minutes without confirmation.';
      transaction.updatedAt = new Date();
      transaction.completedAt = new Date();
    }

    return transaction;
  }

  static async create(data) {
    MpesaTransaction.purgeStaleTransactions();

    const transaction = new MpesaTransaction({
      ...data,
      id: `MPESA-${Date.now()}`,
    });

    transactions.set(transaction.checkoutRequestId, transaction);
    return transaction;
  }

  static async findByCheckoutRequestId(checkoutRequestId) {
    if (!checkoutRequestId) return null;
    MpesaTransaction.purgeStaleTransactions();

    const transaction = transactions.get(checkoutRequestId) || null;
    return MpesaTransaction.expireIfPending(transaction);
  }

  static async updateByCheckoutRequestId(checkoutRequestId, patch) {
    MpesaTransaction.purgeStaleTransactions();

    const transaction = await MpesaTransaction.findByCheckoutRequestId(checkoutRequestId);
    if (!transaction) return null;

    if (transaction.status === 'expired') {
      return transaction;
    }

    Object.assign(transaction, patch);
    transaction.updatedAt = new Date();

    if (patch.status && ['completed', 'failed', 'cancelled', 'expired'].includes(patch.status)) {
      transaction.completedAt = new Date();
    }

    return transaction;
  }

  static async findLastByUserId(userId) {
    if (!userId) return null;
    MpesaTransaction.purgeStaleTransactions();

    let lastTransaction = null;
    let latestTime = 0;

    for (const transaction of transactions.values()) {
      if (transaction && transaction.userId === userId) {
        const txTime = new Date(transaction.createdAt).getTime();
        if (txTime > latestTime) {
          latestTime = txTime;
          lastTransaction = transaction;
        }
      }
    }

    return lastTransaction ? MpesaTransaction.expireIfPending(lastTransaction) : null;
  }

  static async getAllByUserId(userId) {
    if (!userId) return [];
    MpesaTransaction.purgeStaleTransactions();

    const userTransactions = [];
    for (const transaction of transactions.values()) {
      if (transaction && transaction.userId === userId) {
        userTransactions.push(MpesaTransaction.expireIfPending(transaction));
      }
    }

    // Sort by creation date, newest first
    return userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

module.exports = MpesaTransaction;