import React, { useCallback, useEffect } from "react";
import { ContentSection } from "../shared/ContentSection";
import { InlineEditableBadges } from "../shared/InlineEditableBadges";
import { InlineEditableField } from "../shared/InlineEditableField";
import { Agents } from "@/types/types";
import { cn } from "@/lib/utils";
import { isEqual } from "lodash";

interface DisplayFieldProps<T extends Record<string, any>> {
  title?: string;
  agentId: Agents;
  json: T;
  onValueChange: (key: keyof T, oldValue: any, value: any) => void;
  showKeyAsLabel?: boolean;
  specialInstruction?: string;
}

export const DisplayFieldComponent = <T extends Record<string, any>>({
  title: initialTitle,
  agentId,
  json,
  onValueChange,
  showKeyAsLabel = false,
  specialInstruction,
}: DisplayFieldProps<T>) => {
  const [title, setTitle] = React.useState<string | undefined>(initialTitle);
  const [data, setData] = React.useState<T>(json);

  const handleSave = (key: string, value: any) => {
    const keys = key.split(".");
    let oldValue: any = data;
    for (const k of keys) {
      if (oldValue == null) break;
      oldValue = oldValue[k];
    }

    onValueChange(key, oldValue, value);

    // If key has nested structure like "a.b.c", we need to update it correctly
    setData((prev) => {
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
    (
      key: string,
      value: any,
      showKey: boolean = false,
      textClassName?: string
    ) => {
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
          children
        );

      // Null / Undefined - make them editable
      if (value == null) {
        return withWrap(
          <InlineEditableField
            key={String(value)}
            label={key}
            value="None"
            onSave={async (newVal) =>
              handleSave(key, newVal === "None" ? null : newVal)
            }
            textClassName={cn("text-sm italic text-gray-400", textClassName)}
            showLabel={!title}
            isTextarea={false}
          />
        );
      }

      // Primitives
      if (["string", "number", "boolean"].includes(typeof value)) {
        return withWrap(
          <InlineEditableField
            key={String(value)}
            label={key}
            value={String(value)}
            onSave={async (newVal) => handleSave(key, newVal as any)}
            textClassName={cn("text-sm text-gray-700", textClassName)}
            showLabel={!title && showKey}
            isTextarea={
              typeof value === "string" && (value as string).length > 50
            }
          />
        );
      }

      // Arrays
      if (Array.isArray(value)) {
        const isPrimitiveArray = value.every(
          (v) => v == null || ["string", "number", "boolean"].includes(typeof v)
        );

        if (isPrimitiveArray) {
          return withWrap(
            <InlineEditableBadges
              label={key}
              key={String(value)}
              values={value.map(String)}
              onSave={async (newVals) => handleSave(key, newVals as any)}
              showLabel={false}
            />
          );
        }

        // Array of objects → recurse
        return withWrap(
          <div className="space-y-2">
            {value.map((item, idx) => (
              <div
                key={`${key}-${idx}`}
                className="ml-4 rounded-md border p-2 space-y-2"
              >
                {Object.entries(item || {}).map(([subKey, subVal]) => (
                  <React.Fragment key={`${key}.${subKey}`}>
                    {renderField(`${key}[${idx}].${subKey}`, subVal)}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        );
      }

      // Objects
      if (typeof value === "object") {
        return withWrap(
          <div className="space-y-2">
            <div>
              {Object.entries(value).map(([subKey, subVal]) => (
                <React.Fragment key={`${key}.${subKey}`}>
                  {renderField(`${key}.${subKey}`, subVal)}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      }

      // Fallback
      return withWrap(<div className="text-sm">{String(value)}</div>);
    },
    [handleSave]
  );

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    setData(json);
  }, [json]);

  if (!title) {
    return (
      <>
        {Object.entries(data || {}).map(([key, value]) => (
          <React.Fragment key={key}>
            {renderField(key, value, showKeyAsLabel, "font-bold text-base")}
          </React.Fragment>
        ))}
      </>
    );
  }

  return (
    <ContentSection
      title={title}
      content={
        <div className="flex flex-col h-full space-y-3">
          {Object.entries(data || {}).map(([key, value]) => (
            <React.Fragment key={key}>
              {renderField(key, value, showKeyAsLabel)}
            </React.Fragment>
          ))}
        </div>
      }
      context={{
        agentId,
        data,
        specialInstruction,
      }}
    />
  );
};

export const DisplayField = React.memo(DisplayFieldComponent, (prev, next) => {
  const arePropsEqual =
    isEqual(prev.json, next.json) && prev.title === next.title;
  return arePropsEqual;
}) as typeof DisplayFieldComponent;
