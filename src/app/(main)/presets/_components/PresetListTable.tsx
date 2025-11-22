"use client";

import { useState, useMemo, useCallback } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PresetFilterPopover } from "./PresetFilterPopover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, RefreshCcw, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePresets } from "@/hooks/usePresets";
import type { PresetsFilterRequest } from "@/types/preset.types";
import { getPresetColumns } from "./PresetListColumns";
import { PresetDeleteDialog } from "./PresetDeleteDialog";
import { toast } from "sonner";
import type { PresetResponse } from "@/types/preset.types";
import { UserWithoutBrandAccess, useUserStore } from "@/store/user.store";

const PRESET_PAGE_SIZE = 15;

export const PresetListTable = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState<PresetResponse | null>(
    null
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState<PresetResponse | null>(
    null
  );

  const { user } = useUserStore();

  const [filters, setFilters] = useState<PresetsFilterRequest>({});

  const { presetsListQuery, deletePresetMutation } = usePresets({
    skip: (page - 1) * PRESET_PAGE_SIZE,
    limit: PRESET_PAGE_SIZE,
    filter: filters,
  });

  const {
    data: presetsData,
    isLoading,
    isFetching,
    refetch,
  } = presetsListQuery;
  const presets = useMemo(() => presetsData?.presets ?? [], [presetsData]);
  const totalCount = presetsData?.total ?? 0;
  const totalPages = Math.ceil(totalCount / PRESET_PAGE_SIZE);

  const handleEdit = useCallback(
    (preset: PresetResponse) => {
      // block non-platform-default admins from editing a master preset
      if (preset.is_master && user?.is_default_admin !== true) {
        toast.error("Only the platform default admin can edit master presets");
        return;
      }

      router.push(`/presets/${preset.id}`);
    },
    [router, user]
  );

  const handleClone = useCallback(
    (preset: PresetResponse) => {
      router.push(`/presets/new?to_clone=${preset.id}`);
    },

    [router]
  );

  const handleDeleteClick = useCallback((preset: PresetResponse) => {
    setPresetToDelete(preset);
    setDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (presetToDelete) {
      // Prevent master preset deletion from UI side as well
      if (presetToDelete.is_master) {
        toast.error("Master presets cannot be deleted");
        setDeleteDialogOpen(false);
        setPresetToDelete(null);
        return;
      }
      deletePresetMutation.mutate(presetToDelete.id, {
        onSuccess: () => {
          toast.success("Preset deleted successfully");
          setDeleteDialogOpen(false);
          setPresetToDelete(null);
          refetch();
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to delete preset");
        },
      });
    }
  }, [presetToDelete, deletePresetMutation, refetch]);

  const columns = useMemo(
    () =>
      getPresetColumns({
        onEdit: handleEdit,
        onClone: handleClone,
        onDelete: handleDeleteClick,
        user: user as UserWithoutBrandAccess,
      }),
    [handleEdit, handleClone, handleDeleteClick, user]
  );

  const table = useReactTable({
    data: presets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleNewPreset = useCallback(() => {
    router.push("/presets/new");
  }, [router]);

  return (
    <div className="w-full space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Preset Management</h1>
          {!isLoading && (
            <span className="text-sm text-muted-foreground">
              ({totalCount} presets)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search next to filters */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search presets"
              className="pl-9 w-[280px]"
              value={filters.name ?? ""}
              onChange={(e) => {
                setFilters({ ...filters, name: e.target.value || undefined });
                setPage(1);
              }}
            />
          </div>
          {/* Filter popover */}
          <PresetFilterPopover
            filter={filters}
            onChange={(newFilters) => {
              setFilters(newFilters);
              setPage(1);
            }}
          />

          <Button size="sm" onClick={handleNewPreset} className="h-9">
            <Plus className="h-4 w-4 mr-2" />
            New Preset
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh Presets"
            className="h-9 w-9"
          >
            <RefreshCcw
              className={cn(
                "h-4 w-4",
                isFetching ? "animate-spin" : "opacity-50"
              )}
            />
          </Button>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="flex flex-col flex-1 min-h-0 border rounded-lg overflow-hidden">
        {/* Table Header (separate, always visible) */}
        <Table style={{ tableLayout: "fixed", width: "100%" }}>
          <TableHeader className="bg-background border-b z-20">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                onClick={(e) => e.stopPropagation()}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="font-medium"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
        </Table>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-auto max-h-[calc(100vh-100px)]">
          <Table style={{ tableLayout: "fixed", width: "100%" }}>
            <TableBody>
              {isLoading || isFetching ? (
                Array.from({ length: PRESET_PAGE_SIZE }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, idx) => (
                      <TableCell key={idx}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : presets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center italic text-base py-20"
                  >
                    No presets found. Create your first preset.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/30",
                      selectedPreset?.id === row.original.id
                        ? "bg-muted/50"
                        : ""
                    )}
                    onClick={() => setSelectedPreset(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="py-3 px-4 flex items-center justify-between bg-background border-t">
          <div className="text-sm text-muted-foreground">
            {!isLoading && presets.length > 0 && (
              <span>
                Showing {(page - 1) * PRESET_PAGE_SIZE + 1}-
                {Math.min(page * PRESET_PAGE_SIZE, totalCount)} of {totalCount}{" "}
                presets
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm px-2">Page {page}</span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <PresetDeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setPresetToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        preset={presetToDelete}
        isDeleting={deletePresetMutation.isPending}
      />
    </div>
  );
};
