import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MessageSkeleton({
  type = "assistant",
}: {
  type?: "assistant" | "human";
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2",
        type === "human" ? "ml-auto" : "mr-auto"
      )}
    >
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            "flex flex-col gap-2",
            type === "human" ? "items-end" : "items-start"
          )}
        >
          <Skeleton
            className={cn(
              "h-10 rounded-2xl",
              type === "human" ? "w-40 bg-blue-100/50" : "w-64 bg-white/50"
            )}
          />
          <Skeleton
            className={cn(
              "h-6 rounded-2xl",
              type === "human" ? "w-32 bg-blue-100/50" : "w-48 bg-white/50"
            )}
          />
          {type === "assistant" && (
            <Skeleton className="h-6 w-56 rounded-2xl bg-white/50" />
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
      <MessageSkeleton type="human" />
      <MessageSkeleton type="assistant" />
      <MessageSkeleton type="human" />
      <MessageSkeleton type="assistant" />

      <div className="sticky bottom-0 flex flex-col items-center gap-8 bg-transparent rounded-2xl">
        <div className="w-full max-w-3xl">
          <Skeleton className="h-12 w-full rounded-2xl bg-white/50" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <Card className="bg-gray-50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">
          <div className="flex justify-between">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-6 w-20" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}
