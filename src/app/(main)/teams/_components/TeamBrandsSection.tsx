"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Briefcase } from "lucide-react";
import { useEffect } from "react";
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

  const form = useForm<BrandUpdateFormData>({
    resolver: zodResolver(brandUpdateSchema),
    defaultValues: {
      accessible_brands: team.accessible_brands || [],
    },
  });
  const { data: brands } = userBrandsQuery;
  console.log("Brands Data:", brands);

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
            onSuccess: () => resolve(true),
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

  const selectedBrands = form.watch("accessible_brands") || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Brand Access ({selectedBrands.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                        className="w-full"
                        disabled={!canEdit}
                      >
                        <MultiSelectValue
                          overflowBehavior="cutoff"
                          placeholder={
                            canEdit
                              ? "Select brands"
                              : "Only KK-ADMIN can edit brand access"
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

            {canEdit && (
              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdatingTeam}>
                  {isUpdatingTeam ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
