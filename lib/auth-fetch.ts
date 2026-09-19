import { getSession, signOut } from "next-auth/react";

export interface AuthFetchOptions extends RequestInit {
  token?: string;
  autoSignOutOn401?: boolean;
}

export async function authenticatedFetch(
  url: string,
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { token, autoSignOutOn401 = true, headers: optHeaders, ...rest } = options;

  let activeToken = token;
  if (!activeToken && typeof window !== "undefined") {
    const session = await getSession();
    activeToken = (session as any)?.accessToken;
  }

  const headers = new Headers(optHeaders);
  if (activeToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${activeToken}`);
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers,
    });

    if (response.status === 401) {
      console.warn(`[401 Unauthorized] on ${url}. Session expired.`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        if (autoSignOutOn401) {
          setTimeout(() => {
            signOut({ callbackUrl: "/auth/signin?expired=true" });
          }, 1500);
        }
      }
    }

    return response;
  } catch (error) {
    console.error(`Fetch exception for ${url}:`, error);
    throw error;
  }
}
