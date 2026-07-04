// Routes
const express = require('express');
const userController = require('../controllers/userController');
const loanController = require('../controllers/loanController');
const { protect } = require('../middleware/auth');
const pushService = require('../services/pushService');

const router = express.Router();
const appName = process.env.APP_NAME || 'Loan App';
const appUrl = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

// Public routes
router.post('/auth/register', userController.registerOrLogin);

// Protected routes
router.get('/user/profile', protect, userController.getProfile);
router.put('/user/profile', protect, userController.updateProfile);

// Loan routes
router.post('/loans/apply', protect, loanController.createApplication);
router.get('/loans', protect, loanController.getUserLoans);
router.get('/loans/last', protect, loanController.getLastTransaction);
router.get('/loans/:loanId', protect, loanController.getLoan);

// Payment routes
router.post('/stk_push', protect, loanController.initiateStkPush);
router.get('/check_status', protect, loanController.checkPaymentStatus);
router.post('/mpesa/callback', loanController.handleMpesaCallback);

// Web Push routes
router.get('/push/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/push/subscribe', protect, (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }
  pushService.saveSubscription(req.user.id, subscription);
  res.status(201).json({ message: 'Subscribed' });
});

router.post('/push/unsubscribe', protect, (req, res) => {
  pushService.removeSubscription(req.user.id);
  res.json({ message: 'Unsubscribed' });
});

// Trigger a push notification to the currently logged-in user's device
router.post('/push/trigger', protect, async (req, res) => {
  const { title, body } = req.body;
  const sent = await pushService.sendToUser(req.user.id, {
    title: title || appName,
    body: body || 'Your loan application is waiting — tap to continue!',
    icon: '/favicon.ico',
    url: appUrl,
  });
  if (sent === 'not_subscribed') {
    return res.status(404).json({ error: 'No active subscription for this user' });
  }
  res.json({ message: sent ? 'Notification sent' : 'Failed to send notification' });
});

module.exports = router;
