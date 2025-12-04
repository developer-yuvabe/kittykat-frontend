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
import { useModelsStore } from "@/store/models.store";
import { UserListItem, UserListResponse, UserRoleId } from "@/types/user.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Info, X } from "lucide-react";
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
import { useUserStore } from "@/store/user.store";

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
  const { models } = useModelsStore();
  const queryClient = useQueryClient();

  // Get base models (models without finetune_id) and sort models
  const sortedModels = useMemo(() => {
    const baseModels = models.filter((model) => !model.finetune_id);
    const finetunedModels = models.filter((model) => model.finetune_id);

    return [...baseModels, ...finetunedModels];
  }, [models]);

  const form = useForm<EditUserFormData>({
    resolver: zodResolver(updateInvitedUserSchema),
    defaultValues: {
      role: user.role.id,
      modelAccess: user.model_access?.map((model) => model.id) || [],
      contentFilterDisabled: user.content_filter_disabled || false,
      name: user.name || "",
    },
    mode: "onChange",
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
      const userModelAccess = user.model_access?.map((model) => model.id) || [];

      form.reset({
        role: user.role.id,
        modelAccess:
          user.role.id === UserRoleId.ADMIN ||
          user.role.id === UserRoleId.KK_CREATIVE_USER
            ? []
            : userModelAccess,
        contentFilterDisabled: user.content_filter_disabled ?? false,
        name: user.name || "",
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: EditUserFormData) => {
    setIsOpen(false);

    toast.promise(
      updateUser(user.id, {
        roleId: data.role,
        model_access: data.modelAccess,
        contentFilterDisabled: data.contentFilterDisabled,
        name: data.name,
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
    if (
      selectedRole === UserRoleId.ADMIN ||
      selectedRole === UserRoleId.KK_CREATIVE_USER
    ) {
      form.setValue("modelAccess", []);
    } else if (selectedRole === UserRoleId.USER) {
      // When switching to User role, pre-select base models if modelAccess is empty
      const currentModelAccess = form.getValues("modelAccess");
      if (!currentModelAccess || currentModelAccess.length === 0) {
        const baseModelIds = models
          .filter((model) => !model.finetune_id)
          .map((model) => model.id);
        form.setValue("modelAccess", baseModelIds, { shouldDirty: true });
      }
    }
  }, [selectedRole, form, models]);

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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter name"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem className="flex-1">
                    <FormLabel>Email</FormLabel>
                    <Input disabled readOnly defaultValue={user.email} />
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
                            Creative Admin
                          </SelectItem>
                          <SelectItem value={UserRoleId.KK_CREATIVE_USER}>
                            Creative User
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
                                      disabled={
                                        selectedRole === UserRoleId.ADMIN ||
                                        selectedRole ===
                                          UserRoleId.KK_CREATIVE_USER
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
                  <Button
                    type="submit"
                    disabled={
                      !form.formState.isDirty || form.formState.isSubmitting
                    }
                  >
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
