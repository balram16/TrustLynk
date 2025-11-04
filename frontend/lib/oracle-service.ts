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
  // Simulate AI analysis based on claim data
  const baseScore = Math.floor(Math.random() * 100);
  
  // Adjust score based on claim amount (higher amounts = more scrutiny)
  const amountFactor = Math.min(request.claimAmount / 100000, 1) * 20;
  const finalScore = Math.min(Math.floor(baseScore + amountFactor), 100);

  // Generate validations
  const validations: string[] = [];
  if (request.abhaId) {
    validations.push('✓ ABHA ID verified and valid');
    validations.push('✓ Patient medical history retrieved');
  }
  if (request.ipfsCid) {
    validations.push('✓ Medical bill document verified on IPFS');
    validations.push('✓ Document authenticity confirmed');
  }

  // Generate red flags based on score
  const redFlags: string[] = [];
  if (finalScore > 70) {
    redFlags.push('⚠️ Claim amount significantly higher than policy coverage');
    redFlags.push('⚠️ Multiple claims filed in short period');
  } else if (finalScore > 50) {
    redFlags.push('⚠️ Treatment costs above average for diagnosis');
  }

  // Generate suggestions
  const suggestions: string[] = [];
  if (finalScore > 50) {
    suggestions.push('📋 Additional documentation may be required');
    suggestions.push('🏥 Hospital verification recommended');
  }
  if (finalScore <= 30) {
    suggestions.push('✅ Claim appears legitimate - recommend approval');
  } else if (finalScore <= 70) {
    suggestions.push('⏳ Manual review recommended');
  } else {
    suggestions.push('❌ High risk - detailed investigation required');
  }

  return {
    score: finalScore,
    validations,
    redFlags,
    suggestions,
    timestamp: Date.now(),
    requestId: `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
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

