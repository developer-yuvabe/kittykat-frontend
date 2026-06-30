import { NextRequest, NextResponse } from "next/server";
import { AppConfig } from "@/config/app.config";
import { env } from "@/config/env";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "content-location",
};

// These are stripped because Node.js fetch auto-decompresses the body,
// but the upstream (Cloudflare-proxied Render) still sends these headers.
// Forwarding content-encoding/transfer-encoding causes ERR_CONTENT_DECODING_FAILED,
// and forwarding the stale (pre-decompression) content-length truncates the body.
const STRIP_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "transfer-encoding",
  "connection",
  "content-length",
]);

async function handleRequest(req: NextRequest, method: string) {
  const apiUrl = AppConfig.KITTYKAT_AGENT_SERVER;
  const apiKey = env.LANGSMITH_API_KEY;

  let path = req.nextUrl.pathname.replace(/^\/?api\//, "");
  path = path.replace(/^langgraph\//, "");

  const searchParams = new URLSearchParams(req.nextUrl.search);
  searchParams.delete("_path");
  searchParams.delete("nxtP_path");
  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

  const forwardedHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith("x-") || lower === "authorization") {
      forwardedHeaders[key] = value;
    }
  });

  const options: RequestInit = {
    method,
    headers: {
      ...forwardedHeaders,
      "x-api-key": apiKey,
    },
  };

  if (["POST", "PUT", "PATCH"].includes(method)) {
    options.body = await req.text();
  }

  const res = await fetch(`${apiUrl}/${path}${queryString}`, options);

  const responseHeaders: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders[key] = value;
    }
  });

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: { ...responseHeaders, ...CORS_HEADERS },
  });
}

export async function GET(req: NextRequest) {
  return handleRequest(req, "GET");
}
export async function POST(req: NextRequest) {
  return handleRequest(req, "POST");
}
export async function PUT(req: NextRequest) {
  return handleRequest(req, "PUT");
}
export async function PATCH(req: NextRequest) {
  return handleRequest(req, "PATCH");
}
export async function DELETE(req: NextRequest) {
  return handleRequest(req, "DELETE");
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
