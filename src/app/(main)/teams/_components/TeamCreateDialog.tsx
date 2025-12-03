"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GemIcon, Info, Plus, X } from "lucide-react";
import { teamCreateSchema } from "@/schema/team.schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AppConfig } from "@/config/app.config";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserStore } from "@/store/user.store";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select-dropdown";
import { cn } from "@/lib/utils";
import { useTeams } from "@/hooks/useTeams";
import { useBrandStore } from "@/store/brand.store";
import { TeamRolesEnum } from "@/types/team.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditIcon } from "@/components/ui/custom-icon";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { fetchAllUsers } from "@/services/api/user.service";
import { isKKAdmin } from "@/lib/team.utils";

type TeamCreateFormData = z.infer<typeof teamCreateSchema>;

interface MemberWithRole {
  id: string;
  role: TeamRolesEnum;
}

export function TeamCreateDialog() {
  const [open, setOpen] = useState(false);
  const { user: currentUser } = useUserStore();
  const { brands } = useBrandStore();
  const { createTeam } = useTeams();

  // Fetch all users for member selection
  const { data: usersData } = useQuery({
    queryKey: ["users", "all"],
    queryFn: () => fetchAllUsers(1, 50),
    enabled: open,
  });

  const users = usersData?.users || [];

  const [selectedMembers, setSelectedMembers] = useState<MemberWithRole[]>([]);

  const form = useForm<TeamCreateFormData>({
    resolver: zodResolver(teamCreateSchema),
    defaultValues: {
      name: "",
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
      members: [],
      brands: [],
      has_all_brands_access: false,
    },
    mode: "onSubmit",
  });

  const handleOpen = () => {
    setOpen(true);
    setSelectedMembers([]);
    form.reset({
      name: "",
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
      members: [],
      brands: [],
      has_all_brands_access: false,
    });
  };

  const onSubmit = async (data: TeamCreateFormData) => {
    setOpen(false);
    form.reset();
    setSelectedMembers([]);

    const payload = {
      ...data,
      members: selectedMembers,
      // If has_all_brands_access is true, clear the brands array
      brands: data.has_all_brands_access ? [] : data.brands,
    };

    toast.promise(createTeam(payload), {
      loading: "Creating team...",
      success: () => {
        return "Team created successfully!";
      },
      error: () => {
        return "Failed to create team. Please try again.";
      },
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMembers([]);
    form.reset();
  };

  const handleRoleChange = (userId: string, role: TeamRolesEnum) => {
    setSelectedMembers((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, role } : m))
    );
  };

  const selectedMemberIds = selectedMembers.map((m) => m.id);

  return (
    <>
      <Button onClick={handleOpen}>
        <Plus />
        Create Team
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={cn(
              "relative bg-background text-foreground rounded-lg shadow-lg p-6 w-full max-w-xl mx-4",
              "sm:max-w-2xl max-h-[90vh] overflow-y-auto"
            )}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Create Team</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the details to create a new team. Click save when
                  you&apos;re done.
                </p>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Team Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Team Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Credits and Tokens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tokens</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Input
                                type="text"
                                inputMode="numeric"
                                min={AppConfig.CREDITS.MIN}
                                max={AppConfig.CREDITS.MAX}
                                {...field}
                                value={
                                  typeof field.value === "number"
                                    ? field.value.toLocaleString()
                                    : field.value || ""
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/,/g, "");
                                  if (raw === "") {
                                    field.onChange(0);
                                  } else {
                                    const numValue = parseInt(raw, 10);
                                    if (
                                      !isNaN(numValue) &&
                                      numValue >= AppConfig.CREDITS.MIN &&
                                      numValue <= AppConfig.CREDITS.MAX
                                    ) {
                                      field.onChange(numValue);
                                    }
                                  }
                                }}
                                placeholder="Enter tokens"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentValue = field.value || 0;
                                    const newValue = currentValue + 5000;
                                    if (newValue <= AppConfig.CREDITS.MAX) {
                                      field.onChange(newValue);
                                    }
                                  }}
                                >
                                  +5000
                                  <GemIcon size={14} className="ml-1" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentValue = field.value || 0;
                                    const newValue = currentValue + 10000;
                                    if (newValue <= AppConfig.CREDITS.MAX) {
                                      field.onChange(newValue);
                                    }
                                  }}
                                >
                                  +10000
                                  <GemIcon size={14} className="ml-1" />
                                </Button>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="credits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credits</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Input
                                type="text"
                                inputMode="numeric"
                                min={AppConfig.CREDITS.MIN}
                                max={AppConfig.CREDITS.MAX}
                                {...field}
                                value={
                                  typeof field.value === "number"
                                    ? field.value.toLocaleString()
                                    : field.value || ""
                                }
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/,/g, "");
                                  if (raw === "") {
                                    field.onChange(0);
                                  } else {
                                    const numValue = parseInt(raw, 10);
                                    if (
                                      !isNaN(numValue) &&
                                      numValue >= AppConfig.CREDITS.MIN &&
                                      numValue <= AppConfig.CREDITS.MAX
                                    ) {
                                      field.onChange(numValue);
                                    }
                                  }
                                }}
                                placeholder="Enter credits"
                              />
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentValue = field.value || 0;
                                    const newValue = currentValue + 500;
                                    if (newValue <= AppConfig.CREDITS.MAX) {
                                      field.onChange(newValue);
                                    }
                                  }}
                                >
                                  +500
                                  <CreditIcon size={14} className="ml-1" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentValue = field.value || 0;
                                    const newValue = currentValue + 1000;
                                    if (newValue <= AppConfig.CREDITS.MAX) {
                                      field.onChange(newValue);
                                    }
                                  }}
                                >
                                  +1000
                                  <CreditIcon size={14} className="ml-1" />
                                </Button>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Brand Access */}
                  <div className="space-y-4">
                    <FormLabel>Brand Access</FormLabel>

                    {/* All Brands Access Toggle - Only visible to KK-ADMIN */}
                    {isKKAdmin(currentUser) && (
                      <FormField
                        control={form.control}
                        name="has_all_brands_access"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-sm font-normal cursor-pointer mb-0">
                                Allow access to all brands
                              </FormLabel>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p>
                                    When enabled, this team will have access to
                                    all existing and future brands without
                                    needing to select them individually.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Brand Selection - Hidden when has_all_brands_access is true */}
                    {!form.watch("has_all_brands_access") && (
                      <FormField
                        control={form.control}
                        name="brands"
                        render={({ field }) => (
                          <FormItem>
                            <MultiSelect
                              values={field.value || []}
                              onValuesChange={field.onChange}
                            >
                              <FormControl>
                                <MultiSelectTrigger className="w-full">
                                  <MultiSelectValue
                                    overflowBehavior="cutoff"
                                    placeholder="Select brands"
                                  />
                                </MultiSelectTrigger>
                              </FormControl>
                              <MultiSelectContent
                                search={{
                                  placeholder: "Search brands...",
                                  emptyMessage: "No brands found",
                                }}
                              >
                                <MultiSelectGroup>
                                  {brands.map((brand) => (
                                    <MultiSelectItem
                                      key={brand.id}
                                      value={brand.id}
                                      badgeLabel={brand.name}
                                    >
                                      <div className="flex items-start gap-2 w-full">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback className="bg-blue-500 text-white">
                                            {brand.name
                                              ?.charAt(0)
                                              .toUpperCase() || "B"}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                          <span className="break-words">
                                            {brand.name}
                                          </span>
                                          <span className="italic text-xs text-muted-foreground">
                                            Created by{" "}
                                            {brand.created_by.id ===
                                            currentUser?.id
                                              ? "You"
                                              : brand.created_by.name}
                                          </span>
                                        </div>
                                      </div>
                                    </MultiSelectItem>
                                  ))}
                                </MultiSelectGroup>
                              </MultiSelectContent>
                            </MultiSelect>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Members */}
                  <div className="space-y-3">
                    <FormLabel>Team Members (Optional)</FormLabel>
                    <MultiSelect
                      values={selectedMemberIds}
                      onValuesChange={(values) => {
                        // Handle member selection
                        const newMembers = values.map((userId) => {
                          const existing = selectedMembers.find(
                            (m) => m.id === userId
                          );
                          return (
                            existing || {
                              id: userId,
                              role: TeamRolesEnum.MEMBER,
                            }
                          );
                        });
                        setSelectedMembers(newMembers);
                      }}
                    >
                      <MultiSelectTrigger className="w-full">
                        <MultiSelectValue
                          overflowBehavior="cutoff"
                          placeholder="Select team members"
                        />
                      </MultiSelectTrigger>
                      <MultiSelectContent
                        search={{
                          placeholder: "Search users...",
                          emptyMessage: "No users found",
                        }}
                      >
                        <MultiSelectGroup>
                          {users.map((user) => (
                            <MultiSelectItem
                              key={user.id}
                              value={user.id}
                              badgeLabel={user.name}
                            >
                              <div className="flex items-start gap-2 w-full">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {user.name?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="break-words">
                                    {user.name}
                                  </span>
                                  <span className="italic text-xs text-muted-foreground">
                                    {user.email}
                                  </span>
                                </div>
                              </div>
                            </MultiSelectItem>
                          ))}
                        </MultiSelectGroup>
                      </MultiSelectContent>
                    </MultiSelect>

                    {/* Selected Members with Role Selection */}
                    {selectedMembers.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm font-medium">
                          Assign Roles to Members:
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                          {selectedMembers.map((member) => {
                            const user = users.find((u) => u.id === member.id);
                            return (
                              <div
                                key={member.id}
                                className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <Avatar className="h-6 w-6 shrink-0">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                      {user?.name?.charAt(0).toUpperCase() ||
                                        "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm truncate">
                                    {user?.name || "Unknown"}
                                  </span>
                                </div>
                                <Select
                                  value={member.role}
                                  onValueChange={(value) =>
                                    handleRoleChange(
                                      member.id,
                                      value as TeamRolesEnum
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={TeamRolesEnum.OWNER}>
                                      Owner
                                    </SelectItem>
                                    <SelectItem value={TeamRolesEnum.ADMIN}>
                                      Admin
                                    </SelectItem>
                                    <SelectItem value={TeamRolesEnum.MEMBER}>
                                      Member
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        form.formState.isValidating ||
                        form.formState.isSubmitting
                      }
                    >
                      Create Team
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
