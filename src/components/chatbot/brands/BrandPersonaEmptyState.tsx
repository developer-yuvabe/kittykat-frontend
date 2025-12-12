import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

interface BrandPersonaEmptyStateProps {
  isLoading?: boolean;
  onGenerate: () => void;
  onCreate: () => void;
}

function BrandPersonaSkeletonCard() {
  return (
    <Card className="overflow-hidden w-full max-w-md mx-auto">
      {/* Image Skeleton */}
      <Skeleton className="w-full h-64" />

      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Content Skeleton */}
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}

function BrandPersonaEmptyState({
  isLoading,
  onGenerate,
  onCreate,
}: BrandPersonaEmptyStateProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-40" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <BrandPersonaSkeletonCard />
          <BrandPersonaSkeletonCard />
          <BrandPersonaSkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold">No Personas Yet</h3>
          <p className="text-muted-foreground">
            Create personas to better understand your target audience. You can
            generate them with AI or create them manually.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCreate} variant="outline" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Create Manually
          </Button>
          <Button onClick={onGenerate} size="lg">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>
        </div>

        {/* Tips */}
        <div className="pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Tip: AI-generated personas are based on your brand information
            and market analysis
          </p>
        </div>
      </div>
    </div>
  );
}

export default BrandPersonaEmptyState;
export { BrandPersonaSkeletonCard };
