"use client";

import { useState, useMemo, useEffect } from "react";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { GalleryItemResponse, GalleryItem } from "@/types/gallery.types";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EditIcon, SaveIcon } from "@/components/ui/custom-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MediaItemDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: GalleryItemResponse | null;
  handleUpdatePartialData: UseMutateFunction<
    GalleryItemResponse,
    Error,
    { itemId: string; data: Partial<GalleryItem> },
    unknown
  >;
}

export function MediaItemDetailsDialog({
  open,
  onOpenChange,
  item,
  handleUpdatePartialData,
}: MediaItemDetailsDialogProps) {
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>(
    {}
  );
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Record<string, any>
  >({});

  // Reset state when dialog opens with a new item
  useEffect(() => {
    if (open && item) {
      setEditingFields({});
      setFieldValues({});
      setSavingFields({});
      setOptimisticUpdates({});
    }
  }, [open, item?.id]);

  // Create a merged item with optimistic updates
  const displayItem = useMemo(() => {
    if (!item) return null;
    return { ...item, ...optimisticUpdates };
  }, [item, optimisticUpdates]);

  if (!displayItem) return null;

  const handleFieldEdit = (fieldKey: string, currentValue: any) => {
    setEditingFields((prev) => ({ ...prev, [fieldKey]: true }));
    setFieldValues((prev) => ({ ...prev, [fieldKey]: currentValue }));
  };

  const handleFieldSave = async (fieldKey: string, value: any) => {
    if (!item) return;
    setSavingFields((prev) => ({ ...prev, [fieldKey]: true }));

    try {
      // Apply optimistic update immediately
      const updateData: Partial<GalleryItem> = { [fieldKey]: value };

      // Handle nested field updates (like dimensions.width)
      if (fieldKey.includes(".")) {
        const [parentKey, childKey] = fieldKey.split(".");
        const nestedUpdate = {
          [parentKey]: {
            ...(displayItem as any)[parentKey],
            [childKey]: value,
          },
        };
        setOptimisticUpdates((prev) => ({ ...prev, ...nestedUpdate }));
      } else {
        setOptimisticUpdates((prev) => ({ ...prev, [fieldKey]: value }));
      }

      // Call the mutation
      await handleUpdatePartialData({ itemId: item.id, data: updateData });

      // Clear optimistic update after successful mutation
      setEditingFields((prev) => ({ ...prev, [fieldKey]: false }));
      setSavingFields((prev) => ({ ...prev, [fieldKey]: false }));
    } catch (error) {
      console.error(`Error updating ${fieldKey}:`, error);

      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const newState = { ...prev };
        if (fieldKey.includes(".")) {
          const [parentKey] = fieldKey.split(".");
          delete newState[parentKey];
        } else {
          delete newState[fieldKey];
        }
        return newState;
      });

      setSavingFields((prev) => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handleFieldCancel = (fieldKey: string) => {
    setEditingFields((prev) => ({ ...prev, [fieldKey]: false }));
    setFieldValues((prev) => ({ ...prev, [fieldKey]: undefined }));
  };

  // Helper function to get nested value
  const getFieldValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  const renderEditableField = (
    label: string,
    fieldKey: string,
    currentValue: any,
    type:
      | "text"
      | "textarea"
      | "number"
      | "boolean"
      | "array"
      | "select" = "text",
    editable = true,
    options?: { value: string; label: string }[]
  ) => {
    const isEditing = editingFields[fieldKey];
    const isSaving = savingFields[fieldKey];

    // Use optimistically updated value if available
    const displayValue = fieldKey.includes(".")
      ? getFieldValue(displayItem, fieldKey)
      : displayItem[fieldKey as keyof GalleryItemResponse];

    const editValue =
      fieldValues[fieldKey] !== undefined
        ? fieldValues[fieldKey]
        : displayValue;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          {type === "boolean" ? (
            <div className="flex items-center gap-2">
              <Switch
                checked={isEditing ? editValue : displayValue}
                onCheckedChange={(checked) => {
                  if (!editable) return;
                  if (isEditing) {
                    setFieldValues((prev) => ({
                      ...prev,
                      [fieldKey]: checked,
                    }));
                  } else {
                    handleFieldEdit(fieldKey, checked);
                    handleFieldSave(fieldKey, checked);
                  }
                }}
                disabled={isSaving || !editable}
              />
              <span className="text-sm text-gray-600">
                {isEditing
                  ? editValue
                    ? "Yes"
                    : "No"
                  : displayValue
                  ? "Yes"
                  : "No"}
              </span>
            </div>
          ) : type === "select" && options ? (
            <div className="flex-1">
              <Select
                disabled={!isEditing || isSaving || !editable}
                value={isEditing ? editValue : displayValue || ""}
                onValueChange={(value) => {
                  setFieldValues((prev) => ({
                    ...prev,
                    [fieldKey]: value,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : type === "array" ? (
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={Array.isArray(editValue) ? editValue.join(", ") : ""}
                  onChange={(e) =>
                    setFieldValues((prev) => ({
                      ...prev,
                      [fieldKey]: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="Enter comma-separated values"
                  disabled={isSaving || !editable}
                />
              ) : (
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(displayValue) && displayValue.length > 0 ? (
                    displayValue.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">No tags</span>
                  )}
                </div>
              )}
            </div>
          ) : type === "textarea" ? (
            <Textarea
              value={isEditing ? editValue : displayValue || ""}
              onChange={(e) =>
                setFieldValues((prev) => ({
                  ...prev,
                  [fieldKey]: e.target.value,
                }))
              }
              disabled={!isEditing || isSaving || !editable}
              className="flex-1 disabled:opacity-100"
              rows={3}
            />
          ) : (
            <Input
              type={type}
              value={isEditing ? editValue : displayValue || ""}
              onChange={(e) =>
                setFieldValues((prev) => ({
                  ...prev,
                  [fieldKey]:
                    type === "number"
                      ? e.target.value === ""
                        ? null
                        : Number(e.target.value)
                      : e.target.value,
                }))
              }
              disabled={!isEditing || isSaving || !editable}
              className="flex-1 disabled:opacity-100"
            />
          )}

          {editable && type !== "boolean" && (
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFieldCancel(fieldKey)}
                    disabled={isSaving}
                  >
                    <X size={16} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleFieldSave(fieldKey, editValue)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
                    ) : (
                      <SaveIcon size={16} />
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFieldEdit(fieldKey, displayValue)}
                >
                  <EditIcon size={16} />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[90vh] lg:min-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asset Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full px-2 fixed mt-16">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="ai">AI & Generation</TabsTrigger>
            <TabsTrigger value="model">Model Info</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4 p-10">
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField(
                "Title",
                "asset_title",
                displayItem.asset_title
              )}
              {renderEditableField(
                "Asset Type",
                "asset_type",
                displayItem.asset_type,
                "select",
                true,
                [
                  { value: "uploaded", label: "Uploaded" },
                  { value: "generated", label: "Generated" },
                ]
              )}
              {renderEditableField(
                "Source",
                "asset_source",
                displayItem.asset_source,
                "select",
                true,
                [
                  { value: "all-media", label: "All Media" },
                  { value: "moodboard", label: "Moodboard" },
                  { value: "models", label: "Models" },
                  { value: "images", label: "Images" },
                  { value: "products", label: "Products" },
                ]
              )}
              {renderEditableField(
                "Media Format",
                "media_format",
                displayItem.media_format,
                "text",
                false
              )}
              {renderEditableField(
                "Size",
                "size",
                displayItem.size,
                "text",
                false
              )}
              {/* Only show duration for video media format */}
              {displayItem.media_format?.toLowerCase().includes("video") &&
                renderEditableField(
                  "Duration (seconds)",
                  "duration_seconds",
                  displayItem.duration_seconds,
                  "number"
                )}

              {renderEditableField(
                "Is Favorite",
                "is_favourite",
                displayItem.is_favourite,
                "boolean"
              )}
              {renderEditableField(
                "Is Archived",
                "is_archived",
                displayItem.is_archived,
                "boolean"
              )}
            </div>

            {displayItem.dimensions && (
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {renderEditableField(
                    "Width",
                    "dimensions.width",
                    displayItem.dimensions?.width,
                    "number"
                  )}
                  {renderEditableField(
                    "Height",
                    "dimensions.height",
                    displayItem.dimensions?.height,
                    "number"
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4 p-10">
            <div className="grid grid-cols-1 gap-4">
              {displayItem.input_prompt &&
                renderEditableField(
                  "Input Prompt",
                  "input_prompt",
                  displayItem.input_prompt,
                  "textarea"
                )}
              {renderEditableField(
                "AI Description",
                "ai_description",
                displayItem.ai_description,
                "textarea"
              )}
              {renderEditableField(
                "Dominant Color",
                "dominant_color",
                displayItem.dominant_color
              )}
              {renderEditableField(
                "Technical Quality Score",
                "technical_quality_score",
                displayItem.technical_quality_score,
                "number"
              )}
              {renderEditableField(
                "Brand Compliance Score",
                "brand_compliance_score",
                displayItem.brand_compliance_score,
                "number"
              )}
            </div>

            <div className="space-y-4">
              {(displayItem?.prompt_modifiers ?? []).length > 0 &&
                renderEditableField(
                  "Prompt Modifiers",
                  "prompt_modifiers",
                  displayItem.prompt_modifiers,
                  "array"
                )}
              {renderEditableField(
                "AI Tags",
                "ai_tags",
                displayItem.ai_tags,
                "array"
              )}
              {renderEditableField(
                "Visual Style Tags",
                "visual_style_tags",
                displayItem.visual_style_tags,
                "array"
              )}
              {renderEditableField(
                "Detected Objects",
                "detected_objects",
                displayItem.detected_objects,
                "array"
              )}
              {renderEditableField(
                "Detected Emotions",
                "detected_emotions",
                displayItem.detected_emotions,
                "array"
              )}
              {renderEditableField(
                "Detected Colors",
                "detected_colors",
                displayItem.detected_colors,
                "array"
              )}
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-4 mt-4 p-10">
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField(
                "Has Human Model",
                "has_human_model",
                displayItem.has_human_model,
                "boolean"
              )}
            </div>

            {displayItem.model_data && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Model Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  {renderEditableField(
                    "Model Type",
                    "model_data.model_type",
                    displayItem.model_data.model_type,
                    "select",
                    true,
                    [
                      { value: "real", label: "Real" },
                      { value: "virtual", label: "Virtual" },
                      { value: "ai_generated", label: "AI Generated" },
                    ]
                  )}
                  {renderEditableField(
                    "Gender",
                    "model_data.gender",
                    displayItem.model_data.gender
                  )}
                  {renderEditableField(
                    "Ethnicity",
                    "model_data.ethnicity",
                    displayItem.model_data.ethnicity
                  )}
                  {renderEditableField(
                    "Age Range",
                    "model_data.age_range",
                    displayItem.model_data.age_range
                  )}
                  {renderEditableField(
                    "Face Visible",
                    "model_data.face_visible",
                    displayItem.model_data.face_visible,
                    "boolean"
                  )}
                  {renderEditableField(
                    "Body Type",
                    "model_data.body_type",
                    displayItem.model_data.body_type,
                    "select",
                    true,
                    [
                      { value: "headshot", label: "Headshot" },
                      { value: "half_body", label: "Half Body" },
                      { value: "full_body", label: "Full Body" },
                    ]
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="product" className="space-y-4 mt-4 p-10">
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField(
                "Has Product",
                "has_product",
                displayItem.has_product,
                "boolean"
              )}
            </div>

            {displayItem.product_data && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Product Data</h3>
                <div className="grid grid-cols-2 gap-4">
                  {renderEditableField(
                    "Product Category",
                    "product_data.product_category",
                    displayItem.product_data.product_category
                  )}
                  {renderEditableField(
                    "SKU",
                    "product_data.sku",
                    displayItem.product_data.sku
                  )}
                  {renderEditableField(
                    "SKU Reference",
                    "product_data.sku_reference",
                    displayItem.product_data.sku_reference
                  )}
                  {renderEditableField(
                    "Product Visibility",
                    "product_data.product_visibility",
                    displayItem.product_data.product_visibility,
                    "select",
                    true,
                    [
                      { value: "prominent", label: "Prominent" },
                      { value: "subtle", label: "Subtle" },
                      { value: "background", label: "Background" },
                    ]
                  )}
                  {renderEditableField(
                    "Product Placement",
                    "product_data.product_placement",
                    displayItem.product_data.product_placement,
                    "select",
                    true,
                    [
                      { value: "held", label: "Held" },
                      { value: "worn", label: "Worn" },
                      { value: "displayed", label: "Displayed" },
                    ]
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4 mt-4 p-10">
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField(
                "Workflow Status",
                "workflow_status",
                displayItem.workflow_status,
                "select",
                true,
                [
                  { value: "draft", label: "Draft" },
                  { value: "in_review", label: "In Review" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" },
                ]
              )}

              {renderEditableField(
                "Campaign ID",
                "campaign_id",
                displayItem.campaign_id
              )}
              {renderEditableField(
                "Usage Count",
                "usage_count",
                displayItem.usage_count,
                "number"
              )}
            </div>

            <div className="space-y-4">
              {renderEditableField(
                "Search Keywords",
                "search_keywords",
                displayItem.search_keywords,
                "array"
              )}
              {renderEditableField(
                "Custom Tags",
                "custom_tags",
                displayItem.custom_tags,
                "array"
              )}
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4 mt-4 p-10">
            <div className="grid grid-cols-2 gap-4">
              {renderEditableField(
                "Processing Status",
                "processing_status",
                displayItem.processing_status,
                "select",
                true,
                [
                  { value: "processing", label: "Processing" },
                  { value: "ready", label: "Ready" },
                  { value: "failed", label: "Failed" },
                ]
              )}

              {displayItem.size_bytes !== undefined &&
                renderEditableField(
                  "Size (Bytes)",
                  "size_bytes",
                  displayItem.size_bytes,
                  "number",
                  false
                )}
              {renderEditableField(
                "Aspect Ratio",
                "aspect_ratio",
                displayItem.aspect_ratio
              )}
            </div>

            <div className="space-y-2">
              <Label>Timestamps</Label>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs text-gray-500">Created At</Label>
                  <p>{new Date(displayItem.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Updated At</Label>
                  <p>{new Date(displayItem.updated_at).toLocaleString()}</p>
                </div>
                {displayItem.last_accessed_at && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      Last Accessed
                    </Label>
                    <p>
                      {new Date(displayItem.last_accessed_at).toLocaleString()}
                    </p>
                  </div>
                )}
                {displayItem.last_commented_at && (
                  <div>
                    <Label className="text-xs text-gray-500">
                      Last Commented
                    </Label>
                    <p>
                      {new Date(displayItem.last_commented_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {displayItem.metadata_raw && (
              <div className="space-y-2">
                <Label>Raw Metadata</Label>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(displayItem.metadata_raw, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
