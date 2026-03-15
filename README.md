# TrustLynk - AI-Powered Insurance Platform on Stellar Blockchain

<div align="center">

![TrustLynk Logo](https://img.shields.io/badge/TrustLynk-Insurance_Platform-orange?style=for-the-badge)
![Stellar](https://img.shields.io/badge/Stellar-Blockchain-blue?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Powered-green?style=for-the-badge)

**Transform insurance claims processing with AI, blockchain, and instant UPI payouts**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

TrustLynk is a revolutionary decentralized insurance platform that combines the power of Stellar blockchain, artificial intelligence, and India's ABDM (Ayushman Bharat Digital Mission) to create a seamless, transparent, and lightning-fast insurance experience.

### Key Highlights

- ⚡ **3-Minute Claims**: Process claims in minutes, not weeks
- 🤖 **AI-Powered**: Gemini AI for fraud detection and claim validation
- 🔗 **Blockchain Secured**: Stellar smart contracts ensure transparency
- 💳 **Instant Payouts**: Direct UPI transfers upon approval
- 🏥 **ABDM Integration**: Automatic health record verification
- 🛡️ **Fraud Prevention**: Advanced anomaly detection

---

## 🎯 Features

### For Policyholders

- **Quick Policy Purchase**: Buy insurance policies with wallet integration
- **Instant Claim Filing**: Submit claims with document upload
- **Real-Time Tracking**: Monitor claim status with blockchain verification
- **ABHA Integration**: Automatic medical record fetching
- **Secure Payments**: Receive payouts directly via UPI
- **Transaction History**: Complete audit trail on blockchain

### For Insurance Providers

- **Policy Management**: Create and manage insurance policies
- **AI Claim Analysis**: Automated fraud detection and validation
- **Payment Processing**: Integrated payout management
- **Analytics Dashboard**: Real-time insights and metrics
- **Team Management**: Role-based access control
- **Compliance Tools**: Automated regulatory reporting

### Technical Features

- **Smart Contracts**: Move language on Stellar blockchain
- **AI Services**: Gemini AI for intelligent analysis
- **ABDM API**: Health records integration
- **Wallet Support**: Petra Wallet connectivity
- **RESTful API**: Comprehensive backend services
- **Responsive UI**: Modern React/Next.js interface

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │Dashboard │  │  Claims  │  │  Policy Management │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │
┌───────────────────┴─────────────────────────────────────┐
│              Backend API (Node.js/Express)              │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │
│  │   Auth   │  │  Claims  │  │      Payments      │   │
│  └──────────┘  └──────────┘  └────────────────────┘   │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
┌───────▼──────┐ ┌──▼────┐ ┌───▼─────────┐
│   Stellar      │ │Gemini │ │   ABDM      │
│  Blockchain  │ │  AI   │ │  Service    │
└──────────────┘ └───────┘ └─────────────┘
```

### Technology Stack

**Frontend**
- Next.js 15 (React 19)
- TypeScript
- Tailwind CSS
- shadcn/ui Components
- Petra Wallet Adapter

**Backend**
- Node.js & Express
- JWT Authentication
- Multer (File Uploads)
- RESTful API Design

**Blockchain**
- Stellar Blockchain
- Move Smart Contracts
- Petra Wallet Integration

**AI & External Services**
- Gemini AI (Claim Analysis)
- ABDM API (Health Records)
- Cashfree (UPI Payments)

**Python Services**
- Flask (ABDM Mock Service)
- Health Records API

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- Stellar CLI
- Petra Wallet Extension

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/trustlynk.git
cd trustlynk
```

### 2. Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5001`

### 3. ABDM Service Setup

```bash
cd ABDM
pip install -r requirements.txt

# Start ABDM service
python app.py
```

ABDM service will run on `http://localhost:5000`

### 4. Smart Contract Deployment

```bash
cd contracts

# For Unix/Linux/Mac
chmod +x deploy.sh
./deploy.sh

# For Windows
deploy.bat
```

Note the deployed contract address and update in `frontend/lib/blockchain.ts`

### 5. Frontend Setup

```bash
cd frontend
npm install

# Configure environment
# Add your contract address and API URLs to .env.local

# Start development server
npm run dev
```

Frontend will run on `http://localhost:3000`

---

## 📱 Usage Guide

### For Users

1. **Connect Wallet**
   - Install Petra Wallet
   - Connect your wallet on the homepage
   - Switch to Stellar devnet

2. **Register Account**
   - Navigate to `/auth/register`
   - Complete registration with email and password
   - Link your wallet address

3. **Purchase Policy**
   - Browse available policies
   - Select coverage and duration
   - Complete purchase via blockchain transaction

4. **File a Claim**
   - Go to Dashboard → Claims → New Claim
   - Fill in claim details
   - Upload supporting documents
   - Provide ABHA ID for automatic verification
   - Submit for AI analysis

5. **Track Status**
   - Monitor real-time claim progress
   - Receive notifications on updates
   - View blockchain verification

### For Providers

1. **Admin Access**
   - Login with provider credentials
   - Access provider dashboard

2. **Create Policies**
   - Navigate to Policies → Create
   - Set coverage, premium, duration
   - Publish to blockchain

3. **Review Claims**
   - View all submitted claims
   - Check AI analysis results
   - Approve/reject claims
   - Process payments

4. **Analytics**
   - View claim statistics
   - Monitor fraud detection rates
   - Track payment processing

---

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "fullName": "John Doe",
  "role": "user"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Claims Management

#### Submit Claim
```http
POST /api/claims/submit
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "policyId": "POL1001",
  "claimAmount": 50000,
  "claimType": "health",
  "claimDescription": "Medical treatment for...",
  "incidentDate": "2024-03-15",
  "abdmId": "ABHA1234567890",
  "documents": [file1, file2]
}
```

#### Get User Claims
```http
GET /api/claims/user
Authorization: Bearer {token}
```

### AI Analysis

#### Analyze Claim
```http
POST /api/ai-claims/analyze
Authorization: Bearer {token}
Content-Type: application/json

{
  "claimId": "CLM001",
  "abdmId": "ABHA1234567890",
  "claimAmount": 50000,
  "claimDescription": "...",
  "policyDetails": {...}
}
```

### Policies

#### Get All Policies
```http
GET /api/policies
```

#### Create Policy (Provider Only)
```http
POST /api/policies/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "policyName": "Comprehensive Health Insurance",
  "policyType": "health",
  "coverageAmount": 500000,
  "premium": 12000,
  "duration": 365
}
```

### Payments

#### Process Claim Payment (Provider Only)
```http
POST /api/payments/process-claim
Authorization: Bearer {token}
Content-Type: application/json

{
  "claimId": "CLM001",
  "amount": 50000,
  "beneficiaryName": "John Doe",
  "beneficiaryPhone": "+919876543210",
  "beneficiaryUPI": "john@paytm",
  "transferMode": "upi"
}
```

---

## 🔐 Smart Contract Functions

### Admin Functions

```move
public entry fun initialize(admin: &signer)
public entry fun create_policy(...)
public entry fun register_user(...)
```

### User Functions

```move
public entry fun purchase_policy(...)
public entry fun submit_claim(...)
```

### View Functions

```move
#[view]
public fun get_user_role(...)
#[view]
public fun get_policy(...)
#[view]
public fun get_user_policies(...)
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Contract Tests

```bash
cd contracts
Stellar move test
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## 🌐 Deployment

### Production Deployment

1. **Backend**: Deploy to cloud service (AWS, Azure, GCP)
2. **Frontend**: Deploy to Vercel or Netlify
3. **Smart Contracts**: Deploy to Stellar mainnet
4. **Database**: Set up PostgreSQL for production

### Environment Configuration

Update production environment variables:
- API keys for Gemini AI
- Cashfree production credentials
- Real ABDM API endpoints
- Production database URLs

---

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
PORT=5001
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_key
ABDM_SERVICE_URL=http://localhost:5000
CASHFREE_APP_ID=your_cashfree_id
CASHFREE_SECRET_KEY=your_cashfree_secret
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_Stellar_NETWORK=devnet
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

---

## 📊 Project Structure

```
trustlynk/
├── frontend/                 # Next.js frontend
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   └── context/             # React contexts
├── backend/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middlewares/        # Express middlewares
│   └── server.js           # Entry point
├── contracts/              # Move smart contracts
│   ├── sources/           # Contract source files
│   └── Move.toml          # Package configuration
├── ABDM/                   # Python ABDM service
│   ├── app.py             # Flask application
│   └── requirements.txt   # Python dependencies
└── README.md              # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 👥 Team

- **Project Lead**: [Your Name]
- **Blockchain Development**: [Team Member]
- **AI Integration**: [Team Member]
- **Frontend Development**: [Team Member]

---

## 🙏 Acknowledgments

- Stellar Foundation for blockchain infrastructure
- Google Gemini AI for intelligent analysis
- ABDM for health records integration
- shadcn/ui for beautiful components

---

## 📞 Support

- **Documentation**: [docs.trustlynk.io](https://docs.trustlynk.io)
- **Email**: support@trustlynk.io
- **Discord**: [Join our community](https://discord.gg/trustlynk)
- **Twitter**: [@TrustLynk](https://twitter.com/trustlynk)

---

<div align="center">

**⭐ Star us on GitHub — it helps!**

Made with ❤️ by the TrustLynk Team



$1,000: Best DeFi Application using BitGo

Build a DeFi application that leverages BitGo's wallet infrastructure to bring institutional-grade security to on-chain finance.
Using BitGo's SDK and testnet, you can create multi-sig or MPC wallets, build and sign transactions programmatically, enforce policy rules (spending limits, whitelists, approval workflows), connect to DeFi protocols via WalletConnect, and set up webhooks for real-time notifications. This could be a policy-governed yield strategy that auto-rebalances across lending protocols, a multi-sig treasury manager for DAOs, a staking automation tool, or anything else that combines DeFi composability with BitGo's enterprise-grade controls.
</div>

