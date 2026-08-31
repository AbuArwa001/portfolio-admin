// components/GitHubStats.tsx
"use client";

import React from "react";
import LazyImage from "./LazyImage";

interface GitHubStatsProps {
  username: string;
  theme?: "default" | "dark" | "radical" | "merko" | "gruvbox" | "tokyonight";
}

const GitHubStats: React.FC<GitHubStatsProps> = ({
  username,
  theme = "default",
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">GitHub Stats</h2>
        <LazyImage
          src={`https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=${theme}&count_private=true&hide_border=true`}
          alt="GitHub Stats"
          className="w-full h-auto"
          width={500}
          height={200}
        />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Top Languages</h2>
        <LazyImage
          src={`https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=${theme}&hide_border=true&langs_count=8`}
          alt="Top Languages"
          className="w-full h-auto"
          width={500}
          height={200}
        />
      </div>
    </div>
  );
};

export default GitHubStats;
