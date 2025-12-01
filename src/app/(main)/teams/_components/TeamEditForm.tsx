"use client";

import { Button } from "@/components/ui/button";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTeams } from "@/hooks/useTeams";
import { canEditTeamDetails } from "@/lib/team.utils";
import { teamUpdateSchema } from "@/schema/team.schema";
import { useUserStore } from "@/store/user.store";
import { TeamResponse } from "@/types/team.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { AppConfig } from "@/config/app.config";
import { CreditIcon } from "@/components/ui/custom-icon";
import { GemIcon, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

type TeamUpdateFormData = z.infer<typeof teamUpdateSchema>;

interface TeamEditFormProps {
  team: TeamResponse;
}

export function TeamEditForm({ team }: TeamEditFormProps) {
  const { user } = useUserStore();
  const { updateTeam, isUpdatingTeam } = useTeams();
  const canEdit = canEditTeamDetails(user);
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm<TeamUpdateFormData>({
    resolver: zodResolver(teamUpdateSchema),
    defaultValues: {
      name: team.name,
      credits: team.credits,
      tokens: team.tokens,
    },
  });

  const onSubmit = async (data: TeamUpdateFormData) => {
    toast.promise(
      new Promise((resolve, reject) => {
        updateTeam(
          { teamId: team.id, payload: data },
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
        loading: "Updating team...",
        success: "Team updated successfully!",
        error: "Failed to update team.",
      }
    );
  };

  const handleCancel = () => {
    form.reset({
      name: team.name,
      credits: team.credits,
      tokens: team.tokens,
    });
    setIsEditMode(false);
  };

  const isDirty = form.formState.isDirty;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Team Details</CardTitle>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Team Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Team name"
                      {...field}
                      disabled={!isEditMode}
                      className="disabled:opacity-100"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credits and Tokens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tokens"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tokens</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {canEdit && isEditMode ? (
                          <>
                            <Input
                              className="disabled:opacity-100"
                              type="text"
                              inputMode="numeric"
                              min={AppConfig.CREDITS.MIN}
                              max={AppConfig.CREDITS.MAX}
                              {...field}
                              value={
                                typeof field.value === "number"
                                  ? field.value.toLocaleString()
                                  : field.value || ""
                              }
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                if (raw === "") {
                                  field.onChange(0);
                                } else {
                                  const numValue = parseInt(raw, 10);
                                  if (
                                    !isNaN(numValue) &&
                                    numValue >= AppConfig.CREDITS.MIN &&
                                    numValue <= AppConfig.CREDITS.MAX
                                  ) {
                                    field.onChange(numValue);
                                  }
                                }
                              }}
                              placeholder="Enter tokens"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentValue = field.value || 0;
                                  const newValue = currentValue + 5000;
                                  if (newValue <= AppConfig.CREDITS.MAX) {
                                    field.onChange(newValue);
                                  }
                                }}
                              >
                                +5000
                                <GemIcon size={14} className="ml-1" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentValue = field.value || 0;
                                  const newValue = currentValue + 10000;
                                  if (newValue <= AppConfig.CREDITS.MAX) {
                                    field.onChange(newValue);
                                  }
                                }}
                              >
                                +10000
                                <GemIcon size={14} className="ml-1" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Input
                                    type="number"
                                    value={field.value || 0}
                                    disabled
                                    className="disabled:opacity-100"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!canEdit
                                  ? "You do not have permission to edit tokens"
                                  : "Click edit to modify"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {canEdit && isEditMode ? (
                          <>
                            <Input
                              type="text"
                              inputMode="numeric"
                              min={AppConfig.CREDITS.MIN}
                              max={AppConfig.CREDITS.MAX}
                              {...field}
                              value={
                                typeof field.value === "number"
                                  ? field.value.toLocaleString()
                                  : field.value || ""
                              }
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, "");
                                if (raw === "") {
                                  field.onChange(0);
                                } else {
                                  const numValue = parseInt(raw, 10);
                                  if (
                                    !isNaN(numValue) &&
                                    numValue >= AppConfig.CREDITS.MIN &&
                                    numValue <= AppConfig.CREDITS.MAX
                                  ) {
                                    field.onChange(numValue);
                                  }
                                }
                              }}
                              placeholder="Enter credits"
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentValue = field.value || 0;
                                  const newValue = currentValue + 500;
                                  if (newValue <= AppConfig.CREDITS.MAX) {
                                    field.onChange(newValue);
                                  }
                                }}
                              >
                                +500
                                <CreditIcon size={14} className="ml-1" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentValue = field.value || 0;
                                  const newValue = currentValue + 1000;
                                  if (newValue <= AppConfig.CREDITS.MAX) {
                                    field.onChange(newValue);
                                  }
                                }}
                              >
                                +1000
                                <CreditIcon size={14} className="ml-1" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Input
                                    type="number"
                                    value={field.value || 0}
                                    disabled
                                    className="disabled:opacity-100"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!canEdit
                                  ? "Only KK-ADMIN can edit credits"
                                  : "Click edit to modify"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
      </CardContent>
    </Card>
  );
}
