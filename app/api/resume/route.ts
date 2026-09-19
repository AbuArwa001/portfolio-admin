import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth-options";
import { getApiUrl } from "@/lib/config";

const LOCAL_RESUME_PATH = path.join(process.cwd(), "app/resume/resume.json");
const PORTFOLIO_RESUME_PATH = path.resolve(process.cwd(), "../portfolio/app/resume/resume.json");

export async function GET() {
  // First attempt to fetch live from DRF PostgreSQL endpoint
  try {
    const API_URL = getApiUrl();
    const res = await fetch(`${API_URL}/api/v1/resume/primary/`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn("Could not reach DRF database endpoint, using local JSON fallback:", err);
  }

  // Fallback to local resume.json
  try {
    const content = await fs.readFile(LOCAL_RESUME_PATH, "utf-8");
    return NextResponse.json(JSON.parse(content));
  } catch {
    return NextResponse.json({ error: "Failed to read resume data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const API_URL = getApiUrl();
    const token = (session as any)?.accessToken;

    // Save directly to the DRF database
    if (token) {
      const dbRes = await fetch(`${API_URL}/api/v1/resume/primary/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!dbRes.ok) {
        const errText = await dbRes.text().catch(() => "");
        console.error("DRF save error:", dbRes.status, errText);
      }
    }

    // Keep local fallback files in sync on disk
    try {
      await fs.writeFile(LOCAL_RESUME_PATH, JSON.stringify(data, null, 2), "utf-8");
      if (await fs.stat(PORTFOLIO_RESUME_PATH).catch(() => false)) {
        await fs.writeFile(PORTFOLIO_RESUME_PATH, JSON.stringify(data, null, 2), "utf-8");
      }
    } catch (e) {
      console.warn("Local file sync ignored:", e);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save resume data" }, { status: 500 });
  }
}
