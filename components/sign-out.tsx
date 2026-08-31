import { signOut } from "next-auth/react";
import { ReactElement } from "react";

export function UserButton(): ReactElement {
  const handleSignOut = (): void => {
    signOut().catch((error: Error) => {
      console.error("Sign out error:", error);
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="bg-gray-200 text-gray-700 rounded-full font-medium text-sm px-4 py-2 hover:bg-gray-300 transition-colors"
    >
      Sign Out
    </button>
  );
}
