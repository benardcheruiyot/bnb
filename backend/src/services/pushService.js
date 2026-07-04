const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// In-memory subscription store (keyed by userId)
const subscriptions = new Map();
const appName = process.env.APP_NAME || 'Loan App';
const appUrl = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
const subscriptionsFilePath = path.resolve(__dirname, '../../data/push-subscriptions.json');
let pushEnabled = false;

function ensureSubscriptionsStorePath() {
  const dir = path.dirname(subscriptionsFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function persistSubscriptions() {
  try {
    ensureSubscriptionsStorePath();
    const payload = JSON.stringify(Object.fromEntries(subscriptions), null, 2);
    fs.writeFileSync(subscriptionsFilePath, payload, 'utf8');
  } catch (error) {
    console.error('[Push] Failed to persist subscriptions:', error.message);
  }
}

function loadSubscriptions() {
  try {
    ensureSubscriptionsStorePath();
    if (!fs.existsSync(subscriptionsFilePath)) {
      return;
    }

    const raw = fs.readFileSync(subscriptionsFilePath, 'utf8');
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw);
    const entries = Object.entries(parsed || {});
    for (const [userId, subscription] of entries) {
      if (subscription && subscription.endpoint) {
        subscriptions.set(String(userId), subscription);
      }
    }

    console.log(`[Push] Restored ${subscriptions.size} subscription(s) from disk.`);
  } catch (error) {
    console.error('[Push] Failed to load subscriptions:', error.message);
  }
}

function configure() {
  const publicKey = String(process.env.VAPID_PUBLIC_KEY || '').trim();
  const privateKey = String(process.env.VAPID_PRIVATE_KEY || '').trim();

  if (!publicKey || !privateKey) {
    pushEnabled = false;
    console.warn('[Push] VAPID keys are missing. Push notifications are disabled.');
    return false;
  }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:admin@talaextra.mkopaji.com',
      publicKey,
      privateKey
    );
  } catch (error) {
    pushEnabled = false;
    console.warn(`[Push] Invalid VAPID configuration. Push notifications are disabled. ${error.message}`);
    return false;
  }

  loadSubscriptions();
  pushEnabled = true;
  return true;
}

function isEnabled() {
  return pushEnabled;
}

function saveSubscription(userId, subscription) {
  subscriptions.set(String(userId), subscription);
  persistSubscriptions();
}

function removeSubscription(userId) {
  subscriptions.delete(String(userId));
  persistSubscriptions();
}

async function sendNotification(subscription, payload) {
  if (!pushEnabled) {
    return false;
  }

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    // 410 Gone = subscription expired/unsubscribed
    if (err.statusCode === 410) {
      return 'gone';
    }
    console.error('Push send error:', err.message);
    return false;
  }
}

async function sendToUser(userId, payload) {
  if (!pushEnabled) return false;

  const sub = subscriptions.get(String(userId));
  if (!sub) return 'not_subscribed';
  const result = await sendNotification(sub, payload);
  if (result === 'gone') {
    subscriptions.delete(String(userId));
    persistSubscriptions();
  }
  return result;
}

const HOURLY_MESSAGES = [
  { title: 'Tala Mkopo', body: 'Need quick cash? Apply for a loan in minutes — no paperwork needed!' },
  { title: 'Tala Mkopo 💰', body: 'Your next loan is one tap away. Fast approval, flexible repayment.' },
  { title: 'Loan Ready for You', body: 'Get up to KES 100,000 today. Apply now and receive funds instantly.' },
  { title: 'Tala Mkopo Reminder', body: 'Don\'t let money hold you back. Apply for your loan right now.' },
  { title: 'Quick Cash Available', body: 'Low processing fee, high loan amounts. Start your application today!' },
  { title: 'Tala Mkopo', body: 'Pay school fees, rent, or bills — get a loan in under 5 minutes.' },
  { title: 'Funds When You Need Them', body: 'Emergency cash? Tala Mkopo has you covered. Apply now.' },
  { title: 'Tala Mkopo 🏦', body: 'Top up your business, pay bills, or cover emergencies. Loans start at KES 5,500.' },
  { title: 'Apply for a Loan Today', body: 'Repay in 30, 60, or 90 days — terms that work for you.' },
  { title: 'Tala Mkopo', body: 'Still thinking about it? Your loan application takes less than 2 minutes.' },
  { title: 'Money in Minutes', body: 'M-Pesa directly to your phone. Fast, safe, and affordable.' },
  { title: 'Tala Mkopo Reminder', body: 'Thousands of Kenyans trust Tala Mkopo. Join them — apply now.' },
  { title: 'Tala Mkopo 🔔', body: 'Morning or night — we\'re always open. Apply for your loan anytime.' },
  { title: 'Got Bills to Pay?', body: 'Cover your expenses with a Tala Mkopo loan. Quick and hassle-free.' },
  { title: 'Tala Mkopo', body: 'Your financial solution is here. Apply for a loan and get funded today.' },
  { title: 'Don\'t Wait — Apply Now', body: 'Loan applications are open 24/7. Get your cash before you need it.' },
  { title: 'Tala Mkopo 💡', body: 'Smart borrowing, flexible repayment. Apply for a loan with Tala Mkopo.' },
  { title: 'Tala Mkopo', body: 'We believe in you. Get the funds you need to move forward — apply now.' },
  { title: 'Instant Loan Offer', body: 'Qualify for up to KES 100,000. Check your eligibility and apply today.' },
  { title: 'Tala Mkopo Reminder', body: 'Turn your plans into action. A loan from Tala Mkopo can make it happen.' },
  { title: 'Tala Mkopo 🌟', body: 'No long queues, no paperwork. Just fast cash via M-Pesa.' },
  { title: 'Tala Mkopo', body: 'Your future doesn\'t have to wait. Apply for a loan and take charge today.' },
  { title: 'Need Extra Cash?', body: 'Tala Mkopo loans are affordable and fast. Apply in under 2 minutes.' },
  { title: 'Tala Mkopo', body: 'Pay less in fees, get more in funds. Apply for your loan right now.' },
];

let hourlyMessageIndex = 0;

function getNextHourlyMessage() {
  const msg = HOURLY_MESSAGES[hourlyMessageIndex % HOURLY_MESSAGES.length];
  hourlyMessageIndex++;
  return msg;
}

async function broadcastHourlyReminder() {
  if (!pushEnabled) return;
  if (subscriptions.size === 0) return;

  const { title, body } = getNextHourlyMessage();
  const payload = {
    title: title.replace('Tala Mkopo', appName),
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    url: appUrl,
  };

  const stale = [];
  for (const [userId, sub] of subscriptions.entries()) {
    const result = await sendNotification(sub, payload);
    if (result === 'gone') stale.push(userId);
  }
  if (stale.length > 0) {
    stale.forEach((id) => subscriptions.delete(id));
    persistSubscriptions();
  }
}

module.exports = { configure, isEnabled, saveSubscription, removeSubscription, sendToUser, broadcastHourlyReminder };
