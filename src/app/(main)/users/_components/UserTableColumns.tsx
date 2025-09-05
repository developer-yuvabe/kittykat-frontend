import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserListItem, UserListResponse, UserStatus } from "@/types/user.types";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { EllipsisIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { deleteUser, resendInvitation } from "@/services/api/user.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { EditUser } from "./EditUser";

export const getUserTableColumns = (
  page: number,
  limit: number,
  searchTerm: string | undefined = ""
): ColumnDef<UserListItem>[] => [
  {
    header: "#",
    accessorKey: "id",
    cell: ({ row }) => (
      <p className="text-muted-foreground">
        {row.index + 1 + (page - 1) * limit}
      </p>
    ),
  },
  {
    header: "Name",
    accessorKey: "name",
    cell: ({ row }) => {
      return row.original.name ? (
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback className="bg-primary text-white">
              {row.original.name
                ? row.original.name.charAt(0).toUpperCase()
                : row.original.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p>{row.original.name}</p>
        </div>
      ) : (
        <p>-</p>
      );
    },
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Created At",
    accessorKey: "created_at",
    cell: ({ row }) => format(new Date(row.original.created_at), "dd MMM yyyy"),
  },
  {
    header: "Role",
    accessorKey: "role.id",
    cell: ({ row }) => (
      <Badge
        className={cn("uppercase border", {
          "border-primary bg-primary/10 text-primary":
            row.original.role.id === "KK-ADMIN",
          "border-muted-foreground bg-muted text-muted-foreground":
            row.original.role.id === "KK-USER",
        })}
      >
        {row.original.role.id === "KK-ADMIN" ? "Admin" : "User"}
      </Badge>
    ),
  },
  {
    header: "Status",
    accessorKey: "role.status",
    cell: ({ row }) => (
      <Badge
        className={cn("uppercase border", {
          "border-[#22C55E] bg-[#22C55E]/10 text-[#22C55E]":
            row.original.status === UserStatus.ACTIVE,
          "border-[#00bde3] bg-[#00bde3]/10 text-[#00bde3]":
            row.original.status === UserStatus.INVITED,
        })}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    header: "Content filter",
    accessorKey: "role.content_filter_disabled",
    cell: ({ row }) => (
      <Badge
        className={cn("uppercase border", {
          "border-primary bg-primary/10 text-primary":
            row.original.content_filter_disabled === false,
          "border-destructive bg-destructive/10 text-destructive":
            row.original.content_filter_disabled === true,
        })}
      >
        {row.original.content_filter_disabled ? "Disabled" : "Enabled"}
      </Badge>
    ),
  },
  {
    header: "Brand Access",
    accessorKey: "brand_access",
    cell: ({ row }) => {
      const INIT_BRANDS_TO_SHOW = 3;
      const [showAllBrands, setShowAllBrands] = useState(false);
      const role = row.original.role?.id;
      if (role === "KK-ADMIN") {
        return <p className="italic">All brands</p>;
      }

      return row.original.brand_access!.length ? (
        <div className="flex flex-wrap gap-2">
          {row.original
            .brand_access!.slice(
              0,
              showAllBrands ? undefined : INIT_BRANDS_TO_SHOW
            )
            .map((brand) => (
              <Badge key={brand.id} className="border">
                {brand.name}
              </Badge>
            ))}
          {row.original.brand_access!.length > INIT_BRANDS_TO_SHOW && (
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setShowAllBrands((p) => !p)}
            >
              {showAllBrands
                ? "Show Less"
                : `Show all (${row.original.brand_access!.length})`}
            </Button>
          )}
        </div>
      ) : (
        "—"
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const [open, setOpen] = useState(false);
      const [isActionsDisabled, setIsActionsDisabled] = useState(false);
      const queryClient = useQueryClient();

      const handleRevokeAccess = async () => {
        setIsActionsDisabled(true);

        toast.promise(deleteUser(row.original.id), {
          loading: "Revoking access...",
          success: () => {
            queryClient.setQueryData<UserListResponse>(
              ["users", page, limit, searchTerm],
              (oldData) => {
                if (!oldData) return oldData;

                return {
                  ...oldData,
                  users: oldData.users.filter(
                    (user) => user.id !== row.original.id
                  ),
                };
              }
            );
            return "Access revoked successfully.";
          },
          error: (e) => {
            console.log(e);
            return "Failed to revoke access.";
          },
          finally: () => {
            setIsActionsDisabled(false);
          },
        });
      };

      const handleResendInvite = () => {
        toast.promise(resendInvitation(row.original.id!), {
          loading: "Resending invite...",
          success: () => {
            return "Invite resent successfully.";
          },
          error: "Failed to resend invite.",
        });
      };

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto flex">
              <Button variant="ghost" size="icon" className="">
                <EllipsisIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-max">
              {row.original.status === UserStatus.ACTIVE && (
                <>
                  <DropdownMenuItem
                    disabled={
                      isActionsDisabled || row.original.is_default_admin
                    }
                    onClick={() => setOpen(true)}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {row.original.invitation_link && (
                <>
                  <DropdownMenuItem
                    disabled={isActionsDisabled}
                    onClick={handleResendInvite}
                  >
                    Resend Invite
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem
                variant="destructive"
                disabled={isActionsDisabled || row.original.is_default_admin}
                onClick={handleRevokeAccess}
              >
                Revoke Access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <EditUser
            user={row.original}
            isOpen={open}
            setIsOpen={setOpen}
            queryKey={["users", page, limit, searchTerm]}
          />
        </>
      );
    },
  },
];
