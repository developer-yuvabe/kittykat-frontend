"use client";
import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useModelsStore } from "@/store/models.store";
import { Info, Plus, X, GemIcon } from "lucide-react";
import { invitationSchema } from "@/schema/inviation.schema";
import { UserListResponse, UserRoleId } from "@/types/user.types";
import { TeamRolesEnum } from "@/types/team.types";
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
import { checkIfEmailExists, inviteUser } from "@/services/api/user.service";
import { useQueryClient } from "@tanstack/react-query";
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
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeams } from "@/hooks/useTeams";
import { CreditIcon } from "@/components/ui/custom-icon";

type InviteUserFormData = z.infer<typeof invitationSchema>;

export function InviteUser({ queryKey }: { queryKey: (string | number)[] }) {
  const [open, setOpen] = React.useState(false);
  const { models } = useModelsStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const { teamsListQuery } = useTeams();

  const teams = teamsListQuery.data?.teams ?? [];

  // Get base models (models without finetune_id) and sort models
  const { baseModelIds, sortedModels } = useMemo(() => {
    const baseModels = models.filter((model) => !model.finetune_id);
    const finetunedModels = models.filter((model) => model.finetune_id);

    return {
      baseModelIds: baseModels.map((model) => model.id),
      sortedModels: [...baseModels, ...finetunedModels],
    };
  }, [models]);

  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      role: UserRoleId.USER,
      modelAccess: [],
      contentFilterDisabled: false,
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
      teamId: undefined,
      teamRole: undefined,
    },
    mode: "onSubmit",
  });

  const selectedTeamId = form.watch("teamId");
  const typeLabelMap: Record<string, string> = {
    vton: "Virtual try-on",
    image: "Image generation",
    video: "Video generation",
    remix: "In painting",
    "image-upscale": "Image upscale",
  };

  // Reset form when dialog opens
  const handleOpen = () => {
    setOpen(true);
    const defaultValues = {
      email: "",
      role: UserRoleId.USER,
      modelAccess: baseModelIds, // Pre-select base models by default
      contentFilterDisabled: false,
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
      teamId: undefined,
      teamRole: undefined,
    };
    form.reset(defaultValues);
  };

  const onSubmit = async (data: InviteUserFormData) => {
    const emailExists = await checkIfEmailExists(data.email);

    if (emailExists) {
      form.setError("email", {
        type: "manual",
        message: "Email already exists/invited. Please use a different email.",
      });
      return;
    }
    setOpen(false);
    form.reset();

    toast.promise(inviteUser(data), {
      loading: "Sending invite...",
      success: (createdUser) => {
        queryClient.setQueryData<UserListResponse>(queryKey, (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            users: [createdUser, ...oldData.users],
          };
        });

        return "Invite sent successfully!";
      },
      error: () => {
        return "Failed to send invite. Please try again.";
      },
    });
  };

  const selectedRole = form.watch("role");

  useEffect(() => {
    if (
      selectedRole === UserRoleId.ADMIN ||
      selectedRole === UserRoleId.KK_CREATIVE_USER
    ) {
      form.setValue("modelAccess", []);
    }
  }, [selectedRole, form]);

  // Clear team role when team is cleared
  useEffect(() => {
    if (!selectedTeamId) {
      form.setValue("teamRole", undefined);
    }
  }, [selectedTeamId, form]);

  const handleClose = () => {
    setOpen(false);
    form.reset({
      email: "",
      role: UserRoleId.USER,
      modelAccess: baseModelIds, // Pre-select base models by default
      contentFilterDisabled: false,
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
      teamId: undefined,
      teamRole: undefined,
    });
  };

  return (
    <>
      <Button onClick={handleOpen}>
        <Plus />
        Invite user
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={cn(
              "relative bg-background text-foreground rounded-lg shadow-lg p-6 w-full max-w-xl mx-4",
              "sm:max-w-2xl"
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
                <h2 className="text-lg font-semibold">Invite User</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the details to invite a new user. Click save when
                  you&apos;re done.
                </p>
              </div>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <div className="flex flex-col md:flex-row w-full gap-4 items-start">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="john@kittykat.ai" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent
                              className="w-full flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              <SelectItem value={UserRoleId.ADMIN}>
                                Creative Admin
                              </SelectItem>
                              <SelectItem value={UserRoleId.KK_CREATIVE_USER}>
                                Creative User
                              </SelectItem>
                              <SelectItem value={UserRoleId.USER}>
                                User
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Model Access */}
                  <div className="grid grid-cols-1  gap-6">
                    <FormField
                      control={form.control}
                      name="modelAccess"
                      render={({ field }) => (
                        <FormItem className="pb-2">
                          <FormLabel>Model Access</FormLabel>
                          <MultiSelect
                            values={field.value || []}
                            onValuesChange={(newValues) => {
                              field.onChange(newValues);
                            }}
                          >
                            <FormControl>
                              <MultiSelectTrigger
                                className="w-full"
                                disabled={
                                  selectedRole === UserRoleId.ADMIN ||
                                  selectedRole === UserRoleId.KK_CREATIVE_USER
                                }
                              >
                                <MultiSelectValue
                                  overflowBehavior="cutoff"
                                  placeholder={
                                    selectedRole === UserRoleId.ADMIN ||
                                    selectedRole === UserRoleId.KK_CREATIVE_USER
                                      ? "Has access to all models"
                                      : sortedModels.length === 0
                                      ? "Loading models..."
                                      : "Select models"
                                  }
                                />
                              </MultiSelectTrigger>
                            </FormControl>
                            <MultiSelectContent
                              search={{
                                placeholder: "Search models...",
                                emptyMessage:
                                  sortedModels.length === 0
                                    ? "Loading models..."
                                    : "No models found",
                              }}
                            >
                              {sortedModels.length > 0 && (
                                <>
                                  {/* Select All Checkbox */}
                                  <div className="px-2 py-2 border-b border-border">
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="select-all-models-invite"
                                        checked={
                                          field.value?.length ===
                                            models.length && models.length > 0
                                        }
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange(
                                              models.map((model) => model.id)
                                            );
                                          } else {
                                            field.onChange([]);
                                          }
                                        }}
                                        disabled={
                                          selectedRole === UserRoleId.ADMIN ||
                                          selectedRole ===
                                            UserRoleId.KK_CREATIVE_USER
                                        }
                                      />
                                      <label
                                        htmlFor="select-all-models-invite"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        Select All
                                      </label>
                                    </div>
                                  </div>

                                  <MultiSelectGroup>
                                    {sortedModels.map((model) => {
                                      const isBaseModel = !model.finetune_id;

                                      return (
                                        <MultiSelectItem
                                          key={model.id}
                                          value={model.id}
                                          badgeLabel={model.name}
                                          disabled={
                                            selectedRole === UserRoleId.ADMIN ||
                                            selectedRole ===
                                              UserRoleId.KK_CREATIVE_USER
                                          }
                                        >
                                          <div className="flex items-start justify-between group gap-0 w-full">
                                            <div className="flex items-start min-w-0 w-full">
                                              <Avatar className="h-6 w-6 mr-2">
                                                <AvatarFallback
                                                  className={cn(
                                                    "text-white",
                                                    isBaseModel
                                                      ? "bg-green-500"
                                                      : "bg-blue-500"
                                                  )}
                                                >
                                                  {model.name
                                                    ?.charAt(0)
                                                    .toUpperCase() || "M"}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col space-y-1">
                                                <span className="line-clamp-1 break-words">
                                                  {model.name}
                                                </span>
                                                <span className="italic text-xs text-muted-foreground">
                                                  Use Case:{" "}
                                                  {typeLabelMap[model.type] ??
                                                    model.type}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </MultiSelectItem>
                                      );
                                    })}
                                  </MultiSelectGroup>
                                </>
                              )}
                            </MultiSelectContent>
                          </MultiSelect>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Personal Credits & Tokens */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="credits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credits</FormLabel>
                          <FormControl>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="space-y-3">
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      min={0}
                                      placeholder="Enter credits"
                                      disabled={!user?.is_default_admin}
                                      {...field}
                                      value={
                                        typeof field.value === "number"
                                          ? field.value.toLocaleString()
                                          : field.value || ""
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(
                                          /,/g,
                                          ""
                                        );
                                        if (raw === "") {
                                          field.onChange(undefined);
                                        } else {
                                          const numValue = parseInt(raw, 10);
                                          if (!isNaN(numValue)) {
                                            field.onChange(numValue);
                                          }
                                        }
                                      }}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!user?.is_default_admin}
                                        onClick={() => {
                                          const currentValue = field.value || 0;
                                          field.onChange(currentValue + 500);
                                        }}
                                      >
                                        +500
                                        <GemIcon size={14} className="ml-1" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!user?.is_default_admin}
                                        onClick={() => {
                                          const currentValue = field.value || 0;
                                          field.onChange(currentValue + 1000);
                                        }}
                                      >
                                        +1000
                                        <GemIcon size={14} className="ml-1" />
                                      </Button>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                {!user?.is_default_admin && (
                                  <TooltipContent>
                                    Only System Admin can edit credits.
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tokens</FormLabel>
                          <FormControl>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="space-y-3">
                                    <Input
                                      type="text"
                                      inputMode="numeric"
                                      min={0}
                                      placeholder="Enter tokens"
                                      disabled={!user?.is_default_admin}
                                      {...field}
                                      value={
                                        typeof field.value === "number"
                                          ? field.value.toLocaleString()
                                          : field.value || ""
                                      }
                                      onChange={(e) => {
                                        const raw = e.target.value.replace(
                                          /,/g,
                                          ""
                                        );
                                        if (raw === "") {
                                          field.onChange(undefined);
                                        } else {
                                          const numValue = parseInt(raw, 10);
                                          if (!isNaN(numValue)) {
                                            field.onChange(numValue);
                                          }
                                        }
                                      }}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!user?.is_default_admin}
                                        onClick={() => {
                                          const currentValue = field.value || 0;
                                          field.onChange(currentValue + 5000);
                                        }}
                                      >
                                        +5000
                                        <CreditIcon
                                          size={14}
                                          className="ml-1"
                                        />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!user?.is_default_admin}
                                        onClick={() => {
                                          const currentValue = field.value || 0;
                                          field.onChange(currentValue + 10000);
                                        }}
                                      >
                                        +10000
                                        <CreditIcon
                                          size={14}
                                          className="ml-1"
                                        />
                                      </Button>
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                {!user?.is_default_admin && (
                                  <TooltipContent>
                                    Only System Admin can edit tokens.
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Team Assignment (Optional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="teamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Team{" "}
                            <span className="text-muted-foreground font-normal">
                              (Optional)
                            </span>
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(
                                value === "none" ? undefined : value
                              );
                              if (value === "none") {
                                form.setValue("teamRole", undefined);
                              }
                            }}
                            value={field.value ?? "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a team" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No team</SelectItem>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedTeamId && (
                      <FormField
                        control={form.control}
                        name="teamRole"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Team Role{" "}
                              <span className="text-muted-foreground font-normal">
                                (Optional)
                              </span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(
                                  value === "none" ? undefined : value
                                )
                              }
                              value={field.value ?? TeamRolesEnum.MEMBER}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={TeamRolesEnum.MEMBER}>
                                  Member
                                </SelectItem>
                                <SelectItem value={TeamRolesEnum.ADMIN}>
                                  Admin
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {/* Content Filter */}
                  <FormField
                    control={form.control}
                    name="contentFilterDisabled"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center gap-2 h-6">
                          <FormLabel>Content Filter</FormLabel>
                          <TooltipIconButton
                            tooltipClassName="max-w-36"
                            tooltip="Disabling content filter allows the user to access all types of content without restrictions. This setting should be used with caution as it may expose users to inappropriate or harmful content."
                          >
                            <Info />
                          </TooltipIconButton>
                        </div>
                        <FormControl>
                          {user?.is_default_admin ? (
                            <Checkbox
                              variant="toggle"
                              checked={!field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(!checked);
                              }}
                            />
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="w-max">
                                  <Checkbox
                                    disabled
                                    variant="toggle"
                                    checked={!field.value}
                                  />
                                </TooltipTrigger>
                                <TooltipContent side={"right"}>
                                  You do not have permission to change this
                                  setting.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      Send Invite
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
