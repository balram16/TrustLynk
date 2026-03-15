const { ethers } = require("ethers");

// ⚠️ WARNING: Never share private keys publicly!
const PRIVATE_KEY = process.env.FUNDER_PRIVATE_KEY;
const CONTRACT_ADDRESS = "0x9eAd04CD991004de1E90131a788134daDb310D56";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

// Amount to send (in ETH)
const AMOUNT_TO_SEND = "0.05"; // 0.05 Sepolia ETH

async function fundContract() {
  console.log("🔌 Connecting to Sepolia...");
  
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`💼 Sender wallet: ${wallet.address}`);
  
  const senderBalance = await provider.getBalance(wallet.address);
  console.log(`💰 Sender balance: ${ethers.formatEther(senderBalance)} ETH`);

  const contractBalance = await provider.getBalance(CONTRACT_ADDRESS);
  console.log(`📜 Contract balance BEFORE: ${ethers.formatEther(contractBalance)} ETH`);

  if (senderBalance < ethers.parseEther(AMOUNT_TO_SEND)) {
    console.error("❌ Insufficient balance to send. Get free Sepolia ETH from a faucet first.");
    process.exit(1);
  }

  console.log(`📤 Sending ${AMOUNT_TO_SEND} ETH to contract ${CONTRACT_ADDRESS}...`);

  const tx = await wallet.sendTransaction({
    to: CONTRACT_ADDRESS,
    value: ethers.parseEther(AMOUNT_TO_SEND),
  });

  console.log(`⏳ Tx submitted: ${tx.hash}`);
  console.log(`🔗 Track: https://sepolia.etherscan.io/tx/${tx.hash}`);

  await tx.wait();
  console.log("✅ Transaction confirmed!");

  const newBalance = await provider.getBalance(CONTRACT_ADDRESS);
  console.log(`📜 Contract balance AFTER: ${ethers.formatEther(newBalance)} ETH`);
}

fundContract().catch(console.error);
