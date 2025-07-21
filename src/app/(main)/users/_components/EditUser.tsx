"us client";
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
import { UserListItem, UserRoleId } from "@/types/user.types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectSearch,
  MultiSelectContent,
  MultiSelectList,
  MultiSelectItem,
  MultiSelectEmpty,
} from "@/components/ui/multi-select";
import { toast } from "sonner";
import { updateUser } from "@/services/api/user.service";
import { useQueryClient } from "@tanstack/react-query";
import { updateInvitedUserSchema } from "@/schema/user.schema";
type EditUserFormData = z.infer<typeof updateInvitedUserSchema>;

export function EditUser({
  user,
  setIsOpen,
  isOpen,
}: {
  user: UserListItem;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
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

  const onSubmit = async (data: EditUserFormData) => {
    setIsOpen(false);
    form.reset();

    toast.promise(
      updateUser(user.id, {
        roleId: data.role,
        brand_access: data.brandAccess,
      }),
      {
        loading: "Updating user...",
        success: () => {
          queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] === "users",
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
      form.setValue(
        "brandAccess",
        user.brand_access?.map((brand) => brand.id) || []
      );
    }
  }, [selectedRole]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setIsOpen(open);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and permissions. You can change the role and
            brand access for the user.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 mt-6"
          >
            <div className="flex flex-col md:flex-row w-full gap-4 items-start">
              <FormItem className="flex-1">
                <FormLabel>Name</FormLabel>
                <Input
                  disabled
                  placeholder="john@kittykat.ai"
                  value={user.name}
                />
              </FormItem>
              <FormItem className="flex-1">
                <FormLabel>Email</FormLabel>
                <Input
                  disabled
                  placeholder="john@kittykat.ai"
                  value={user.email}
                />
              </FormItem>
            </div>
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
            <FormField
              control={form.control}
              name="brandAccess"
              render={({ field }) => (
                <FormItem className="pb-2">
                  <FormLabel>Brand Access</FormLabel>
                  <MultiSelect
                    disabled={selectedRole === UserRoleId.ADMIN}
                    value={field.value}
                    onValueChange={field.onChange}
                    maxCount={10}
                  >
                    <MultiSelectTrigger className="w-full">
                      <MultiSelectValue
                        placeholder={
                          selectedRole === UserRoleId.ADMIN
                            ? "Admin has access to all brands"
                            : "Select brands"
                        }
                        maxDisplay={2}
                        maxItemLength={20}
                      />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      <MultiSelectSearch placeholder="Search brands..." />
                      <MultiSelectList>
                        <MultiSelectEmpty>No brands found</MultiSelectEmpty>
                        {brands.map((brand) => (
                          <MultiSelectItem
                            key={brand.id}
                            value={brand.id}
                            label={brand.name}
                          >
                            {brand.name}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectList>
                    </MultiSelectContent>
                  </MultiSelect>
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
              <Button disabled={!form.formState.isDirty} type="submit">
                Update user
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
