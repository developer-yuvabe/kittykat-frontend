"use client";

import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X, Sparkles } from "lucide-react";

interface AskKittyKatBulkEditorProps {
  editingText: string;
  onTextChange: (text: string) => void;
  onEnhance: () => void;
  onSave: () => void;
  onCancel: () => void;
  isEnhancing: boolean;
  isSaving: boolean;
}

export function AskKittyKatBulkEditor({
  editingText,
  onTextChange,
  onEnhance,
  onSave,
  onCancel,
  isEnhancing,
  isSaving,
}: AskKittyKatBulkEditorProps) {
  return (
    <div className="space-y-3">
      <div data-color-mode="light">
        <MDEditor
          value={editingText}
          onChange={(val) => onTextChange(val || "")}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={false}
          textareaProps={{
            style: {
              fontSize: 13,
              lineHeight: 1.5,
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          }}
          height={200}
          data-testid="markdown-editor"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onEnhance}
          disabled={isEnhancing}
          className="h-7 px-2"
        >
          {isEnhancing ? (
            <Loader2 className="h-3 w-3 mr-1 animate-pulse" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Enhance
        </Button>
        <Button
          size="sm"
          onClick={onSave}
          disabled={editingText.trim() === "" || isSaving}
          className="h-7 px-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Estimating...
            </>
          ) : (
            <>
              <Save className="h-3 w-3 mr-1" />
              Save
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          className="h-7 px-2"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
