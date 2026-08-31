// components/search-button.tsx
"use client";

import { useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { SearchDialog } from "@/components/search-dialog";
import { SearchableItem } from "@/hooks/use-search";

interface SearchButtonProps {
  searchData: SearchableItem[];
}

export function SearchButton({ searchData }: SearchButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => setIsOpen(true)}
      >
        <IconSearch className="mr-2 h-4 w-4" />
        Search
      </Button>

      <SearchDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        searchData={searchData}
      />
    </>
  );
}
