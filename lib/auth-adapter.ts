import {
  Adapter,
  AdapterUser,
  AdapterSession,
  VerificationToken,
} from "next-auth/adapters";

// export interface DRFUser {
//   id: number;
//   email: string;
//   username?: string;
//   first_name?: string;
//   last_name?: string;
//   is_active?: boolean;
// }
export interface DRFUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  // username?: string;
}
export interface DRFSession {
  session_key: string;
  user: number;
  expire_date: string;
}

export interface DRFAccount {
  id: number;
  user: number;
  type: string;
  provider: string;
  provider_account_id: string;
}

export interface CredentialsResponse {
  user: DRFUser;
  access: string;
  refresh: string;
}

export class DRFAdapter implements Adapter {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async fetchDRF<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`DRF API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as T;
  }

  async createUser(user: Omit<AdapterUser, "id">): Promise<AdapterUser> {
    const drfUser: DRFUser = await this.fetchDRF("/auth/register/", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        first_name: user.name?.split(" ")[0] || "",
        last_name: user.name?.split(" ").slice(1).join(" ") || "",
        password: "temporary-password",
        password_confirm: "temporary-password",
      }),
    });

    return {
      id: drfUser.id.toString(),
      email: drfUser.email,
      emailVerified: null,
      name:
        `${drfUser.first_name || ""} ${drfUser.last_name || ""}`.trim() || undefined,
      image: null,
    };
  }

  async getUser(id: string): Promise<AdapterUser | null> {
    try {
      const drfUser: DRFUser = await this.fetchDRF(`/auth/users/${id}/`);
      return {
        id: drfUser.id.toString(),
        email: drfUser.email,
        emailVerified: null,
        name:
          `${drfUser.first_name || ""} ${drfUser.last_name || ""}`.trim() ||
          undefined,
        image: null,
      };
    } catch {
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<AdapterUser | null> {
    try {
      // Since your Django user model uses email as unique field, you might need
      // to create a custom endpoint or adjust your API to search by email
      const drfUser: DRFUser = await this.fetchDRF(
        `/auth/users/?email=${email}`
      );

      // If your endpoint returns a list, adjust accordingly:
      // const response: { results: DRFUser[] } = await this.fetchDRF(`/auth/users/?email=${email}`);
      // const drfUser = response.results[0];

      return {
        id: drfUser.id.toString(),
        email: drfUser.email,
        emailVerified: null,
        name:
          `${drfUser.first_name || ""} ${drfUser.last_name || ""}`.trim() ||
          undefined,
        image: null,
      };
    } catch {
      return null;
    }
  }

  async getUserByAccount(providerAccountId: {
    provider: string;
    providerAccountId: string;
  }): Promise<AdapterUser | null> {
    try {
      const response: { results: DRFAccount[] } = await this.fetchDRF(
        `/auth/accounts/?provider=${providerAccountId.provider}&provider_account_id=${providerAccountId.providerAccountId}`
      );

      if (response.results && response.results.length > 0) {
        const account = response.results[0];
        const user = await this.getUser(account.user.toString());
        return user;
      }
      return null;
    } catch {
      return null;
    }
  }

  async updateUser(
    user: Partial<AdapterUser> & Pick<AdapterUser, "id">
  ): Promise<AdapterUser> {
    const existingUser = await this.getUser(user.id);
    if (!existingUser) {
      throw new Error("User not found");
    }
    return { ...existingUser, ...user };
  }

  // async deleteUser(userId: string): Promise<void> {
  //   // Implement if needed
  // }

  //   async linkAccount(account: any): Promise<void> {
  //     await this.fetchDRF("/auth/accounts/", {
  //       method: "POST",
  //       body: JSON.stringify({
  //         user: parseInt(account.userId),
  //         type: account.type,
  //         provider: account.provider,
  //         provider_account_id: account.providerAccountId,
  //       }),
  //     });
  //   }

  // async unlinkAccount(providerAccountId: {
  //   provider: string;
  //   providerAccountId: string;
  // }): Promise<void> {
  //   // Implement if needed
  // }

  async createSession(session: {
    sessionToken: string;
    userId: string;
    expires: Date;
  }): Promise<AdapterSession> {
    return session;
  }

  
  async getSessionAndUser(sessionToken: string): Promise<{// eslint-disable-line @typescript-eslint/no-unused-vars
    session: AdapterSession;
    user: AdapterUser;
  } | null> {
    return null;
  }

  async updateSession(
    session: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken"> // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<AdapterSession | null> {
    return null;
  }

  async deleteSession(sessionToken: string): Promise<void> {// eslint-disable-line @typescript-eslint/no-unused-vars
    // Implement if needed
  }

  async createVerificationToken(
    verificationToken: VerificationToken
  ): Promise<VerificationToken> {
    return verificationToken;
  }

  async useVerificationToken(params: {// eslint-disable-line @typescript-eslint/no-unused-vars
    identifier: string;
    token: string;
  }): Promise<VerificationToken | null> {
    return null;
  }
}
