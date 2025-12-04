"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronsUpDownIcon, Loader2, Search, XIcon } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { useUsersInfinite } from "@/hooks/useUsersInfinite";
import type { UserListItem } from "@/types/user.types";

// ============================================================================
// Types
// ============================================================================
export interface SelectedUser {
  id: string;
  name: string;
  email: string;
}

interface UserMultiSelectProps {
  selectedUsers: SelectedUser[];
  onSelectionChange: (users: SelectedUser[]) => void;
  excludeUserIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// ============================================================================
// Debounce Hook (inline for simplicity)
// ============================================================================
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Component
// ============================================================================
export function UserMultiSelect({
  selectedUsers,
  onSelectionChange,
  excludeUserIds = [],
  placeholder = "Select users...",
  disabled = false,
  className,
}: UserMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Combine excluded IDs with already selected user IDs
  const allExcludedIds = [...excludeUserIds, ...selectedUsers.map((u) => u.id)];

  const { users, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useUsersInfinite({
      search: debouncedSearch || undefined,
      enabled: open,
      excludeIds: allExcludedIds,
    });

  // Intersection observer for infinite scroll
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "100px",
  });

  // Fetch next page when sentinel is in view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Focus input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else {
      setSearchQuery("");
    }
  }, [open]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const handleSelectUser = useCallback(
    (user: UserListItem) => {
      const newUser: SelectedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
      };
      onSelectionChange([...selectedUsers, newUser]);
    },
    [selectedUsers, onSelectionChange]
  );

  const handleRemoveUser = useCallback(
    (userId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      onSelectionChange(selectedUsers.filter((u) => u.id !== userId));
    },
    [selectedUsers, onSelectionChange]
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            "flex h-auto min-h-10 w-full items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer",
            "hover:bg-accent hover:text-accent-foreground transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            disabled && "pointer-events-none opacity-50",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 overflow-hidden">
            {selectedUsers.length === 0 ? (
              <span className="text-muted-foreground font-normal">
                {placeholder}
              </span>
            ) : (
              selectedUsers.map((user) => (
                <Badge
                  key={user.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="truncate max-w-[120px]">{user.name}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleRemoveUser(user.id, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleRemoveUser(user.id);
                      }
                    }}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5 cursor-pointer"
                  >
                    <XIcon className="h-3 w-3" />
                    <span className="sr-only">Remove {user.name}</span>
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDownIcon className="h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </div>

        {/* Users List */}
        <div className="max-h-[300px] overflow-y-auto p-1">
          {isLoading && users.length === 0 ? (
            // Skeleton loading state
            <div className="space-y-2 p-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2 py-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {debouncedSearch ? "No users found" : "No available users"}
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent transition-colors",
                    "focus:outline-none focus:bg-accent"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium truncate">
                      {user.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </span>
                  </div>
                </button>
              ))}

              {/* Infinite scroll sentinel */}
              {hasNextPage && (
                <div ref={sentinelRef} className="flex justify-center py-2">
                  {isFetchingNextPage && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default UserMultiSelect;
