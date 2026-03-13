// upload.js - FINAL and QUOTED version

const { execSync } = require('child_process');

// --- IMPORTANT: REPLACE THESE VALUES ---
const SUBSCRIPTION_ID = '5795';
const NETWORK = 'sepolia';
const PRIVATE_KEY = '4412a759d8c3f5a3b79bfc511d495ea5f0585613dabbbe1a3bd67da2f5d1d441'; // ⚠️ USE YOUR NEW KEY!
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

// --- DIRECT EXECUTION PATH FIX ---
// Use double backslashes for JS strings in Windows paths
// Note: We use process.env.APPDATA for Windows global node_modules path
const CLI_EXECUTABLE_PATH = `${process.env.APPDATA}\\npm\\node_modules\\@chainlink\\functions-toolkit\\dist\\cli.js`;

// FIX: Wrap the executable path in double quotes ("...") so the space in the username is handled correctly.
const command = [
  'node', // Use Node executable directly
  `"${CLI_EXECUTABLE_PATH}"`, // <--- THIS IS THE FIX: PATH WRAPPED IN QUOTES
  'secrets', 
  'upload',
  `--subscription-id ${SUBSCRIPTION_ID}`,
  `--env-file .env.enc`,
  `--network ${NETWORK}`,
  `--private-key ${PRIVATE_KEY}`,
  `--rpc-url ${RPC_URL}`
].join(' '); 

console.log("Running direct Node execution path (Quoted Path Fix)...");
console.log("---------------------------------------");
console.log(`Executing: ${command}`);

try {
  // Execute the command in the shell
  const output = execSync(command, { encoding: 'utf-8', stdio: 'inherit' });
  console.log("---------------------------------------");
  console.log("✅ Upload successful! Encrypted Secrets Reference should be visible above.");
} catch (error) {
  console.error("---------------------------------------");
  console.error("❌ Upload failed. Please check the RPC URL, Private Key validity, and the Encryption Password (which it will ask for next).");
  console.error("Original Error:", error.message);
  process.exit(1);
}