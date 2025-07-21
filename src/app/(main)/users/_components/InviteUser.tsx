"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  Dialog,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import { inviationSchema } from "@/schema/inviation.schema";
import { UserRoleId } from "@/types/user.types";
import {
  Form,
  FormControl,
  FormDescription,
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

type InviteUserFormData = z.infer<typeof inviationSchema>;

export function InviteUser() {
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
      success: () => {
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "users",
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
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Invite user
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-xl"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Enter the details to invite a new user. Click save when you&apos;re
            done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-6"
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
                      <SelectContent className="w-full flex-1">
                        <SelectItem value={UserRoleId.ADMIN}>Admin</SelectItem>
                        <SelectItem value={UserRoleId.USER}>User</SelectItem>
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
                                    {brand.name?.charAt(0).toUpperCase() || "B"}
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
                  {selectedRole === UserRoleId.USER && (
                    <FormDescription>
                      Brand access can only be changed again after the user
                      accepts the invitation.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  form.formState.isValidating || form.formState.isSubmitting
                }
                loading={
                  form.formState.isValidating || form.formState.isSubmitting
                }
              >
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
