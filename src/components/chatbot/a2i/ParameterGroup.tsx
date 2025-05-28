// components/parameters/ParameterGroup.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ParameterGroup as ParameterGroupType } from "@/types/a2i.types";
import { ParameterInput } from "./ParameterInput";

interface ParameterGroupProps {
  group: ParameterGroupType;
  values: Record<string, any>;
  onParameterChange: (key: string, value: any) => void;
  requiredFields: string[];
  modelId: string;
}

export const ParameterGroup: React.FC<ParameterGroupProps> = ({
  group,
  values,
  onParameterChange,
  requiredFields,
  modelId,
}) => {
  const isCustomAspectRatio = values.aspect_ratio === "custom";
  const shouldShowCustomDimensions =
    modelId === "flux-1.1-pro" && isCustomAspectRatio;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{group.title}</CardTitle>
        {group.description && (
          <CardDescription className="text-sm">
            {group.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {group.parameters.map(([key, param]) => {
          // Skip width/height if not in custom aspect ratio mode
          if (
            (key === "width" || key === "height") &&
            !shouldShowCustomDimensions
          ) {
            return null;
          }

          return (
            <ParameterInput
              key={key}
              paramKey={key}
              parameter={param}
              value={values[key]}
              onChange={onParameterChange}
              isRequired={requiredFields.includes(key)}
            />
          );
        })}

        {/* Special handling for custom width/height in essentials group */}
        {group.id === "essentials" && shouldShowCustomDimensions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <ParameterInput
              paramKey="width"
              parameter={{
                type: "integer",
                title: "Width",
                minimum: 256,
                maximum: 1440,
              }}
              value={values.width}
              onChange={onParameterChange}
            />
            <ParameterInput
              paramKey="height"
              parameter={{
                type: "integer",
                title: "Height",
                minimum: 256,
                maximum: 1440,
              }}
              value={values.height}
              onChange={onParameterChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
