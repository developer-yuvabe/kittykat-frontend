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

  // Don't render if no analysis data
  if (!analysis) {
    return null;
  }

  const {
    composition_tags,
    lighting_tags,
    setting_tags,
    people_tags,
    styling_tags,
    camera_tags,
    texture_tags,
  } = analysis.aggregated_tags;

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
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Visual Style
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Visual Style learned from {analysis.no_images_analyzed} curated
                images
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {formatDate(analysis.analyzed_at)}
              </p>
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
