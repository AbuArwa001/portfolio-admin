// components/search-dialog.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchableItem, useSearch } from "@/hooks/use-search";
import { useRouter } from "next/navigation";

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchData: SearchableItem[];
}

export function SearchDialog({
  isOpen,
  onOpenChange,
  searchData,
}: SearchDialogProps) {
  const { query, setQuery, results } = useSearch(searchData);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (item: SearchableItem) => {
    router.push(item.url);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Add DialogTitle for accessibility - visually hidden */}
        <DialogTitle asChild>
          <VisuallyHidden>Search</VisuallyHidden>
        </DialogTitle>
        <DialogDescription asChild>
          <VisuallyHidden>Search through portfolio content</VisuallyHidden>
        </DialogDescription>

        <div className="p-4 border-b">
          <Input
            ref={inputRef}
            placeholder="Search pages, projects, skills..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <ScrollArea className="max-h-80">
          {results.length > 0 ? (
            <div className="p-2">
              {results.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleSelect(item)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-secondary rounded-full">
                      {item.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found for &quot;{query}&quot;</p>
              <p className="text-sm mt-1">Try different keywords</p>
            </div>
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
