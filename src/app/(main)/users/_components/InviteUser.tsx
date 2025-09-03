"use client";
import React, { useEffect } from "react";
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
import { Info, Plus, X } from "lucide-react";
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

type InviteUserFormData = z.infer<typeof inviationSchema>;

export function InviteUser({ queryKey }: { queryKey: (string | number)[] }) {
  const [open, setOpen] = React.useState(false);
  const { brands } = useBrandStore();
  const { user } = useUserStore();
  const queryClient = useQueryClient();
  const form = useForm<InviteUserFormData>({
    resolver: zodResolver(inviationSchema),
    defaultValues: {
      email: "",
      role: UserRoleId.USER,
      brandAccess: [],
      contentFilterDisabled: false,
    },
    mode: "onSubmit",
  });

  const onSubmit = async (data: InviteUserFormData) => {
    const emailExists = await checkIfEmailExists(data.email);

    if (emailExists) {
      form.setError("email", {
        type: "manual",
        message: "Email already invited. Please use a different email.",
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
    }
  }, [selectedRole]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus />
        Invite user
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className={cn(
              "relative bg-background text-foreground rounded-lg shadow-lg p-6 w-full max-w-xl mx-4",
              "sm:max-w-xl"
            )}
          >
            <button
              onClick={() => {
                setOpen(false);
                form.reset();
              }}
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
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent
                              className="w-full flex-1"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent clicks from bubbling to modal
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
                  <FormField
                    control={form.control}
                    name="contentFilterDisabled"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center gap-2">
                          <FormLabel>Content Filter</FormLabel>u-
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
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        form.reset();
                      }}
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
