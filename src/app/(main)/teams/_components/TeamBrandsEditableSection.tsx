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
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeams } from "@/hooks/useTeams";
import useUsers from "@/hooks/useUsers";
import { isKKAdmin } from "@/lib/team.utils";
import { useUserStore } from "@/store/user.store";
import { TeamBrand, TeamResponse } from "@/types/team.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, Info, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { TeamBrandsBadge } from "./TeamBrandsBadge";
import { TeamBrandsAllAccessBadge } from "./TeamBrandsAllAccessBadge";
import { TeamBrandsReadOnlyView } from "./TeamBrandsReadOnlyView";

const brandUpdateSchema = z.object({
  accessible_brands: z.array(z.string()).optional(),
  has_all_brands_access: z.boolean().optional(),
});

type BrandUpdateFormData = z.infer<typeof brandUpdateSchema>;

interface TeamBrandsEditableSectionProps {
  team: TeamResponse;
  currentUser: { id: string };
}

export function TeamBrandsEditableSection({
  team,
  currentUser,
}: TeamBrandsEditableSectionProps) {
  const { user } = useUserStore();
  const { userBrandsQuery } = useUsers({ userId: currentUser?.id });
  const { updateTeam, isUpdatingTeam } = useTeams();
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<BrandUpdateFormData>({
    resolver: zodResolver(brandUpdateSchema),
    defaultValues: {
      accessible_brands: team.accessible_brands?.map((brand) => brand.id) || [],
      has_all_brands_access: team.has_all_brands_access || false,
    },
  });

  const { data: brands, isLoading: isBrandsLoading } = userBrandsQuery;

  // Update form when team changes
  useEffect(() => {
    form.reset({
      accessible_brands: team.accessible_brands?.map((brand) => brand.id) || [],
      has_all_brands_access: team.has_all_brands_access || false,
    });
  }, [team, form]);

  const onSubmit = async (data: BrandUpdateFormData) => {
    toast.promise(
      new Promise((resolve, reject) => {
        updateTeam(
          {
            teamId: team.id,
            payload: {
              accessible_brands: data.has_all_brands_access
                ? []
                : data.accessible_brands,
              has_all_brands_access: data.has_all_brands_access,
            },
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
      accessible_brands: team.accessible_brands?.map((brand) => brand.id) || [],
      has_all_brands_access: team.has_all_brands_access || false,
    });
    setIsEditMode(false);
  };

  const isDirty = form.formState.isDirty;
  const selectedBrandIds = form.watch("accessible_brands") || [];
  const hasAllBrandsAccess = form.watch("has_all_brands_access");

  // Determine brand count display
  const brandCountDisplay = hasAllBrandsAccess
    ? "All"
    : selectedBrandIds.length;

  // Get selected brands for display
  const getSelectedBrands = (): TeamBrand[] => {
    if (isEditMode && brands) {
      return selectedBrandIds
        .map((id) => {
          const brand = brands.find((b) => b.id === id);
          return brand ? { id: brand.id, name: brand.name } : null;
        })
        .filter((b): b is TeamBrand => b !== null);
    }
    return team.accessible_brands || [];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Brand Access ({brandCountDisplay})
          </CardTitle>
          {!isEditMode && (
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
        {isBrandsLoading && isEditMode ? (
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
        ) : isEditMode ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* All Brands Access Toggle - Only visible to KK-ADMIN */}
              {isKKAdmin(user) && (
                <FormField
                  control={form.control}
                  name="has_all_brands_access"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <FormLabel className="text-sm font-normal cursor-pointer mb-0">
                          Allow access to all brands
                        </FormLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>
                              When enabled, this team will have access to all
                              existing and future brands without needing to
                              select them individually.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              {/* Brand Selection - Hidden when has_all_brands_access is true */}
              {!hasAllBrandsAccess && (
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
                          <MultiSelectTrigger className="w-full">
                            <MultiSelectValue
                              overflowBehavior="cutoff"
                              placeholder="Select brands"
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
                                      {brand.name?.charAt(0).toUpperCase() ||
                                        "B"}
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
              )}

              {/* Selected brands preview - only show when not using all brands access */}
              {!hasAllBrandsAccess && selectedBrandIds.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected Brands:</p>
                  <div className="flex flex-wrap gap-2">
                    {getSelectedBrands().map((brand) => (
                      <TeamBrandsBadge key={brand.id} brand={brand} />
                    ))}
                  </div>
                </div>
              )}

              {/* Show all brands access badge in edit mode when enabled */}
              {hasAllBrandsAccess && <TeamBrandsAllAccessBadge />}

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
            </form>
          </Form>
        ) : (
          <TeamBrandsReadOnlyView
            brands={team.accessible_brands || []}
            hasAllBrandsAccess={team.has_all_brands_access}
          />
        )}
      </CardContent>
    </Card>
  );
}
