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
import { UserWithoutBrandAccess } from "@/store/user.store";

interface PresetListColumnsProps {
  onEdit: (preset: PresetResponse) => void;
  onClone: (preset: PresetResponse) => void;
  onDelete: (preset: PresetResponse) => void;
  user: UserWithoutBrandAccess;
}

export function getPresetColumns({
  onEdit,
  onClone,
  onDelete,
  user,
}: PresetListColumnsProps): ColumnDef<PresetResponse>[] {
  // NOTE: Master presets have special permissions:
  // - They cannot be deleted (Delete action disabled for all users)
  // - Only the platform default admin (user.is_default_admin === true) can edit them
  // Tooltips are shown for disabled actions to explain why they're disabled.
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
          user={user}
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
  user,
}: {
  preset: PresetResponse;
  onEdit: (preset: PresetResponse) => void;
  onClone: (preset: PresetResponse) => void;
  onDelete: (preset: PresetResponse) => void;
  user?: UserWithoutBrandAccess | null;
}) {
  const isMaster = !!preset.is_master;
  const canEditMaster = user?.is_default_admin === true;
  const editDisabled = isMaster && !canEditMaster;
  const deleteDisabled = isMaster;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* Edit — only default platform admin can edit master presets */}
        {editDisabled ? (
          <Tooltip>
            {/* Tooltip needs pointer events on the trigger — disabled Radix items have pointer-events: none, so we wrap the menu item */}
            <TooltipTrigger asChild>
              <div className="w-full">
                <DropdownMenuItem disabled className="gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              You do not have permission to edit master presets
            </TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuItem onClick={() => onEdit(preset)} className="gap-2">
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onClone(preset)} className="gap-2">
          <Copy className="h-4 w-4" />
          <span>Clone</span>
        </DropdownMenuItem>
        {deleteDisabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <DropdownMenuItem disabled className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </div>
            </TooltipTrigger>
            <TooltipContent>Master presets cannot be deleted</TooltipContent>
          </Tooltip>
        ) : (
          <DropdownMenuItem
            onClick={() => onDelete(preset)}
            className="gap-2 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
