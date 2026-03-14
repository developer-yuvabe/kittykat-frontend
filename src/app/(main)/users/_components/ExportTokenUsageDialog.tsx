"use client";

import React, { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select-dropdown";
import {
  tokenUsageExportSchema,
  type TokenUsageExportFormData,
} from "@/schema/user.schema";
import { useAdminTokenUsage } from "@/hooks/useUsers";
import {
  useAllBrandOptions,
  useModelOptions,
  useUserOptions,
  useWorkspaceOptions,
} from "@/hooks/useUsers";

export function ExportTokenUsageDialog() {
  const [open, setOpen] = useState(false);

  const { exportCsv, isExporting } = useAdminTokenUsage();

  const form = useForm<TokenUsageExportFormData>({
    resolver: zodResolver(tokenUsageExportSchema),
    defaultValues: {
      start_date: "",
      end_date: "",
      workspace_id: [],
      user_id: [],
      brand_id: [],
      model_id: [],
    },
  });

  const selectedWorkspaces = useWatch({ control: form.control, name: "workspace_id" });

  const {
    data: workspaceOptions = [],
    isLoading: loadingWorkspaces,
    isFetchingNextPage: fetchingMoreWorkspaces,
    hasNextPage: hasMoreWorkspaces,
    fetchNextPage: fetchMoreWorkspaces,
  } = useWorkspaceOptions();

  const {
    data: userOptions = [],
    isLoading: loadingUsers,
    isFetchingNextPage: fetchingMoreUsers,
    hasNextPage: hasMoreUsers,
    fetchNextPage: fetchMoreUsers,
  } = useUserOptions(undefined, selectedWorkspaces);

  const { data: brandOptions = [], isLoading: loadingBrands } =
    useAllBrandOptions();

  const { data: modelOptions = [], isLoading: loadingModels } =
    useModelOptions();

  const onSubmit = (data: TokenUsageExportFormData) => {
    exportCsv(
      {
        start_date: data.start_date,
        end_date: data.end_date,
        workspace_id: data.workspace_id?.length ? data.workspace_id : undefined,
        user_id: data.user_id?.length ? data.user_id : undefined,
        brand_id: data.brand_id?.length ? data.brand_id : undefined,
        model_id: data.model_id?.length ? data.model_id : undefined,
      },
      {
        onSuccess: () => handleOpenChange(false),
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) form.reset();
    setOpen(value);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Download className="size-4 mr-2" />
        Export Usage
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Export Token Usage</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          max={new Date().toISOString().split("T")[0]}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Workspace */}
              <FormField
                control={form.control}
                name="workspace_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace (optional)</FormLabel>
                    <MultiSelect
                      values={field.value ?? []}
                      onValuesChange={(vals) => {
                        field.onChange(vals);
                        form.setValue("user_id", []);
                      }}
                    >
                      <FormControl>
                        <MultiSelectTrigger
                          className="w-full"
                          disabled={loadingWorkspaces}
                        >
                          <MultiSelectValue placeholder="All workspaces" />
                        </MultiSelectTrigger>
                      </FormControl>
                      <MultiSelectContent
                        search={{ placeholder: "Search workspaces..." }}
                        onScrollCapture={(e) => {
                          const el = e.currentTarget;
                          if (
                            hasMoreWorkspaces &&
                            !fetchingMoreWorkspaces &&
                            el.scrollTop + el.clientHeight >=
                              el.scrollHeight - 40
                          ) {
                            fetchMoreWorkspaces();
                          }
                        }}
                      >
                        {workspaceOptions.map((opt) => (
                          <MultiSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* User */}
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User (optional)</FormLabel>
                    <MultiSelect
                      values={field.value ?? []}
                      onValuesChange={field.onChange}
                    >
                      <FormControl>
                        <MultiSelectTrigger
                          className="w-full"
                          disabled={loadingUsers}
                        >
                          <MultiSelectValue placeholder="All users" />
                        </MultiSelectTrigger>
                      </FormControl>
                      <MultiSelectContent
                        search={{ placeholder: "Search users..." }}
                        onScrollCapture={(e) => {
                          const el = e.currentTarget;
                          if (
                            hasMoreUsers &&
                            !fetchingMoreUsers &&
                            el.scrollTop + el.clientHeight >=
                              el.scrollHeight - 40
                          ) {
                            fetchMoreUsers();
                          }
                        }}
                      >
                        {userOptions.map((opt) => (
                          <MultiSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Brand */}
              <FormField
                control={form.control}
                name="brand_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand (optional)</FormLabel>
                    <MultiSelect
                      values={field.value ?? []}
                      onValuesChange={field.onChange}
                    >
                      <FormControl>
                        <MultiSelectTrigger
                          className="w-full"
                          disabled={loadingBrands}
                        >
                          <MultiSelectValue placeholder="All brands" />
                        </MultiSelectTrigger>
                      </FormControl>
                      <MultiSelectContent
                        search={{ placeholder: "Search brands..." }}
                      >
                        {brandOptions.map((opt) => (
                          <MultiSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model */}
              <FormField
                control={form.control}
                name="model_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model (optional)</FormLabel>
                    <MultiSelect
                      values={field.value ?? []}
                      onValuesChange={field.onChange}
                    >
                      <FormControl>
                        <MultiSelectTrigger
                          className="w-full"
                          disabled={loadingModels}
                        >
                          <MultiSelectValue placeholder="All models" />
                        </MultiSelectTrigger>
                      </FormControl>
                      <MultiSelectContent
                        search={{ placeholder: "Search models..." }}
                      >
                        {modelOptions.map((opt) => (
                          <MultiSelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MultiSelectItem>
                        ))}
                      </MultiSelectContent>
                    </MultiSelect>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isExporting}>
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}