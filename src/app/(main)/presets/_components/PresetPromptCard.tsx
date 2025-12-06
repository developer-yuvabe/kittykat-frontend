"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/thread/tooltip-icon-button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ChevronDown, RotateCcw, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptFieldType } from "@/types/preset.types";

interface PresetPromptCardProps {
  fieldType: PromptFieldType;
  label: string;
  description?: string;
  value: string;
  onValueChange: (value: string) => void;
  onAdjust?: (
    presetId: string,
    fieldType: PromptFieldType,
    instruction: string
  ) => Promise<string>;
  presetId?: string;
  isAdjusting?: boolean;
  isExpanded?: boolean;
  isViewOnly?: boolean;
}

export function PresetPromptCard({
  fieldType,
  label,
  description,
  value,
  onValueChange,
  onAdjust,
  presetId,
  isAdjusting = false,
  isExpanded: initialExpanded = false,
  isViewOnly = false,
}: PresetPromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [adjustmentInstruction, setAdjustmentInstruction] = useState("");
  const [isLocalAdjusting, setIsLocalAdjusting] = useState(false);
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Sync history when value changes from parent (e.g., initial load or external updates)
  useEffect(() => {
    // Only reset history if the current value doesn't match what we have in history
    if (value !== history[historyIndex]) {
      setHistory([value]);
      setHistoryIndex(0);
    }
  }, [value, history, historyIndex]);

  const handleValueChange = (newValue: string) => {
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onValueChange(newValue);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onValueChange(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onValueChange(history[newIndex]);
    }
  };

  const handleAdjust = async () => {
    if (!adjustmentInstruction.trim() || !onAdjust) return;

    setIsLocalAdjusting(true);
    try {
      const adjustedPrompt = await onAdjust(
        presetId || "",
        fieldType,
        adjustmentInstruction
      );
      handleValueChange(adjustedPrompt);
      setAdjustmentInstruction("");
    } catch (error) {
      console.error("Error adjusting prompt:", error);
    } finally {
      setIsLocalAdjusting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdjust();
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <Card className="border">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isExpanded ? "" : "-rotate-90"
                    )}
                  />
                  <div>
                    <CardTitle className="text-base">{label}</CardTitle>
                    {description && (
                      <CardDescription className="text-xs mt-1">
                        {description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4 border-t pt-4">
            {/* Prompt Textarea with Undo/Redo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Prompt Content</label>
              <Textarea
                value={value}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="Enter your prompt here..."
                className="min-h-32 resize-none"
                disabled={isViewOnly}
                readOnly={isViewOnly}
              />
            </div>

            {/* AI Adjust Section - Hidden in view-only mode */}
            {onAdjust && !isViewOnly && (
              <div className="space-y-2 bg-muted/50 p-3 rounded-lg border">
                <label className="text-sm font-medium">
                  AI Prompt Adjustment
                </label>
                <Input
                  value={adjustmentInstruction}
                  onChange={(e) => setAdjustmentInstruction(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., adjust for Birkenstock sandals..."
                  disabled={isLocalAdjusting || isAdjusting}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Describe how you&apos;d like to adjust this prompt. Press
                  Enter or click AI Adjust to apply changes.
                </p>
                <div className="flex gap-2 items-center">
                  <Button
                    onClick={handleAdjust}
                    disabled={
                      !adjustmentInstruction.trim() ||
                      isLocalAdjusting ||
                      isAdjusting
                    }
                    size="sm"
                    variant="outline"
                    className="flex-1 min-w-0"
                    type="button"
                  >
                    {isLocalAdjusting || isAdjusting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Adjusting...
                      </>
                    ) : (
                      "AI Adjust"
                    )}
                  </Button>
                  <div className="flex gap-1 flex-shrink-0">
                    <TooltipIconButton
                      onClick={handleUndo}
                      disabled={!canUndo}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0"
                      tooltip="Undo"
                      type="button"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </TooltipIconButton>
                    <TooltipIconButton
                      onClick={handleRedo}
                      disabled={!canRedo}
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0"
                      tooltip="Redo"
                      type="button"
                    >
                      <RotateCw className="h-4 w-4" />
                    </TooltipIconButton>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
