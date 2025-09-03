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
import { UserListItem, UserListResponse, UserRoleId } from "@/types/user.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Info, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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
  const { brands } = useBrandStore();
  const queryClient = useQueryClient();
  const form = useForm<EditUserFormData>({
    resolver: zodResolver(updateInvitedUserSchema),
    defaultValues: {
      role: user.role.id,
      brandAccess: user.brand_access
        ? user.brand_access.map((brand) => brand.id)
        : undefined,
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
      });
    }
  }, [isOpen, user, form]);

  const onSubmit = async (data: EditUserFormData) => {
    setIsOpen(false);

    toast.promise(
      updateUser(user.id, {
        roleId: data.role,
        brand_access: data.brandAccess,
        contentFilterDisabled: data.contentFilterDisabled,
      }),
      {
        loading: "Updating user...",
        success: (updatedUser) => {
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
          return "Failed to update user.";
        },
      }
    );
  };

  const selectedRole = form.watch("role");

  useEffect(() => {
    if (selectedRole === UserRoleId.ADMIN) {
      form.setValue("brandAccess", []);
    } else {
      // Only reset to original brand access if currently empty or was admin
      const currentBrandAccess = form.getValues("brandAccess");
      if (!currentBrandAccess || currentBrandAccess.length === 0) {
        form.setValue(
          "brandAccess",
          user.brand_access?.map((brand) => brand.id) || []
        );
      }
    }
  }, [selectedRole, form, user.brand_access]);

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
              "relative bg-background text-foreground rounded-lg shadow-lg p-6 w-full max-w-xl mx-4"
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
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">Edit User</h2>
                <p className="text-sm text-muted-foreground">
                  Update user details and permissions. You can change role and
                  brand access for user.
                </p>
              </div>
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
                        <SelectContent className="w-full">
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
                              overflowBehavior="wrap-when-open"
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
                                <div className="flex items-start min-w-0 w-full">
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarFallback className="bg-blue-500 text-white">
                                      {brand.name?.charAt(0).toUpperCase() ||
                                        "B"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col space-y-1">
                                    <span className="line-clamp- break-words">
                                      {brand.name}
                                    </span>
                                    <span className="italic text-xs">
                                      Created by{" "}
                                      {brand.created_by.id === user.id
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
                      {/* {selectedRole === UserRoleId.USER && (
                        <FormDescription>
                          Brand access can only be changed again after the user
                          accepts the invitation.
                        </FormDescription>
                      )} */}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contentFilterDisabled"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <div className="flex items-center gap-2">
                        <FormLabel>Content Filter</FormLabel>
                        <TooltipIconButton
                          tooltipClassName="max-w-36"
                          tooltip="Disabling content filter allows the user to access all types of content without restrictions. This setting should be used with caution as it may expose users to inappropriate or harmful content."
                        >
                          <Info />
                        </TooltipIconButton>
                      </div>
                      <FormControl>
                        <Checkbox
                          variant="toggle"
                          checked={!field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(!checked);
                          }}
                        />
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
