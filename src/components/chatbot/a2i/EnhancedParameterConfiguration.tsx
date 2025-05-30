// components/EnhancedParameterConfiguration.tsx
import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentSection } from "@/components/shared/ContentSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

import { ParameterGroup } from "./ParameterGroup";
import { useParameterManagement } from "@/hooks/useParameterManagement";
import { groupParameters } from "@/lib/a2i.utils";
import { models } from "@/lib/models";
import { ThreadA2iImage } from "@/types/types";

const EnhancedParameterConfiguration = ({
  a2iImageInformation,
  brandId,
}: {
  a2iImageInformation: ThreadA2iImage | undefined;
  brandId: string;
}) => {
  const initialModelId = a2iImageInformation?.parameters?.model;
  console.log("im", initialModelId);

  const {
    selectedModelId,
    setSelectedModelId,
    selectedModel,
    params,
    updateParam,
    isLoading,
    lastSaved,
  } = useParameterManagement({
    models,
    initialModelId,
    brandId,
    a2iInformation: a2iImageInformation,
  });

  console.log("h3", a2iImageInformation, brandId);
  const parameterGroups = selectedModel?.schema
    ? groupParameters(selectedModel.schema)
    : [];

  return (
    <ContentSection
      content={
        <div className="w-full  space-y-8">
          {/* Header with Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLoading && (
                <Badge variant="secondary" className="animate-pulse">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping mr-2" />
                  Saving...
                </Badge>
              )}
              {lastSaved && (
                <Badge variant="outline">
                  Saved: {lastSaved.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>

          {/* Model Selection */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex text-base items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                Choose Your AI Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <Label htmlFor="model-select" className="text-sm font-medium">
                  Select the AI model that best fits your needs
                </Label>
                <Select
                  value={selectedModelId}
                  onValueChange={setSelectedModelId}
                >
                  <SelectTrigger className="w-1/4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{model.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Parameter Groups */}
          <div className="space-y-8">
            {parameterGroups.map((group) => (
              <div key={group.id} className="space-y-4">
                <ParameterGroup
                  group={group}
                  values={params}
                  onParameterChange={updateParam}
                  requiredFields={selectedModel?.schema?.required || []}
                  modelId={selectedModelId}
                />
              </div>
            ))}
          </div>
        </div>
      }
      title="Image Generation Parameters"
    />
  );
};

export default EnhancedParameterConfiguration;
