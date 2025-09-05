import React from "react";
import {
  capitalizeKey,
  formatUpdateArrayMessage,
  formatUpdateMessage,
} from "@/lib/langgraph.utils";
import { ContentSection } from "../shared/ContentSection";
import { Agents } from "@/types/types";
import { InlineEditableField } from "../shared/InlineEditableField";
import { submitOptimisticMessage } from "@/services/api/langgraph.service";
import { useStreamContext } from "@/providers/langgraph/Stream";
import { useUserStore } from "@/store/user.store";
import { useBrandStore } from "@/store/brand.store";
import { InlineEditableBadges } from "../shared/InlineEditableBadges";

interface DynamicContentSectionProps {
  dynamicData: Record<string, unknown>;
  agentId?: Agents;
  pathPrefix?: string;
}

export const RenderValue: React.FC<{
  value: unknown;
  depth?: number;
  path?: string;
  agentId?: Agents;
  enableEdit?: boolean;
}> = ({ value, depth = 0, path = "", agentId, enableEdit }) => {
  const stream = useStreamContext();
  const { user } = useUserStore();
  const { selectedBrandId } = useBrandStore();
  const editable = enableEdit ?? true;

  const handleSave = async (newVal: string) => {
    const oldVal = String(value);
    const msg = formatUpdateMessage(
      path,
      oldVal,
      newVal,
      agentId ?? "brandingAgent",
      path
        .split(".")
        .pop()
        ?.replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()) || ""
    );

    if (msg) {
      submitOptimisticMessage({
        stream,
        text: msg,
        userId: user!.id,
        currentBrandContextId: selectedBrandId,
      });
    }
  };

  if (value === null || value === undefined) {
    return <span className="text-gray-500 italic">None</span>;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return (
      <InlineEditableField
        enableEdit={editable}
        label={path}
        value={String(value)}
        onSave={handleSave}
        textClassName="text-sm text-gray-700"
      />
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-500 italic">Empty list</span>;
    }

    if (value.every((item) => typeof item !== "object" || item === null)) {
      const items = value.map((item) => String(item));
      return (
        <div className="mt-1">
          <InlineEditableBadges
            values={items}
            onSave={async (newValues) => {
              const message = formatUpdateArrayMessage(
                path, // fieldPath
                items, // old value
                newValues, // new value
                agentId ?? "brandingAgent"
              );
              if (message) {
                submitOptimisticMessage({
                  stream,
                  text: message,
                  userId: user!.id,
                  currentBrandContextId: selectedBrandId,
                });
              }
            }}
            showLabel={false} // set to true and pass a label if needed
            enableEdit={editable}
          />
        </div>
      );
    } else {
      return (
        <div className="space-y-3 mt-1">
          {value.map((item, idx) => (
            <div key={idx} className="pl-4 border-gray-200">
              <RenderValue
                value={item}
                depth={depth + 1}
                path={`${path}[${idx}]`}
                agentId={agentId}
              />
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
            <div className="">
              <span className="text-sm font-medium text-gray-600">
                {capitalizeKey(key)}:
              </span>
              <div className="ml-2 flex-1">
                <RenderValue
                  value={val}
                  depth={depth + 1}
                  path={`${path ? `${path}.` : ""}${key}`}
                  agentId={agentId}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-gray-700">{String(value)}</span>;
};

export const DynamicContentSection: React.FC<DynamicContentSectionProps> = ({
  dynamicData,
  agentId,
  pathPrefix,
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
              <RenderValue
                value={value}
                // Empty strings can also be considered as a valid value, so using undefined check looks good
                path={`${
                  pathPrefix === undefined
                    ? "dynamic"
                    : pathPrefix === ""
                    ? key
                    : `${pathPrefix}.${key}`
                }`}
                agentId={agentId}
              />
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
