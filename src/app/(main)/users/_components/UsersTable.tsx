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
import { fetchAllUsers } from "@/services/api/user.service";
import { useQuery } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { getUserTableColumns } from "./UserTableColumns";
import { debounce } from "lodash";
import { InviteUser } from "./InviteUser";
import { cn } from "@/lib/utils";

export const UsersTable = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const limit = AppConfig.TABLE_VIEW_LIMIT;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users", page, limit, searchTerm],
    queryFn: () => fetchAllUsers(page, AppConfig.TABLE_VIEW_LIMIT, searchTerm),
  });
  const columns = useMemo(
    () => getUserTableColumns(page, limit),
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
    data: data?.users || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil((data?.pagination.total || 0) / limit),
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 justify-center">
          <h1 className="text-2xl font-semibold ">User Management</h1>
          <button
            onClick={() => refetch()}
            className={cn("text-muted-foreground", {
              "animate-spin": isRefetching,
            })}
            aria-label="Refresh Users"
            disabled={isRefetching}
          >
            <RefreshCcw size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-md w-max">
          <div className="flex h-9 items-center border-2 rounded-md pl-3">
            <SearchIcon className="size-4 shrink-0 opacity-50" />
            <Input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search for users"
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm placeholder:text-muted-foreground border-0 outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-transparent"
            />
          </div>
          <InviteUser />
        </div>
      </div>
      <div className="flex flex-col flex-1 h-[85%] border rounded-lg overflow-hidden">
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
          <TableBody className="mb-40">
            {isLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.id}>
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
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
      <div className="py-2 px-4 flex items-center justify-end gap-x-4">
        {!isLoading && (
          <span className="text-sm">
            Showing {(page - 1) * limit + 1}-
            {Math.min(page * limit, data?.pagination.total || 0)} of{" "}
            {data?.pagination.total || 0} users
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
          disabled={data ? data.users.length < limit : true || isLoading}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
