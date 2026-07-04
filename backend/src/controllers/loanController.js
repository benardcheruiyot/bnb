// Loan Controller
const Loan = require('../models/Loan');
const MpesaTransaction = require('../models/MpesaTransaction');
const loanService = require('../services/loanService');
const mpesaService = require('../services/mpesaService');
const { AppError } = require('../middleware/errorHandler');
const pushService = require('../services/pushService');

const STATUS_QUERY_MIN_INTERVAL_MS = 1200;
const TERMINAL_STATUS_GRACE_MS = 25000;

class LoanController {
  constructor() {
    this.createApplication = this.createApplication.bind(this);
    this.getLoan = this.getLoan.bind(this);
    this.getUserLoans = this.getUserLoans.bind(this);
    this.getLastTransaction = this.getLastTransaction.bind(this);
    this.initiateStkPush = this.initiateStkPush.bind(this);
    this.checkPaymentStatus = this.checkPaymentStatus.bind(this);
    this.handleMpesaCallback = this.handleMpesaCallback.bind(this);
    this.appUrl = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  inferLoanAmountFromFee(processingFee) {
    const feeToLoanMap = {
      120: 5500,
      200: 10000,
      320: 15000,
      520: 25000,
      760: 35000,
      1100: 50000,
      1450: 65000,
      1850: 80000,
      2350: 100000,
      2800: 120000,
      3200: 135000,
      3500: 150000,
    };

    return feeToLoanMap[Number(processingFee)] || null;
  }

  async ensureLoanCreatedForCompletedTransaction(checkoutRequestId) {
    if (!checkoutRequestId) return null;

    const transaction = await MpesaTransaction.findByCheckoutRequestId(checkoutRequestId);
    if (!transaction || transaction.status !== 'completed' || transaction.loanId) {
      return transaction;
    }

    if (!transaction.userId || !transaction.loanAmount) {
      return transaction;
    }

    const loan = await loanService.createLoanApplication(transaction.userId, {
      amount: Number(transaction.loanAmount),
      processingFee: Number(transaction.amount),
      termDays: Number(transaction.termDays) || 60,
    });

    await MpesaTransaction.updateByCheckoutRequestId(checkoutRequestId, {
      loanId: loan.id,
      loanCreatedAt: new Date(),
    });

    return MpesaTransaction.findByCheckoutRequestId(checkoutRequestId);
  }

  async createApplication(req, res, next) {
    try {
      const { amount, termDays } = req.body;

      if (!amount) {
        return next(new AppError('Loan amount is required', 400));
      }

      // Validate amount
      loanService.validateLoanAmount(amount);

      const processingFee = parseInt(process.env.PROCESSING_FEE || 300, 10);

      const loan = await loanService.createLoanApplication(req.user.id, {
        amount,
        processingFee,
        termDays: termDays || 30,
      });

      res.status(201).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async getLoan(req, res, next) {
    try {
      const { loanId } = req.params;
      const loan = await Loan.findById(loanId);

      if (!loan) {
        return next(new AppError('Loan not found', 404));
      }

      if (loan.userId !== req.user.id) {
        return next(new AppError('Not authorized to access this loan', 403));
      }

      res.status(200).json({
        success: true,
        data: loan,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async getUserLoans(req, res, next) {
    try {
      const loans = await Loan.findByUserId(req.user.id);

      res.status(200).json({
        success: true,
        data: loans,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async getLastTransaction(req, res, next) {
    try {
      const lastTransaction = await MpesaTransaction.findLastByUserId(req.user.id);

      res.status(200).json({
        success: true,
        data: lastTransaction
          ? {
              checkoutRequestId: lastTransaction.checkoutRequestId,
              amount: lastTransaction.amount,
              loanAmount: lastTransaction.loanAmount,
              termDays: lastTransaction.termDays,
              phone: lastTransaction.phone,
              status: lastTransaction.status,
              createdAt: lastTransaction.createdAt,
            }
          : null,
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async initiateStkPush(req, res, next) {
    try {
      const { phone, amount, loanAmount, termDays } = req.body;

      if (!phone || !amount) {
        return next(new AppError('Phone number and amount are required', 400));
      }

      loanService.validateProcessingFee(Number(amount));

      const resolvedLoanAmount = Number(loanAmount) || this.inferLoanAmountFromFee(amount);
      if (resolvedLoanAmount) {
        loanService.validateLoanAmount(Number(resolvedLoanAmount));
      }

      const result = await mpesaService.initiateStkPush(phone, amount);

      if (!result.success) {
        return next(new AppError(result.message, 400));
      }

      await MpesaTransaction.create({
        checkoutRequestId: result.checkoutRequestId,
        merchantRequestId: result.merchantRequestId,
        userId: req.user.id,
        phone,
        amount,
        loanAmount: resolvedLoanAmount,
        termDays: termDays || 60,
        status: 'initiated',
        rawResponse: result.rawResponse || null,
      });

      res.status(200).json({
        success: true,
        reference: result.checkoutRequestId,
      });

      // Notify device that STK push was sent
      pushService.sendToUser(req.user.id, {
        title: 'Check Your Phone',
        body: `M-Pesa payment request of KES ${amount} sent. Enter your PIN to confirm.`,
        icon: '/favicon.ico',
        url: this.appUrl,
      }).catch(() => {});
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async checkPaymentStatus(req, res, next) {
    try {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.set('Surrogate-Control', 'no-store');

      const { checkoutId } = req.query;

      if (!checkoutId) {
        return next(new AppError('Checkout ID is required', 400));
      }

      console.log(`[Payment Status] Checking status for checkoutId: ${checkoutId}`);

      const existingTransaction = await MpesaTransaction.findByCheckoutRequestId(checkoutId);
      console.log(
        '[Payment Status] Transaction found:',
        existingTransaction ? 'yes' : 'no',
        existingTransaction?.status
      );

      if (existingTransaction?.userId && existingTransaction.userId !== req.user.id) {
        return next(new AppError('Not authorized to access this transaction', 403));
      }

      const terminalStatuses = ['completed', 'failed', 'cancelled', 'expired'];

      // Prefer callback-confirmed terminal state to avoid losing a successful payment
      // when an STK query response is delayed or temporarily inconsistent.
      if (existingTransaction && terminalStatuses.includes(existingTransaction.status)) {
        console.log(`[Payment Status] Transaction already in terminal state: ${existingTransaction.status}`);
        const finalizedTransaction =
          existingTransaction.status === 'completed'
            ? await this.ensureLoanCreatedForCompletedTransaction(checkoutId)
            : existingTransaction;

        return res.status(200).json({
          success: finalizedTransaction.status === 'completed',
          status: finalizedTransaction.status,
          resultCode: finalizedTransaction.resultCode || null,
          resultDescription: finalizedTransaction.resultDescription || null,
          loanId: finalizedTransaction.loanId || null,
        });
      }

      // Return quickly for active transactions and only query Safaricom at controlled intervals.
      // This keeps UI polling responsive while still allowing callback-confirmed states to surface instantly.
      if (existingTransaction && !terminalStatuses.includes(existingTransaction.status)) {
        const lastQueryMs = existingTransaction.lastStatusQueryAt
          ? new Date(existingTransaction.lastStatusQueryAt).getTime()
          : 0;
        const elapsedSinceLastQuery = Date.now() - lastQueryMs;

        if (lastQueryMs > 0 && elapsedSinceLastQuery < STATUS_QUERY_MIN_INTERVAL_MS) {
          return res.status(200).json({
            success: false,
            status: existingTransaction.status || 'pending',
            resultCode: existingTransaction.resultCode || null,
            resultDescription: existingTransaction.resultDescription || 'Waiting for payment confirmation...',
            loanId: existingTransaction.loanId || null,
          });
        }
      }

      console.log('[Payment Status] Querying M-Pesa API for transaction status...');
      const result = await mpesaService.checkTransactionStatus(checkoutId);
      console.log('[Payment Status] M-Pesa query result:', result.status);

      const refreshedTransaction = await MpesaTransaction.findByCheckoutRequestId(checkoutId);
      const fallbackStatus = refreshedTransaction?.status || existingTransaction?.status || 'pending';
      let normalizedStatus = result.status || fallbackStatus;

      const queryTerminalStatuses = ['failed', 'cancelled', 'expired'];
      const statusSourceTransaction = refreshedTransaction || existingTransaction;
      const transactionAgeMs = statusSourceTransaction?.createdAt
        ? Date.now() - new Date(statusSourceTransaction.createdAt).getTime()
        : Number.POSITIVE_INFINITY;
      const callbackConfirmed = Boolean(statusSourceTransaction?.callbackData);

      // Some STK status queries can briefly return terminal states before the user finishes
      // handset confirmation. Keep polling as pending for a short grace window unless callback-confirmed.
      if (
        queryTerminalStatuses.includes(normalizedStatus) &&
        !callbackConfirmed &&
        transactionAgeMs < TERMINAL_STATUS_GRACE_MS
      ) {
        console.log(
          `[Check Status] Holding early terminal result as pending (${normalizedStatus}) at ${transactionAgeMs}ms`
        );
        normalizedStatus = 'pending';
      }

      console.log(`[Check Status] Normalized status: ${normalizedStatus}`);

      // Update the transaction with the latest status
      if (existingTransaction || refreshedTransaction) {
        console.log('[Check Status] Updating transaction status...');
        await MpesaTransaction.updateByCheckoutRequestId(checkoutId, {
          status: normalizedStatus,
          resultCode: normalizedStatus === 'pending' ? null : (result.resultCode || null),
          resultDescription:
            normalizedStatus === 'pending'
              ? 'Waiting for payment confirmation...'
              : (result.resultDescription || null),
          lastStatusQueryAt: new Date(),
        });
      } else if (normalizedStatus === 'completed') {
        // If we confirmed payment is completed but no transaction exists, create one
        console.log('[Check Status] Payment confirmed but no transaction exists. Creating new record.');
        await MpesaTransaction.create({
          checkoutRequestId: checkoutId,
          status: 'completed',
          resultCode: result.resultCode || '0',
          resultDescription: result.resultDescription || 'Payment confirmed',
        });
      }

      const finalizedTransaction =
        normalizedStatus === 'completed'
          ? await this.ensureLoanCreatedForCompletedTransaction(checkoutId)
          : await MpesaTransaction.findByCheckoutRequestId(checkoutId);

      console.log(
        `[Check Status] Final response: success=${normalizedStatus === 'completed'}, status=${normalizedStatus}`
      );

      res.status(200).json({
        success: normalizedStatus === 'completed',
        status: normalizedStatus,
        resultCode: result.resultCode || refreshedTransaction?.resultCode || null,
        resultDescription:
          normalizedStatus === 'expired'
            ? 'Transaction expired after 5 minutes without confirmation.'
            : result.resultDescription || refreshedTransaction?.resultDescription || null,
        loanId: finalizedTransaction?.loanId || null,
      });
    } catch (error) {
      console.error('[Check Status] Error:', error.message, error.stack);
      return res.status(200).json({
        success: false,
        status: 'pending',
        resultCode: null,
        resultDescription: 'Payment confirmation is delayed. Please keep waiting.',
        loanId: null,
      });
    }
  }

  async handleMpesaCallback(req, res, next) {
    try {
      const { Body } = req.body;

      if (!Body || !Body.stkCallback) {
        console.error('[Callback] Invalid callback data received');
        return res.status(400).json({
          success: false,
          message: 'Invalid callback data',
        });
      }

      const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
      const metadata = CallbackMetadata?.Item || [];
      const normalizedResultCode = String(ResultCode ?? '');

      console.log(
        `[Callback] Received callback for CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`
      );

      const getMetaValue = (name) => metadata.find((item) => item.Name === name)?.Value;
      const receiptNumber = getMetaValue('MpesaReceiptNumber') || null;

      const normalizedStatus =
        normalizedResultCode === '0'
          ? 'completed'
          : normalizedResultCode === '1032'
            ? 'cancelled'
            : 'failed';

      // Check if transaction exists
      let existingTransaction = await MpesaTransaction.findByCheckoutRequestId(CheckoutRequestID);

      if (!existingTransaction) {
        console.warn(`[Callback] Transaction not found in memory for ${CheckoutRequestID}. Creating new record.`);
        // If transaction doesn't exist in memory, create it from callback data
        existingTransaction = await MpesaTransaction.create({
          checkoutRequestId: CheckoutRequestID,
          merchantRequestId: MerchantRequestID || null,
          status: normalizedStatus,
          resultCode: normalizedResultCode,
          resultDescription: ResultDesc || null,
          mpesaReceiptNumber: receiptNumber,
          callbackData: Body.stkCallback,
        });
      } else {
        // Update existing transaction
        await MpesaTransaction.updateByCheckoutRequestId(CheckoutRequestID, {
          merchantRequestId: MerchantRequestID || null,
          status: normalizedStatus,
          resultCode: normalizedResultCode,
          resultDescription: ResultDesc || null,
          mpesaReceiptNumber: receiptNumber,
          callbackData: Body.stkCallback,
        });
      }

      // ResultCode 0 = Success
      if (normalizedResultCode === '0') {
        const finalTx = await this.ensureLoanCreatedForCompletedTransaction(CheckoutRequestID);
        console.log(`Payment successful for request: ${CheckoutRequestID}`);

        // Notify user's device
        const userId = existingTransaction?.userId || finalTx?.userId;
        if (userId) {
          pushService.sendToUser(userId, {
            title: 'Payment Received!',
            body: 'Your M-Pesa payment was confirmed. Your loan is being processed.',
            icon: '/favicon.ico',
            url: this.appUrl,
          }).catch(() => {});
        }
      } else {
        console.log(`Payment failed for request: ${CheckoutRequestID}, Result: ${ResultDesc}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Callback] Error processing callback:', error.message);
      next(new AppError(error.message, 500));
    }
  }
}

module.exports = new LoanController();
