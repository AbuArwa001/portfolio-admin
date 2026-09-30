import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy-image?url=<encoded-url>
 *
 * Server-side image proxy — fetches a remote image and returns it
 * as a base64 data: URL string. Used so the client can embed images
 * inline (e.g. for print-safe rendering where cross-origin <img> tags
 * show as black boxes in print).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Whitelist: only proxy known safe domains
  const allowed = [
    "avatars.githubusercontent.com",
    "github.com",
    "khalfanathman.dev",
    "lh3.googleusercontent.com",
  ];
  let hostname: string;
  try {
    hostname = new URL(imageUrl).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!allowed.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (portfolio-admin proxy)" },
      cache: "force-cache",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502 }
      );
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error("proxy-image error:", err);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
