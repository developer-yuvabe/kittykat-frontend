"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TeamBrand } from "@/types/team.types";
import { X } from "lucide-react";

interface TeamBrandsBadgeProps {
  brand: TeamBrand;
  onRemove?: () => void;
  isRemoving?: boolean;
}

export function TeamBrandsBadge({
  brand,
  onRemove,
  isRemoving,
}: TeamBrandsBadgeProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md group">
      <Avatar className="h-5 w-5">
        <AvatarFallback className="bg-blue-500 text-white text-xs">
          {brand.name?.charAt(0).toUpperCase() || "B"}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm">{brand.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          aria-label={`Remove ${brand.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
