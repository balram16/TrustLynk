// Backend proxy for Fileverse upload to bypass CORS issues on browser frontend
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const FILEVERSE_API_URL = "http://localhost:8001";
  const FILEVERSE_API_KEY = process.env.NEXT_PUBLIC_FILEVERSE_API_KEY;

  if (!FILEVERSE_API_KEY) {
    return NextResponse.json({ success: false, error: "API key not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string || `Medical_Bill_Summary_${Date.now()}`;
    const authorizedAddresses = formData.get("authorizedAddresses") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Build the multipart payload for Fileverse
    const uploadForm = new FormData();
    uploadForm.append("file", file, file.name || "document.pdf");
    // Notes: local server derives title from filename, doesn't mention authorizedAddresses explicitly in root.

    console.log(`[Fileverse-Proxy] Forwarding file upload: ${file.name}`);

    const response = await fetch(`${FILEVERSE_API_URL}/api/ddocs?apiKey=${encodeURIComponent(FILEVERSE_API_KEY)}`, {
      method: "POST",
      body: uploadForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Fileverse-Proxy] Remote error:", response.status, errorText);
      return NextResponse.json({ success: false, error: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log("[Fileverse-Proxy] Creation success:", data);
    return NextResponse.json({ success: true, data: data.data });

  } catch (error) {
    console.error("[Fileverse-Proxy] Exception:", error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
