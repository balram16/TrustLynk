import { ethers } from "ethers";

// ==========================================
// Contract ABI (matches InsurancePortal.sol with struct params)
// ==========================================
const CONTRACT_ABI = [
  // Constructor / Init
  "function initialize(address _admin) external",
  "function isInitialized() external view returns (bool)",
  "function admin() external view returns (address)",

  // User Management
  "function registerUser(address _user, uint32 _role) external",
  "function getUserRole(address _userAddress) external view returns (uint32)",
  "function checkAdminStatus(address _user) external view returns (bool)",
  "function getUserInfo(address _userAddress) external view returns (tuple(address wallet, uint32 role, bool registered, string name, string location, string contact, uint256 registeredAt))",

  // Policy Management (uses PolicyParams struct)
  "function createPolicy(tuple(string title, string description, uint32 policyType, uint256 monthlyPremium, uint256 yearlyPremium, uint256 coverageAmount, uint256 minAge, uint256 maxAge, uint256 durationDays, uint256 waitingPeriodDays) params) external returns (uint256)",
  "function getAllPolicies() external view returns (tuple(uint256 policyId, string title, string description, uint32 policyType, uint256 monthlyPremium, uint256 yearlyPremium, uint256 coverageAmount, uint256 minAge, uint256 maxAge, uint256 durationDays, uint256 waitingPeriodDays, uint256 createdAt, address createdBy)[])",
  "function getPolicy(uint256 _policyId) external view returns (tuple(uint256 policyId, string title, string description, uint32 policyType, uint256 monthlyPremium, uint256 yearlyPremium, uint256 coverageAmount, uint256 minAge, uint256 maxAge, uint256 durationDays, uint256 waitingPeriodDays, uint256 createdAt, address createdBy))",

  // User Policies (uses PurchaseParams struct)
  "function purchasePolicy(tuple(uint256 policyId, string metadataUri, string holderName, uint256 holderAge, string holderGender, string holderBloodGroup) params) external payable",
  "function getMyPolicies(address _userAddress) external view returns (tuple(uint256 policyId, address userAddress, uint256 purchaseDate, uint256 expiryDate, uint256 premiumPaidWei, uint256 monthlyPremiumWei, bool active, uint256 tokenId, string metadataUri, uint256 escrowId, string holderName, uint256 holderAge, string holderGender, string holderBloodGroup)[])",

  // Claims (uses ClaimParams struct)
  "function claimPolicy(tuple(uint256 policyId, uint32 aggregateScore, string abhaId, string ipfsCid, string oracleRequestId, string claimDescription, string hospitalName) params) external",
  "function approveClaim(uint256 _claimId) external",
  "function rejectClaim(uint256 _claimId) external",
  "function getClaimStatus(uint256 _claimId) external view returns (uint32, uint256, uint32)",
  "function getClaimDetails(uint256 _claimId) external view returns (tuple(uint256 claimId, uint256 policyId, address userAddress, uint256 claimAmount, uint32 aggregateScore, uint32 status, uint256 claimedAt, uint256 processedAt, string abhaId, string ipfsCid, string oracleRequestId, string claimDescription, string hospitalName))",
  "function getAllClaims() external view returns (tuple(uint256 claimId, uint256 policyId, address userAddress, uint256 claimAmount, uint32 aggregateScore, uint32 status, uint256 claimedAt, uint256 processedAt, string abhaId, string ipfsCid, string oracleRequestId, string claimDescription, string hospitalName)[])",
  "function getUserClaims(address _userAddress) external view returns (tuple(uint256 claimId, uint256 policyId, address userAddress, uint256 claimAmount, uint32 aggregateScore, uint32 status, uint256 claimedAt, uint256 processedAt, string abhaId, string ipfsCid, string oracleRequestId, string claimDescription, string hospitalName)[])",

  // NFT / Tokens / ERC721
  "function name() external pure returns (string)",
  "function symbol() external pure returns (string)",
  "function balanceOf(address _owner) external view returns (uint256)",
  "function ownerOf(uint256 _tokenId) external view returns (address)",
  "function tokenURI(uint256 _tokenId) external view returns (string)",
  "function supportsInterface(bytes4 interfaceId) external pure returns (bool)",
  "function getNFTMetadata(uint256 _tokenId) external view returns (tuple(string name, string description, string imageUri, uint256 coverageAmount, uint256 validityStart, uint256 validityEnd, uint256 premiumAmount, uint32 policyType, string holderName, uint256 holderAge, string holderGender, string holderBloodGroup))",
  "function getUserTokensList(address _userAddress) external view returns (uint256[])",
  "function getPolicyTokensList(uint256 _policyId) external view returns (uint256[])",
  "function getTotalTokens() external view returns (uint256)",


  "function getOracleRequest(string _requestId) external view returns (tuple(string requestId, uint256 claimId, string abhaId, string ipfsCid, uint256 requestedAt, uint32 status))",
  "function verifyIpfsCidInClaim(string _ipfsCid) external view returns (bool)",
  "function getClaimsByAbhaId(string _abhaId) external view returns (tuple(uint256 claimId, uint256 policyId, address userAddress, uint256 claimAmount, uint32 aggregateScore, uint32 status, uint256 claimedAt, uint256 processedAt, string abhaId, string ipfsCid, string oracleRequestId, string claimDescription, string hospitalName)[])",

  // Counters
  "function policyCounter() external view returns (uint256)",
  "function claimCounter() external view returns (uint256)",

  // Events
  "event UserRegistered(address indexed user, uint32 role)",
  "event PolicyCreated(uint256 indexed policyId, string title, address indexed creator)",
  "event PolicyPurchased(uint256 indexed policyId, address indexed buyer, uint256 paymentAmount, string tokenId, uint256 escrowId)",
  "event ClaimSubmitted(uint256 indexed claimId, uint256 indexed policyId, address indexed user, uint32 aggregateScore, uint32 status)",
  "event ClaimApproved(uint256 indexed claimId, address indexed user, uint256 claimAmount)",
  "event ClaimRejected(uint256 indexed claimId, address indexed admin)",
  "event ContractInitialized(address indexed admin)",
];

// ==========================================
// Configuration
// ==========================================
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const SUPPORTED_CHAINS: Record<number, { name: string; rpcUrl: string; blockExplorer: string }> = {
  11155111: {
    name: "Sepolia Testnet",
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  31337: {
    name: "Hardhat Local",
    rpcUrl: "http://localhost:8545",
    blockExplorer: "",
  },
};

export const DEFAULT_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "31337");

// ==========================================
// Role Constants
// ==========================================
export const ROLE_UNREGISTERED = 0;
export const ROLE_POLICYHOLDER = 1;
export const ROLE_ADMIN = 2;

export const POLICY_TYPE_HEALTH = 1;
export const POLICY_TYPE_LIFE = 2;
export const POLICY_TYPE_AUTO = 3;
export const POLICY_TYPE_HOME = 4;
export const POLICY_TYPE_TRAVEL = 5;

export const POLICY_STATUS_ACTIVE = 1;
export const POLICY_STATUS_INACTIVE = 2;

export const USER_POLICY_STATUS_ACTIVE = 1;
export const USER_POLICY_STATUS_EXPIRED = 2;
export const USER_POLICY_STATUS_CANCELLED = 3;

export const CLAIM_STATUS_APPROVED = 1;
export const CLAIM_STATUS_PENDING = 2;
export const CLAIM_STATUS_REJECTED = 3;

// ==========================================
// Interfaces
// ==========================================
export interface BlockchainPolicy {
  policy_id: string;
  title: string;
  description: string;
  policy_type: number;
  monthly_premium: string;
  yearly_premium: string;
  coverage_amount: string;
  min_age: string;
  max_age: string;
  duration_days: string;
  waiting_period_days: string;
  status: number;
  created_at: string;
  created_by: string;
}

export interface BlockchainUserPolicy {
  id: string; // Unique identifier (escrow_id)
  policy_id: string;
  user_address: string;
  purchase_date: string;
  expiry_date: string;
  premium_paid: string;
  monthly_premium: string;
  active: boolean;
  status: number; // For UI backward compatibility
  token_id: string;
  metadata_uri: string;
  escrow_id: string;
  holder_name: string;
  holder_age: number;
  holder_gender: string;
  holder_blood_group: string;
}

export interface PolicyClaim {
  claim_id: string;
  policy_id: string;
  user_address: string;
  claim_amount: string;
  aggregate_score: number;
  status: number;
  claimed_at: string;
  processed_at: string;
}

export interface PolicyNFTMetadata {
  name: string;
  description: string;
  imageUri: string;
  coverageAmount: number;
  validityStart: number;
  validityEnd: number;
  premiumAmount: number;
  policyType: number;
  holderName: string;
  holderAge: number;
  holderGender: string;
  holderBloodGroup: string;
}

// ==========================================
// ETH Payment Helpers
// ==========================================
export const ETH_DECIMALS = 18;
export const INR_TO_ETH_RATE = 250000; // 1 ETH ≈ 250,000 INR

export function convertINRToETH(inrAmount: number): number {
  const ethAmount = inrAmount / INR_TO_ETH_RATE;
  return Number(ethAmount.toFixed(6));
}

export function convertETHToINR(ethAmount: number | bigint): number {
  const amount = typeof ethAmount === "bigint" ? parseFloat(ethers.formatEther(ethAmount)) : Number(ethAmount);
  return Math.floor(amount * INR_TO_ETH_RATE);
}

export function formatETH(ethAmount: number | bigint | string): string {
  const amount = typeof ethAmount === "bigint" ? parseFloat(ethers.formatEther(ethAmount)) 
               : typeof ethAmount === "string" ? parseFloat(ethAmount) : Number(ethAmount);
  return amount.toFixed(6) + " ETH";
}

// ==========================================
// Provider / Contract Helpers
// ==========================================

function getProvider(): ethers.BrowserProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask is not installed. Please install MetaMask extension.");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

// Read-only provider goes directly to the RPC node – bypasses MetaMask network so
// getUserRole / view calls work regardless of which chain MetaMask is currently on.
function getReadProvider(): ethers.JsonRpcProvider {
  const chainId = DEFAULT_CHAIN_ID;
  const chain = SUPPORTED_CHAINS[chainId];
  const rpcUrl = chain?.rpcUrl ?? "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

async function ensureCorrectNetwork(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) return;
  const targetChainId = DEFAULT_CHAIN_ID;
  const targetHex = "0x" + targetChainId.toString(16);
  try {
    const currentChainHex: string = await window.ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(currentChainHex, 16);
    if (currentChainId !== targetChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: targetHex }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          // Chain not in MetaMask – add it (Hardhat Local)
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: targetHex,
              chainName: targetChainId === 31337 ? "Hardhat Local" : "Sepolia Testnet",
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: [SUPPORTED_CHAINS[targetChainId]?.rpcUrl ?? "http://127.0.0.1:8545"],
            }],
          });
        } else {
          throw switchErr;
        }
      }
    }
  } catch (err) {
    console.warn("Could not ensure correct network:", err);
  }
}

async function getSigner(): Promise<ethers.JsonRpcSigner> {
  await ensureCorrectNetwork();
  const provider = getProvider();
  return await provider.getSigner();
}

function getReadContract(): ethers.Contract {
  const provider = getReadProvider();
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

async function getWriteContract(): Promise<ethers.Contract> {
  const signer = await getSigner();
  if (!CONTRACT_ADDRESS) {
    throw new Error("Contract address not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local");
  }
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// ==========================================
// Wallet Functions (MetaMask)
// ==========================================

export async function isFreighterAvailable(): Promise<boolean> {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function getWalletPublicKey(): Promise<string> {
  try {
    const provider = getProvider();
    const signer = await provider.getSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error("Error getting wallet address:", error);
    throw new Error("Failed to get wallet address");
  }
}

// ==========================================
// User Functions
// ==========================================

export async function registerUser(
  userAddress: string,
  role: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    if (!userAddress || userAddress.trim() === "") {
      throw new Error("Invalid user address");
    }

    const contract = await getWriteContract();
    const tx = await contract.registerUser(userAddress, role);
    const receipt = await tx.wait();

    console.log("✅ User registered:", receipt.hash);
    return { success: true, transactionHash: receipt.hash };
  } catch (error: any) {
    console.error("Error registering user:", error);
    return { success: false, error: error.reason || error.message };
  }
}

export async function registerAsAdmin(): Promise<{ success: boolean; transactionHash?: string }> {
  const address = await getWalletPublicKey();
  return registerUser(address, ROLE_ADMIN);
}

export async function registerAsPolicyholder(): Promise<{ success: boolean; transactionHash?: string }> {
  const address = await getWalletPublicKey();
  return registerUser(address, ROLE_POLICYHOLDER);
}

export async function getUserRole(walletAddress: string): Promise<number> {
  try {
    if (!walletAddress || walletAddress.trim() === "") {
      console.warn("getUserRole called with empty address");
      return ROLE_UNREGISTERED;
    }

    const contract = getReadContract();
    const role = await contract.getUserRole(walletAddress);
    return Number(role);
  } catch (error) {
    console.error("Error getting user role:", error);
    return ROLE_UNREGISTERED;
  }
}

// ==========================================
// Policy Functions
// ==========================================

export async function createPolicy(policyData: {
  title: string;
  description: string;
  policyType: number;
  monthlyPremium: number;
  yearlyPremium: number;
  coverageAmount: number;
  minAge: number;
  maxAge: number;
  durationDays: number;
  waitingPeriodDays: number;
}): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    const contract = await getWriteContract();

    // Convert INR to string ETH amount, then parse to wei
    const monthlyPremiumWei = ethers.parseEther((policyData.monthlyPremium / INR_TO_ETH_RATE).toFixed(18));
    const yearlyPremiumWei = ethers.parseEther((policyData.yearlyPremium / INR_TO_ETH_RATE).toFixed(18));
    const coverageAmountWei = ethers.parseEther((policyData.coverageAmount / INR_TO_ETH_RATE).toFixed(18));

    console.log("Creating policy with params:", {
      ...policyData,
      monthlyPremiumWei: monthlyPremiumWei.toString(),
      yearlyPremiumWei: yearlyPremiumWei.toString(),
      coverageAmountWei: coverageAmountWei.toString(),
    });

    // Pass as struct (tuple)
    const tx = await contract.createPolicy({
      title: policyData.title,
      description: policyData.description,
      policyType: policyData.policyType,
      monthlyPremium: monthlyPremiumWei,
      yearlyPremium: yearlyPremiumWei,
      coverageAmount: coverageAmountWei,
      minAge: policyData.minAge,
      maxAge: policyData.maxAge,
      durationDays: policyData.durationDays,
      waitingPeriodDays: policyData.waitingPeriodDays,
    });

    const receipt = await tx.wait();
    console.log("✅ Policy created:", receipt.hash);
    return { success: true, transactionHash: receipt.hash };
  } catch (error: any) {
    console.error("Error creating policy:", error);
    throw error;
  }
}

export async function getAllPolicies(): Promise<BlockchainPolicy[]> {
  try {
    const contract = getReadContract();
    const policies = await contract.getAllPolicies();

    return policies.map((p: any) => ({
      policy_id: p.policyId.toString(),
      title: p.title,
      description: p.description,
      policy_type: Number(p.policyType),
      // Convert Wei → INR so all pages can safely parseInt() these as INR values
      monthly_premium: convertETHToINR(p.monthlyPremium).toString(),
      yearly_premium: convertETHToINR(p.yearlyPremium).toString(),
      coverage_amount: convertETHToINR(p.coverageAmount).toString(),
      min_age: p.minAge.toString(),
      max_age: p.maxAge.toString(),
      duration_days: p.durationDays.toString(),
      waiting_period_days: p.waitingPeriodDays.toString(),
      status: POLICY_STATUS_ACTIVE,
      created_at: p.createdAt.toString(),
      created_by: p.createdBy,
    }));
  } catch (error) {
    console.error("Error getting all policies:", error);
    return [];
  }
}

export async function purchasePolicy(
  policyId: any,
  metadataUri: string,
  monthlyPremiumINR: number,
  policyholderDetails: {
    name: string;
    age: number;
    gender: string;
    bloodGroup: string;
  }
): Promise<{ success: boolean; transactionHash?: string; paymentAmount?: number; paymentAmountINR?: number }> {
  try {
    const numericPolicyId = typeof policyId === "string" ? parseInt(policyId) : policyId;

    if (!metadataUri || metadataUri.trim() === "") {
      throw new Error("Invalid metadata URI");
    }
    if (isNaN(monthlyPremiumINR) || monthlyPremiumINR <= 0) {
      throw new Error("Invalid premium amount");
    }

    const premiumInEth = convertINRToETH(monthlyPremiumINR);
    const premiumWei = ethers.parseEther(premiumInEth.toString());

    console.log(`💰 Payment Details:
    - Policy ID: ${numericPolicyId}
    - Monthly Premium: ${monthlyPremiumINR} INR = ${premiumInEth} ETH
    - Wei Amount: ${premiumWei.toString()}`);

    const contract = await getWriteContract();

    // Pass as struct
    const tx = await contract.purchasePolicy(
      {
        policyId: BigInt(numericPolicyId),
        metadataUri: metadataUri,
        holderName: policyholderDetails.name,
        holderAge: BigInt(policyholderDetails.age),
        holderGender: policyholderDetails.gender,
        holderBloodGroup: policyholderDetails.bloodGroup,
      },
      { value: premiumWei }
    );

    const receipt = await tx.wait();
    console.log("✅ Policy purchased:", receipt.hash);

    return {
      success: true,
      transactionHash: receipt.hash,
      paymentAmount: Number(premiumWei),
      paymentAmountINR: monthlyPremiumINR,
    };
  } catch (error: any) {
    console.error("Error purchasing policy:", error);
    throw error;
  }
}

export async function getUserPolicies(walletAddress: string): Promise<BlockchainUserPolicy[]> {
  try {
    const contract = getReadContract();
    const policies = await contract.getMyPolicies(walletAddress);

    return policies.map((p: any) => ({
      id: p.escrowId.toString(),
      policy_id: p.policyId.toString(),
      user_address: p.userAddress,
      purchase_date: p.purchaseDate.toString(),
      expiry_date: p.expiryDate.toString(),
      premium_paid: convertETHToINR(p.premiumPaidWei).toString(),
      monthly_premium: convertETHToINR(p.monthlyPremiumWei).toString(),
      active: p.active,
      status: p.active ? USER_POLICY_STATUS_ACTIVE : USER_POLICY_STATUS_EXPIRED,
      token_id: p.tokenId.toString(),
      metadata_uri: p.metadataUri,
      escrow_id: p.escrowId.toString(),
      holder_name: p.holderName,
      holder_age: Number(p.holderAge),
      holder_gender: p.holderGender,
      holder_blood_group: p.holderBloodGroup
    } as BlockchainUserPolicy));
  } catch (error: any) {
    if (error.reason && error.reason.includes("User not registered")) {
      console.log("User not registered yet. Returning no policies.");
      return [];
    }
    console.error("Error getting user policies:", error);
    return [];
  }
}

// ==========================================
// Claims Functions
// ==========================================

export async function claimPolicy(
  policyId: any,
  aggregateScore: number
): Promise<{ success: boolean; transactionHash?: string; claimAmount?: number }> {
  try {
    const numericPolicyId = parseInt(policyId);
    if (isNaN(numericPolicyId) || numericPolicyId <= 0) {
      throw new Error("Invalid policy ID");
    }

    console.log(`📋 Claiming policy:
    - Policy ID: ${numericPolicyId}
    - Aggregate Score: ${aggregateScore}
    - Expected Status: ${
      aggregateScore <= 30 ? "APPROVED" : aggregateScore <= 70 ? "PENDING" : "REJECTED"
    }`);

    const contract = await getWriteContract();

    // Pass as struct
    const tx = await contract.claimPolicy({
      policyId: numericPolicyId,
      aggregateScore: aggregateScore,
      abhaId: "",
      ipfsCid: "",
      oracleRequestId: "",
      claimDescription: "",
      hospitalName: "",
    });

    const receipt = await tx.wait();
    console.log("✅ Claim submitted:", receipt.hash);

    const policies = await getAllPolicies();
    const policy = policies.find((p) => p.policy_id === numericPolicyId.toString());
    const claimAmount = policy ? parseInt(policy.coverage_amount) : 0;

    return {
      success: true,
      transactionHash: receipt.hash,
      claimAmount,
    };
  } catch (error: any) {
    console.error("Error claiming policy:", error);
    throw error;
  }
}

export async function claimPolicyWithOracle(
  policyId: number,
  aggregateScore: number,
  abhaId: string,
  ipfsCid: string,
  oracleRequestId: string,
  claimDescription: string,
  hospitalName: string
): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    const contract = await getWriteContract();

    const tx = await contract.claimPolicy({
      policyId: policyId,
      aggregateScore: aggregateScore,
      abhaId: abhaId,
      ipfsCid: ipfsCid,
      oracleRequestId: oracleRequestId,
      claimDescription: claimDescription,
      hospitalName: hospitalName,
    });

    const receipt = await tx.wait();
    console.log("✅ Claim with oracle data submitted:", receipt.hash);
    return { success: true, transactionHash: receipt.hash };
  } catch (error: any) {
    console.error("Error claiming with oracle:", error);
    throw error;
  }
}

export const getNFTMetadata = async (tokenId: string | number): Promise<PolicyNFTMetadata | null> => {
  try {
    const contract = getReadContract();
    
    // Extract numeric portion only: "POLICY_1" → "1"
    const numericId = typeof tokenId === 'string' ? BigInt(tokenId.replace(/\D/g, '')) : BigInt(tokenId);
    const m = await contract.getNFTMetadata(numericId);
    
    return {
      name: m.name,
      description: m.description,
      imageUri: m.imageUri,
      coverageAmount: Number(m.coverageAmount),
      validityStart: Number(m.validityStart),
      validityEnd: Number(m.validityEnd),
      premiumAmount: Number(m.premiumAmount),
      policyType: Number(m.policyType),
      holderName: m.holderName,
      holderAge: Number(m.holderAge),
      holderGender: m.holderGender,
      holderBloodGroup: m.holderBloodGroup
    };
  } catch (error) {
    console.error("Error getting NFT metadata:", error);
    return null;
  }
}

export async function getUserClaims(userAddress: string): Promise<PolicyClaim[]> {
  try {
    const contract = getReadContract();
    const claims = await contract.getUserClaims(userAddress);

    return claims.map((claim: any) => ({
      claim_id: claim.claimId.toString(),
      policy_id: claim.policyId.toString(),
      user_address: claim.userAddress,
      // Convert Wei → INR so display pages can safely parseInt() as INR
      claim_amount: convertETHToINR(claim.claimAmount).toString(),
      aggregate_score: Number(claim.aggregateScore),
      status: Number(claim.status),
      claimed_at: claim.claimedAt.toString(),
      processed_at: claim.processedAt.toString(),
    }));
  } catch (error: any) {
    if (error.reason && error.reason.includes("User not registered")) {
      console.log("User not registered yet. Returning no claims.");
      return [];
    }
    console.error("Error getting user claims:", error);
    return [];
  }
}

export async function getAllClaims(): Promise<PolicyClaim[]> {
  try {
    const contract = getReadContract();
    const claims = await contract.getAllClaims();

    return claims.map((claim: any) => ({
      claim_id: claim.claimId.toString(),
      policy_id: claim.policyId.toString(),
      user_address: claim.userAddress,
      // Convert Wei → INR so display pages can safely parseInt() as INR
      claim_amount: convertETHToINR(claim.claimAmount).toString(),
      aggregate_score: Number(claim.aggregateScore),
      status: Number(claim.status),
      claimed_at: claim.claimedAt.toString(),
      processed_at: claim.processedAt.toString(),
    }));
  } catch (error) {
    console.error("Error fetching all claims:", error);
    return [];
  }
}

export async function getClaimStatus(
  claimId: number
): Promise<{ status: number; amount: string; score: number } | null> {
  try {
    const contract = getReadContract();
    const [status, amount, score] = await contract.getClaimStatus(claimId);

    return {
      status: Number(status),
      amount: amount.toString(),
      score: Number(score),
    };
  } catch (error) {
    console.error("Error fetching claim status:", error);
    return null;
  }
}

export async function approveClaim(
  claimId: number
): Promise<{ success: boolean; transactionHash?: string }> {
  try {
    console.log(`✅ Approving claim ID: ${claimId}`);
    const contract = await getWriteContract();
    const tx = await contract.approveClaim(claimId);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  } catch (error: any) {
    console.error("Error approving claim:", error);
    throw error;
  }
}

// ==========================================
// Portal / Contract Status
// ==========================================

export async function isPortalInitialized(): Promise<boolean> {
  try {
    const contract = getReadContract();
    return await contract.isInitialized();
  } catch (error) {
    console.error("Error checking portal initialization:", error);
    return false;
  }
}

export async function isContractInitialized(): Promise<boolean> {
  return isPortalInitialized();
}

// ==========================================
// NFT / Token Functions
// ==========================================




export async function getUserTokens(walletAddress: string): Promise<string[]> {
  try {
    const contract = getReadContract();
    const tokens = await contract.getUserTokensList(walletAddress);
    return tokens.map((t: any) => t.toString());
  } catch (error) {
    console.error("Error getting user tokens:", error);
    return [];
  }
}


export async function getPolicyTokens(policyId: number): Promise<string[]> {
  try {
    const contract = getReadContract();
    const tokens = await contract.getPolicyTokensList(policyId);
    return tokens.map((t: any) => t.toString());
  } catch (error) {
    console.error("Error getting policy tokens:", error);
    return [];
  }
}

export async function getTotalTokens(): Promise<number> {
  try {
    const contract = getReadContract();
    const total = await contract.getTotalTokens();
    return Number(total);
  } catch (error) {
    console.error("Error getting total tokens:", error);
    return 0;
  }
}

// ==========================================
// Helper Functions
// ==========================================

export function getPolicyTypeString(policyType: number): string {
  switch (policyType) {
    case POLICY_TYPE_HEALTH: return "Health";
    case POLICY_TYPE_LIFE: return "Life";
    case POLICY_TYPE_AUTO: return "Auto";
    case POLICY_TYPE_HOME: return "Home";
    case POLICY_TYPE_TRAVEL: return "Travel";
    default: return "Unknown";
  }
}

export function getPolicyTypeNumber(policyType: string): number {
  switch (policyType.toLowerCase()) {
    case "health": return POLICY_TYPE_HEALTH;
    case "life": return POLICY_TYPE_LIFE;
    case "auto": return POLICY_TYPE_AUTO;
    case "home": return POLICY_TYPE_HOME;
    case "travel": return POLICY_TYPE_TRAVEL;
    default: return POLICY_TYPE_HEALTH;
  }
}

export function formatAmount(amount: string): number {
  return parseInt(amount, 10);
}

export function formatDate(timestamp: string): string {
  const date = new Date(parseInt(timestamp, 10) * 1000);
  return date.toLocaleDateString();
}

export function getClaimStatusString(status: number): string {
  switch (status) {
    case 1: return "Approved";
    case 2: return "Pending Verification";
    case 3: return "Rejected";
    default: return "Unknown";
  }
}

export function getClaimStatusColor(status: number): string {
  switch (status) {
    case 1: return "text-green-600 bg-green-50";
    case 2: return "text-yellow-600 bg-yellow-50";
    case 3: return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}

export function generatePolicyMetadata(
  policy: BlockchainPolicy,
  userAddress: string,
  policyholderDetails?: {
    name: string;
    age: number;
    gender: string;
    bloodGroup: string;
  }
): any {
  const attributes = [
    { trait_type: "Coverage", value: `${formatETH(BigInt(policy.coverage_amount))}` },
    { trait_type: "Premium", value: `${formatETH(BigInt(policy.yearly_premium))}/year` },
    { trait_type: "Policy Type", value: getPolicyTypeString(policy.policy_type) },
    { trait_type: "Duration", value: `${policy.duration_days} days` },
    { trait_type: "Minimum Age", value: policy.min_age },
    { trait_type: "Maximum Age", value: policy.max_age },
    { trait_type: "Policyholder", value: userAddress },
    { trait_type: "Created At", value: formatDate(policy.created_at) },
  ];

  if (policyholderDetails) {
    if (policy.policy_type === 3) {
      // Auto Insurance Maps to Vehicle Details
      attributes.push(
        { trait_type: "Registration Number", value: policyholderDetails.name },
        { trait_type: "Manufacturing Year", value: policyholderDetails.age.toString() },
        { trait_type: "Vehicle Make", value: policyholderDetails.gender },
        { trait_type: "Vehicle Model", value: policyholderDetails.bloodGroup }
      );
    } else {
      // Standard Health/Life Insurance Maps to Personal Details
      attributes.push(
        { trait_type: "Holder Name", value: policyholderDetails.name },
        { trait_type: "Holder Age", value: policyholderDetails.age.toString() },
        { trait_type: "Holder Gender", value: policyholderDetails.gender },
        { trait_type: "Holder Blood Group", value: policyholderDetails.bloodGroup }
      );
    }
  }

  return {
    name: `${policy.title} #${policy.policy_id}`,
    description: `${policy.description} - NFT Certificate for TrustLynk Insurance Policy`,
    image: "https://trustlynk.io/policy-nft.png",
    attributes,
    external_url: `https://trustlynk.io/policy/${policy.policy_id}`,
    collection: {
      name: "TrustLynk Insurance Policies",
      family: "TrustLynk",
    },
  };
}

export async function getPolicy(policyId: string): Promise<BlockchainPolicy | null> {
  const policies = await getAllPolicies();
  return policies.find((p) => p.policy_id === policyId) || null;
}

export async function getCollectionInfo(): Promise<{
  name: string;
  description: string;
  uri: string;
} | null> {
  return {
    name: "TrustLynk Insurance Policies",
    description: "NFT collection representing insurance policies on TrustLynk platform powered by Ethereum blockchain",
    uri: "https://trustlynk.io/collection.json",
  };
}

// Type declaration for MetaMask
declare global {
  interface Window {
    ethereum: any;
  }
}
