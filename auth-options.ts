import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiUrl } from "@/lib/config";

function parseJwtExp(token: string): number {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const parsed = JSON.parse(jsonPayload);
    return (parsed.exp || 0) * 1000;
  } catch {
    return Date.now() + 55 * 60 * 1000;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const API_URL = getApiUrl();
          const username = credentials.email.trim();
          const res = await fetch(`${API_URL}/api/v1/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: username,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errText = await res.text().catch(() => "");
            console.error("DRF Login failed:", res.status, errText);
            return null;
          }

          const data = await res.json();

          if (data.access) {
            let name = "Admin User";
            let email = username;
            try {
              const meRes = await fetch(`${API_URL}/api/v1/auth/me/`, {
                headers: { Authorization: `Bearer ${data.access}` },
              });
              if (meRes.ok) {
                const meData = await meRes.json();
                if (meData.first_name || meData.last_name) {
                  name = `${meData.first_name || ""} ${meData.last_name || ""}`.trim();
                } else if (meData.username) {
                  name = meData.username;
                }
                if (meData.email) email = meData.email;
              }
            } catch (e) {
              console.warn("Could not fetch user profile details:", e);
            }

            return {
              id: "1",
              email: email,
              name: name,
              accessToken: data.access,
              refreshToken: data.refresh,
            } as any;
          }

          return null;
        } catch (e) {
          console.error("DRF Login error:", e);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "khalfan-portfolio-admin-secret-2026",
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.accessTokenExpires = parseJwtExp((user as any).accessToken);
        token.name = user.name;
        token.email = user.email;
        token.error = undefined;
        return token;
      }

      // Check if token needs refresh (either explicit update or nearing expiration within 3 mins)
      const isExpiringSoon =
        typeof token.accessTokenExpires === "number" &&
        Date.now() > token.accessTokenExpires - 3 * 60 * 1000;

      if (trigger !== "update" && !isExpiringSoon) {
        return token;
      }

      if (!token.refreshToken) {
        return { ...token, error: "TokenExpired" };
      }

      try {
        const API_URL = getApiUrl();
        const res = await fetch(`${API_URL}/api/v1/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: token.refreshToken }),
        });

        if (!res.ok) {
          console.error("Token refresh failed, status:", res.status);
          return { ...token, error: "TokenExpired" };
        }

        const data = await res.json();
        return {
          ...token,
          accessToken: data.access,
          accessTokenExpires: parseJwtExp(data.access),
          refreshToken: data.refresh ?? token.refreshToken,
          error: undefined,
        };
      } catch (err) {
        console.error("Token refresh exception:", err);
        return { ...token, error: "TokenExpired" };
      }
    },
    async session({ session, token }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.name = token.name as string;
          session.user.email = token.email as string;
        }
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
        (session as any).accessTokenExpires = token.accessTokenExpires;
        (session as any).error = token.error;
      }
      return session;
    },
  },
};

