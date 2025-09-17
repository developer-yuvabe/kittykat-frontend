import React, { useCallback } from "react";
import { ContentSection } from "../shared/ContentSection";
import { InlineEditableBadges } from "../shared/InlineEditableBadges";
import { InlineEditableField } from "../shared/InlineEditableField";
import { Agents } from "@/types/types";

interface DisplayFieldProps<T extends Record<string, any>> {
  title: string;
  agentId: Agents;
  json: T;
  onValueChange: (key: keyof T, oldValue: any, value: any) => void;
  showKeyAsLabel?: boolean;
}

export const DisplayField = <T extends Record<string, any>>({
  title,
  agentId,
  json,
  onValueChange,
  showKeyAsLabel = false,
}: DisplayFieldProps<T>) => {
  const [data, setData] = React.useState<T>(json);

  const handleSave = (key: string, value: any) => {
    onValueChange(key, data[key], value);

    // If key has nested structure like "a.b.c", we need to update it correctly
    setData((prev) => {
      const keys = key.split(".");
      const newObj: any = { ...prev };
      let curr: any = newObj;

      keys.forEach((key, idx) => {
        if (idx === keys.length - 1) {
          curr[key] = value; // last key → assign new value
        } else {
          curr[key] = { ...curr[key] }; // clone intermediate object
          curr = curr[key];
        }
      });

      return newObj;
    });
  };

  const renderField = useCallback(
    (key: string, value: any, showKey: boolean = false) => {
      const withWrap = (children: React.ReactNode) =>
        showKey ? (
          <div>
            <h4 className="font-medium text-sm">
              {key
                .replace(/_/g, " ")
                .replace(/([A-Z])/g, " $1")
                .replace(/\s+/g, " ")
                .trim()
                .replace(/^./, (str) => str.toUpperCase())}
            </h4>
            {children}
          </div>
        ) : (
          <>{children}</>
        );

      // Null / Undefined
      if (value == null) {
        return withWrap(
          <div key={key} className="text-sm italic text-gray-400">
            None
          </div>
        );
      }

      // Primitives
      if (["string", "number", "boolean"].includes(typeof value)) {
        return withWrap(
          <InlineEditableField
            key={key}
            label={key}
            value={String(value)}
            onSave={async (newVal) => handleSave(key, newVal as any)}
            textClassName="text-sm text-gray-700"
            isTextarea={key.toLowerCase().includes("tagline")}
          />
        );
      }

      // Arrays
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return withWrap(
            <div key={key} className="text-sm italic text-gray-400">
              Empty list
            </div>
          );
        }

        const isPrimitiveArray = value.every(
          (v) => v == null || ["string", "number", "boolean"].includes(typeof v)
        );

        if (isPrimitiveArray) {
          return withWrap(
            <InlineEditableBadges
              key={key}
              label={key}
              values={value.map(String)}
              onSave={async (newVals) => handleSave(key, newVals as any)}
              showLabel={false}
            />
          );
        }

        // Array of objects → recurse
        return withWrap(
          <div key={key} className="space-y-2">
            {value.map((item, idx) => (
              <div
                key={`${key}-${idx}`}
                className="ml-4 rounded-md border p-2 space-y-2"
              >
                {Object.entries(item || {}).map(([subKey, subVal]) =>
                  renderField(`${key}[${idx}].${subKey}`, subVal)
                )}
              </div>
            ))}
          </div>
        );
      }

      // Objects
      if (typeof value === "object") {
        return withWrap(
          <div key={key} className="space-y-2">
            <div>
              {Object.entries(value).map(([subKey, subVal]) =>
                renderField(`${key}.${subKey}`, subVal)
              )}
            </div>
          </div>
        );
      }

      // Fallback
      return withWrap(
        <div key={key} className="text-sm">
          {String(value)}
        </div>
      );
    },
    [handleSave]
  );

  return (
    <ContentSection
      title={title}
      content={
        <div className="space-y-3">
          {Object.entries(data || {}).map(([key, value]) =>
            renderField(key, value, showKeyAsLabel)
          )}
        </div>
      }
      context={{
        agentId,
        data,
      }}
    />
  );
};
