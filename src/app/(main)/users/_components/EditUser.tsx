"use client";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select-dropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateInvitedUserSchema } from "@/schema/user.schema";
import { updateUser } from "@/services/api/user.service";
import { useBrandStore } from "@/store/brand.store";
import { useModelsStore } from "@/store/models.store";
import { UserListItem, UserListResponse, UserRoleId } from "@/types/user.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { GemIcon, Info, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreditIcon } from "@/components/ui/custom-icon";
import { useUserStore } from "@/store/user.store";
import { AppConfig } from "@/config/app.config";

type EditUserFormData = z.infer<typeof updateInvitedUserSchema>;

export function EditUser({
  user,
  setIsOpen,
  isOpen,
  queryKey,
}: {
  user: UserListItem;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  queryKey: (string | number)[];
}) {
  const { user: currentLoggedInUser } = useUserStore();
  const { brands } = useBrandStore();
  const { models } = useModelsStore();
  const queryClient = useQueryClient();

  // Get base models (models without finetune_id) and sort models
  const { baseModelIds, sortedModels } = useMemo(() => {
    const baseModels = models.filter((model) => !model.finetune_id);
    const finetunedModels = models.filter((model) => model.finetune_id);

    return {
      baseModelIds: baseModels.map((model) => model.id),
      sortedModels: [...baseModels, ...finetunedModels],
    };
  }, [models]);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(updateInvitedUserSchema),
    defaultValues: {
      role: user.role.id,
      brandAccess: user.brand_access
        ? user.brand_access.map((brand) => brand.id)
        : undefined,
      modelAccess: user.model_access?.map((model) => model.id) || baseModelIds, // Default to base models if no access defined
      contentFilterDisabled: user.content_filter_disabled || false,
      credits: user.credits || 0,
      kittykat_expert_credits: user.kittykat_expert_credits || 0,
    },
    mode: "onSubmit",
  });
  const typeLabelMap: Record<string, string> = {
    vton: "Virtual try-on",
    image: "Image generation",
    video: "Video generation",
    remix: "In painting",
    "image-upscale": "Image upscale",
  };
  // Reset form values when user prop changes or dialog opens
  useEffect(() => {
    if (isOpen && user) {
      // Ensure base models are always included in model access
      const userModelAccess = user.model_access?.map((model) => model.id) || [];
      const combinedModelAccess = [
        ...new Set([...baseModelIds, ...userModelAccess]),
      ];

      form.reset({
        role: user.role.id,
        brandAccess: user.brand_access
          ? user.brand_access.map((brand) => brand.id)
          : undefined,
        modelAccess:
          user.role.id === UserRoleId.ADMIN ? [] : combinedModelAccess, // ✅ FIXED SYNTAX ERROR
        contentFilterDisabled: user.content_filter_disabled ?? false,
        credits: user.credits ?? 0,
        kittykat_expert_credits: user.kittykat_expert_credits ?? 0, // ✅ ADDED
      });
    }
  }, [isOpen, user, form, baseModelIds]);

  const onSubmit = async (data: EditUserFormData) => {
    setIsOpen(false);

    toast.promise(
      updateUser(user.id, {
        roleId: data.role,
        brand_access: data.brandAccess,
        model_access: data.modelAccess,
        contentFilterDisabled: data.contentFilterDisabled,
        credits: data.credits,
        kittykat_expert_credits: data.kittykat_expert_credits,
      }),
      {
        loading: "Updating user...",
        success: (updatedUser) => {
          // Optimistic update - use setQueryData instead of invalidateQueries
          queryClient.setQueryData<UserListResponse>(queryKey, (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              users: oldData.users.map((u) =>
                u.id === user.id ? updatedUser : u
              ),
            };
          });
          return "User updated successfully!";
        },
        error: () => {
          setIsOpen(false); // Also close on error
          return "Failed to update user.";
        },
      }
    );
  };

  const selectedRole = form.watch("role");

  useEffect(() => {
    if (selectedRole === UserRoleId.ADMIN) {
      form.setValue("brandAccess", []);
      form.setValue("modelAccess", []);
    } else {
      // Only reset to original brand access if currently empty or was admin
      const currentBrandAccess = form.getValues("brandAccess");
      const currentModelAccess = form.getValues("modelAccess") || [];

      if (!currentBrandAccess || currentBrandAccess.length === 0) {
        form.setValue(
          "brandAccess",
          user.brand_access?.map((brand) => brand.id) || []
        );
      }

      // Always ensure base models are included
      const combinedModelAccess = [
        ...new Set([...baseModelIds, ...currentModelAccess]),
      ];
      form.setValue("modelAccess", combinedModelAccess);
    }
  }, [selectedRole, form, user.brand_access, user.model_access, baseModelIds]);

  const handleClose = () => {
    form.reset(); // Reset form when closing
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={cn(
              "relative bg-background text-foreground rounded-lg shadow-lg p-6 w-full max-w-2xl"
            )}
          >
            {/* Header with Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col max-w-full">
              <h2 className="text-lg font-semibold">Edit User</h2>
              <p className="text-sm text-muted-foreground break-words">
                Update user details and permissions.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8 mt-6"
              >
                {/* Name and Email */}
                <div className="flex flex-col md:flex-row gap-4">
                  <FormItem className="flex-1">
                    <FormLabel>Name</FormLabel>
                    <Input disabled value={user.name} />
                  </FormItem>
                  <FormItem className="flex-1">
                    <FormLabel>Email</FormLabel>
                    <Input disabled value={user.email} />
                  </FormItem>
                </div>

                {/* Role */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value} // Use value instead of defaultValue
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent clicks from bubbling to modal
                          }}
                        >
                          <SelectItem value={UserRoleId.ADMIN}>
                            Admin
                          </SelectItem>
                          <SelectItem value={UserRoleId.USER}>User</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Brand Access and Model Access Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand Access */}
                  <FormField
                    control={form.control}
                    name="brandAccess"
                    render={({ field }) => (
                      <FormItem className="pb-2">
                        <FormLabel>Brand Access</FormLabel>
                        <MultiSelect
                          values={field.value}
                          onValuesChange={field.onChange}
                        >
                          <FormControl>
                            <MultiSelectTrigger
                              className="w-full"
                              disabled={selectedRole === UserRoleId.ADMIN}
                            >
                              <MultiSelectValue
                                overflowBehavior="cutoff"
                                placeholder={
                                  selectedRole === UserRoleId.ADMIN
                                    ? "Admin has access to all brands"
                                    : "Select brands"
                                }
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
                                  disabled={selectedRole === UserRoleId.ADMIN}
                                >
                                  <div className="flex items-start justify-between group gap-0">
                                    <div className="flex items-start min-w-0 w-full">
                                      <Avatar className="h-6 w-6 mr-2">
                                        <AvatarFallback className="bg-blue-500 text-white">
                                          {brand.name
                                            ?.charAt(0)
                                            .toUpperCase() || "B"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col space-y-1">
                                        <span className="line-clamp- break-words">
                                          {brand.name}
                                        </span>
                                        <span className="italic text-xs">
                                          Created by{" "}
                                          {brand.created_by.id ===
                                          currentLoggedInUser?.id
                                            ? "You"
                                            : brand.created_by.name}
                                        </span>
                                      </div>
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

                  {/* Model Access */}
                  <FormField
                    control={form.control}
                    name="modelAccess"
                    render={({ field }) => (
                      <FormItem className="pb-2">
                        <FormLabel>Model Access</FormLabel>
                        <MultiSelect
                          values={field.value || []}
                          onValuesChange={(newValues) => {
                            // Ensure base models are always included
                            const combinedValues = [
                              ...new Set([...baseModelIds, ...newValues]),
                            ];
                            field.onChange(combinedValues);
                          }}
                        >
                          <FormControl>
                            <MultiSelectTrigger
                              className="w-full"
                              disabled={selectedRole === UserRoleId.ADMIN}
                            >
                              <MultiSelectValue
                                overflowBehavior="cutoff"
                                placeholder={
                                  selectedRole === UserRoleId.ADMIN
                                    ? "Admin has access to all models"
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
                                      id="select-all-models-edit"
                                      checked={
                                        field.value?.length === models.length &&
                                        models.length > 0
                                      }
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          // Select all models
                                          field.onChange(
                                            models.map((model) => model.id)
                                          );
                                        } else {
                                          // Keep only base models (cannot deselect them)
                                          field.onChange(baseModelIds);
                                        }
                                      }}
                                      disabled={
                                        selectedRole === UserRoleId.ADMIN
                                      }
                                    />
                                    <label
                                      htmlFor="select-all-models-edit"
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      Select All
                                    </label>
                                  </div>
                                </div>

                                <MultiSelectGroup>
                                  {sortedModels.map((model) => {
                                    const isBaseModel = !model.finetune_id;

                                    if (isBaseModel) {
                                      return (
                                        <TooltipProvider key={model.id}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div className="relative">
                                                <MultiSelectItem
                                                  value={model.id}
                                                  badgeLabel={model.name}
                                                  disabled={
                                                    selectedRole ===
                                                      UserRoleId.ADMIN ||
                                                    isBaseModel
                                                  }
                                                  className="pointer-events-none"
                                                >
                                                  <div className="flex items-start justify-between group gap-0 w-full">
                                                    <div className="flex items-start min-w-0 w-full">
                                                      <Avatar className="h-6 w-6 mr-2">
                                                        <AvatarFallback className="bg-green-500 text-white opacity-60">
                                                          {model.name
                                                            ?.charAt(0)
                                                            .toUpperCase() ||
                                                            "M"}
                                                        </AvatarFallback>
                                                      </Avatar>
                                                      <div className="flex flex-col space-y-1">
                                                        <span className="line-clamp- break-words text-muted-foreground">
                                                          {model.name}
                                                        </span>
                                                        <span className="italic text-xs text-muted-foreground">
                                                          Use Case:{" "}
                                                          {typeLabelMap[
                                                            model.type
                                                          ] ?? model.type}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </MultiSelectItem>
                                                {/* Invisible overlay for hover events */}
                                                <div className="absolute inset-0 pointer-events-auto cursor-not-allowed" />
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="right">
                                              Cannot unselect base models
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      );
                                    }

                                    return (
                                      <MultiSelectItem
                                        key={model.id}
                                        value={model.id}
                                        badgeLabel={model.name}
                                        disabled={
                                          selectedRole === UserRoleId.ADMIN
                                        }
                                      >
                                        <div className="flex items-start justify-between group gap-0 w-full">
                                          <div className="flex items-start min-w-0 w-full">
                                            <Avatar className="h-6 w-6 mr-2">
                                              <AvatarFallback className="bg-green-500 text-white">
                                                {model.name
                                                  ?.charAt(0)
                                                  .toUpperCase() || "M"}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col space-y-1">
                                              <span className="line-clamp- break-words">
                                                {model.name}
                                              </span>
                                              <span className="italic text-xs">
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
                {/* Content Filter and Credits */}
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Credits */}

                  <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center gap-2 h-6">
                          <FormLabel>Tokens</FormLabel>
                        </div>
                        <FormControl>
                          <div className="space-y-3">
                            {currentLoggedInUser?.is_default_admin ? (
                              <Input
                                type="number"
                                min={AppConfig.CREDITS.MIN}
                                max={AppConfig.CREDITS.MAX}
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "") {
                                    field.onChange(0);
                                  } else {
                                    const numValue = parseInt(value, 10);
                                    if (
                                      !isNaN(numValue) &&
                                      numValue >= AppConfig.CREDITS.MIN &&
                                      numValue <= AppConfig.CREDITS.MAX
                                    ) {
                                      field.onChange(numValue);
                                    }
                                  }
                                }}
                                placeholder="Enter tokens amount"
                                className="w-full"
                              />
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="w-full"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Input
                                        type="number"
                                        value={field.value}
                                        disabled
                                        className="bg-muted w-full pointer-events-none"
                                        placeholder="Enter tokens amount"
                                        tabIndex={-1}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side={"bottom"}>
                                    You do not have permission to edit Tokens.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {/* Quick add buttons */}
                            {currentLoggedInUser?.is_default_admin && (
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
                                  <CreditIcon size={14} className="ml-1" />
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
                                  <CreditIcon size={14} className="ml-1" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentValue = field.value || 0;
                                    const newValue = currentValue + 50000;
                                    if (newValue <= AppConfig.CREDITS.MAX) {
                                      field.onChange(newValue);
                                    }
                                  }}
                                >
                                  +50000
                                  <CreditIcon size={14} className="ml-1" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kittykat_expert_credits"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center gap-2 h-6">
                          <FormLabel>Kittykat Expert Credits</FormLabel>
                        </div>
                        <FormControl>
                          <div className="space-y-3">
                            {currentLoggedInUser?.is_default_admin ? (
                              <Input
                                type="number"
                                min={AppConfig.CREDITS.MIN}
                                max={AppConfig.CREDITS.MAX}
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === "") {
                                    field.onChange(0);
                                  } else {
                                    const numValue = parseInt(value, 10);
                                    if (
                                      !isNaN(numValue) &&
                                      numValue >= AppConfig.CREDITS.MIN &&
                                      numValue <= AppConfig.CREDITS.MAX
                                    ) {
                                      field.onChange(numValue);
                                    }
                                  }
                                }}
                                placeholder="Enter credits amount"
                                className="w-full"
                              />
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="w-full"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Input
                                        type="number"
                                        value={field.value}
                                        disabled
                                        className="bg-muted w-full pointer-events-none"
                                        placeholder="Enter credits amount"
                                        tabIndex={-1}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side={"bottom"}>
                                    You do not have permission to edit credits.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}

                            {/* Quick add buttons */}
                            {currentLoggedInUser?.is_default_admin && (
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
                                  <GemIcon size={14} className="ml-1" />
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
                                  <GemIcon size={14} className="ml-1" />
                                </Button>
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
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        {currentLoggedInUser?.is_default_admin ? (
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

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!form.formState.isDirty}>
                    Update user
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}
