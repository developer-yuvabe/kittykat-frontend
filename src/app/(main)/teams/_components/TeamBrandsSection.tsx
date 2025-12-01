"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select-dropdown";
import { useTeams } from "@/hooks/useTeams";
import useUsers from "@/hooks/useUsers";
import { canEditTeamDetails } from "@/lib/team.utils";
import { useUserStore } from "@/store/user.store";
import { TeamResponse } from "@/types/team.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const brandUpdateSchema = z.object({
  accessible_brands: z.array(z.string()).optional(),
});

type BrandUpdateFormData = z.infer<typeof brandUpdateSchema>;

interface TeamBrandsSectionProps {
  team: TeamResponse;
}

export function TeamBrandsSection({ team }: TeamBrandsSectionProps) {
  const { user: currentUser } = useUserStore();
  const { userBrandsQuery } = useUsers({ userId: currentUser?.id });
  const { updateTeam, isUpdatingTeam } = useTeams();
  const canEdit = canEditTeamDetails(currentUser);
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<BrandUpdateFormData>({
    resolver: zodResolver(brandUpdateSchema),
    defaultValues: {
      accessible_brands: team.accessible_brands || [],
    },
  });
  const { data: brands, isLoading: isBrandsLoading } = userBrandsQuery;

  // Update form when team changes
  useEffect(() => {
    form.reset({
      accessible_brands: team.accessible_brands || [],
    });
  }, [team, form]);

  const onSubmit = async (data: BrandUpdateFormData) => {
    toast.promise(
      new Promise((resolve, reject) => {
        updateTeam(
          {
            teamId: team.id,
            payload: { accessible_brands: data.accessible_brands },
          },
          {
            onSuccess: () => {
              setIsEditMode(false);
              resolve(true);
            },
            onError: (error) => reject(error),
          }
        );
      }),
      {
        loading: "Updating brand access...",
        success: "Brand access updated successfully!",
        error: "Failed to update brand access.",
      }
    );
  };

  const handleCancel = () => {
    form.reset({
      accessible_brands: team.accessible_brands || [],
    });
    setIsEditMode(false);
  };

  const isDirty = form.formState.isDirty;

  const selectedBrands = form.watch("accessible_brands") || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Brand Access ({selectedBrands.length})
          </CardTitle>
          {canEdit && !isEditMode && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditMode(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isBrandsLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="accessible_brands"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brands</FormLabel>
                    <MultiSelect
                      values={field.value || []}
                      onValuesChange={field.onChange}
                    >
                      <FormControl>
                        <MultiSelectTrigger
                          className="w-full disabled:opacity-100"
                          disabled={!isEditMode}
                        >
                          <MultiSelectValue
                            overflowBehavior="cutoff"
                            placeholder={
                              !canEdit
                                ? "You do not have permission to edit brands"
                                : !isEditMode
                                ? "Click edit to modify"
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
                          {brands?.map((brand) => (
                            <MultiSelectItem
                              key={brand.id}
                              value={brand.id}
                              badgeLabel={brand.name}
                            >
                              <div className="flex items-start gap-2 w-full">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-blue-500 text-white">
                                    {brand.name?.charAt(0).toUpperCase() || "B"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="break-words">
                                    {brand.name}
                                  </span>
                                  <span className="italic text-xs text-muted-foreground">
                                    Created by{" "}
                                    {brand.created_by.id === currentUser?.id
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display selected brands */}
              {selectedBrands.length > 0 && userBrandsQuery.isFetched && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Brands:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedBrands.map((brandId) => {
                      const brand = brands?.find((b) => b.id === brandId);
                      if (!brand) return null;
                      return (
                        <div
                          key={brandId}
                          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-blue-500 text-white text-xs">
                              {brand.name?.charAt(0).toUpperCase() || "B"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{brand.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {canEdit && isEditMode && (
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isUpdatingTeam}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdatingTeam || !isDirty}>
                    {isUpdatingTeam ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
