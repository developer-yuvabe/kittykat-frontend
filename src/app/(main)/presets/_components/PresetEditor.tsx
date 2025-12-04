"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectSearch,
  MultiSelectContent,
  MultiSelectList,
  renderMultiSelectOptions,
} from "@/components/ui/multi-select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { usePresets } from "@/hooks/usePresets";
import { useBrandStore } from "@/store/brand.store";
import { PresetPromptCard } from "./PresetPromptCard";
import type {
  PresetDetailResponse,
  PromptFieldType,
  PresetFormData,
} from "@/types/preset.types";
import { PresetEditorMode } from "@/types/preset.types";
import { presetFormSchema } from "@/types/preset.types";
import { DEFAULT_EMPTY_PROMPTS, PROMPT_FIELDS } from "@/lib/preset.utils";

interface PresetEditorProps {
  presetId?: string;
  preset?: PresetDetailResponse;
  mode?: PresetEditorMode;
}

export function PresetEditor({
  presetId,
  preset,
  mode = PresetEditorMode.NEW,
}: PresetEditorProps) {
  const router = useRouter();
  const brands = useBrandStore((state) => state.brands);
  const {
    presetQuery,
    createPresetMutation,
    updatePresetMutation,
    patchPresetMutation,
    adjustPromptMutation,
  } = usePresets({ presetId, enabled: mode === PresetEditorMode.EDIT || mode === PresetEditorMode.VIEW });

  const form = useForm<PresetFormData>({
    resolver: zodResolver(presetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "custom",
      brand_ids: [],
      prompts: DEFAULT_EMPTY_PROMPTS,
    },
    mode: "onChange",
  });

  const presetType = form.watch("type");
  const selectedBrands = form.watch("brand_ids");
  const prompts = form.watch("prompts");
  const { isDirty } = useFormState({ control: form.control });

  const isLoading = (mode === PresetEditorMode.EDIT || mode === PresetEditorMode.VIEW) && presetQuery.isLoading;
  const isViewOnly = mode === PresetEditorMode.VIEW;
  const isSaving =
    createPresetMutation.isPending ||
    updatePresetMutation.isPending ||
    patchPresetMutation.isPending;
  const [adjustingFields, setAdjustingFields] = useState<Set<string>>(
    new Set()
  );

  // Initialize form with existing preset or master preset
  useEffect(() => {
    if (mode === PresetEditorMode.NEW && preset) {
      // New preset - use master preset prompts
      form.reset({
        name: "",
        description: "",
        type: "custom",
        brand_ids: [],
        prompts: preset.prompts || DEFAULT_EMPTY_PROMPTS,
      });
    } else if (mode === PresetEditorMode.CLONE && preset) {
      form.reset({
        name: `${preset.name} (copy) `,
        description: preset.description || "",
        type: (preset.type as "generic" | "custom") || "custom",
        brand_ids: preset.brand_ids || [],
        prompts:
          ("prompts" in preset
            ? (preset as PresetDetailResponse).prompts
            : DEFAULT_EMPTY_PROMPTS) || DEFAULT_EMPTY_PROMPTS,
      });
    } else if ((mode === PresetEditorMode.EDIT || mode === PresetEditorMode.VIEW) && presetQuery.data) {
      // Edit or View existing preset
      const preset = presetQuery.data;
      form.reset({
        name: preset.name || "",
        description: preset.description || "",
        type: (preset.type as "generic" | "custom") || "custom",
        brand_ids: preset.brand_ids || [],
        prompts:
          ("prompts" in preset
            ? (preset as PresetDetailResponse).prompts
            : DEFAULT_EMPTY_PROMPTS) || DEFAULT_EMPTY_PROMPTS,
      });
    }
  }, [mode, preset, presetQuery.data, form]);

  const handleSave = async (data: PresetFormData) => {
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      type: data.type,
      brand_ids: data.type === "generic" ? undefined : data.brand_ids,
      prompts: data.prompts,
    };

    if (mode === PresetEditorMode.NEW || mode === PresetEditorMode.CLONE) {
      createPresetMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Preset created successfully");
          router.push("/presets");
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to create preset");
        },
      });
    } else if (presetId) {
      // Use PATCH for edits to allow partial updates
      patchPresetMutation.mutate(
        { presetId, payload },
        {
          onSuccess: () => {
            toast.success("Preset updated successfully");
            router.push("/presets");
          },
          onError: (error: any) => {
            toast.error(error?.message || "Failed to update preset");
          },
        }
      );
    }
  };

  const handleAdjust = async (
    presetIdForAdjust: string,
    fieldType: PromptFieldType,
    instruction: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      setAdjustingFields((prev) => new Set(prev).add(fieldType));
      adjustPromptMutation.mutate(
        {
          preset_id: presetIdForAdjust,
          field_type: fieldType,
          adjustment_instructions: instruction,
        },
        {
          onSuccess: (adjustedPrompt) => {
            setAdjustingFields((prev) => {
              const next = new Set(prev);
              next.delete(fieldType);
              return next;
            });
            resolve(adjustedPrompt);
          },
          onError: (error) => {
            setAdjustingFields((prev) => {
              const next = new Set(prev);
              next.delete(fieldType);
              return next;
            });
            toast.error("Failed to adjust prompt");
            reject(error);
          },
        }
      );
    });
  };

  const brandOptions = brands.map((b) => ({
    label: b.name,
    value: b.id,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            {mode === PresetEditorMode.NEW
              ? "Create New Preset"
              : mode === PresetEditorMode.CLONE
              ? "Clone Preset"
              : mode === PresetEditorMode.VIEW
              ? "View Preset"
              : "Edit Preset"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === PresetEditorMode.NEW
              ? "Create a new preset with custom prompts"
              : mode === PresetEditorMode.CLONE
              ? "Create a copy of this preset"
              : mode === PresetEditorMode.VIEW
              ? "View preset details and prompts (read-only)"
              : "Update the preset details and prompts"}
          </p>
        </div>
      </div>

      {/* Preset Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preset Details</CardTitle>
          <CardDescription>
            Configure the basic information for this preset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Preset Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., E-commerce Product Shots"
                disabled={isSaving || isViewOnly}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Optional description of this preset's purpose"
                className="min-h-20 resize-none"
                disabled={isSaving || isViewOnly}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Preset Type Selection - do not show for master presets when editing or for view mode */}
            {(preset?.is_master && mode === PresetEditorMode.EDIT) || isViewOnly ? null : (
              <div className="space-y-3">
                <Label>Preset Type *</Label>
                <div className="flex gap-4">
                  <div
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition ${
                      presetType === "generic"
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      form.setValue("type", "generic", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      form.setValue("brand_ids", [], {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    <div className="font-medium">Generic</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available to all brands - system level preset
                    </p>
                  </div>
                  <div
                    className={`flex-1 p-4 border rounded-lg cursor-pointer transition ${
                      presetType === "custom"
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/30 hover:bg-muted/50"
                    }`}
                    onClick={() =>
                      form.setValue("type", "custom", {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <div className="font-medium">Custom</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Assign to specific brands
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Brand Selection - Only for Custom */}
            {presetType === "custom" && (
              <div className="space-y-2">
                <Label>Assigned Brands *</Label>
                <MultiSelect
                  value={selectedBrands || []}
                  onValueChange={(values: string[]) =>
                    form.setValue("brand_ids", values, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                  disabled={isSaving || isViewOnly}
                >
                  <MultiSelectTrigger className="w-full">
                    <MultiSelectValue placeholder="Select brands..." />
                  </MultiSelectTrigger>
                  <MultiSelectContent>
                    <MultiSelectSearch placeholder="Search brands..." />
                    <MultiSelectList>
                      {renderMultiSelectOptions(brandOptions)}
                    </MultiSelectList>
                  </MultiSelectContent>
                </MultiSelect>
                {selectedBrands && selectedBrands.length === 0 && (
                  <p className="text-xs text-destructive">
                    At least one brand is required for custom presets
                  </p>
                )}
                {form.formState.errors.brand_ids && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.brand_ids.message}
                  </p>
                )}
              </div>
            )}

            {/* Prompt Cards */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Prompt Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Define the five prompts that power this preset. All fields are
                  required. *
                </p>
              </div>

              {PROMPT_FIELDS.map(({ fieldType, label, description: desc }) => (
                <div key={fieldType}>
                  <PresetPromptCard
                    fieldType={fieldType}
                    label={label}
                    description={desc}
                    value={prompts?.[fieldType] || ""}
                    onValueChange={(value) => {
                      // Mark the form as dirty and validate when programmatically changing deep values
                      form.setValue(`prompts.${fieldType}`, value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    onAdjust={handleAdjust}
                    presetId={presetId || preset?.id || ""}
                    isAdjusting={adjustingFields.has(fieldType)}
                    isExpanded={false}
                    isViewOnly={isViewOnly}
                  />
                  {form.formState.errors.prompts?.[fieldType] && (
                    <p className="text-sm text-destructive mt-2">
                      {form.formState.errors.prompts[fieldType]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-3 justify-end sticky bottom-0 bg-background py-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/presets")}
                disabled={isSaving}
              >
                {isViewOnly ? "Back to Presets" : "Cancel"}
              </Button>
              {!isViewOnly && (
                <Button
                  type="submit"
                  disabled={
                    // In edit mode require changes to be made before enabling save
                    // Do not block save strictly on `isValid` here — handleSubmit will run validation and show errors.
                    (mode === PresetEditorMode.EDIT && !isDirty) || isSaving
                  }
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {mode === PresetEditorMode.NEW ||
                      mode === PresetEditorMode.CLONE
                        ? "Creating..."
                        : "Saving..."}
                    </>
                  ) : (
                    <>
                      {mode === PresetEditorMode.NEW ||
                      mode === PresetEditorMode.CLONE
                        ? "Create Preset"
                        : "Save Changes"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
