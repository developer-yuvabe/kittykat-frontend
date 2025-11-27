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
import { useBrandStore } from "@/store/brand.store";
import { useModelsStore } from "@/store/models.store";
import { GemIcon, Info, Plus, X } from "lucide-react";
import { inviationSchema } from "@/schema/inviation.schema";
import { UserListResponse, UserRoleId } from "@/types/user.types";
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
import { CreditIcon } from "@/components/ui/custom-icon";
import { NumberInput } from "@/components/ui/number-input";

type InviteUserFormData = z.infer<typeof inviationSchema>;

export function InviteUser({ queryKey }: { queryKey: (string | number)[] }) {
  const [open, setOpen] = React.useState(false);
  const { brands } = useBrandStore();
  const { models } = useModelsStore();
  const { user } = useUserStore();
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

  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(inviationSchema),
    defaultValues: {
      email: "",
      role: UserRoleId.USER,
      brandAccess: [],
      modelAccess: [],
      contentFilterDisabled: false,
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
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
  const addKittyKatExpertCredits = (amount: number) => {
    const currentValue = form.getValues("credits") || 0;
    const newValue = currentValue + amount;
    if (newValue <= AppConfig.CREDITS.MAX) {
      form.setValue("credits", newValue);
    }
  };
  // Initialize base models when component mounts or models load
  useEffect(() => {
    if (baseModelIds.length > 0) {
      form.setValue("modelAccess", baseModelIds);
    }
  }, [baseModelIds, form]);

  // Reset form with base models when dialog opens
  const handleOpen = () => {
    setOpen(true);
    // Reset form with default values including base models
    const defaultValues = {
      email: "",
      role: UserRoleId.USER,
      brandAccess: [],
      modelAccess: baseModelIds.length > 0 ? baseModelIds : [],
      contentFilterDisabled: false,
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
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
    if (selectedRole === UserRoleId.ADMIN) {
      form.setValue("brandAccess", []);
      form.setValue("modelAccess", []);
    } else {
      // Ensure base models are included when switching to user role
      const currentSelection = form.getValues("modelAccess") || [];
      const combinedSelection = [
        ...new Set([...baseModelIds, ...currentSelection]),
      ];
      form.setValue("modelAccess", combinedSelection);
    }
  }, [selectedRole, baseModelIds, form]);

  const addCredits = (amount: number) => {
    const currentValue = form.getValues("credits") || 0;
    const newValue = currentValue + amount;
    if (newValue <= AppConfig.CREDITS.MAX) {
      form.setValue("credits", newValue);
    }
  };

  const handleClose = () => {
    setOpen(false);
    form.reset({
      email: "",
      role: UserRoleId.USER,
      brandAccess: [],
      modelAccess: baseModelIds.length > 0 ? baseModelIds : [],
      contentFilterDisabled: false,
      credits: AppConfig.DEFAULT_CREDITS,
      tokens: AppConfig.DEFAULT_TOKENS,
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
                  className="space-y-8"
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
                                Admin
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

                  {/* Updated Brand Access and Model Access Grid */}
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
                                            {brand.created_by.id === user?.id
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
                                            field.onChange(baseModelIds);
                                          }
                                        }}
                                        disabled={
                                          selectedRole === UserRoleId.ADMIN
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
                              {user?.is_default_admin ? (
                                <NumberInput
                                  min={AppConfig.CREDITS.MIN}
                                  max={AppConfig.CREDITS.MAX}
                                  {...field}
                                  onChange={field.onChange}
                                  placeholder="Enter tokens"
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
                                          placeholder="Enter tokens"
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

                              {/* Quick add buttons with proper validation */}
                              {user?.is_default_admin && (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addCredits(5000)}
                                  >
                                    +5000
                                    <CreditIcon size={14} className="ml-1" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addCredits(10000)}
                                  >
                                    +10000
                                    <CreditIcon size={14} className="ml-1" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addCredits(50000)}
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
                      name="credits"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center gap-2 h-6">
                            <FormLabel>Kittykat Expert Credits</FormLabel>
                          </div>
                          <FormControl>
                            <div className="space-y-3">
                              {user?.is_default_admin ? (
                                <NumberInput
                                  min={AppConfig.CREDITS.MIN}
                                  max={AppConfig.CREDITS.MAX}
                                  {...field}
                                  onChange={field.onChange}
                                  placeholder="Enter credits"
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
                                      You do not have permission to edit
                                      kittykat expert credits.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {/* Quick add buttons with proper validation */}
                              {user?.is_default_admin && (
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      addKittyKatExpertCredits(500)
                                    }
                                  >
                                    +500
                                    <GemIcon size={14} className="ml-1" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      addKittyKatExpertCredits(1000)
                                    }
                                  >
                                    +1000
                                    <GemIcon size={14} className="ml-1" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      addKittyKatExpertCredits(5000)
                                    }
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
