"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal, Copy, Edit, Trash2, Crown } from "lucide-react";
import { useBrandStore } from "@/store/brand.store";
import type { PresetResponse } from "@/types/preset.types";

interface PresetListColumnsProps {
  onEdit: (preset: PresetResponse) => void;
  onClone: (preset: PresetResponse) => void;
  onDelete: (preset: PresetResponse) => void;
}

export function getPresetColumns({
  onEdit,
  onClone,
  onDelete,
}: PresetListColumnsProps): ColumnDef<PresetResponse>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const name = row.getValue("name") as string;
        const isMaster = row.original.is_master;
        return (
          <div className="flex items-center gap-2 font-medium">
            {name}
            {isMaster && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Crown className="h-4 w-4 text-amber-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Master preset - available to all brands
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground truncate max-w-xs">
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <Badge variant={type === "generic" ? "default" : "outline"}>
            {type === "generic" ? "Generic" : "Custom"}
          </Badge>
        );
      },
    },

    {
      accessorKey: "brand_ids",
      header: "Assigned Brands",
      cell: ({ row }) => (
        <PresetBrandsList brandIds={row.getValue("brand_ids")} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <PresetActionsCell
          preset={row.original}
          onEdit={onEdit}
          onClone={onClone}
          onDelete={onDelete}
        />
      ),
    },
  ];
}

function PresetBrandsList({ brandIds }: { brandIds?: string[] }) {
  const brands = useBrandStore((state) => state.brands);

  if (!brandIds || brandIds.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const brandNames = brandIds
    .map((id) => brands.find((b) => b.id === id)?.name)
    .filter(Boolean);

  if (brandNames.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {brandNames.slice(0, 2).map((name, idx) => (
        <Badge key={idx} variant="outline" className="text-xs">
          {name}
        </Badge>
      ))}
      {brandNames.length > 2 && (
        <Badge variant="outline" className="text-xs">
          +{brandNames.length - 2}
        </Badge>
      )}
    </div>
  );
}

function PresetActionsCell({
  preset,
  onEdit,
  onClone,
  onDelete,
}: {
  preset: PresetResponse;
  onEdit: (preset: PresetResponse) => void;
  onClone: (preset: PresetResponse) => void;
  onDelete: (preset: PresetResponse) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(preset)} className="gap-2">
          <Edit className="h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onClone(preset)} className="gap-2">
          <Copy className="h-4 w-4" />
          <span>Clone</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(preset)}
          className="gap-2 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
