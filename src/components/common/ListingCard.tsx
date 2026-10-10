import type { ReactNode } from "react";

interface ListingCardProps {
  children: ReactNode;
}

export function ListingCard({ children }: ListingCardProps) {
  return (
    <div className="p-2 w-full max-w-[1600px] mx-auto">
      <div className="bg-card text-card-foreground rounded-lg border border-border shadow-xs p-3 space-y-3 transition-colors">
        {children}
      </div>
    </div>
  );
}
