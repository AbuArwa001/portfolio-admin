"use client";

import type { ReactElement } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
export function SignInButton(): ReactElement {
  const handleSignIn = (): void => {
    signIn().catch((error: Error) => {
      console.error("Sign in error:", error);
    });
  };

  return (
    <button
      onClick={handleSignIn}
      className="text-gray-700 hover:text-gray-900 font-medium text-sm sm:text-base"
    >
      Sign In
    </button>
  );
}

export function SignUpButton(): ReactElement {
  return (
    <Link
      href="/auth/signup"
      className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 flex items-center justify-center cursor-pointer hover:bg-[#5a3ae6] transition-colors"
    >
      Sign Up
    </Link>
  );
}
export function UserButton(): ReactElement {
  const { data: session } = useSession();

  const handleSignOut = (): void => {
    signOut().catch((error: Error) => {
      console.error("Sign out error:", error);
    });
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">
        {session?.user?.name || session?.user?.email}
      </span>
      <button
        onClick={handleSignOut}
        className="bg-gray-200 text-gray-700 rounded-full font-medium text-sm px-4 py-2 hover:bg-gray-300 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
