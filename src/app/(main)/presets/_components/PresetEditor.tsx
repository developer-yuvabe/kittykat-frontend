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
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { usePresets } from "@/hooks/usePresets";
import { useBrandStore } from "@/store/brand.store";
import { PresetPromptCard } from "./PresetPromptCard";
import type {
  PresetDetailResponse,
  PromptFieldType,
  PresetFormData,
  // PresetVersion type comes from preset.types - ensure it's available there
  PresetVersion,
} from "@/types/preset.types";
import { PresetEditorMode } from "@/types/preset.types";
import { presetFormSchema } from "@/types/preset.types";
import {
  DEFAULT_EMPTY_PROMPTS,
  PROMPT_FIELDS,
  DEFAULT_EMPTY_VERSIONS,
  VERSION_DESCRIPTION_MAP,
  VERSION_KEY_DISPLAY_MAP,
  REQUIRED_PROMPTS_BY_VERSION,
} from "@/lib/preset.utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
  } = usePresets({
    presetId,
    enabled: mode === PresetEditorMode.EDIT || mode === PresetEditorMode.VIEW,
  });

  const form = useForm<PresetFormData>({
    resolver: zodResolver(presetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "custom",
      brand_ids: [],
      // NEW: versions array instead of single prompts
      versions: DEFAULT_EMPTY_VERSIONS,
    },
    mode: "onChange",
  });

  const presetType = form.watch("type");
  const selectedBrands = form.watch("brand_ids");
  // removed old prompts watcher
  const { isDirty } = useFormState({ control: form.control });

  const isLoading =
    (mode === PresetEditorMode.EDIT || mode === PresetEditorMode.VIEW) &&
    presetQuery.isLoading;
  const isViewOnly = mode === PresetEditorMode.VIEW;
  const isSaving =
    createPresetMutation.isPending ||
    updatePresetMutation.isPending ||
    patchPresetMutation.isPending;
  const [adjustingFields, setAdjustingFields] = useState<Set<string>>(
    new Set()
  );

  // modal state: editing index into versions array
  const [editingVersionIndex, setEditingVersionIndex] = useState<number | null>(
    null
  );

  // Initialize form with existing preset or master preset (support NEW, CLONE, EDIT, VIEW)
  useEffect(() => {
    if (mode === PresetEditorMode.NEW && preset) {
      // New preset - use master preset versions
      form.reset({
        name: "",
        description: "",
        type: "custom",
        brand_ids: [],
        versions:
          (preset as PresetDetailResponse).versions || DEFAULT_EMPTY_VERSIONS,
      });
    } else if (mode === PresetEditorMode.CLONE && preset) {
      form.reset({
        name: `${preset.name} (copy) `,
        description: preset.description || "",
        type: (preset.type as "generic" | "custom") || "custom",
        brand_ids: preset.brand_ids || [],
        versions:
          ("versions" in preset
            ? (preset as PresetDetailResponse).versions
            : DEFAULT_EMPTY_VERSIONS) || DEFAULT_EMPTY_VERSIONS,
      });
    } else if (
      (mode === PresetEditorMode.EDIT || mode === PresetEditorMode.VIEW) &&
      presetQuery.data
    ) {
      // Edit or View existing preset
      const fetched = presetQuery.data;
      form.reset({
        name: fetched.name || "",
        description: fetched.description || "",
        type: (fetched.type as "generic" | "custom") || "custom",
        brand_ids: fetched.brand_ids || [],
        versions: fetched.versions || DEFAULT_EMPTY_VERSIONS,
      });
    }
  }, [mode, preset, presetQuery.data, form]);

  const brandOptions = brands.map((b) => ({
    label: b.name,
    value: b.id,
  }));

  const hasEmptyPrompt = () => {
    const versions = form.getValues("versions");

    return versions.some((version) => {
      const requiredFields =
        REQUIRED_PROMPTS_BY_VERSION[version.version_key] || [];

      return requiredFields.some((field) => {
        const value = version.prompts[field];
        return !value || !value.trim();
      });
    });
  };

  // Helper: get current versions array
  const versions: PresetVersion[] =
    form.watch("versions") || DEFAULT_EMPTY_VERSIONS;
  const currentEditingVersion =
    editingVersionIndex !== null ? versions[editingVersionIndex] : null;

  // Save entire preset
  const handleSave = async (data: PresetFormData) => {
    const payload = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      type: data.type,
      brand_ids: data.type === "generic" ? undefined : data.brand_ids,
      versions: data.versions,
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

  // Adjust prompt by version — wrapper that calls backend with version_key
  const handleAdjustWithVersion = async (
    presetIdForAdjust: string,
    versionKey: PresetVersion["version_key"],
    fieldType: PromptFieldType,
    instruction: string
  ): Promise<string> => {
    // Use composite key so multiple version/field adjustments are tracked separately
    const compositeKey = `${versionKey}:${fieldType}`;
    setAdjustingFields((prev) => new Set(prev).add(compositeKey));

    return new Promise((resolve, reject) => {
      adjustPromptMutation.mutate(
        {
          preset_id: presetIdForAdjust,
          version_key: versionKey,
          field_type: fieldType,
          adjustment_instructions: instruction,
        },
        {
          onSuccess: (adjustedPrompt) => {
            setAdjustingFields((prev) => {
              const next = new Set(prev);
              next.delete(compositeKey);
              return next;
            });
            resolve(adjustedPrompt);
          },
          onError: (error) => {
            setAdjustingFields((prev) => {
              const next = new Set(prev);
              next.delete(compositeKey);
              return next;
            });
            toast.error("Failed to adjust prompt");
            reject(error);
          },
        }
      );
    });
  };

  // When the modal edits a version, update the form's versions array
  const updateEditingVersion = (updated: PresetVersion) => {
    if (editingVersionIndex === null) return;
    const next = [...versions];
    next[editingVersionIndex] = updated;
    form.setValue("versions", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const saveVersionChanges = () => {
    setEditingVersionIndex(null);
  };

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
            {(preset?.is_master && mode === PresetEditorMode.EDIT) ||
            isViewOnly ? null : (
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

            {/*  Preset Versions Table */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Preset Versions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage prompt versions for different input permutations.
                </p>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="p-3 text-left">Version Key</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {versions.map((version, idx) => (
                      <tr key={version.version_key} className="border-t">
                        <td className="p-3 font-medium">
                          {VERSION_KEY_DISPLAY_MAP[version.version_key] ||
                            version.version_key}{" "}
                        </td>
                        <td className="p-3">
                          {VERSION_DESCRIPTION_MAP[version.version_key]}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingVersionIndex(idx)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                  type="button"
                  onClick={() => {
                    if (hasEmptyPrompt()) {
                      toast.error(
                        "Please fill all prompt fields in all preset versions."
                      );
                      return;
                    }

                    form.handleSubmit(handleSave)();
                  }}
                  disabled={isSaving}
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

      {/*  Version Edit Modal */}
      {currentEditingVersion && (
        <Dialog open={true} onOpenChange={() => setEditingVersionIndex(null)}>
          <DialogContent className="w-[85vw] sm:max-w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-xl px-6">
            <DialogHeader>
              <DialogTitle className="flex flex-col">
                <span className="text-lg">
                  Edit Preset Version:{" "}
                  {VERSION_KEY_DISPLAY_MAP[currentEditingVersion.version_key]}
                </span>
                <span className="text-sm text-muted-foreground mt-1">
                  {VERSION_DESCRIPTION_MAP[currentEditingVersion.version_key]}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {PROMPT_FIELDS.map(({ fieldType, label, description }) => {
                // Determine which prompts to show based on version_key
                const shouldShow = (() => {
                  const versionKey = currentEditingVersion.version_key;

                  switch (versionKey) {
                    case "All":
                      // Show all 5 prompts
                      return true;

                    case "M":
                      // Show: moodboard_analysis, analysis_merge, prompt_generation
                      return (
                        fieldType === "moodboard_analysis" ||
                        fieldType === "prompt_generation"
                      );

                    case "MT":
                      // Show: only prompt_generation
                      return fieldType === "prompt_generation";

                    case "MP":
                    case "MC":
                    case "MPC":
                    case "MPT":
                    case "MCT":
                      // Show: analysis_merge, prompt_generation
                      return (
                        fieldType === "analysis_merge" ||
                        fieldType === "prompt_generation"
                      );

                    default:
                      return false;
                  }
                })();

                if (!shouldShow) return null;

                return (
                  <PresetPromptCard
                    key={fieldType}
                    fieldType={fieldType}
                    label={label}
                    description={description}
                    value={currentEditingVersion.prompts[fieldType]}
                    onValueChange={(v) =>
                      updateEditingVersion({
                        ...currentEditingVersion,
                        prompts: {
                          ...currentEditingVersion.prompts,
                          [fieldType]: v,
                        },
                      })
                    }
                    onAdjust={(presetIdForAdjust, field, instruction) =>
                      handleAdjustWithVersion(
                        presetIdForAdjust ||
                          presetId ||
                          (preset && (preset as PresetDetailResponse).id) ||
                          "",
                        currentEditingVersion.version_key as PresetVersion["version_key"],
                        field,
                        instruction
                      )
                    }
                    presetId={
                      presetId ||
                      (preset && (preset as PresetDetailResponse).id) ||
                      ""
                    }
                    isAdjusting={adjustingFields.has(
                      `${currentEditingVersion.version_key}:${fieldType}`
                    )}
                    isExpanded={false}
                    isViewOnly={isViewOnly}
                  />
                );
              })}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditingVersionIndex(null)}
              >
                Cancel
              </Button>
              <Button onClick={saveVersionChanges} disabled={isSaving}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
