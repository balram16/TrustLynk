# Chainlink Functions Secrets Upload - Setup Guide

## ⚠️ Important: You need to encrypt your secrets first!

### Step 1: Create your .env file

Create a `.env` file in this directory with your secrets (one per line):

```bash
API_KEY=your_api_key_here
SECRET_TOKEN=your_secret_token_here
ANOTHER_SECRET=value_here
```

### Step 2: Encrypt your secrets

You have two options:

#### Option A: Using Docker (Recommended)
```powershell
docker run --rm -it -v "${pwd}:/app" -w /app node:18-alpine sh -c "npm install @chainlink/env-enc && npx @chainlink/env-enc set-pw && npx @chainlink/env-enc encrypt"
```

#### Option B: Using local npm
```powershell
npm install @chainlink/env-enc
npx @chainlink/env-enc set-pw
npx @chainlink/env-enc encrypt
```

This will:
1. Ask you to set a password
2. Create a `.env.enc` file with your encrypted secrets

### Step 3: Upload secrets to Chainlink DON

#### Option A: Using the provided script (Easiest)
```powershell
node upload-secrets.js
```

#### Option B: Using Docker
```powershell
docker run --rm -it -v "${pwd}:/app" -w /app node:18-alpine sh -c "apk add --no-cache python3 make g++ && npm install && node upload-secrets.js"
```

#### Option C: Using the batch file
```powershell
.\run-upload.bat
```

### Step 4: Save the Encrypted Secrets Reference

After successful upload, you'll receive an encrypted secrets reference (hex string starting with 0x).
Save this reference - you'll need it when making Chainlink Functions requests!

## Configuration

All configuration is in `upload-secrets.js`:
- Subscription ID: 5795
- Network: Sepolia
- Private Key: (your key)
- RPC URL: https://ethereum-sepolia-rpc.publicnode.com

## Troubleshooting

### Error: .env.enc file not found
- You need to complete Step 2 first to encrypt your secrets

### Error: Invalid private key
- Check that your private key is correct in `upload-secrets.js`
- Make sure it's a 64-character hex string (without 0x prefix)

### Error: Network connection issues
- Check your internet connection
- Try a different RPC URL if the default one is down

### Error: Subscription not found
- Verify your subscription ID is correct
- Make sure your wallet address owns or is authorized for this subscription

## Security Notes

⚠️ **NEVER commit your private key to version control!**
⚠️ **Keep your .env and .env.enc files secure**
⚠️ **Consider using environment variables for sensitive data**

## What's Next?

After uploading secrets, you can use the encrypted secrets reference in your Chainlink Functions requests:
```javascript
const secretsLocation = 1; // 1 = DON-hosted
const encryptedSecretsReference = "0x..."; // Your reference from upload
```

