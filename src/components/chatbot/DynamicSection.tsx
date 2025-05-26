import React from "react";
import { capitalizeKey } from "@/lib/langgraph.utils";
import { ContentSection } from "../shared/ContentSection";
import { Badge } from "../ui/badge";
import { Agents } from "@/types/types";

interface DynamicContentSectionProps {
  dynamicData: Record<string, unknown>;
  agentId?: Agents;
}
const RenderValue: React.FC<{ value: unknown; depth?: number }> = ({
  value,
  depth = 0,
}) => {
  // Handle different data types
  if (value === null || value === undefined) {
    return <span className="text-gray-500 italic">None</span>;
  }

  if (typeof value === "string") {
    return <span className="text-gray-700 text-sm">{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span className="text-gray-700">{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500 italic">Empty list</span>;
    }

    // Check if array contains primitive values or objects
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return (
        <div className="flex flex-wrap gap-1 mt-1">
          {value.map((item, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-xs bg-gray-50 text-gray-700 border-gray-200"
            >
              {String(item)}
            </Badge>
          ))}
        </div>
      );
    } else {
      // Array of objects
      return (
        <div className="space-y-3 mt-1">
          {value.map((item, idx) => (
            <div key={idx} className="pl-4  border-gray-200">
              <div className="mt-1">
                <RenderValue value={item} depth={depth + 1} />
              </div>
            </div>
          ))}
        </div>
      );
    }
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-2 mt-1">
        {Object.entries(value).map(([key, val]) => (
          <div key={key} className={`${depth > 0 ? "pl-4" : ""}`}>
            <div className="flex items-baseline">
              <span className="text-sm font-medium text-gray-600">
                {capitalizeKey(key)}:
              </span>
              <div className="ml-2 flex-1">
                <RenderValue value={val} depth={depth + 1} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback for any other types
  return <span className="text-gray-700">{String(value)}</span>;
};

export const DynamicContentSection: React.FC<DynamicContentSectionProps> = ({
  dynamicData,
  agentId,
}) => {
  if (!dynamicData || Object.keys(dynamicData).length === 0) return null;

  return (
    <>
      {Object.entries(dynamicData).map(([key, value]) => (
        <ContentSection
          key={key}
          title={capitalizeKey(key)}
          content={
            <div className="ml-2 space-y-2 ">
              <RenderValue value={value} />
            </div>
          }
          context={{
            agentId,
            data: {
              [key]: value,
            },
          }}
        />
      ))}
    </>
  );
};
