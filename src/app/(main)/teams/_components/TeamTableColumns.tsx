import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TeamListResponse } from "@/types/team.types";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreHorizontal, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { TeamDeleteDialog } from "./TeamDeleteDialog";
import { useUserStore } from "@/store/user.store";
import { canDeleteTeam } from "@/lib/team.utils";
import { format } from "date-fns";

export function getTeamTableColumns(
  page: number,
  limit: number
): ColumnDef<TeamListResponse>[] {
  return [
    {
      id: "serial",
      header: "S.No",
      cell: ({ row }) => {
        const index = row.index;
        return <span>{(page - 1) * limit + index + 1}</span>;
      },
    },
    {
      accessorKey: "name",
      header: "Team Name",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              {team.avatar_url && (
                <AvatarImage src={team.avatar_url} alt={team.name} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {team.name?.charAt(0).toUpperCase() || "T"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{team.name}</span>
              <span className="text-xs text-muted-foreground">
                ID: {team.id}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "owner_id",
      header: "Owner",
      cell: ({ row }) => {
        const team = row.original;
        const { user } = useUserStore();
        const isCurrentUser = user?.id === team.owner?.id;

        return (
          <span className="text-sm">
            {team.owner
              ? `${team.owner.name}${isCurrentUser ? " (You)" : ""}`
              : "Unknown"}
          </span>
        );
      },
    },
    {
      accessorKey: "members_count",
      header: "Members",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {team.members_count}
          </Badge>
        );
      },
    },
    {
      accessorKey: "credits",
      header: "Credits",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <span className="font-mono text-sm">
            {team.credits.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "tokens",
      header: "Tokens",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <span className="font-mono text-sm">
            {team.tokens.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "brands_count",
      header: "Brands",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <Badge variant="outline" className="gap-1">
            {team.brands_count}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const team = row.original;
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(team.created_at), "dd MMM yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const team = row.original;
        const { user } = useUserStore();
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

        return (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/teams/${team.id}`}
                    className="flex items-center cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {canDeleteTeam(user) && (
                  <>
                    <DropdownMenuSeparator />
                    {team.is_personal_team ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <DropdownMenuItem
                              disabled
                              className="text-muted-foreground"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>This team can&apos;t be deleted.</p>
                          <p>To delete, you need to delete the owner.</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Team
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {deleteDialogOpen && (
              <TeamDeleteDialog
                team={team}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              />
            )}
          </>
        );
      },
    },
  ];
}
