const { SecretsManager } = require("@chainlink/functions-toolkit");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");

// Configuration
const SUBSCRIPTION_ID = 5795;
const NETWORK = "sepolia";
const PRIVATE_KEY = "4412a759d8c3f5a3b79bfc511d495ea5f0585613dabbbe1a3bd67da2f5d1d441";
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

// Router addresses for different networks
const routerAddresses = {
  sepolia: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
  ethereum: "0x65Dcc24F8ff9e51F10DCc7Ed1e4e2A61e6E14bd6",
  polygon: "0xdc2AAF042Aeff2E68B3e8E33F19e4B9fA7C73F10",
  avalanche: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0"
};

// Parse .env file into key-value pairs
function parseEnvFile(filepath) {
  const envContent = fs.readFileSync(filepath, "utf8");
  const secrets = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) return;
    
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      secrets[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return secrets;
}

async function uploadSecrets() {
  try {
    console.log("🔐 Starting Chainlink Functions Secrets Upload...\n");

    // Check if .env file exists
    const envPath = path.join(__dirname, ".env");
    if (!fs.existsSync(envPath)) {
      console.error("❌ Error: .env file not found!");
      console.log("\n📝 Please create a .env file with your secrets.");
      process.exit(1);
    }

    // Read and parse secrets from .env
    console.log("📖 Reading secrets from .env...");
    const secrets = parseEnvFile(envPath);
    
    if (Object.keys(secrets).length === 0) {
      console.error("❌ Error: No secrets found in .env file!");
      process.exit(1);
    }
    
    console.log("✅ Found secrets:", Object.keys(secrets).join(', '));

    // Create provider and signer
    console.log("\n🔌 Connecting to network:", NETWORK);
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const signer = wallet.connect(provider);

    // Get router address
    const routerAddress = routerAddresses[NETWORK.toLowerCase()];
    if (!routerAddress) {
      throw new Error(`Unknown network: ${NETWORK}`);
    }

    console.log("📡 Router Address:", routerAddress);
    console.log("👤 Wallet Address:", wallet.address);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log("💰 Wallet Balance:", ethers.utils.formatEther(balance), "ETH");
    
    if (balance.eq(0)) {
      console.warn("\n⚠️  WARNING: Wallet has 0 balance! You may need testnet ETH.");
    }

    // Initialize Secrets Manager
    console.log("\n🔧 Initializing Secrets Manager...");
    // Sepolia DON ID (as of 2024)
    const donId = "fun-ethereum-sepolia-1";
    console.log("🆔 DON ID:", donId);
    
    const secretsManager = new SecretsManager({
      signer: signer,
      functionsRouterAddress: routerAddress,
      donId: donId
    });

    await secretsManager.initialize();
    console.log("✅ Secrets Manager initialized");
    
    // Sepolia DON Gateway URLs (as of 2024)
    const sepoliaGatewayUrls = [
      "https://01.functions-gateway.testnet.chain.link/",
      "https://02.functions-gateway.testnet.chain.link/"
    ];
    
    // Use fetched gateway URLs or fallback to manual URLs
    if (!secretsManager.gatewayUrls || secretsManager.gatewayUrls.length === 0) {
      secretsManager.gatewayUrls = sepoliaGatewayUrls;
      console.log("📡 Using manual DON Gateway URLs:", sepoliaGatewayUrls.join(', '));
    } else {
      console.log("📡 Using fetched DON Gateway URLs:", secretsManager.gatewayUrls.slice(0, 2).join(', '), '...');
    }

    // Encrypt secrets
    console.log("\n🔒 Encrypting secrets...");
    const encryptedSecretsObj = await secretsManager.encryptSecrets(secrets);
    console.log("✅ Secrets encrypted");

    console.log("\n🚀 Uploading secrets to DON...");
    console.log("⏳ This may take a few moments...");
    
    // Upload secrets
    const uploadResult = await secretsManager.uploadEncryptedSecretsToDON({
      encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
      gatewayUrls: secretsManager.gatewayUrls,
      slotId: 0,
      minutesUntilExpiration: 15,
    });

    if (!uploadResult.success) {
      throw new Error("Upload failed: " + uploadResult.message);
    }

    console.log("\n✅ ✅ ✅ Secrets uploaded successfully! ✅ ✅ ✅");
    console.log("\n📋 SAVE THIS ENCRYPTED SECRETS REFERENCE:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("0x" + uploadResult.version.toString(16).padStart(16, '0'));
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n💡 Use this reference in your Chainlink Functions request!");
    console.log(`📅 Expires in 15 minutes from now`);

    return uploadResult;

  } catch (error) {
    console.error("\n❌ Upload failed:");
    console.error(error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.error("\n💡 TIP: Your wallet needs testnet ETH. Get some from:");
      console.error("   https://faucets.chain.link/sepolia");
    }
    
    if (error.message.includes("subscription")) {
      console.error("\n💡 TIP: Check your subscription ID and make sure your wallet is authorized.");
    }
    
    if (error.code === 'NETWORK_ERROR') {
      console.error("\n💡 TIP: Check your internet connection and RPC URL.");
    }
    
    process.exit(1);
  }
}

// Run the upload
uploadSecrets();

