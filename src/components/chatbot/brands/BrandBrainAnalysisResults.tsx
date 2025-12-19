"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandBrainAggregatedAnalysis } from "@/types/types";
import { Sparkles, RefreshCw } from "lucide-react";
import { useBrandBrainAnalysis } from "@/hooks/useBrandBrainAnalysis";
import { useBrandStore } from "@/store/brand.store";
import { format } from "date-fns";
import { toast } from "sonner";

interface BrandBrainAnalysisResultsProps {
  analysis?: BrandBrainAggregatedAnalysis;
}

function BrandBrainAnalysisResults({
  analysis,
}: BrandBrainAnalysisResultsProps) {
  const { selectedBrandId } = useBrandStore();
  const { mutate: triggerAnalysis, isPending } = useBrandBrainAnalysis();

  const handleReanalyze = () => {
    if (!selectedBrandId) {
      toast.error("No brand selected");
      return;
    }

    triggerAnalysis({
      brand_id: selectedBrandId,
    });
  };

  // Show empty state when no analysis data or when aggregated tags are missing
  if (!analysis || !analysis.aggregated_tags) {
    return (
      <Card className="border border-gray-400">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gray-400" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Visual Style
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                No analysis available yet
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center space-y-4">
            <div className="rounded-full bg-gray-100 p-3">
              <Sparkles className="h-8 w-8 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">
                No Visual Style Analysis Yet
              </h4>
              <p className="text-sm text-gray-600 max-w-md">
                To generate a visual style analysis, please curate at least one
                campaign with images for this brand. Once curated, the system
                will automatically analyze the visual patterns and styles.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <p className="text-xs text-blue-800">
                <strong>How to curate:</strong> Navigate to the Gallery Folder
                View , select campaigns that represent your brand&apos;s visual
                style, and mark them as curated. The analysis will be generated
                automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    composition_tags = [],
    lighting_tags = [],
    setting_tags = [],
    people_tags = [],
    styling_tags = [],
    camera_tags = [],
    texture_tags = [],
    negative_tags = [],
  } = analysis.aggregated_tags || {};

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  const renderTagCategory = (
    title: string,
    tags: { name: string; weight: number }[]
  ) => {
    if (!tags || tags.length === 0) return null;

    // Sort by weight descending and take top tags
    const sortedTags = [...tags].sort((a, b) => b.weight - a.weight);

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          {title}
        </h4>
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((tag, index) => {
            return (
              <Badge
                key={`${tag.name}-${index}`}
                variant={"admin"}
                className="text-sm font-normal "
              >
                {tag.name}
                <span className="ml-1.5 text-xs mt-[2px]">{tag.weight}</span>
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="border border-gray-400 ">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Visual Style
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Visual Style learned from {analysis.no_images_analyzed ?? 0}{" "}
                curated images
              </p>
              {analysis.analyzed_at && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {formatDate(analysis.analyzed_at)}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handleReanalyze}
            disabled={isPending || analysis.is_analyzing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isPending || analysis.is_analyzing ? "animate-spin" : ""
              }`}
            />
            Re-analyze curated images
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {renderTagCategory("Composition", composition_tags)}
        {renderTagCategory("Lighting", lighting_tags)}
        {renderTagCategory("Setting", setting_tags)}
        {renderTagCategory("People", people_tags)}
        {renderTagCategory("Styling", styling_tags)}
        {renderTagCategory("Camera", camera_tags)}
        {renderTagCategory("Texture", texture_tags)}
        {renderTagCategory("Negative", negative_tags)}

        {analysis.is_analyzing && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analysis in progress...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BrandBrainAnalysisResults;
