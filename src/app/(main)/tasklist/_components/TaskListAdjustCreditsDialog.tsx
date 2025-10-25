"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useTaskList } from "@/hooks/useTaskList";
import { useUserStore } from "@/store/user.store";
import type { TasklistRecord } from "@/types/tasklist.types";
import { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Minus,
  Calculator,
  AlertTriangle,
} from "lucide-react";

interface TaskListAdjustCreditsDialogProps {
  tasklist: TasklistRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskListAdjustCreditsDialog = ({
  tasklist,
  isOpen,
  onClose,
}: TaskListAdjustCreditsDialogProps) => {
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { adjustCreditsMutation } = useTaskList();
  const { user } = useUserStore();

  const adjustmentNumber = useMemo(() => {
    const num = parseFloat(adjustment);
    return isNaN(num) ? 0 : num;
  }, [adjustment]);

  const newTotal = useMemo(() => {
    if (!tasklist) return 0;
    return tasklist.final_credits + adjustmentNumber;
  }, [tasklist, adjustmentNumber]);

  const isValidAdjustment = adjustmentNumber !== 0 && reason.trim().length > 0;
  const isPositiveAdjustment = adjustmentNumber > 0;

  const handleSubmit = async () => {
    if (!tasklist || !isValidAdjustment || !user) return;

    setIsSubmitting(true);
    try {
      await adjustCreditsMutation.mutateAsync({
        tasklistId: tasklist.id!,
        data: {
          credit_adjustment: adjustmentNumber,
          reason: reason.trim(),
          adjusted_by: user.name || user.email,
        },
      });
      onClose();
      setAdjustment("");
      setReason("");
    } catch (error) {
      console.error("Failed to adjust credits:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setAdjustment("");
      setReason("");
    }
  };

  const suggestedReasons = [
    "Additional complexity discovered",
    "Scope reduction after review",
    "Quality improvement required",
    "Task completed faster than expected",
    "Client requested changes",
    "Technical difficulty adjustment",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Adjust Credits
          </DialogTitle>
          <DialogDescription>
            Modify the credit amount for tasklist{" "}
            <span className="font-mono">TL-{tasklist?.id?.toUpperCase()}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 overflow-y-auto flex-1">
          {/* Current Credit Breakdown */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Current Credit Breakdown
            </Label>
            <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Estimated Credits</span>
                <span className="font-mono">{tasklist?.estimated_credits}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Initial Deducted</span>
                <span className="font-mono">
                  {tasklist?.initial_deduction_credits}
                </span>
              </div>
              {tasklist?.adjustment_logs &&
                tasklist.adjustment_logs.length > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Previous Adjustments
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
                <span>Current Total</span>
                <span className="font-mono text-lg">
                  {tasklist?.final_credits}
                </span>
              </div>
            </div>
          </div>

          {/* Adjustment Input */}
          <div className="space-y-2">
            <Label htmlFor="adjustment">Credit Adjustment</Label>
            <div className="relative">
              <Input
                id="adjustment"
                type="number"
                placeholder="Enter adjustment amount (+ or -)"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                className="pr-12"
                step="0.1"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {adjustmentNumber > 0 ? (
                  <Plus className="h-4 w-4 text-green-600" />
                ) : adjustmentNumber < 0 ? (
                  <Minus className="h-4 w-4 text-red-600" />
                ) : (
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use positive numbers to add credits, negative numbers to deduct
              credits.
            </p>
          </div>

          {/* Preview */}
          {adjustmentNumber !== 0 && (
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Adjustment Preview</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span>Current Total</span>
                  <span className="font-mono">{tasklist?.final_credits}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Adjustment</span>
                  <Badge
                    variant={isPositiveAdjustment ? "default" : "destructive"}
                    className="font-mono"
                  >
                    {isPositiveAdjustment ? "+" : ""}
                    {adjustmentNumber}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>New Total</span>
                  <span
                    className={cn(
                      "font-mono text-lg",
                      newTotal < 0 && "text-red-600"
                    )}
                  >
                    {newTotal}
                  </span>
                </div>
                {newTotal < 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Warning: This will result in negative credits</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this credit adjustment is necessary..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              This reason will be logged in the adjustment history.
            </p>
          </div>

          {/* Suggested Reasons */}
          <div className="space-y-2">
            <Label className="text-sm">Suggested Reasons</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedReasons.map((suggestedReason) => (
                <Button
                  key={suggestedReason}
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setReason(suggestedReason)}
                  className="text-xs h-7"
                >
                  {suggestedReason}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValidAdjustment || isSubmitting}
            className="min-w-[120px]"
            variant={newTotal < 0 ? "destructive" : "default"}
          >
            {isSubmitting
              ? "Adjusting..."
              : `Adjust Credits ${isPositiveAdjustment ? "+" : ""}${
                  adjustmentNumber || ""
                }`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
