import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
          const res = await fetch(`${API_URL}/api/v1/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            console.error("DRF Login failed:", res.status);
            return null;
          }

          const data = await res.json();

          if (data.access) {
            // Fetch user profile if possible
            let name = "Admin User";
            let email = credentials.email;
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
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
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
      }
      return session;
    },
  },
};
