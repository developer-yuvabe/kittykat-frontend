"use client";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/custom-icon";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppConfig } from "@/config/app.config";
import { useTeams } from "@/hooks/useTeams";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getTeamTableColumns } from "./TeamTableColumns";
import { debounce } from "lodash";
import { TeamCreateDialog } from "./TeamCreateDialog";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/user.store";
import { canEditTeamDetails } from "@/lib/team.utils";

export const TeamsTable = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = AppConfig.TABLE_VIEW_LIMIT;
  const skip = (page - 1) * limit;

  const { user } = useUserStore();
  const canCreate = canEditTeamDetails(user);

  const { teamsListQuery } = useTeams({
    skip,
    limit,
    search: searchTerm,
  });

  const { data, isLoading, refetch, isRefetching } = teamsListQuery;

  console.log("Teams Data:", data);

  const columns = useMemo(
    () => getTeamTableColumns(page, limit),
    [page, limit]
  );

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      setPage(1);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  const table = useReactTable({
    data: data?.teams || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((data?.total || 0) / limit),
  });

  return (
    <div className="w-full space-y-4 h-full flex flex-col">
      {/* --- Top Controls --- */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold leading-0">Team Management</h1>
        </div>
        <div className="flex items-center gap-2 rounded-md w-max">
          <Button
            size={"icon"}
            variant="outline"
            onClick={() => {
              refetch();
            }}
            disabled={isRefetching}
            title="Refresh Teams"
            aria-label="Refresh Teams"
          >
            <RefreshCcw
              className={cn(
                "size-4",
                isRefetching ? "animate-spin" : "opacity-50"
              )}
            />
          </Button>
          <div className="flex h-9 items-center border-2 rounded-md pl-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for teams"
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm placeholder:text-muted-foreground border-0 outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-transparent"
            />
          </div>
          {canCreate && <TeamCreateDialog />}
        </div>
      </div>
      {/* --- Table Wrapper --- */}
      <div className="flex flex-col flex-1 min-h-0 border rounded-lg overflow-hidden">
        {/* --- Scrollable Table --- */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted z-10 border-b border-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, idx) => (
                      <TableCell key={idx}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center italic text-base py-20"
                  >
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/5"
                    onClick={(e) => {
                      const target = e.target as HTMLElement | null;
                      // If clicking an interactive element inside the row, don't navigate
                      if (
                        target?.closest(
                          "a,button,input,select,textarea,[role=button],[data-no-row-click]"
                        )
                      ) {
                        return;
                      }
                      router.push(`/teams/${(row.original as any).id}`);
                    }}
                    tabIndex={0}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
        {/* --- Sticky Footer --- */}
        <div className="py-2 px-4 flex items-center justify-end gap-x-4 bg-white border-t">
          {!isLoading && (
            <span className="text-sm">
              Showing {(page - 1) * limit + 1}-
              {Math.min(page * limit, data?.total || 0)} of {data?.total || 0}{" "}
              teams
            </span>
          )}

          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={data ? data.teams.length < limit : true || isLoading}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
