"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ITEMS_PER_PAGE, useGalleryQuery } from "@/hooks/useGallery";
import type { TimelineEvent } from "@/types/tasklist.types";
import { useTaskList } from "@/hooks/useTaskList";
import { format } from "date-fns";
import { formatToLocalTime } from "@/lib/utils";
import {
  ExternalLink,
  Clock,
  User,
  CreditCard,
  FileText,
  Calendar,
  History,
  AlertCircle,
  Edit3,
  Settings,
  GemIcon,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { TaskListAdjustCreditsDialog } from "./TaskListAdjustCreditsDialog";
import { TaskListEditNotesDialog } from "./TaskListEditNotesDialog";
import { WorkflowStatusDialog } from "./TaskListStatusDialog";
import { useConceptVisualStore } from "@/store/concept-visual.store";

interface TaskListDetailsDrawerProps {
  tasklistId: string | null;
  isOpen: boolean;
  onClose: () => void;
  brandId?: string;
}

const getTimelineEventInfo = (event: TimelineEvent) => {
  switch (event.type) {
    case "created":
      return {
        title: "Tasklist Created",
        description: `Initial credit estimate: ${event.details.estimated_credits} credits, Initial deduction: ${event.details.initial_deduction} credits`,
        icon: FileText,
        color: "border-green-500 bg-green-500/10 text-green-700",
      };
    case "updated":
      return {
        title: "Status Updated",
        description: `Status changed to ${event.details.status_changed_to}`,
        icon: AlertCircle,
        color: "border-blue-500 bg-blue-500/10 text-blue-700",
      };
    case "credit_adjusted":
      const adjustment = event.details.adjustment || 0;
      const isPositive = adjustment > 0;
      return {
        title: "Credits Adjusted",
        description: `${isPositive ? "+" : ""}${adjustment} credits - ${
          event.details.reason
        }`,
        icon: GemIcon,
        color: isPositive
          ? "border-green-500 bg-green-500/10 text-green-700"
          : "border-red-500 bg-red-500/10 text-red-700",
      };
    default:
      return {
        title: "Unknown Event",
        description: "Unknown event type",
        icon: Clock,
        color: "border-gray-500 bg-gray-500/10 text-gray-700",
      };
  }
};

export const TaskListDetailsDrawer = ({
  tasklistId,
  isOpen,
  onClose,
  brandId,
}: TaskListDetailsDrawerProps) => {
  const { useTaskListDetail, useTaskListTimeline, isAdmin } = useTaskList();
  const { openConceptVisual } = useConceptVisualStore();
  // Dialog states
  const [showAdjustCreditsDialog, setShowAdjustCreditsDialog] = useState(false);
  const [showEditNotesDialog, setShowEditNotesDialog] = useState(false);
  const [showWorkflowStatusDialog, setShowWorkflowStatusDialog] =
    useState(false);

  const detailQuery = useTaskListDetail(tasklistId || "");
  const timelineQuery = useTaskListTimeline(tasklistId || "");

  const tasklist = detailQuery.data?.tasklist;
  const timeline = timelineQuery.data?.timeline || [];

  // Gallery integration for MediaEditor
  const galleryActions = useGalleryQuery(
    {
      selectedFilters: {
        brands: brandId ? [brandId] : [],
        campaigns: [],
        moodboards: [],
        product_categories: [],
        asset_types: [],
        asset_sources: [],
        media_format: [],
        aspect_ratio: [],
        workflow_status: [],
      },
    },
    ITEMS_PER_PAGE,
    !!brandId,
    "TaskListDetailsDrawer"
  );

  // Always call the hook but with empty string if no asset_id
  // For multiple assets, use the first one
  const firstAssetId = tasklist?.asset_ids?.[0] || "";
  const galleryItem = galleryActions.useGalleryItem(firstAssetId);

  const handleViewFullAsset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (firstAssetId && galleryItem?.data && !galleryItem.isError) {
      openConceptVisual({
        source: "media-gallery",
        assetItems: [galleryItem.data],
        asset: {
          galleryActions,
          currentAsset: galleryItem.data,
        },
      });
    } else {
      // Fallback to opening in new tab (first URL)
      const firstUrl = tasklist?.asset_urls?.[0];
      if (firstUrl) {
        window.open(firstUrl, "_blank");
      }
    }
  };

  if (!isOpen || !tasklistId) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[800px] sm:max-w-[1000px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tasklist Details
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pb-6">
          {detailQuery.isLoading ? (
            // Loading State
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : detailQuery.isError || !tasklist ? (
            // Error State
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Failed to load tasklist details
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => detailQuery.refetch()}
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-mono">
                      TL-
                      {tasklist.id?.toUpperCase()}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Brand
                      </p>
                      <p className="text-sm">{tasklist.brand_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Campaign
                      </p>
                      <p className="text-sm">{tasklist.campaign_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Submitted By
                      </p>
                      <p className="text-sm">
                        {tasklist.submitted_by_name || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Submitted At
                      </p>
                      <p className="text-sm">
                        {formatToLocalTime(tasklist.submitted_at)}
                      </p>
                    </div>
                  </div>

                  {/* Asset Preview */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      {tasklist.asset_urls?.length > 1 ? "Assets" : "Asset"}
                      {tasklist.is_bulk_request && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Bulk Request
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                        {tasklist.asset_urls?.[0] && (
                          <Image
                            src={tasklist.asset_urls[0]}
                            alt="Asset preview"
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        )}
                        {tasklist.asset_urls &&
                          tasklist.asset_urls.length > 1 && (
                            <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-tl">
                              +{tasklist.asset_urls.length - 1}
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewFullAsset}
                          className="gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View {tasklist.asset_urls?.length > 1
                            ? "First"
                            : ""}{" "}
                          Asset
                        </Button>
                        {tasklist.asset_urls &&
                          tasklist.asset_urls.length > 1 && (
                            <p className="text-xs text-muted-foreground">
                              {tasklist.asset_urls.length} assets in this
                              tasklist
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="flex flex-row gap-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowWorkflowStatusDialog(true)}
                        className="gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Update Workflow Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAdjustCreditsDialog(true)}
                        className="gap-2"
                      >
                        <GemIcon className="h-4 w-4" />
                        Adjust Credits
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditNotesDialog(true)}
                        className="gap-2"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit Notes
                      </Button>
                    </div>
                  )}

                  {/* Notes */}
                  {tasklist.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Notes
                      </p>
                      <div className="prose prose-sm max-w-none">
                        <div className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                          {tasklist.notes}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credit Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Credit Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Estimated Credits
                      </span>
                      <span className="font-mono">
                        {tasklist.estimated_credits}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Initial Deducted
                      </span>
                      <span className="font-mono">
                        {tasklist.initial_deduction_credits}
                      </span>
                    </div>
                    {tasklist.adjustment_logs &&
                      tasklist.adjustment_logs.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            Adjustments
                          </span>
                          <span className="font-mono">
                            {tasklist.adjustment_logs.reduce(
                              (sum, log) => sum + log.adjusted_credit,
                              0
                            )}
                          </span>
                        </div>
                      )}
                    <Separator />
                    <div className="flex justify-between items-center font-semibold">
                      <span> Total</span>
                      <span className="font-mono text-lg">
                        {tasklist.final_credits}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Task Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Task Breakdown ({tasklist.tasks?.length || 0} tasks)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasklist.tasks?.map((task, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{task.task}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Category: {task.task_category}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2 font-mono">
                          {task.estimated_credit} credits
                        </Badge>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground italic text-center py-4">
                        No tasks found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Adjustment History */}
              {tasklist.adjustment_logs &&
                tasklist.adjustment_logs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Adjustment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tasklist.adjustment_logs.map((log, index) => (
                          <div
                            key={index}
                            className="border-l-2 border-muted pl-4"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <p className="text-sm font-medium">
                                {log.reason}
                              </p>
                              <Badge
                                variant={
                                  log.adjusted_credit >= 0
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {log.adjusted_credit >= 0 ? "+" : ""}
                                {log.adjusted_credit}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{log.adjusted_by}</span>
                              <Calendar className="h-3 w-3 ml-2" />
                              <span>
                                {formatToLocalTime(log.adjusted_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Timeline */}
              {timeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timelineQuery.isLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {timeline.map((event, index) => {
                          const eventInfo = getTimelineEventInfo(event);
                          const EventIcon = eventInfo.icon;

                          return (
                            <div
                              key={index}
                              className="flex gap-3 p-3 rounded-lg border"
                            >
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${eventInfo.color}`}
                              >
                                <EventIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">
                                    {eventInfo.title}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {formatToLocalTime(event.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {eventInfo.description}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Admin Dialogs */}
        {isAdmin && tasklist && (
          <>
            <TaskListAdjustCreditsDialog
              tasklist={tasklist || null}
              isOpen={showAdjustCreditsDialog}
              onClose={() => setShowAdjustCreditsDialog(false)}
            />
            <TaskListEditNotesDialog
              tasklist={tasklist || null}
              isOpen={showEditNotesDialog}
              onClose={() => setShowEditNotesDialog(false)}
            />
            <WorkflowStatusDialog
              tasklist={tasklist || null}
              isOpen={showWorkflowStatusDialog}
              onClose={() => setShowWorkflowStatusDialog(false)}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
