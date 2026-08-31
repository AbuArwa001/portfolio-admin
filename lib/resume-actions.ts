"use server";

import { promises as fs } from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth-options";
import { revalidatePath } from "next/cache";

const DATA_PATH = path.join(process.cwd(), "app/resume/resume.json");

export type Reference = {
  id?: number;
  name: string;
  title: string;
  company: string;
  relationship: string;
  quote: string;
  email: string;
  phone: string;
  linkedin: string;
};

export type ResumeData = {
  profile: { name: string; role: string; avatar: string; bio?: string; location?: string; phone?: string };
  contact: { email: string; linkedin: string; github: string; website?: string };
  experience: Array<{ title: string; company: string; period: string; location: string; achievements: string[] }>;
  education: Array<{ school: string; degree: string; period: string }>;
  skills: string[];
  certifications: Array<{ name: string; issuer: string; year: string }>;
  references: Reference[];
};

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
}

export async function getResumeData(): Promise<ResumeData> {
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  // Defensive fallback — older JSON files may not have this field
  if (!Array.isArray(parsed.references)) parsed.references = [];
  return parsed as ResumeData;
}

export async function saveResumeData(data: ResumeData): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAuth();
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    revalidatePath("/resume");
    revalidatePath("/cv/print");
    revalidatePath("/references");
    return { ok: true };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
