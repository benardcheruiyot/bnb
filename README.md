# Full Stack Loan Application

A modern fullstack loan application built with React and Node.js/Express.

## 📋 Project Structure

```
loan-app/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── models/       # Data models (User, Loan)
│   │   ├── controllers/  # Route controllers
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic (M-Pesa, Loan service)
│   │   ├── middleware/   # Auth, error handling
│   │   ├── utils/        # Helper functions
│   │   └── server.js     # Express app setup
│   ├── .env              # Environment variables
│   ├── .env.example      # Example env file
│   └── package.json      # Backend dependencies
│
└── frontend/             # React application
    ├── public/
    │   └── index.html    # HTML entry point
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── services/     # API client
    │   ├── context/      # React context (Auth)
    │   ├── hooks/        # Custom hooks
    │   ├── utils/        # Helper functions
    │   ├── styles/       # CSS files
    │   ├── App.js        # Main app component
    │   └── index.js      # React entry point
    ├── .env              # Environment variables
    ├── .gitignore        # Git ignore
    └── package.json      # Frontend dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your M-Pesa credentials and settings
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```
   Backend will run on `http://localhost:5004`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   echo "REACT_APP_API_URL=http://localhost:5004/api" > .env
   ```

4. **Start development server:**
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## 🔑 Key Features

### Backend
- ✅ Express.js REST API
- ✅ JWT authentication
- ✅ M-Pesa payment integration (Daraja API)
- ✅ User and Loan management
- ✅ Error handling middleware
- ✅ CORS enabled
- ✅ Rate limiting
- ✅ Security headers (Helmet)

### Frontend
- ✅ React with React Router
- ✅ Context API for state management
- ✅ Responsive design
- ✅ Form validation
- ✅ Payment flow with SweetAlert2
- ✅ User authentication
- ✅ Loan dashboard
- ✅ Mobile-first design

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register/Login user
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)

### Loans
- `POST /api/loans/apply` - Create loan application (protected)
- `GET /api/loans` - Get user loans (protected)
- `GET /api/loans/:loanId` - Get loan details (protected)

### Payments (M-Pesa)
- `POST /api/stk_push` - Initiate STK push for payment
- `GET /api/check_status` - Check payment status
- `POST /api/mpesa/callback` - M-Pesa callback handler

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5004
FRONTEND_URL=http://localhost:3000

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_production_key
MPESA_CONSUMER_SECRET=your_production_secret
MPESA_SHORTCODE=your_business_shortcode
MPESA_PARTYB=your_buygoods_or_paybill_destination
MPESA_PASSKEY=your_production_passkey
MPESA_ENVIRONMENT=production
MPESA_TRANSACTION_TYPE=CustomerBuyGoodsOnline

# Loan Settings
LOAN_MIN_AMOUNT=5500
LOAN_MAX_AMOUNT=150000
LOAN_INTEREST_RATE=0.1
PROCESSING_FEE=120
PROCESSING_FEE_MIN=120
PROCESSING_FEE_MAX=3500

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5004/api
```

## 📚 Technologies Used

### Backend
- Express.js
- Node.js
- JWT (jsonwebtoken)
- Bcryptjs
- Axios
- Helmet
- Morgan
- Express Rate Limit

### Frontend
- React 18
- React Router DOM
- Axios
- SweetAlert2
- Lucide React

## 🔄 User Flow

1. **Home Page** - Landing page with feature overview
2. **Eligibility** - User enters phone number
3. **Loan Application** - Select loan amount
4. **Payment** - M-Pesa STK push initiated
5. **Dashboard** - View loan status and history

## 🛠️ Development Scripts

### Backend
```bash
npm run dev        # Start development server with nodemon
npm start          # Start production server
npm test           # Run tests
npm run lint       # Run linter
npm run format     # Format code
```

### Frontend
```bash
npm start          # Start development server
npm build          # Build for production
npm test           # Run tests
```

## 📝 Architecture Decisions

1. **Separation of Concerns** - Frontend and backend in separate folders for modularity
2. **In-Memory Storage** - Demo uses Map for user/loan storage (replace with MongoDB for production)
3. **Context API** - Used for auth state management (scalable to Redux if needed)
4. **RESTful API** - Standard REST endpoints for easy integration
5. **Environment-based Config** - Different settings for dev/prod environments

## 🚀 Deployment

### Backend
- Can be deployed to Heroku, AWS, DigitalOcean, etc.
- Uses environment variables for configuration
- Ensure M-Pesa callback URL is configured

### Frontend
- Can be deployed to InterServer, Netlify, AWS S3 + CloudFront, etc.
- Build with `npm run build`
- Update `REACT_APP_API_URL` for production API endpoint

### CI/CD

- Production deployment is automated via `.github/workflows/deploy-production.yml`.
- Staging deployment is automated via `.github/workflows/deploy-staging.yml`.
- Triggers:
   - Production: push to `main` or manual `workflow_dispatch`
   - Staging: push to `staging` or manual `workflow_dispatch`
- Both workflows run full server recovery using `deploy_and_restart.sh`.

Recommended setup:
- Create two GitHub Environments: `production` and `staging`.
- Store environment-specific secrets/variables in each environment with the same names.
- This keeps staging and production isolated while reusing one workflow structure.

Set these **GitHub Secrets**:
- `VPS_HOST`: Server IP or hostname (example: `153.75.247.188`)
- `VPS_USER`: SSH user (example: `root`)
- `VPS_SSH_KEY`: Private key content for SSH access
- `BACKEND_ENV_FILE`: Full backend `.env` as multiline text
- `FRONTEND_ENV_FILE`: Full frontend `.env` as multiline text

Set these **GitHub Variables** (Repository Variables):
- `APP_DOMAIN`: Production domain (example: `extracash.mkopaji.com`)
- `CERTBOT_EMAIL`: Email for TLS certificate registration
- `DEPLOY_PATH`: Remote app path (example: `/var/www/talaextra-5004`)
- `DEPLOY_BRANCH`: Branch to deploy (default: `main`)
- `DEPLOY_REPO`: Optional explicit Git repo URL (required if auto-detection is not suitable)
- `BACKEND_PORT`: Backend app port (recommended for this clone: `5004`)
- `PM2_APP_NAME`: Unique PM2 process name (example: `talaextra-backend-5004`)

For staging environment, set the same variable names but with staging values (example: `APP_DOMAIN=staging.talaextra.mkopaji.com`, `DEPLOY_BRANCH=staging`, different `DEPLOY_PATH` if needed).

Optional diagnostics workflow:
- Run `.github/workflows/diagnose-production.yml` manually to inspect PM2, Nginx, ports, and health checks on the server.

### One-Command CI/CD Bootstrap

You can auto-configure GitHub Environments, secrets, and variables from your local machine.

Prerequisites:
- GitHub CLI installed (`gh`)
- Authenticated session (`gh auth login`)
- Local env files ready (`backend/.env` and `frontend/.env`)

Run:

```bash
chmod +x scripts/setup_github_environments.sh
./scripts/setup_github_environments.sh \
   --vps-host 153.75.247.188 \
   --vps-user root \
   --ssh-key-file ~/.ssh/id_ed25519 \
   --certbot-email admin@extracash.mkopaji.com \
   --prod-domain extracash.mkopaji.com \
   --staging-domain staging.extracash.mkopaji.com
```

Windows PowerShell:

```powershell
.\scripts\setup_github_environments.ps1 `
   -VpsHost 153.75.247.188 `
   -VpsUser root `
   -SshKeyFile "$env:USERPROFILE\.ssh\id_rsa" `
   -CertbotEmail admin@extracash.mkopaji.com `
   -ProdDomain extracash.mkopaji.com `
   -StagingDomain staging.extracash.mkopaji.com
```

Optional overrides:

```bash
--repo owner/repo
--deploy-repo https://github.com/owner/repo.git
--prod-path /var/www/talaextra-5004
--staging-path /var/www/talaextra-5005
--prod-branch main
--staging-branch staging
--backend-staging-env-file backend/.env.staging
--frontend-staging-env-file frontend/.env.staging
```

## 🆘 Recover From Empty Server

If your server was wiped, use the root deployment script to rebuild it automatically.

### What It Does
- Installs Node.js, PM2, Nginx, Certbot, Git.
- Clones and updates this repository.
- Uploads your local `backend/.env` and `frontend/.env` automatically (if present).
- Rewrites domain-dependent env values (`ALLOWED_ORIGINS`, callback URL, API URL).
- Installs backend/frontend dependencies.
- Builds frontend for production.
- Starts backend with PM2.
- Configures Nginx to serve frontend and proxy `/api` to backend.
- Issues/renews SSL certificate.

### One-Command Recovery

```bash
chmod +x deploy_and_restart.sh
./deploy_and_restart.sh \
   --host root@153.75.247.188 \
   --domain extracash.mkopaji.com \
   --email admin@extracash.mkopaji.com
```

Optional flags:

```bash
--repo https://github.com/<owner>/<repo>.git
--branch main
--project-dir /var/www/talaextra-5004
--skip-env-sync
```

### Verify Domain Recovery

```bash
chmod +x scripts/check_domain_recovery.sh
./scripts/check_domain_recovery.sh extracash.mkopaji.com 153.75.247.188
```

If you want deployment without uploading local env files, add `--skip-env-sync`.

## 🔒 Security Considerations

- ✅ JWT tokens for authentication
- ✅ Bcryptjs for password hashing
- ✅ CORS configured
- ✅ Rate limiting enabled
- ✅ Security headers (Helmet)
- ✅ Input validation
- ✅ Protected routes on frontend

## 📦 Production Checklist

- [ ] Replace in-memory storage with MongoDB/PostgreSQL
- [ ] Configure real M-Pesa credentials
- [ ] Update API URLs
- [ ] Set up SSL/TLS certificates
- [ ] Configure email notifications
- [ ] Set up logging system
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and alerting
- [ ] Configure backups
- [ ] Perform security audit

## 📞 Support

For issues or questions, refer to the individual README files in `backend/` and `frontend/` directories.

## 📄 License

This project is licensed under the ISC License.

## 👥 Contributors

- Your Name
