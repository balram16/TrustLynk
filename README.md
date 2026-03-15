# TrustLynk - AI-Powered Insurance Platform on Ethereum

<div align="center">

![TrustLynk Logo](https://img.shields.io/badge/TrustLynk-Insurance_Platform-orange?style=for-the-badge)
![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blue?style=for-the-badge&logo=ethereum)
![AI Powered](https://img.shields.io/badge/AI-Powered_Analysis-green?style=for-the-badge)
![ABDM](https://img.shields.io/badge/ABDM-Health_Records-purple?style=for-the-badge)
![Fileverse](https://img.shields.io/badge/Fileverse-Encrypted_Docs-red?style=for-the-badge)

**Decentralized insurance claims powered by AI fraud detection, ABHA health records, and encrypted document storage on blockchain**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [API](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

TrustLynk is a Web3 insurance platform built on **Ethereum (Sepolia)** that uses AI-driven claim verification, India's ABDM health records, IPFS document storage, and **Fileverse** end-to-end encrypted medical document vaulting.

### Key Highlights

- 🤖 **AI Rule Engine**: Multi-rule claim fraud detection using Gemini AI
- 🔗 **Ethereum Smart Contracts**: Solidity contracts deployed on Sepolia testnet
- 🏥 **ABDM / ABHA Integration**: Automatic health record verification
- 📁 **IPFS Storage**: Decentralized bill/document pinning via Pinata
- 🔒 **Fileverse Encryption**: End-to-end encrypted medical document storage
- 🕵️ **Audit Logs**: Tamper-proof AI analysis logs stored on Fileverse
- 🪙 **NFT Policies**: Insurance policies minted as ERC-721 tokens
- 👛 **MetaMask Support**: Wallet login, policy purchase, claim submission

---

## 🎯 Features

### For Policyholders

- **Connect MetaMask Wallet**: Register as a policyholder on-chain
- **Browse & Buy Policies**: Purchase health/vehicle policies with ETH premium
- **File Claims (Multi-Step)**: ABHA verification → Bill upload → AI analysis → On-chain submit
- **IPFS Bill Storage**: Medical bills stored permanently on IPFS
- **Encrypted Medical Vault**: Documents encrypted via Fileverse (only patient + insurer can read)
- **Claim Status Tracking**: Real-time dashboard with blockchain state

### For Insurance Providers

- **Policy Creation**: Publish new policies to smart contract
- **AI Claim Review**: View AI risk score, red flags, and reasoning
- **Approve / Reject Claims**: Manual override with on-chain transaction
- **Provider Dashboard**: All claim submissions with detailed AI audit trail

### Technical Features

- **Smart Contracts**: Solidity (Ethereum Sepolia) — `InsurancePortal.sol`, `InsuranceViews.sol`
- **AI Service**: Python FastAPI backend with Gemini AI + custom 30-rule engine
- **Encrypted Storage**: Fileverse dDocs local API server for end-to-end encrypted audit logs
- **IPFS**: Pinata Gateway for medical bill upload/read
- **Frontend**: Next.js 15 App Router + MetaMask wallet integration

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ User     │  │ Provider     │  │ Multi-Step Claim Form │  │
│  │Dashboard │  │ Dashboard    │  │ (ABHA → IPFS → AI)   │  │
│  └──────────┘  └──────────────┘  └───────────────────────┘  │
└──────────────────┬───────────────────────────────────────────┘
                   │
       ┌───────────┼──────────────────┐
       │           │                  │
┌──────▼──────┐ ┌─▼──────────┐ ┌────▼──────────┐
│  Ethereum   │ │ Python AI  │ │  Fileverse    │
│  Sepolia    │ │ Backend    │ │  Local Server │
│  (Solidity) │ │ (FastAPI)  │ │  (Port 8001)  │
└─────────────┘ └────────────┘ └───────────────┘
       │               │                │
       │         ┌─────┴─────┐          │
       │         │  Gemini   │          │
       │         │  AI API   │          │
       │         └───────────┘          │
       │                                │
┌──────▼──────┐                 ┌───────▼──────┐
│  IPFS via   │                 │  ddocs.new   │
│  Pinata     │                 │  (Sync)      │
└─────────────┘                 └──────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, TypeScript, shadcn/ui, Tailwind CSS |
| **Wallet** | MetaMask (ethers.js v6) |
| **Smart Contracts** | Solidity, Hardhat, Ethereum Sepolia |
| **AI Backend** | Python FastAPI, Gemini AI, PyMuPDF, 30-rule engine |
| **Document Storage** | IPFS (Pinata), Fileverse dDocs |
| **Health Records** | ABDM / ABHA mock integration |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- MetaMask browser extension
- Sepolia testnet ETH (from faucet)

---

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/trustlynk.git
cd trustlynk
```

---

### 2. AI Backend Setup (Python FastAPI)

```bash
cd api
pip install -r requirements.txt
```

Create `.env` inside `api/`:
```env
GEMINI_API_KEY=your_gemini_api_key
FILEVERSE_API_KEY=your_fileverse_api_key
```

Start the server:
```bash
python index.py
```

AI backend runs at `http://localhost:8000`.  
Use ngrok to expose it publicly:
```bash
ngrok http 8000
```

---

### 3. Fileverse Local Server (Encrypted Document Storage)

```bash
npx @fileverse/api --apiKey YOUR_FILEVERSE_API_KEY
```

Server runs at `http://localhost:8001`.  
Generate your API key at [ddocs.new](https://ddocs.new) → Settings → Developer Mode.

---

### 4. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local` inside `frontend/`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret_key
NEXT_PUBLIC_AI_API_URL=https://your-ngrok-url.ngrok-free.app
NEXT_PUBLIC_FILEVERSE_API_KEY=your_fileverse_api_key
```

Start the dev server:
```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

### 5. Smart Contract Deployment (Optional — already on Sepolia)

```bash
cd contracts/ethereum
npm install

# Copy env
cp .env.example .env
# Fill in PRIVATE_KEY and SEPOLIA_RPC_URL

# Deploy
npx hardhat run scripts/deploy.js --network sepolia
```

Update `NEXT_PUBLIC_CONTRACT_ADDRESS` with the new deployed address.

---

## 📱 Usage Guide

### For Policyholders

1. **Connect Wallet**: Open [localhost:3000](http://localhost:3000) → Connect MetaMask (Sepolia network)
2. **Register**: Register as a policyholder on-chain
3. **Browse Policies**: View available policies from the insurance provider
4. **Buy Policy**: Click "Buy" → confirm MetaMask transaction (sends ETH premium)
5. **File a Claim**:
   - Step 1: Enter ABHA ID → Fetch health records
   - Step 2: Fill claim details (amount, date, hospital)
   - Step 3: Upload hospital bill PDF (stored on IPFS + encrypted on Fileverse)
   - Step 4: AI analysis result → Submit to blockchain

### For Insurance Providers

1. **Register as Provider**: Connect wallet → Register as provider
2. **Create Policy**: Dashboard → Create Policy → Set premium, coverage, type
3. **Review Claims**: All Claims page → View AI score + red flags
4. **Approve/Reject**: Click Approve or Reject → Confirm on MetaMask

---

## 📚 API Documentation

### AI Claim Analysis

```http
POST /verify-claim/
Content-Type: application/json
ngrok-skip-browser-warning: true

{
  "ipfs_hash": "QmXxx...",
  "abha_identifier": "123456789012"
}
```

**Response:**
```json
{
  "aggregate_score": 45,
  "recommendation": "PENDING REVIEW",
  "pre_risk_score": 55,
  "red_flags": ["Identity Warn: Name Mismatch"],
  "reasoning": "...",
  "detailed_analysis_steps": [...],
  "extracted_data_points": {...}
}
```

### Fileverse API (Local Server)

**Create Document (Audit Log / Summary)**
```http
POST http://localhost:8001/api/ddocs?apiKey={YOUR_API_KEY}
Content-Type: application/json

{
  "title": "TrustLynk_Audit_12345_20260315",
  "content": "# AI Audit Log\n- Score: 45\n- Recommendation: PENDING REVIEW"
}
```

**Upload File (Medical Bill)**
```http
POST http://localhost:8001/api/ddocs?apiKey={YOUR_API_KEY}
Content-Type: multipart/form-data

file: <pdf_file>
```

**List Documents**
```http
GET http://localhost:8001/api/ddocs?apiKey={YOUR_API_KEY}&limit=10
```

---

## 🔐 Smart Contract Functions

**InsurancePortal.sol (Sepolia)**

```solidity
// Admin / Provider
function initialize(address admin) external
function createPolicy(PolicyParams calldata params) external
function approveOrRejectClaim(uint256 claimId, bool approve) external

// Policyholder
function registerUser(string calldata role, ...) external
function purchasePolicy(PurchaseParams calldata params) external payable
function claimPolicy(ClaimParams calldata params) external

// View
function getPolicy(uint256 policyId) external view returns (Policy memory)
function getUserClaims(address user) external view returns (Claim[] memory)
function getAllPolicies() external view returns (Policy[] memory)
```

---

## 📊 Project Structure

```
trustlynk/
├── frontend/                    # Next.js 15 frontend
│   ├── app/                    # App Router pages
│   │   ├── dashboard/          # User & Provider dashboards
│   │   └── api/fileverse/      # Next.js proxy for Fileverse
│   ├── components/             # React components
│   │   └── insurance/          # Claim form, policy cards
│   ├── lib/                    # Services
│   │   ├── blockchain.ts       # ethers.js contract calls
│   │   ├── ipfs-service.ts     # Pinata IPFS upload
│   │   ├── oracle-service.ts   # AI backend communication
│   │   ├── fileverse-service.ts # Fileverse encrypted upload
│   │   └── abha-service.ts     # ABDM health record fetch
│   └── context/                # Wallet context
├── api/                        # Python AI backend
│   ├── index.py                # FastAPI app + 30-rule engine
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # API keys (gitignored)
│   └── dummy_abha_database.json # Mock ABHA records
├── contracts/
│   └── ethereum/
│       ├── contracts/
│       │   ├── InsurancePortal.sol
│       │   └── InsuranceViews.sol
│       └── scripts/deploy.js
└── README.md
```

---

## 🌐 Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| **Frontend** | Vercel | `npm run build` → deploy |
| **AI Backend** | Render.com | Python web service, `uvicorn index:app` |
| **Smart Contracts** | Ethereum Sepolia | Already deployed |
| **Fileverse** | Local / self-hosted | Runs alongside backend |

> **Note**: Fileverse local server cannot be hosted on serverless platforms. For production, run it alongside your backend VM on Render / Railway.

---

## 🔧 Environment Variables Reference

**`api/.env`**
```env
GEMINI_API_KEY=...
FILEVERSE_API_KEY=...
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_PINATA_API_KEY=...
NEXT_PUBLIC_PINATA_SECRET_KEY=...
NEXT_PUBLIC_AI_API_URL=https://your-backend.ngrok-free.app
NEXT_PUBLIC_FILEVERSE_API_KEY=...
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Ethereum / Hardhat** for smart contract infrastructure
- **Google Gemini AI** for intelligent claim analysis
- **Fileverse** for end-to-end encrypted document storage
- **Pinata / IPFS** for decentralized file storage
- **ABDM** for health records API
- **shadcn/ui** for beautiful UI components

---

<div align="center">

**⭐ Star us on GitHub — it helps!**

Made with ❤️ by the TrustLynk Team

</div>
