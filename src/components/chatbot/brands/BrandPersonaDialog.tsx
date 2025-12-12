"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  BrandPersona,
  PersonaFormValues,
  personaSchema,
  PersonaUpdateRequest,
} from "@/types/persona.types";
import { uploadFileAndReturnUrl } from "@/services/api/gcs.service";
import { ImagePlus, Loader2, X, ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface BrandPersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona?: BrandPersona | null;
  brandId: string;
  onSave: (data: PersonaUpdateRequest) => Promise<void>;
  mode: "create" | "edit" | "duplicate";
}

const listToMultiline = (items?: string[]) =>
  items && items.length ? items.join("\n") : "";

const parseMultilineList = (value?: string) =>
  value
    ?.split("\n")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const getDefaultValues = (
  persona?: BrandPersona | null,
  mode?: "create" | "edit" | "duplicate"
): PersonaFormValues => ({
  name:
    mode === "duplicate" && persona
      ? `${persona.name} (Copy)`
      : persona?.name || "",
  summary: persona?.summary || "",
  image_url: persona?.image_url || "",
  age_range: persona?.age_range || "",
  gender: persona?.gender || "",
  location_focus: persona?.location_focus || "",
  target_geography: persona?.target_geography || "",
  life_stage: persona?.life_stage || "",
  composition_mode: persona?.composition_mode || "",
  psychographics: listToMultiline(persona?.psychographics),
  pain_points: listToMultiline(persona?.pain_points),
  style_preferences: listToMultiline(persona?.style_preferences),
  usage_contexts: listToMultiline(persona?.usage_contexts),
  visual_direction: listToMultiline(persona?.visual_direction),
  messaging_angles: listToMultiline(persona?.messaging_angles),
  content_recommendations: listToMultiline(persona?.content_recommendations),
  do_guidelines: listToMultiline(persona?.do_guidelines),
  dont_guidelines: listToMultiline(persona?.dont_guidelines),
});

function BrandPersonaDialog({
  open,
  onOpenChange,
  persona,
  brandId,
  onSave,
  mode,
}: BrandPersonaDialogProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: getDefaultValues(persona, mode),
  });

  useEffect(() => {
    if (open) {
      reset(getDefaultValues(persona, mode));
    }
  }, [open, persona, mode, reset]);

  const imageUrl = watch("image_url");

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const url = await uploadFileAndReturnUrl(
        file.name,
        file.type,
        "brands",
        file,
        brandId,
        null
      );
      setValue("image_url", url, { shouldDirty: true, shouldValidate: true });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setValue("image_url", "", { shouldDirty: true, shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmitForm = handleSubmit(async (values) => {
    const payload: PersonaUpdateRequest = {
      name: values.name.trim(),
      summary: values.summary?.trim() || undefined,
      image_url: values.image_url?.trim() || undefined,
      age_range: values.age_range?.trim() || undefined,
      gender: values.gender?.trim() || undefined,
      location_focus: values.location_focus?.trim() || undefined,
      target_geography: values.target_geography?.trim() || undefined,
      life_stage: values.life_stage?.trim() || undefined,
      composition_mode: (values.composition_mode || undefined) as
        | "solo"
        | "group"
        | "couple"
        | "family"
        | undefined,
      psychographics: parseMultilineList(values.psychographics),
      pain_points: parseMultilineList(values.pain_points),
      style_preferences: parseMultilineList(values.style_preferences),
      usage_contexts: parseMultilineList(values.usage_contexts),
      visual_direction: parseMultilineList(values.visual_direction),
      messaging_angles: parseMultilineList(values.messaging_angles),
      content_recommendations: parseMultilineList(
        values.content_recommendations
      ),
      do_guidelines: parseMultilineList(values.do_guidelines),
      dont_guidelines: parseMultilineList(values.dont_guidelines),
    };

    await toast.promise(onSave(payload), {
      loading: "Saving persona...",
      success:
        mode === "create"
          ? "Persona created successfully"
          : mode === "duplicate"
          ? "Persona duplicated successfully"
          : "Persona updated successfully",
      error: "Failed to save persona",
    });

    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Create New Persona"
              : mode === "duplicate"
              ? "Duplicate Persona"
              : "Edit Persona"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new persona to represent your target audience."
              : mode === "duplicate"
              ? "Create a copy of this persona with modifications."
              : "Update the persona information below."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmitForm} className="space-y-6">
          <div className="space-y-2">
            <Label>Persona Image</Label>
            <div className="flex items-start gap-4">
              {imageUrl ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                  <Image
                    src={imageUrl}
                    alt="Persona"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Recommended: 400x400px, max 5MB
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., The Urban Professional"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                placeholder="Brief description of this persona..."
                rows={3}
                {...register("summary")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Identity Snapshot</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age_range">Age Range</Label>
                <Input
                  id="age_range"
                  placeholder="e.g., 28-35"
                  {...register("age_range")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Input
                  id="gender"
                  placeholder="e.g., Female, All genders"
                  {...register("gender")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_focus">Location</Label>
                <Input
                  id="location_focus"
                  placeholder="e.g., Urban, Suburban"
                  {...register("location_focus")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_geography">Geography</Label>
                <Input
                  id="target_geography"
                  placeholder="e.g., US - Northeast"
                  {...register("target_geography")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="life_stage">Life Stage</Label>
                <Input
                  id="life_stage"
                  placeholder="e.g., Career Climber"
                  {...register("life_stage")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="composition_mode">Composition</Label>
                <Controller
                  control={control}
                  name="composition_mode"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(val) => field.onChange(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select composition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solo">Solo</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="couple">Couple</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Detailed Attributes</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="psychographics">
                  Psychographics (one per line)
                </Label>
                <Textarea
                  id="psychographics"
                  placeholder="Career-driven&#10;Socially active&#10;Tech-savvy"
                  rows={3}
                  {...register("psychographics")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pain_points">Pain Points (one per line)</Label>
                <Textarea
                  id="pain_points"
                  placeholder="Limited time&#10;Work-life balance&#10;Budget constraints"
                  rows={3}
                  {...register("pain_points")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="style_preferences">
                  Style Preferences (one per line)
                </Label>
                <Textarea
                  id="style_preferences"
                  placeholder="Minimalist&#10;Modern&#10;Professional"
                  rows={3}
                  {...register("style_preferences")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="visual_direction">
                  Visual Direction (one per line)
                </Label>
                <Textarea
                  id="visual_direction"
                  placeholder="Clean lines&#10;Neutral colors&#10;Urban settings"
                  rows={3}
                  {...register("visual_direction")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="messaging_angles">
                  Messaging Angles (one per line)
                </Label>
                <Textarea
                  id="messaging_angles"
                  placeholder="Efficiency&#10;Quality&#10;Convenience"
                  rows={3}
                  {...register("messaging_angles")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="do_guidelines">Do&apos;s (one per line)</Label>
                <Textarea
                  id="do_guidelines"
                  placeholder="Show professional settings&#10;Use aspirational imagery&#10;Highlight convenience"
                  rows={3}
                  {...register("do_guidelines")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dont_guidelines">
                  Don&apos;ts (one per line)
                </Label>
                <Textarea
                  id="dont_guidelines"
                  placeholder="Avoid cluttered visuals&#10;Don't use outdated references&#10;Avoid overly casual tone"
                  rows={3}
                  {...register("dont_guidelines")}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploadingImage}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create Persona"
              ) : mode === "duplicate" ? (
                "Duplicate Persona"
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default BrandPersonaDialog;
