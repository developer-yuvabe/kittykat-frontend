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
import { Info, X } from "lucide-react";
import { useEffect } from "react";
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
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(updateInvitedUserSchema),
    defaultValues: {
      role: user.role.id,
      brandAccess: user.brand_access
        ? user.brand_access.map((brand) => brand.id)
        : undefined,
      modelAccess: user.model_access
        ? user.model_access.map((model) => model.id)
        : undefined,
      contentFilterDisabled: user.content_filter_disabled || false,
      credits: user.credits || 0,
    },
    mode: "onSubmit",
  });

  // Reset form values when user prop changes or dialog opens
  useEffect(() => {
    if (isOpen && user) {
      form.reset({
        role: user.role.id,
        brandAccess: user.brand_access
          ? user.brand_access.map((brand) => brand.id)
          : undefined,
        modelAccess: user.model_access
          ? user.model_access.map((model) => model.id)
          : undefined,
        contentFilterDisabled: user.content_filter_disabled ?? false,
        credits: user.credits ?? 0,
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: EditUserFormData) => {
    setIsOpen(false);

    toast.promise(
      updateUser(user.id, {
        roleId: data.role,
        brand_access: data.brandAccess,
        model_access: data.modelAccess,
        contentFilterDisabled: data.contentFilterDisabled,
        credits: data.credits,
      }),
      {
        loading: "Updating user...",
        success: (updatedUser) => {
          queryClient.invalidateQueries({
            queryKey: ["users"], // This will refetch all user queries
          });

          setIsOpen(false); // Move this to success callback
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
      const currentModelAccess = form.getValues("modelAccess");

      if (!currentBrandAccess || currentBrandAccess.length === 0) {
        form.setValue(
          "brandAccess",
          user.brand_access?.map((brand) => brand.id) || []
        );
      }

      if (!currentModelAccess || currentModelAccess.length === 0) {
        form.setValue(
          "modelAccess",
          user.model_access?.map((model) => model.id) || []
        );
      }
    }
  }, [selectedRole, form, user.brand_access, user.model_access]);

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

                {/* Brand Access and Model Access Grid - Updated to match InviteUser */}
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

                  {/* Model Access - Updated to match Brand Access UI exactly */}
                  <FormField
                    control={form.control}
                    name="modelAccess"
                    render={({ field }) => (
                      <FormItem className="pb-2">
                        <FormLabel>Model Access</FormLabel>
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
                                    ? "Admin has access to all models"
                                    : "Select models"
                                }
                              />
                            </MultiSelectTrigger>
                          </FormControl>
                          <MultiSelectContent
                            search={{
                              placeholder: "Search models...",
                              emptyMessage: "No models found",
                            }}
                          >
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
                                      // Deselect all models
                                      field.onChange([]);
                                    }
                                  }}
                                  disabled={selectedRole === UserRoleId.ADMIN}
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
                              {models.map((model) => (
                                <MultiSelectItem
                                  key={model.id}
                                  value={model.id}
                                  badgeLabel={model.name}
                                  disabled={selectedRole === UserRoleId.ADMIN}
                                >
                                  <div className="flex items-start justify-between group gap-0">
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
                                          Use Case: {model.type}
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
                </div>
                {/* Content Filter and Credits */}
                <div className="flex flex-col md:flex-row gap-4">
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
                        <FormControl className="-mt-7">
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

                  {/* Credits - Show to all admins, with proper spacing for alignment */}
                  {currentLoggedInUser?.role?.id === "KK-ADMIN" ? (
                    <FormField
                      control={form.control}
                      name="credits"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <div className="flex items-center gap-2 h-6">
                            <FormLabel>Credits</FormLabel>
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
                                      You do not have permission to edit
                                      Credits.
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}

                              {/* Quick add buttons with digit validation */}
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
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    // Empty div to maintain layout when credits field is not shown
                    <div className="flex-1"></div>
                  )}
                </div>

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
