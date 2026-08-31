// hooks/use-search.ts
"use client";

import { useState, useMemo } from "react";

// Define searchable content types
export interface SearchableItem {
  id: string;
  title: string;
  description: string;
  url: string;
  type: "page" | "project" | "skill" | "blog";
  tags?: string[];
}

export const useSearch = (searchData: SearchableItem[]) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();

    return searchData.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }, [query, searchData]);

  return {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
  };
};
