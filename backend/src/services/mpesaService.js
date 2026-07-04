// M-Pesa Service
const https = require('https');
const path = require('path');
const dotenv = require('dotenv');

class MpesaService {
  constructor() {
    this.consumerKey = String(process.env.MPESA_CONSUMER_KEY || '').trim();
    this.consumerSecret = String(process.env.MPESA_CONSUMER_SECRET || '').trim();
    this.environment = String(process.env.MPESA_ENVIRONMENT || 'production').trim();
    this.shortcode = String(process.env.MPESA_SHORTCODE || '').trim();
    this.partyB = String(process.env.MPESA_PARTYB || this.shortcode).trim();
    this.businessCode = String(this.shortcode || this.partyB).trim();
    this.passkey = String(process.env.MPESA_PASSKEY || '').trim();
    this.transactionType = String(process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline').trim();
    this.runtimeTransactionType = this.transactionType;
    this.httpsAgent = new https.Agent({ family: 4, keepAlive: false });
    this.cachedAccessToken = null;
    this.cachedAccessTokenExpiresAt = 0;
    this.resolvedPartyB = this.resolvePartyB();
    
    // Log M-Pesa configuration status
    this.isConfigured = this.isProperlyConfigured();
    if (!this.isConfigured) {
      console.warn('[M-Pesa] ⚠️  M-Pesa is running in DEVELOPMENT MODE');
      console.warn('[M-Pesa] Set real credentials in .env to enable production');
    } else {
      console.log(`[M-Pesa] ✅ M-Pesa is configured for ${this.environment}`);
      if (this.isBuyGoodsTransaction(this.transactionType) && this.partyB && this.partyB !== this.businessCode) {
        console.warn(
          `[M-Pesa] MPESA_PARTYB (${this.partyB}) differs from MPESA_SHORTCODE (${this.businessCode}). Using MPESA_PARTYB as configured.`
        );
      }
    }
  }

  refreshRuntimeConfig() {
    // Reload .env so runtime edits (like MPESA_PARTYB changes) are applied.
    dotenv.config({
      path: path.resolve(__dirname, '../../.env'),
      override: true,
    });

    const latestShortcode = String(process.env.MPESA_SHORTCODE || '').trim();
    const latestPartyB = String(process.env.MPESA_PARTYB || latestShortcode).trim();
    const latestTransactionType = String(
      process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline'
    ).trim();
    const latestPasskey = String(process.env.MPESA_PASSKEY || '').trim();
    const latestConsumerKey = String(process.env.MPESA_CONSUMER_KEY || '').trim();
    const latestConsumerSecret = String(process.env.MPESA_CONSUMER_SECRET || '').trim();
    const latestEnvironment = String(process.env.MPESA_ENVIRONMENT || this.environment).trim();

    this.shortcode = latestShortcode;
    this.partyB = latestPartyB;
    this.businessCode = String(this.resolveBusinessShortCode(latestTransactionType)).trim();
    this.passkey = latestPasskey || this.passkey;
    this.consumerKey = latestConsumerKey || this.consumerKey;
    this.consumerSecret = latestConsumerSecret || this.consumerSecret;
    this.environment = latestEnvironment || this.environment;

    const previousConfiguredType = this.transactionType;
    this.transactionType = latestTransactionType;
    if (!this.runtimeTransactionType || this.runtimeTransactionType === previousConfiguredType) {
      this.runtimeTransactionType = latestTransactionType;
    }

    this.resolvedPartyB = this.resolvePartyB();
  }

  isProperlyConfigured() {
    const hasKeys = Boolean(this.consumerKey && this.consumerSecret);
    const hasBusinessCode = Boolean(this.businessCode);
    const hasPartyB = Boolean(this.resolvedPartyB);
    const hasPasskey = Boolean(this.passkey);

    return hasKeys && hasBusinessCode && hasPartyB && hasPasskey && this.environment === 'production';
  }

  isBuyGoodsTransaction(transactionType = this.transactionType) {
    return String(transactionType || '').toLowerCase() === 'customerbuygoodsonline';
  }

  getAlternateTransactionType(transactionType = this.transactionType) {
    return this.isBuyGoodsTransaction(transactionType)
      ? 'CustomerPayBillOnline'
      : 'CustomerBuyGoodsOnline';
  }

  getActiveTransactionType() {
    return this.runtimeTransactionType || this.transactionType;
  }

  isAgentStoreMismatchDescription(text) {
    return /agent number and store number entered do not match/i.test(String(text || ''));
  }

  resolvePartyB(transactionType = this.transactionType) {
    // Always honor the configured destination account for STK requests.
    return this.partyB || this.shortcode;
  }

  resolveBusinessShortCode(transactionType = this.transactionType) {
    // Daraja STK password/signature is tied to the shortcode + passkey pair.
    // Keep BusinessShortCode anchored to shortcode to avoid prompt failures.
    return this.shortcode || this.partyB;
  }

  async requestJson(method, path, { headers = {}, body, timeout = 20000 } = {}) {
    const url = new URL(`${this.getBaseUrl()}${path}`);

    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      let settled = false;
      const request = https.request(
        url,
        {
          method,
          agent: this.httpsAgent,
          family: 4,
          headers: {
            Accept: 'application/json',
            ...headers,
            ...(payload
              ? {
                  'Content-Type': 'application/json',
                  'Content-Length': Buffer.byteLength(payload),
                }
              : {}),
          },
        },
        (response) => {
          let raw = '';

          response.on('data', (chunk) => {
            raw += chunk;
          });

          response.on('end', () => {
            if (settled) {
              return;
            }

            settled = true;
            clearTimeout(absoluteTimeout);
            let data = raw;

            try {
              data = raw ? JSON.parse(raw) : {};
            } catch {
              data = raw;
            }

            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve(data);
              return;
            }

            reject({
              response: {
                status: response.statusCode,
                data,
              },
              message: typeof data === 'string' ? data : data?.errorMessage || data?.ResponseDescription || `Request failed with status ${response.statusCode}`,
            });
          });
        }
      );

      const absoluteTimeout = setTimeout(() => {
        if (settled) {
          return;
        }

        const timeoutError = Object.assign(new Error(`timeout of ${timeout}ms exceeded`), {
          code: 'ECONNABORTED',
        });

        settled = true;
        request.destroy(timeoutError);
        reject(timeoutError);
      }, timeout);

      request.on('error', (error) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(absoluteTimeout);
        reject(error);
      });

      if (payload) {
        request.write(payload);
      }

      request.end();
    });
  }

  getBaseUrl() {
    return 'https://api.safaricom.co.ke';
  }

  normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.startsWith('254') && digits.length === 12) {
      return digits;
    }

    if (digits.startsWith('0') && digits.length === 10) {
      return `254${digits.slice(1)}`;
    }

    if (digits.length === 9 && digits.startsWith('7')) {
      return `254${digits}`;
    }

    return digits;
  }

  async getAccessToken() {
    if (this.cachedAccessToken && Date.now() < this.cachedAccessTokenExpiresAt) {
      return this.cachedAccessToken;
    }

    const auth = Buffer.from(
      `${this.consumerKey}:${this.consumerSecret}`
    ).toString('base64');

    let lastError;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await this.requestJson(
          'GET',
          '/oauth/v1/generate?grant_type=client_credentials',
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
            timeout: 8000,
          }
        );

        const expiresInMs = Math.max((parseInt(response.expires_in, 10) || 0) - 60, 60) * 1000;
        this.cachedAccessToken = response.access_token;
        this.cachedAccessTokenExpiresAt = Date.now() + expiresInMs;

        return response.access_token;
      } catch (error) {
        lastError = error;
        const apiData = error.response?.data;
        const statusCode = error.response?.status;

        console.error('[M-Pesa OAuth] Failed to get access token');
        console.error('[M-Pesa OAuth] Attempt:', attempt);
        console.error('[M-Pesa OAuth] Environment:', this.environment);
        console.error('[M-Pesa OAuth] Status:', statusCode || 'no-response');
        console.error('[M-Pesa OAuth] Code:', error.code || 'n/a');
        console.error('[M-Pesa OAuth] Message:', error.message);
        if (apiData) {
          console.error('[M-Pesa OAuth] API error:', apiData);
        }

        if (statusCode === 401 || statusCode === 403 || statusCode === 400) {
          throw new Error('M-Pesa OAuth rejected credentials. Confirm Consumer Key/Secret and environment.');
        }

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          continue;
        }
      }
    }

    if (lastError?.code === 'ECONNABORTED' || !lastError?.response) {
      throw new Error(
        'Temporary connection issue while reaching Safaricom OAuth. Please try again in a moment.'
      );
    }

    throw new Error('Failed to authenticate with M-Pesa');
  }

  shouldRetryStkError(error) {
    const statusCode = error.response?.status;
    const apiErrorCode = String(error.response?.data?.errorCode || '');
    const networkCodes = ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'];

    // Permanent merchant/config errors should fail immediately.
    if (apiErrorCode === '500.001.1001' || statusCode === 400 || statusCode === 401 || statusCode === 403) {
      return false;
    }

    if (networkCodes.includes(error.code)) {
      return true;
    }

    return !statusCode || statusCode >= 500;
  }

  async executeStkPush(accessToken, payload) {
    return this.requestJson('POST', '/mpesa/stkpush/v1/processrequest', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload,
      timeout: 20000,
    });
  }

  async initiateStkPush(phone, amount) {
    try {
      this.refreshRuntimeConfig();
      const normalizedPhone = this.normalizePhone(phone);

      if (this.environment !== 'production') {
        throw new Error('M-Pesa is configured for production only. Set MPESA_ENVIRONMENT=production.');
      }

      console.log(`[M-Pesa STK] Initiating STK push for ${normalizedPhone} (${this.environment})`);

      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);

      const callbackUrl = String(process.env.MPESA_CALLBACK_URL || '').trim();

      if (!callbackUrl) {
        throw new Error('MPESA_CALLBACK_URL is required in production.');
      }

      if (this.environment === 'production') {
        let callbackHost;
        let callbackProtocol;
        try {
          const parsedCallbackUrl = new URL(callbackUrl);
          callbackHost = parsedCallbackUrl.hostname;
          callbackProtocol = parsedCallbackUrl.protocol;
        } catch {
          throw new Error('MPESA_CALLBACK_URL must be a valid HTTPS URL in production.');
        }

        if (
          callbackProtocol !== 'https:' ||
          callbackHost === 'localhost' ||
          callbackHost === '127.0.0.1'
        ) {
          throw new Error('MPESA_CALLBACK_URL must be HTTPS and publicly reachable in production.');
        }
      }

      const activeTransactionType = this.getActiveTransactionType();
      const activeBusinessCode = this.resolveBusinessShortCode(activeTransactionType);
      const activePartyB = this.resolvePartyB(activeTransactionType);
      const password = Buffer.from(
        `${activeBusinessCode}${this.passkey}${timestamp}`
      ).toString('base64');
      console.log(
        `[M-Pesa STK] Routing config -> SigningShortCode: ${activeBusinessCode}, DestinationPartyB: ${activePartyB}, TransactionType: ${activeTransactionType}`
      );
      const payload = {
        BusinessShortCode: activeBusinessCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: activeTransactionType,
        Amount: amount,
        PartyA: normalizedPhone,
        PartyB: activePartyB,
        PhoneNumber: normalizedPhone,
        CallBackURL: callbackUrl,
        AccountReference: `LoanApp-${Date.now()}`,
        TransactionDesc: 'Loan Processing Fee',
      };

      console.log('[M-Pesa STK] Request payload:', payload);

      let response;
      let lastError;

      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          response = await this.executeStkPush(accessToken, payload);
          break;
        } catch (error) {
          lastError = error;
          const canRetry = attempt < 2 && this.shouldRetryStkError(error);
          console.error(`[M-Pesa STK] Attempt ${attempt} failed:`, error.message);

          if (!canRetry) {
            throw error;
          }

          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      console.log('[M-Pesa STK] Response:', response);

      if (response.ResponseCode !== '0') {
        throw new Error(response.ResponseDescription);
      }

      return {
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        rawResponse: response,
        success: true,
      };
    } catch (error) {
      const apiError = error.response?.data;
      console.error('[M-Pesa STK] ❌ STK FAILED');
      console.error('[M-Pesa STK] Error message:', error.message);
      console.error('[M-Pesa STK] Full API error:', JSON.stringify(apiError, null, 2));
      console.error('[M-Pesa STK] Status code:', error.response?.status);

      // DO NOT HIDE ERRORS - Show them so the user knows what's wrong
      return {
        success: false,
        message:
          (apiError?.errorCode === '500.001.1001'
            ? 'M-Pesa rejected the merchant configuration. Confirm the shortcode, passkey, and transaction type belong to the same live merchant.'
            : null) ||
          apiError?.errorMessage ||
          apiError?.ResponseDescription ||
          (error.code === 'ECONNABORTED'
            ? 'Safaricom STK request timed out before completion. Please try again.'
            : error.message),
        errorCode: apiError?.errorCode,
        fullError: apiError,
      };
    }
  }

  async checkTransactionStatus(checkoutRequestId, attempt = 1) {
    try {
      this.refreshRuntimeConfig();
      if (this.environment !== 'production') {
        throw new Error('M-Pesa is configured for production only. Set MPESA_ENVIRONMENT=production.');
      }

      console.log(`[M-Pesa Status] Attempt ${attempt}: Checking transaction status for ${checkoutRequestId}`);

      const accessToken = await this.getAccessToken();
      const timestamp = new Date()
        .toISOString()
        .replace(/[^0-9]/g, '')
        .slice(0, -3);

      const activeTransactionType = this.getActiveTransactionType();
      const activeBusinessCode = this.resolveBusinessShortCode(activeTransactionType);
      const password = Buffer.from(
        `${activeBusinessCode}${this.passkey}${timestamp}`
      ).toString('base64');

      const payload = {
        BusinessShortCode: activeBusinessCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await this.requestJson(
        'POST',
        '/mpesa/stkpushquery/v1/query',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: payload,
          timeout: 7000,
        }
      );

      console.log('[M-Pesa Status] Response:', JSON.stringify(response));

      const normalizedResultCode = String(response.ResultCode || '');
      const isSuccess = normalizedResultCode === '0';
      const isPending = ['1', '1037', '1019'].includes(String(response.ResultCode || ''));
      const isCancelled = normalizedResultCode === '1032';
      const mismatchDetected = !isSuccess && this.isAgentStoreMismatchDescription(response.ResultDesc);

      if (mismatchDetected) {
        const nextTransactionType = this.getAlternateTransactionType(this.getActiveTransactionType());
        if (nextTransactionType !== this.runtimeTransactionType) {
          this.runtimeTransactionType = nextTransactionType;
          console.warn(
            `[M-Pesa] Detected Agent/Store mismatch. Switching runtime transaction type to ${this.runtimeTransactionType} for subsequent STK attempts.`
          );
        }
      }

      let normalizedStatus = 'failed';
      if (isSuccess) normalizedStatus = 'completed';
      else if (isCancelled) normalizedStatus = 'cancelled';
      else if (isPending) normalizedStatus = 'pending';

      console.log(`[M-Pesa Status] Result: status=${normalizedStatus}, code=${response.ResultCode}, desc=${response.ResultDesc}`);

      return {
        success: isSuccess,
        status: normalizedStatus,
        resultCode: response.ResultCode,
        resultDescription: response.ResultDesc,
        mpesaReference: response.MerchantRequestID,
      };
    } catch (error) {
      console.error(`[M-Pesa Status] Attempt ${attempt} failed:`, error.message);

      if (attempt < 2 && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || !error.response)) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return this.checkTransactionStatus(checkoutRequestId, attempt + 1);
      }

      // Return a pending state when status query fails, to avoid false failures
      // The callback mechanism may still deliver the result
      return {
        success: false,
        status: 'pending',
        resultCode: null,
        resultDescription: error.message,
      };
    }
  }
}

module.exports = new MpesaService();
