import { NextRequest, NextResponse } from "next/server";

interface ResolvedBadge {
  name: string;
  image: string;
  issuer: string;
  url: string;
}

const PRESETS: Array<{ pattern: RegExp; name: string; image: string; issuer: string }> = [
  {
    pattern: /ccna|cisco/i,
    name: "CCNA: Enterprise Networking, Security, and Automation",
    image: "/badges/cisco-ccna.png",
    issuer: "Cisco Networking Academy",
  },
  {
    pattern: /cloud-practitioner|practitioner.*aws|aws.*practitioner/i,
    name: "AWS Certified Cloud Practitioner",
    image: "/badges/aws-cloud-practitioner.png",
    issuer: "Amazon Web Services (AWS)",
  },
  {
    pattern: /solutions-architect|architect.*aws|aws.*solutions/i,
    name: "AWS Certified Solutions Architect – Associate",
    image: "/badges/aws-solutions-architect.png",
    issuer: "Amazon Web Services (AWS)",
  },
  {
    pattern: /oracle|oci|foundations.*associate/i,
    name: "Oracle Cloud Infrastructure Certified Foundations Associate",
    image: "/badges/oracle-oci.png",
    issuer: "Oracle University",
  },
  {
    pattern: /alx/i,
    name: "ALX Software Engineering Honours Badge",
    image: "/badges/alx-software-engineering.svg",
    issuer: "ALX Africa",
  },
  {
    pattern: /security|wireshark|packet/i,
    name: "Network Security & Packet Inspection Specialist",
    image: "/badges/network-security.svg",
    issuer: "Network Academy",
  },
];

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "Missing 'url' query parameter" }, { status: 400 });
  }

  return handleResolve(urlParam);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.url) {
      return NextResponse.json({ error: "Missing 'url' in body" }, { status: 400 });
    }
    return handleResolve(body.url);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

async function handleResolve(targetUrl: string) {
  const cleanUrl = targetUrl.trim();

  // 1. Check if the URL directly points to an image
  if (/\.(png|jpg|jpeg|svg|webp)(\?.*)?$/i.test(cleanUrl)) {
    const filename = cleanUrl.split("/").pop()?.split("?")[0] || "Badge";
    const inferredName = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return NextResponse.json({
      name: inferredName,
      image: cleanUrl,
      issuer: "Verified Provider",
      url: cleanUrl,
    });
  }

  // 2. Check presets first
  for (const preset of PRESETS) {
    if (preset.pattern.test(cleanUrl)) {
      return NextResponse.json({
        name: preset.name,
        image: preset.image,
        issuer: preset.issuer,
        url: cleanUrl,
      });
    }
  }

  // 3. Try to fetch Open Graph metadata from the webpage
  try {
    const res = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const html = await res.text();
      const ogTitleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
      const ogImageMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
      const titleTagMatch = html.match(/<title>([^<]+)<\/title>/i);

      let name = ogTitleMatch?.[1] || titleTagMatch?.[1] || "";
      name = name.replace(/\s*\|\s*Credly.*$/i, "").trim();

      const image = ogImageMatch?.[1] || "";

      let issuer = "Verified Credential";
      if (/credly\.com/i.test(cleanUrl)) issuer = "Credly Verified";
      if (/cisco/i.test(html) || /cisco/i.test(cleanUrl)) issuer = "Cisco";
      if (/amazon|aws/i.test(html) || /aws/i.test(cleanUrl)) issuer = "Amazon Web Services";
      if (/oracle/i.test(html) || /oracle/i.test(cleanUrl)) issuer = "Oracle";

      if (name || image) {
        return NextResponse.json({
          name: name || "Verified Digital Badge",
          image: image || "/badges/cisco-ccna.png",
          issuer,
          url: cleanUrl,
        });
      }
    }
  } catch {
    // If fetching fails, fallback gracefully
  }

  // Fallback
  return NextResponse.json({
    name: "Digital Badge Credential",
    image: "/badges/cisco-ccna.png",
    issuer: "Verified Issuer",
    url: cleanUrl,
  });
}
