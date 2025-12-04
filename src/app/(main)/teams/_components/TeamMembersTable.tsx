"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Link2,
  MoreHorizontal,
  Search,
  UserX,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useUserStore } from "@/store/user.store";
import {
  TeamMember,
  TeamMemberStatus,
  TeamResponse,
  TeamRolesEnum,
} from "@/types/team.types";

// ============================================================================
// Types
// ============================================================================
interface MembersTableProps {
  members: TeamMember[];
  team: TeamResponse;
  canManage: boolean;
  onRemove: (memberId: string) => void;
  onRoleChange: (memberId: string, role: TeamRolesEnum) => void;
  isRemoving: boolean;
  isUpdatingRole: boolean;
}

// ============================================================================
// Cell Components
// ============================================================================
const MemberNameCell = ({
  member,
  isCurrentUser,
}: {
  member: TeamMember;
  isCurrentUser: boolean;
}) => (
  <div className="flex items-center gap-3">
    <Avatar className="h-9 w-9">
      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
        {member.name?.charAt(0).toUpperCase() ||
          member.email?.charAt(0).toUpperCase() ||
          "U"}
      </AvatarFallback>
    </Avatar>
    <div className="flex flex-col">
      <span className="font-medium text-sm">
        {member.name || member.email || "Unknown"}
        {isCurrentUser && " (You)"}
      </span>
      <span className="text-xs text-muted-foreground">{member.email}</span>
    </div>
  </div>
);

const RoleCell = ({
  member,
  isOwner,
  canManage,
  onRoleChange,
  isUpdatingRole,
}: {
  member: TeamMember;
  isOwner: boolean;
  canManage: boolean;
  onRoleChange: (memberId: string, role: TeamRolesEnum) => void;
  isUpdatingRole: boolean;
}) => {
  if (isOwner) {
    return (
      <Badge variant={getRoleBadgeVariant(TeamRolesEnum.OWNER)}>Owner</Badge>
    );
  }

  if (canManage) {
    return (
      <Select
        value={member.role || TeamRolesEnum.MEMBER}
        onValueChange={(value) =>
          onRoleChange(member.id, value as TeamRolesEnum)
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
    );
  }

  return (
    <Badge variant={getRoleBadgeVariant(member.role)}>
      {formatTeamRole(member.role)}
    </Badge>
  );
};

const StatusCell = ({ status }: { status?: TeamMemberStatus }) => {
  const isInvited = status === TeamMemberStatus.INVITED;

  return isInvited ? (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
    >
      Invited
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
    >
      Active
    </Badge>
  );
};

const ActionsCell = ({
  member,
  isOwner,
  isCurrentUser,
  onRemove,
  isRemoving,
}: {
  member: TeamMember;
  teamId: string;
  isOwner: boolean;
  isCurrentUser: boolean;
  onRemove: (memberId: string) => void;
  isRemoving: boolean;
}) => {
  // Don't show actions for owner or current user
  if (isOwner || isCurrentUser) return null;

  const isInvited = member.status === TeamMemberStatus.INVITED;

  const handleCopyInviteLink = (inviteLink: string) => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied to clipboard");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={isRemoving}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isInvited && (
          <DropdownMenuItem
            onClick={() => handleCopyInviteLink(member.invitation_link!)}
            className="cursor-pointer"
          >
            <Link2 className="h-4 w-4 mr-2" />
            Copy Invite Link
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => onRemove(member.id)}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <UserX className="h-4 w-4 mr-2" />
          Revoke Access
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============================================================================
// Main Component
// ============================================================================
export const MembersTable = ({
  members,
  team,
  canManage,
  onRemove,
  onRoleChange,
  isRemoving,
  isUpdatingRole,
}: MembersTableProps) => {
  const { user } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

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

  // Build columns - only include actions column if user can manage
  const columns: ColumnDef<TeamMember>[] = useMemo(() => {
    const baseColumns: ColumnDef<TeamMember>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <MemberNameCell
            member={row.original}
            isCurrentUser={user?.id === row.original.id}
          />
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <RoleCell
            member={row.original}
            isOwner={row.original.id === team.owner.id}
            canManage={canManage}
            onRoleChange={onRoleChange}
            isUpdatingRole={isUpdatingRole}
          />
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusCell status={row.original.status} />,
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
    ];

    // Only add actions column if user can manage
    if (canManage) {
      baseColumns.push({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionsCell
            member={row.original}
            teamId={team.id}
            isOwner={row.original.id === team.owner.id}
            isCurrentUser={user?.id === row.original.id}
            onRemove={onRemove}
            isRemoving={isRemoving}
          />
        ),
      });
    }

    return baseColumns;
  }, [
    team,
    canManage,
    user?.id,
    onRemove,
    onRoleChange,
    isRemoving,
    isUpdatingRole,
  ]);

  const table = useReactTable({
    data: filteredMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  });

  const totalPages = table.getPageCount();
  const currentPage = pagination.pageIndex + 1;

  // Render table content (reused for both scroll and non-scroll cases)
  const renderTableContent = () => (
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
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search members by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {filteredMembers.length > 10 ? (
          <ScrollArea className="h-[500px]">{renderTableContent()}</ScrollArea>
        ) : (
          renderTableContent()
        )}
      </div>

      {/* Pagination */}
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
