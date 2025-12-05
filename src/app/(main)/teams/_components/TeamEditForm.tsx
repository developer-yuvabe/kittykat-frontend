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
import { canEditTeamCredits, canEditTeamNameAndAvatar } from "@/lib/team.utils";
import { teamUpdateSchema } from "@/schema/team.schema";
import { useUserStore } from "@/store/user.store";
import { TeamResponse } from "@/types/team.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { AppConfig } from "@/config/app.config";
import { Camera, GemIcon, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { CreditIcon } from "@/components/ui/custom-icon";

type TeamUpdateFormData = z.infer<typeof teamUpdateSchema>;

interface TeamEditFormProps {
  team: TeamResponse;
}

export function TeamEditForm({ team }: TeamEditFormProps) {
  const { user } = useUserStore();
  const { updateTeam, isUpdatingTeam } = useTeams();
  const canEditCredits = canEditTeamCredits(user);
  const canEditNameAvatar = canEditTeamNameAndAvatar(user, team);
  const canEdit = canEditCredits || canEditNameAvatar;
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TeamUpdateFormData>({
    resolver: zodResolver(teamUpdateSchema),
    defaultValues: {
      name: team.name,
      credits: team.credits,
      tokens: team.tokens,
      avatar_url: team.avatar_url || "",
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
      avatar_url: team.avatar_url || "",
    });
    setIsEditMode(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const url = await uploadFileAndReturnUrl(
        `team-avatar-${team.id}`,
        file.type,
        "brands",
        file
      );
      form.setValue("avatar_url", url, { shouldDirty: true });
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload avatar");
      console.error("Avatar upload error:", error);
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    form.setValue("avatar_url", null, { shouldDirty: true });
  };

  const isDirty = form.formState.isDirty;
  const watchedAvatarUrl = form.watch("avatar_url");

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
            {/* Avatar and Team Name Section */}
            <div className="flex items-start gap-6">
              {/* Avatar with Upload */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={watchedAvatarUrl || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {form.watch("name")?.charAt(0).toUpperCase() || "T"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Upload overlay - only show in edit mode */}
                  {isEditMode && canEditNameAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isUploadingAvatar ? (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                          >
                            <Camera className="h-4 w-4 text-white" />
                          </button>
                          {watchedAvatarUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              className="p-1.5 bg-white/20 rounded-full hover:bg-red-500/80 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />

                {isEditMode && canEditNameAvatar && (
                  <span className="text-xs text-muted-foreground">
                    Hover to change
                  </span>
                )}
              </div>

              {/* Team Name Field */}
              <div className="flex-1">
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
                          disabled={!isEditMode || !canEditNameAvatar}
                          className="disabled:opacity-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                        {canEditCredits && isEditMode ? (
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
                                <CreditIcon size={14} className="ml-1" />
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
                                {!canEditCredits
                                  ? "Only System Admin can edit tokens"
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
                        {canEditCredits && isEditMode ? (
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
                                <GemIcon size={14} className="ml-1" />
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
                                {!canEditCredits
                                  ? "Only System Admin can edit credits"
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
