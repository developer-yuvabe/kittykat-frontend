"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatTeamRole, getRoleBadgeVariant } from "@/lib/team.utils";
import { TeamMember, TeamResponse, TeamRolesEnum } from "@/types/team.types";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserStore } from "@/store/user.store";

export const MembersTable = ({
  members,
  team,
  canChangeRole,
  canRemove,
  onRemove,
  onRoleChange,
  isRemoving,
  isUpdatingRole,
}: {
  members: TeamMember[];
  team: TeamResponse;
  canChangeRole: boolean;
  canRemove: boolean;
  onRemove: (memberId: string) => void;
  onRoleChange: (memberId: string, role: TeamRolesEnum) => void;
  isRemoving: boolean;
  isUpdatingRole: boolean;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(
      (member) =>
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query)
    );
  }, [members, searchQuery]);

  const columns: ColumnDef<TeamMember>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
          const { user } = useUserStore();
          const isCurrentUser = user?.id === row.original.id;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {row.original.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {row.original.name || "Unknown"}
                  {isCurrentUser && " (You)"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {row.original.email}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const isOwner = row.original.id === team.owner.id;
          return isOwner ? (
            <Badge variant={getRoleBadgeVariant(TeamRolesEnum.OWNER)}>
              Owner
            </Badge>
          ) : canChangeRole ? (
            <Select
              value={row.original.role || TeamRolesEnum.MEMBER}
              onValueChange={(value) =>
                onRoleChange(row.original.id, value as TeamRolesEnum)
              }
              disabled={isUpdatingRole}
            >
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TeamRolesEnum.ADMIN}>Admin</SelectItem>
                <SelectItem value={TeamRolesEnum.MEMBER}>Member</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getRoleBadgeVariant(row.original.role)}>
              {formatTeamRole(row.original.role)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "consumed_credits",
        header: "Credits Used",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.consumed_credits || 0}</span>
        ),
      },
      {
        accessorKey: "consumed_tokens",
        header: "Tokens Used",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.consumed_tokens || 0}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isOwner = row.original.id === team.owner.id;
          return canRemove && !isOwner ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onRemove(row.original.id)}
              disabled={isRemoving}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null;
        },
      },
    ],
    [
      team.owner.id,
      canChangeRole,
      canRemove,
      onRemove,
      onRoleChange,
      isRemoving,
      isUpdatingRole,
    ]
  );

  const table = useReactTable({
    data: filteredMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table with Conditional Fixed Height and Scroll */}
      <div className="border rounded-lg">
        {filteredMembers.length > 10 ? (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length > 0 ? (
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
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchQuery
                        ? "No members found matching your search"
                        : "No team members yet"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
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
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {searchQuery
                      ? "No members found matching your search"
                      : "No team members yet"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {table.getRowModel().rows.length} of{" "}
            {filteredMembers.length} members
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
