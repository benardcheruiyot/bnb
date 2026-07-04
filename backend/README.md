# Backend API - Tala Mkopo Extra

Express.js REST API for loan application management with M-Pesa integration.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Environment Setup](#environment-setup)
- [Development](#development)

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your settings
npm run dev
```

Server runs on `http://localhost:5004`

## 📁 Project Structure

```
src/
├── models/           # Data models
│   ├── User.js      # User model
│   └── Loan.js      # Loan model
├── controllers/     # Route handlers
│   ├── userController.js
│   └── loanController.js
├── routes/          # API routes
│   └── index.js
├── services/        # Business logic
│   ├── mpesaService.js
│   └── loanService.js
├── middleware/      # Middleware
│   ├── auth.js      # JWT auth
│   └── errorHandler.js
├── utils/          # Helper functions
└── server.js       # Express setup
```

## 📡 API Documentation

### Authentication

#### Register/Login User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "phone_number": "0701234567"
}

Response: 
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGc..."
  }
}
```

### User Routes (Protected)

#### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

### Loan Routes

#### Create Loan Application (Protected)
```http
POST /api/loans/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50000,
  "termDays": 30
}

Response:
{
  "success": true,
  "data": {
    "id": "LOAN-1234567890",
    "userId": "...",
    "amount": 50000,
    "status": "pending",
    ...
  }
}
```

#### Get User Loans (Protected)
```http
GET /api/loans
Authorization: Bearer <token>
```

#### Get Loan Details (Protected)
```http
GET /api/loans/:loanId
Authorization: Bearer <token>
```

### Payment Routes

#### Initiate STK Push
```http
POST /api/stk_push
Content-Type: application/json

{
  "phone": "254701234567",
  "amount": 300
}

Response:
{
  "success": true,
  "reference": "ws_CO_DMZ_123456789012"
}
```

#### Check Payment Status
```http
GET /api/check_status?checkoutId=ws_CO_DMZ_123456789012
```

#### M-Pesa Callback
```http
POST /api/mpesa/callback
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "...",
      "ResultCode": 0
    }
  }
}
```

## 🔐 Environment Setup

Create a `.env` file in the `backend` directory (you can copy from `.env.example`):

```env
# Server
NODE_ENV=development
PORT=5004
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/loan_app

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

# M-Pesa Daraja API
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PARTYB=your_buygoods_or_paybill_destination
MPESA_PASSKEY=your_production_passkey
MPESA_ENVIRONMENT=production
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline
MPESA_CALLBACK_URL=https://talaextra.mkopaji.com/api/mpesa/callback

# Loan Settings
LOAN_MIN_AMOUNT=5500
LOAN_MAX_AMOUNT=150000
LOAN_INTEREST_RATE=0.1
PROCESSING_FEE=120
PROCESSING_FEE_MIN=120
PROCESSING_FEE_MAX=3500

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛠️ Development

### Start Development Server
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## 📦 Dependencies

- **express** - Web framework
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **axios** - HTTP client
- **dotenv** - Environment variables
- **helmet** - Security headers
- **morgan** - Request logging
- **express-rate-limit** - Rate limiting
- **joi** - Data validation

## 🔗 M-Pesa Integration

The backend integrates with M-Pesa Daraja API for payment processing:

1. **Access Token** - Generated for each API request
2. **STK Push** - Prompts user for M-Pesa PIN
3. **Status Check** - Polls for payment confirmation
4. **Callback** - Receives M-Pesa callback notifications

### M-Pesa Credentials

- Use production Consumer Key/Secret from Safaricom Daraja.
- Use the shortcode/passkey tied to your live business setup.
- Ensure `MPESA_TRANSACTION_TYPE` matches your business type.

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use managed database (MongoDB Atlas, AWS RDS, etc.)
3. Configure real M-Pesa credentials
4. Set strong JWT_SECRET
5. Enable HTTPS
6. Set up error tracking (Sentry, etc.)
7. Configure logging system
8. Set up CI/CD pipeline
9. Configure monitoring and alerts

## 📝 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS configured
- Rate limiting
- Security headers (Helmet)
- Input validation
- Error details not exposed in production

## 📞 Support

For issues, check the main README or create an issue on the repository.
