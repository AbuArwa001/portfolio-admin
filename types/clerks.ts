export interface ClerkEmailAddress {
  id: string;
  emailAddress: string;
  verification: {
    status: string;
    strategy: string;
  };
  linkedTo: Array<{
    id: string;
    type: string;
  }>;
}

export interface ClerkUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string;
  emailAddresses: ClerkEmailAddress[];
  primaryEmailAddressId: string | null;
  getToken: () => Promise<string>;
}

export interface ClerkUseUser {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: ClerkUser | null | undefined;
}
