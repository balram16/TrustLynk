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

async function uploadSecrets() {
  try {
    console.log("🔐 Starting Chainlink Functions Secrets Upload...\n");

    // Check if .env.enc file exists
    const envEncPath = path.join(__dirname, ".env.enc");
    if (!fs.existsSync(envEncPath)) {
      console.error("❌ Error: .env.enc file not found!");
      console.log("\n📝 Please create a .env.enc file with your encrypted secrets.");
      console.log("   You can create it by:");
      console.log("   1. Add your secrets to .env file");
      console.log("   2. Run: npx @chainlink/env-enc set-pw");
      console.log("   3. Run: npx @chainlink/env-enc encrypt");
      process.exit(1);
    }

    // Read encrypted secrets
    console.log("📖 Reading encrypted secrets from .env.enc...");
    const encryptedSecretsObj = JSON.parse(fs.readFileSync(envEncPath, "utf8"));

    // Create provider and signer
    console.log("🔌 Connecting to network:", NETWORK);
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

    // Initialize Secrets Manager
    const secretsManager = new SecretsManager({
      signer: signer,
      functionsRouterAddress: routerAddress,
      donId: `fun-${NETWORK}-1`
    });

    await secretsManager.initialize();

    console.log("\n🚀 Uploading secrets to DON...");
    
    // Upload secrets
    const encryptedSecretsReference = await secretsManager.uploadEncryptedSecretsToDON({
      encryptedSecretsHexstring: encryptedSecretsObj.encryptedSecrets,
      gatewayUrls: secretsManager.gatewayUrls,
      slotId: 0,
      minutesUntilExpiration: 15,
    });

    console.log("\n✅ Secrets uploaded successfully!");
    console.log("\n📋 Encrypted Secrets Reference (use this in your request):");
    console.log("0x" + encryptedSecretsReference.slice(2));

    return encryptedSecretsReference;

  } catch (error) {
    console.error("\n❌ Upload failed:");
    console.error(error.message);
    if (error.stack) {
      console.error("\n📚 Stack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the upload
uploadSecrets();

