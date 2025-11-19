import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PresetEditorSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Preset Details Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>

          {/* Preset Type Selection */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-4">
              <Skeleton className="flex-1 h-24 rounded-lg" />
              <Skeleton className="flex-1 h-24 rounded-lg" />
            </div>
          </div>

          {/* Prompt Cards */}
          <div className="border-t pt-6 space-y-4">
            <Skeleton className="h-6 w-40 mb-2" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Card className="border">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-3 w-64" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-32 w-full rounded" />
                    <Skeleton className="h-24 w-full rounded" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
