// Fileverse dDocs Service
// Uploads encrypted medical documents to Fileverse for secure storage
// Docs are accessible only by authorized wallet addresses

const FILEVERSE_API_URL = "https://v1-docs.fileverse.io";
const FILEVERSE_API_KEY = process.env.NEXT_PUBLIC_FILEVERSE_API_KEY;

export interface FileverseUploadResult {
  fileId: string;
  documentUrl: string;
  success: boolean;
}

/**
 * Upload an encrypted medical document to Fileverse
 * Grants read access to the patient wallet and the insurer wallet (policy.createdBy)
 *
 * @param file - The PDF file to upload
 * @param patientWallet - Ethereum address of the patient
 * @param insurerWallet - Ethereum address of the insurer (from policy.createdBy)
 * @returns Fileverse file ID and document URL, or empty on failure (non-blocking)
 */
export async function uploadEncryptedMedicalDoc(
  file: File,
  patientWallet: string,
  insurerWallet: string
): Promise<FileverseUploadResult> {
  if (!FILEVERSE_API_KEY) {
    console.warn("⚠️ [Fileverse] API key not configured. Skipping encrypted upload.");
    return { fileId: "", documentUrl: "", success: false };
  }

  try {
    console.log("🔒 [Fileverse] Uploading encrypted medical document...");

    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("title", `Medical_Bill_${Date.now()}.pdf`);
    formData.append("description", "TrustLynk encrypted medical bill for insurance claim");
    formData.append(
      "authorizedAddresses",
      JSON.stringify([patientWallet, insurerWallet].filter(Boolean))
    );

    const response = await fetch("/api/fileverse/upload", {
      method: "POST",
      // No Authorization header here, the local Next.js API will inject the key from .env.local
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: "Unknown Error" }));
      throw new Error(`Fileverse upload failed: ${response.status} - ${errData.error || "Upload failed"}`);
    }

    const resData = await response.json();
    const data = resData.data;  // Next.js API wraps response inside { success: true, data: ... }
    
    // local server returns ddocId
    const fileId = data?.ddocId || data?.documentId || data?.fileId || data?.id || "";
    const documentUrl = data?.link || data?.url || `${FILEVERSE_API_URL}/document/${fileId}`;

    console.log(`✅ [Fileverse] Medical document uploaded. File ID: ${fileId}`);
    return { fileId, documentUrl, success: true };
  } catch (err) {
    // Non-blocking: log the error but do not stop claim submission
    console.error("❌ [Fileverse] Upload failed (non-blocking):", err);
    return { fileId: "", documentUrl: "", success: false };
  }
}

/**
 * Save a text/JSON document to Fileverse as an encrypted note
 * Used for storing AI audit summaries
 *
 * @param title - Title of the document
 * @param content - Text content (stringified JSON or plain text)
 * @returns File ID of the created document
 */
export async function saveEncryptedNote(title: string, content: string): Promise<string> {
  if (!FILEVERSE_API_KEY) {
    console.warn("⚠️ [Fileverse] API key not configured. Skipping note save.");
    return "";
  }

  try {
    const response = await fetch(`${FILEVERSE_API_URL}/api/v1/documents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FILEVERSE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, content }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fileverse note save failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const fileId = data?.documentId || data?.fileId || data?.id || "";
    console.log(`✅ [Fileverse] Note saved. File ID: ${fileId}`);
    return fileId;
  } catch (err) {
    console.error("❌ [Fileverse] Note save failed (non-blocking):", err);
    return "";
  }
}
