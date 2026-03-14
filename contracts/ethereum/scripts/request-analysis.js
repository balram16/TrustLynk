const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS; // Set this in your .env
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    return;
  }

  const [signer] = await ethers.getSigners();
  const InsurancePortal = await ethers.getContractAt("InsurancePortal", contractAddress);

  // 1. Read the source code that Chainlink will execute
  const source = fs.readFileSync(
    path.join(__dirname, "functions-request-source.js"),
    "utf8"
  );

  // 2. Define the arguments for the API call
  const abhaId = "123456789012"; // Example ABHA ID
  const ipfsHash = "QmExample..."; // Example IPFS Hash
  let apiUrl = "https://eafe-152-59-111-100.ngrok-free.app"; // Replace with YOUR PUBLIC API URL
  if (!apiUrl.endsWith("/verify-claim/")) {
    apiUrl = apiUrl.replace(/\/$/, "") + "/verify-claim/";
  }

  const args = [abhaId, ipfsHash, apiUrl];
  const callbackGasLimit = 300000;

  // 3. Define placeholder claim params for the callback to handle
  const claimParams = {
    policyId: 1,
    aggregateScore: 0, // Placeholder, will be updated by oracle
    abhaId: abhaId,
    ipfsCid: ipfsHash,
    oracleRequestId: "",
    claimDescription: "Auto AI Analysis Request",
    hospitalName: "Apollo Hospital",
    userAddress: signer.address
  };

  console.log("Sending AI Analysis request to Chainlink DON...");
  
  // 4. Send the request
  const tx = await InsurancePortal.sendOCRRequest(
    source,
    "0x", // no secrets for now
    0,    // slot ID
    0,    // version
    args,
    callbackGasLimit,
    claimParams
  );

  const receipt = await tx.wait();
  console.log("✅ Request sent! Transaction Hash:", receipt.hash);
  console.log("Wait for the OCRResponseReceived event on Etherscan...");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
