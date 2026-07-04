# Frontend - Tala Mkopo Extra

React-based frontend application for loan management and application.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Pages & Components](#pages--components)
- [State Management](#state-management)
- [Development](#development)

## 🚀 Quick Start

```bash
npm install
npm start
```

App runs on `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/       # Reusable components
│   ├── Header.js
│   ├── Header.css
│   ├── Footer.js
│   ├── Footer.css
│   └── ProtectedRoute.js
├── pages/           # Page components
│   ├── Home.js      # Landing page
│   ├── Home.css
│   ├── Eligibility.js    # Registration
│   ├── Eligibility.css
│   ├── Loan.js      # Loan application
│   ├── Loan.css
│   ├── Dashboard.js # User dashboard
│   └── Dashboard.css
├── services/        # API client
│   └── api.js
├── context/         # State management
│   └── AuthContext.js
├── hooks/          # Custom hooks
│   └── useAuth.js
├── utils/          # Helper functions
│   └── helpers.js
├── styles/         # Global styles
│   └── globals.css
├── App.js         # Main app component
└── index.js       # Entry point
public/
└── index.html
```

## 📄 Pages & Components

### Pages

1. **Home** (`/`)
   - Landing page
   - Feature showcase
   - CTA buttons

2. **Eligibility** (`/eligibility`)
   - User registration
   - Phone number collection
   - Eligibility check

3. **Loan** (`/loan`)
   - Select loan amount
   - View loan summary
   - M-Pesa payment integration

4. **Dashboard** (`/dashboard`)
   - User profile
   - Loan history
   - Apply new loan button

### Components

- **Header** - Navigation and branding
- **Footer** - Copyright and links
- **ProtectedRoute** - Route protection for authenticated users

## 🔄 State Management

Uses React Context API with `AuthContext`:

```javascript
const { user, loading, login, logout } = useAuth();
```

### Auth Context Features
- User data persistence (localStorage)
- Login/Logout functionality
- Token management
- Loading states

## 📡 API Integration

API client in `services/api.js` handles:

```javascript
// Auth
authService.registerOrLogin(name, phone)
authService.getProfile()
authService.updateProfile(data)
authService.logout()

// Loans
loanService.createApplication(amount, termDays)
loanService.getUserLoans()
loanService.getLoanDetails(id)
loanService.initiateStkPush(phone, amount)
loanService.checkPaymentStatus(checkoutId)
```

## 🎨 Styling

- **CSS Modules** approach with global styles
- **CSS Variables** for theming
- **Mobile-first** responsive design
- **Flexbox & Grid** for layouts

### Color Scheme
- Primary: `#26c2a3` (Teal)
- Secondary: `#f39c12` (Orange)
- Accent: `#ff9f1c` (Amber)

## 🛠️ Development

### Start Dev Server
```bash
npm start
```

### Build for Production
```bash
npm build
```

### Run Tests
```bash
npm test
```

### Environment Variables

Create `.env` file:

```env
REACT_APP_API_URL=http://localhost:5004/api
```

## 📦 Dependencies

- **react** - UI library
- **react-dom** - DOM rendering
- **react-router-dom** - Routing
- **axios** - HTTP client
- **sweetalert2** - Alert dialogs
- **lucide-react** - Icons

## 🔐 Authentication Flow

1. User enters phone number on Eligibility page
2. Backend registers/logs in user and returns JWT token
3. Token stored in localStorage
4. Token sent with all protected API requests
5. Protected routes check for token and user

## 💻 Component Lifecycle

### Home Page
```
Home
├── Header
├── Hero Section
├── Features
└── Footer
```

### Eligibility Page
```
Eligibility
├── Header
├── RegistrationForm
├── Requirements
├── BenefitsCard
└── Footer
```

### Loan Page
```
Loan
├── Header
├── LoanGrid (5 options)
├── LoanSummary (conditional)
├── ApplyButton
├── InfoBox
└── Footer
```

### Dashboard Page
```
Dashboard
├── Header
├── WelcomeCard
├── AccountInfo
├── QuickStats
├── LoansList
└── Footer
```

## 🚀 Production Build

```bash
npm run build
```

Optimized build created in `build/` directory

### Deployment Options

1. **InterServer**
- Upload the `build/` directory contents to your InterServer web root (for example `public_html`).
- Point your domain to the hosting account and ensure your backend API URL is set in `.env`.

2. **Netlify**
```bash
netlify deploy --prod --dir=build
```

3. **AWS S3 + CloudFront**
```bash
aws s3 sync build/ s3://your-bucket/
```

## 🔗 API Endpoints (from Frontend)

All requests go to `REACT_APP_API_URL`

```
POST   /auth/register
GET    /user/profile
PUT    /user/profile
POST   /loans/apply
GET    /loans
GET    /loans/:loanId
POST   /stk_push
GET    /check_status
POST   /mpesa/callback
```

## 📱 Responsive Design

- Mobile (< 480px)
- Tablet (480px - 768px)
- Desktop (> 768px)

## 🔒 Security

- JWT tokens stored in localStorage
- Token sent in Authorization header
- Protected routes require authentication
- HTTPS enforced in production
- No sensitive data in localStorage (only token)

## 🐛 Debugging

### localStorage Inspection
```javascript
// Check stored data
console.log(localStorage.getItem('token'))
console.log(localStorage.getItem('user'))
```

### API Requests
All API calls can be inspected in browser DevTools > Network tab

### React DevTools
Use React DevTools browser extension for component inspection

## 📝 Code Style

- **Functional Components** with Hooks
- **ES6+ Syntax**
- **Font** - Poppins (Google Fonts)
- **Units** - rem (for scalability)

## 🚀 Optimization Tips

1. Use React.memo() for expensive components
2. Implement lazy loading with React.lazy()
3. Optimize images
4. Code splitting with React Router
5. Service Workers for caching

## 📞 Support

For issues, refer to the main README or contact support.
