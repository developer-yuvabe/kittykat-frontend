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
import { inviteUser } from "@/services/api/user.service";
import { useQueryClient } from "@tanstack/react-query";
type InviteUserFormData = z.infer<typeof inviationSchema>;

export function InviteUser() {
  const [open, setOpen] = React.useState(false);
  const { brands } = useBrandStore();
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
      <DialogContent className="sm:max-w-xl">
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
              <Button type="submit">Send Invite</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
