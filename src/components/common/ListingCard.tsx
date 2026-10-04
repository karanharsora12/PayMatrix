import type { ReactNode } from "react";

interface ListingCardProps {
  children: ReactNode;
}

export function ListingCard({ children }: ListingCardProps) {
  return (
    <div className="p-2 w-full max-w-[1600px] mx-auto">
      <div className="bg-white rounded-sm border border-gray-100/80 shadow-xs p-2 space-y-3">
        {children}
      </div>
    </div>
  );
}
