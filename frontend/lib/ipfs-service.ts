// IPFS Service - Upload files to Pinata
// SECURITY: Do NOT hardcode API keys. Provide them via environment variables only.
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET;
const PINATA_API_URL = 'https://api.pinata.cloud';

export interface IPFSUploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export interface UploadProgress {
  progress: number;
  stage: 'preparing' | 'uploading' | 'pinning' | 'complete';
  message: string;
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadToIPFS(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<IPFSUploadResponse> {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      throw new Error('Pinata API credentials are not configured. Set NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_API_SECRET in .env.local');
    }
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file type (should be PDF)
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Preparing stage
    onProgress?.({
      progress: 10,
      stage: 'preparing',
      message: 'Preparing file for upload...'
    });

    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata
    const metadata = JSON.stringify({
      name: `Medical_Bill_${Date.now()}.pdf`,
      keyvalues: {
        uploadDate: new Date().toISOString(),
        fileType: 'medical-bill',
        fileName: file.name
      }
    });
    formData.append('pinataMetadata', metadata);

    // Uploading stage
    onProgress?.({
      progress: 30,
      stage: 'uploading',
      message: 'Uploading to IPFS...'
    });

    // Upload to Pinata
    const response = await fetch(`${PINATA_API_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload to IPFS');
    }

    // Pinning stage
    onProgress?.({
      progress: 80,
      stage: 'pinning',
      message: 'Pinning to IPFS network...'
    });

    const result: IPFSUploadResponse = await response.json();

    // Complete stage
    onProgress?.({
      progress: 100,
      stage: 'complete',
      message: 'Upload complete!'
    });

    return result;
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Get IPFS gateway URL for a CID
 */
export function getIPFSUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Pin by hash (if file is already on IPFS)
 */
export async function pinByHash(
  ipfsHash: string,
  name?: string
): Promise<void> {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      throw new Error('Pinata API credentials are not configured.');
    }
    const response = await fetch(`${PINATA_API_URL}/pinning/pinByHash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
      body: JSON.stringify({
        hashToPin: ipfsHash,
        pinataMetadata: {
          name: name || `Pinned_${Date.now()}`
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to pin by hash');
    }
  } catch (error) {
    console.error('Pin by hash error:', error);
    throw error;
  }
}

/**
 * Test Pinata connection
 */
export async function testPinataConnection(): Promise<boolean> {
  try {
    if (!PINATA_API_KEY || !PINATA_API_SECRET) {
      return false;
    }
    const response = await fetch(`${PINATA_API_URL}/data/testAuthentication`, {
      method: 'GET',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_API_SECRET,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Pinata connection test failed:', error);
    return false;
  }
}

