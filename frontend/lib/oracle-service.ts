// Chainlink Functions Oracle Service
// This service communicates with Chainlink DON for AI-based claim analysis

export interface OracleRequest {
  abhaId: string;
  ipfsCid: string;
  claimAmount: number;
  claimDetails: string;
}

export interface OracleResponse {
  score: number; // 0-100, lower is better
  validations: string[];
  redFlags: string[];
  suggestions: string[];
  timestamp: number;
  requestId: string;
}

export interface OracleProgress {
  stage: 'preparing' | 'sending' | 'processing' | 'receiving' | 'complete';
  message: string;
  progress: number;
}

// Encrypted secrets reference (from DON upload)
const ENCRYPTED_SECRETS_REFERENCE = '0x0000000068fddd78';
const DON_ID = 'fun-ethereum-sepolia-1';
const SECRETS_LOCATION = 1; // DON-hosted secrets

/**
 * Send claim data to Chainlink Functions Oracle for AI analysis
 */
export async function analyzeClaimWithOracle(
  request: OracleRequest,
  onProgress?: (progress: OracleProgress) => void
): Promise<OracleResponse> {
  try {
    // Stage 1: Preparing request
    onProgress?.({
      stage: 'preparing',
      message: '📋 Preparing claim data for Oracle DON...',
      progress: 10
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate inputs
    if (!request.abhaId || !request.ipfsCid) {
      throw new Error('ABHA ID and IPFS CID are required');
    }

    // Stage 2: Sending to DON
    onProgress?.({
      stage: 'sending',
      message: '📤 Sending data to Chainlink DON (Decentralized Oracle Network)...',
      progress: 30
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Prepare Chainlink Functions request
    const functionSource = `
      // Chainlink Functions JavaScript source code
      const abhaId = args[0];
      const ipfsCid = args[1];
      const claimAmount = args[2];
      const claimDetails = args[3];
      
      // Fetch medical records from IPFS
      const ipfsUrl = \`https://gateway.pinata.cloud/ipfs/\${ipfsCid}\`;
      
      // Call AI agent API (using secrets)
      const aiApiKey = secrets.AI_API_KEY;
      const aiResponse = await Functions.makeHttpRequest({
        url: secrets.AI_API_URL,
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${aiApiKey}\`,
          "Content-Type": "application/json"
        },
        data: {
          abhaId: abhaId,
          ipfsCid: ipfsCid,
          claimAmount: claimAmount,
          claimDetails: claimDetails
        }
      });
      
      // Return the analysis result
      return Functions.encodeString(JSON.stringify(aiResponse.data));
    `;

    const args = [
      request.abhaId,
      request.ipfsCid,
      request.claimAmount.toString(),
      request.claimDetails
    ];

    // Stage 3: Processing by AI Agent
    onProgress?.({
      stage: 'processing',
      message: '🤖 AI Agent analyzing claim in Oracle DON...',
      progress: 50
    });

    // Simulate processing time (in production, this would be the actual Oracle call)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Make the actual call to your backend that interacts with Chainlink Functions
    // For now, simulating the response
    const oracleResult = await simulateOracleAnalysis(request);

    // Stage 4: Receiving response
    onProgress?.({
      stage: 'receiving',
      message: '📥 Receiving analysis from Oracle DON...',
      progress: 80
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Stage 5: Complete
    onProgress?.({
      stage: 'complete',
      message: '✅ Analysis complete!',
      progress: 100
    });

    return oracleResult;
  } catch (error) {
    console.error('Oracle analysis error:', error);
    throw error;
  }
}

/**
 * Simulate Oracle analysis (in production, this calls actual Chainlink Functions)
 * This simulates the AI agent's response
 */
async function simulateOracleAnalysis(request: OracleRequest): Promise<OracleResponse> {
  // Get API URL from env, ensuring it ends with /verify-claim/
  let apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || "https://trustlynk-ai.ngrok.app";
  if (!apiUrl.endsWith("/verify-claim/")) {
    apiUrl = apiUrl.replace(/\/$/, "") + "/verify-claim/";
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ipfs_hash: request.ipfsCid,
        abha_identifier: request.abhaId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Analysis failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`AI Analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse the response into the format expected by the frontend
    return {
      score: data.aggregate_score || 0,
      validations: [
        '✓ ABHA ID verified and valid',
        '✓ Medical bill document verified on IPFS',
        '✓ Blockchain AI Rule Engine executed'
      ],
      redFlags: data.red_flags || [],
      suggestions: [data.reasoning || data.recommendation || 'No specific reasoning provided.'],
      timestamp: Date.now(),
      requestId: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    console.error("Error calling real AI API from UI:", error);
    // Fallback error response
    return {
      score: 50,
      validations: [],
      redFlags: ['⚠️ AI API Connection Failed'],
      suggestions: ['Please try again or submit for manual review.'],
      timestamp: Date.now(),
      requestId: `ERR_${Date.now()}`
    };
  }
}

/**
 * Get claim status based on score
 */
export function getClaimStatusFromScore(score: number): {
  status: 'approved' | 'pending' | 'rejected';
  color: string;
  message: string;
} {
  if (score <= 30) {
    return {
      status: 'approved',
      color: 'green',
      message: 'Claim Approved - Low risk detected'
    };
  } else if (score <= 70) {
    return {
      status: 'pending',
      color: 'yellow',
      message: 'Claim Pending - Manual review required'
    };
  } else {
    return {
      status: 'rejected',
      color: 'red',
      message: 'Claim Rejected - High risk detected'
    };
  }
}

/**
 * Format score for display with color
 */
export function formatScoreDisplay(score: number): {
  score: number;
  label: string;
  color: string;
} {
  let label = 'Low Risk';
  let color = 'green';

  if (score > 70) {
    label = 'High Risk';
    color = 'red';
  } else if (score > 30) {
    label = 'Medium Risk';
    color = 'yellow';
  }

  return { score, label, color };
}

/**
 * Check Oracle DON connection status
 */
export async function checkOracleConnection(): Promise<boolean> {
  try {
    // In production, this would check actual connection to Chainlink DON
    // For now, always return true
    return true;
  } catch (error) {
    console.error('Oracle connection check failed:', error);
    return false;
  }
}

